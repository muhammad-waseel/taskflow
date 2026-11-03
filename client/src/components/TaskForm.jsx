import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'medium', dueDate: '' };

export default function TaskForm({ onSubmit, initial, onCancel, compact = false }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(Boolean(initial));

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please enter a task title');
      return;
    }
    setError('');
    setBusy(true);
    const ok = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null,
    });
    setBusy(false);
    if (ok && !initial) {
      setForm(EMPTY);
      setExpanded(false);
    }
  };

  return (
    <form className={`task-form ${compact ? 'compact' : 'card'}`} onSubmit={submit} data-cy={initial ? 'edit-form' : 'task-form'} noValidate>
      <div className="task-form-row">
        <input
          className="title-input"
          data-cy={initial ? 'edit-title' : 'task-title'}
          value={form.title}
          onChange={update('title')}
          onFocus={() => setExpanded(true)}
          placeholder="What needs to be done?"
          maxLength={120}
          aria-label="Task title"
        />
        {!initial && (
          <button className="btn btn-primary" type="submit" disabled={busy} data-cy="add-task">
            {busy ? 'Adding…' : '+ Add task'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="task-form-extra">
          <textarea
            data-cy={initial ? 'edit-description' : 'task-description'}
            value={form.description}
            onChange={update('description')}
            placeholder="Add a description (optional)"
            rows={2}
            maxLength={1000}
            aria-label="Description"
          />
          <div className="task-form-row">
            <label className="inline">
              Priority
              <select data-cy={initial ? 'edit-priority' : 'task-priority'} value={form.priority} onChange={update('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="inline">
              Due date
              <input data-cy={initial ? 'edit-due' : 'task-due'} type="date" value={form.dueDate} onChange={update('dueDate')} />
            </label>
            {initial && (
              <div className="edit-actions">
                <button type="button" className="btn btn-ghost" onClick={onCancel} data-cy="edit-cancel">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy} data-cy="edit-save">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="field-error" data-cy="task-error">{error}</div>}
    </form>
  );
}
