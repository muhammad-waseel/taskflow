const request = require('supertest');
const db = require('./setup');
const app = require('../app');

let token;
let otherToken;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(() => db.connect('taskflow_test_tasks'), 30000);
beforeEach(async () => {
  await db.clear();
  token = (await request(app).post('/api/auth/register').send({ name: 'Sara', email: 'sara@example.com', password: 'secret123' })).body.token;
  otherToken = (await request(app).post('/api/auth/register').send({ name: 'Bilal', email: 'bilal@example.com', password: 'secret123' })).body.token;
});
afterAll(() => db.disconnect());

const createTask = (body) => request(app).post('/api/tasks').set(auth()).send(body);

describe('creating tasks', () => {
  it('creates a task with defaults', async () => {
    const res = await createTask({ title: 'Write report' });
    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({ title: 'Write report', priority: 'medium', completed: false, dueDate: null });
    expect(res.body.task.id).toBeDefined();
  });

  it('accepts priority, description and due date', async () => {
    const res = await createTask({ title: 'Ship v1', priority: 'high', description: 'Final checks', dueDate: '2026-12-01' });
    expect(res.status).toBe(201);
    expect(res.body.task.priority).toBe('high');
    expect(res.body.task.description).toBe('Final checks');
    expect(new Date(res.body.task.dueDate).toISOString().slice(0, 10)).toBe('2026-12-01');
  });

  it.each([
    [{ title: '   ' }, 'Title is required'],
    [{ title: 'x'.repeat(121) }, 'Title must be 120 characters or fewer'],
    [{ title: 'Ok', priority: 'urgent' }, 'Priority must be low, medium or high'],
    [{ title: 'Ok', dueDate: 'not-a-date' }, 'Due date is invalid'],
  ])('rejects invalid input (%#)', async (body, message) => {
    const res = await createTask(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No auth' });
    expect(res.status).toBe(401);
  });
});

describe('listing and filtering', () => {
  beforeEach(async () => {
    await createTask({ title: 'Buy groceries', priority: 'low' });
    await createTask({ title: 'Prepare demo', priority: 'high', dueDate: '2026-11-10' });
    const done = await createTask({ title: 'Read docs', priority: 'medium', dueDate: '2026-11-05' });
    await request(app).patch(`/api/tasks/${done.body.task.id}`).set(auth()).send({ completed: true });
  });

  it('lists only my tasks', async () => {
    await request(app).post('/api/tasks').set({ Authorization: `Bearer ${otherToken}` }).send({ title: 'Not yours' });
    const res = await request(app).get('/api/tasks').set(auth());
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.tasks.map((t) => t.title)).not.toContain('Not yours');
  });

  it('filters by status', async () => {
    const active = await request(app).get('/api/tasks?status=active').set(auth());
    const completed = await request(app).get('/api/tasks?status=completed').set(auth());
    expect(active.body.tasks).toHaveLength(2);
    expect(completed.body.tasks.map((t) => t.title)).toEqual(['Read docs']);
  });

  it('filters by priority', async () => {
    const res = await request(app).get('/api/tasks?priority=high').set(auth());
    expect(res.body.tasks.map((t) => t.title)).toEqual(['Prepare demo']);
  });

  it('searches titles case-insensitively', async () => {
    const res = await request(app).get('/api/tasks?search=DEMO').set(auth());
    expect(res.body.tasks.map((t) => t.title)).toEqual(['Prepare demo']);
  });

  it('treats search text literally (no regex injection)', async () => {
    const res = await request(app).get('/api/tasks?search=.*').set(auth());
    expect(res.body.tasks).toHaveLength(0);
  });

  it('sorts by priority', async () => {
    const res = await request(app).get('/api/tasks?sort=priority').set(auth());
    expect(res.body.tasks.map((t) => t.priority)).toEqual(['high', 'medium', 'low']);
  });

  it('sorts by due date with undated tasks last', async () => {
    const res = await request(app).get('/api/tasks?sort=due').set(auth());
    expect(res.body.tasks.map((t) => t.title)).toEqual(['Read docs', 'Prepare demo', 'Buy groceries']);
  });

  it('returns stats', async () => {
    const res = await request(app).get('/api/tasks/stats').set(auth());
    expect(res.body).toMatchObject({ total: 3, completed: 1, active: 2 });
  });
});

describe('updating and deleting', () => {
  let id;
  beforeEach(async () => {
    id = (await createTask({ title: 'Original', priority: 'low' })).body.task.id;
  });

  it('updates fields', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).set(auth()).send({ title: 'Renamed', priority: 'high', completed: true });
    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ title: 'Renamed', priority: 'high', completed: true });
  });

  it('clears the due date', async () => {
    await request(app).patch(`/api/tasks/${id}`).set(auth()).send({ dueDate: '2026-12-24' });
    const res = await request(app).patch(`/api/tasks/${id}`).set(auth()).send({ dueDate: null });
    expect(res.body.task.dueDate).toBeNull();
  });

  it('rejects an empty title on update', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).set(auth()).send({ title: '' });
    expect(res.status).toBe(400);
  });

  it("cannot read, edit or delete another user's task", async () => {
    const other = { Authorization: `Bearer ${otherToken}` };
    expect((await request(app).get(`/api/tasks/${id}`).set(other)).status).toBe(404);
    expect((await request(app).patch(`/api/tasks/${id}`).set(other).send({ title: 'Hacked' })).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${id}`).set(other)).status).toBe(404);
    const mine = await request(app).get(`/api/tasks/${id}`).set(auth());
    expect(mine.body.task.title).toBe('Original');
  });

  it('deletes a task', async () => {
    const del = await request(app).delete(`/api/tasks/${id}`).set(auth());
    expect(del.status).toBe(204);
    const res = await request(app).get(`/api/tasks/${id}`).set(auth());
    expect(res.status).toBe(404);
  });

  it('returns 404 for an invalid id', async () => {
    const res = await request(app).get('/api/tasks/not-a-real-id').set(auth());
    expect(res.status).toBe(404);
  });
});
