import { useState } from 'react';
import TaskForm from './TaskForm.jsx';

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function dueLabel(value) {
  if (!value) return null;
  const due = new Date(value);
  const today = new Date();
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((dueDay - todayDay) / 86400000);
  const text = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (diff < 0) return { text: `Overdue · ${text}`, tone: 'overdue' };
  if (diff === 0) return { text: 'Due today', tone: 'today' };
  if (diff === 1) return { text: 'Due tomorrow', tone: 'soon' };
  return { text: `Due ${text}`, tone: '' };
}

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const due = dueLabel(task.dueDate);
  const overdue = due?.tone === 'overdue' && !task.completed;

  if (editing) {
    return (
      <article className="task editing" data-cy="task-item">
        <TaskForm
          compact
          initial={{ title: task.title, description: task.description, priority: task.priority, dueDate: toDateInput(task.dueDate) }}
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            const ok = await onUpdate(task.id, body);
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </article>
    );
  }

  return (
    <article className={`task ${task.completed ? 'done' : ''} ${overdue ? 'is-overdue' : ''}`} data-cy="task-item" data-priority={task.priority}>
      <button
        className={`check ${task.completed ? 'checked' : ''}`}
        onClick={() => onUpdate(task.id, { completed: !task.completed }, task.completed ? 'Marked as active' : 'Task completed')}
        aria-label={task.completed ? 'Mark as active' : 'Mark as complete'}
        data-cy="task-toggle"
      >
        {task.completed && (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        )}
      </button>

      <div className="task-body">
        <h3 data-cy="task-item-title">{task.title}</h3>
        {task.description && <p className="task-desc" data-cy="task-item-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge priority-${task.priority}`} data-cy="task-item-priority">{task.priority}</span>
          {due && <span className={`badge due ${task.completed ? '' : due.tone}`} data-cy="task-item-due">{due.text}</span>}
        </div>
      </div>

      <div className="task-actions">
        {confirming ? (
          <>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)} data-cy="confirm-delete">Delete</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} data-cy="cancel-delete">Keep</button>
          </>
        ) : (
          <>
            <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit task" title="Edit" data-cy="task-edit">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            <button className="icon-btn danger" onClick={() => setConfirming(true)} aria-label="Delete task" title="Delete" data-cy="task-delete">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
            </button>
          </>
        )}
      </div>
    </article>
  );
}
