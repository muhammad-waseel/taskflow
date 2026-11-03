import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import TaskForm from '../components/TaskForm.jsx';
import TaskItem from '../components/TaskItem.jsx';
import Filters from '../components/Filters.jsx';

const DEFAULT_FILTERS = { status: 'all', priority: '', search: '', sort: 'newest' };

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, overdue: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      const [list, s] = await Promise.all([api(`/tasks?${params}`), api('/tasks/stats')]);
      setTasks(list.tasks);
      setStats(s);
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, onLogout]);

  useEffect(() => {
    const t = setTimeout(load, filters.search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, filters.search]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const run = async (fn, message) => {
    try {
      await fn();
      if (message) setToast(message);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const createTask = (body) => run(() => api('/tasks', { method: 'POST', body }), 'Task added');
  const updateTask = (id, body, message = 'Task updated') => run(() => api(`/tasks/${id}`, { method: 'PATCH', body }), message);
  const deleteTask = (id) => run(() => api(`/tasks/${id}`, { method: 'DELETE' }), 'Task deleted');

  const firstName = user.name.split(' ')[0];
  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <div className="topbar-right">
          <span className="user-chip" data-cy="user-name">
            <span className="avatar">{firstName[0]?.toUpperCase()}</span>
            {user.name}
          </span>
          <button className="btn btn-ghost" onClick={onLogout} data-cy="logout">Log out</button>
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <div>
            <h1 data-cy="welcome">Hi {firstName} 👋</h1>
            <p className="muted">
              {stats.active === 0 ? 'You are all caught up.' : `You have ${stats.active} active task${stats.active === 1 ? '' : 's'}.`}
            </p>
          </div>
          <div className="progress" aria-label={`${progress}% complete`}>
            <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
            <small>{progress}% complete</small>
          </div>
        </section>

        <section className="stats" data-cy="stats">
          <Stat label="Total" value={stats.total} cy="stat-total" />
          <Stat label="Active" value={stats.active} cy="stat-active" />
          <Stat label="Completed" value={stats.completed} cy="stat-completed" tone="green" />
          <Stat label="Overdue" value={stats.overdue} cy="stat-overdue" tone="red" />
        </section>

        <TaskForm onSubmit={createTask} />

        <Filters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} canReset={filtered} />

        {error && <div className="alert" role="alert" data-cy="error">{error}</div>}

        <section className="task-list" data-cy="task-list">
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : tasks.length === 0 ? (
            <div className="empty" data-cy="empty-state">
              <div className="empty-icon">✓</div>
              <h3>{filtered ? 'No tasks match your filters' : 'No tasks yet'}</h3>
              <p className="muted">{filtered ? 'Try a different filter or clear them.' : 'Add your first task above to get started.'}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
            ))
          )}
        </section>
      </main>

      {toast && <div className="toast" role="status" data-cy="toast">{toast}</div>}
      <footer className="footer">TaskFlow · Built by Muhammad Waseel</footer>
    </div>
  );
}

function Stat({ label, value, cy, tone = '' }) {
  return (
    <div className={`stat ${tone}`} data-cy={cy}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
