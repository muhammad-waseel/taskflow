const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { PRIORITIES } = require('../models/Task');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  due: { dueDate: 1, createdAt: -1 },
  priority: null, // handled in memory (custom order)
};
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validate(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) return { error: 'Title is required' };
    if (title.length > 120) return { error: 'Title must be 120 characters or fewer' };
    out.title = title;
  }
  if (body.description !== undefined) out.description = String(body.description).trim().slice(0, 1000);
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return { error: 'Priority must be low, medium or high' };
    out.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === '') out.dueDate = null;
    else {
      const d = new Date(body.dueDate);
      if (Number.isNaN(d.getTime())) return { error: 'Due date is invalid' };
      out.dueDate = d;
    }
  }
  if (body.completed !== undefined) out.completed = Boolean(body.completed);
  return { value: out };
}

function loadOwnTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Task not found' });
    return null;
  }
  return Task.findOne({ _id: req.params.id, user: req.userId }).then((task) => {
    if (!task) res.status(404).json({ message: 'Task not found' });
    return task;
  });
}

// GET /api/tasks?status=active|completed|all&priority=high&search=text&sort=newest|oldest|due|priority
router.get('/', async (req, res, next) => {
  try {
    const { status = 'all', priority, search, sort = 'newest' } = req.query;
    const filter = { user: req.userId };
    if (status === 'active') filter.completed = false;
    else if (status === 'completed') filter.completed = true;
    if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
    if (search && String(search).trim()) {
      filter.title = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    }

    let tasks = await Task.find(filter).sort(SORTS[sort] || SORTS.newest);
    if (sort === 'priority') {
      tasks = tasks.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    }
    if (sort === 'due') {
      // tasks without a due date go last
      tasks = [...tasks.filter((t) => t.dueDate), ...tasks.filter((t) => !t.dueDate)];
    }
    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.userId }).select('completed dueDate');
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const completed = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < startOfToday).length;
    return res.json({ total: tasks.length, completed, active: tasks.length - completed, overdue });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const task = await Task.create({ ...value, user: req.userId });
    return res.status(201).json({ task });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await loadOwnTask(req, res);
    if (task) res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { value, error } = validate(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });
    const task = await loadOwnTask(req, res);
    if (!task) return undefined;
    Object.assign(task, value);
    await task.save();
    return res.json({ task });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await loadOwnTask(req, res);
    if (!task) return undefined;
    await task.deleteOne();
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
