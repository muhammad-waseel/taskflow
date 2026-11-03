import { useState } from 'react';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      const data = await api(`/auth/${mode}`, { method: 'POST', body });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <Logo light />
        <h1>Plan your day.<br />Finish what matters.</h1>
        <p>TaskFlow keeps your tasks organised with priorities, due dates and quick filters, so nothing slips through the cracks.</p>
        <ul className="auth-points">
          <li>Priorities and due dates at a glance</li>
          <li>Filter, search and sort in one click</li>
          <li>Secure accounts with JWT authentication</li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit} data-cy="auth-form" noValidate>
          <h2 data-cy="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted">{isRegister ? 'Start organising your tasks in seconds.' : 'Log in to see your tasks.'}</p>

          {isRegister && (
            <label>
              Name
              <input data-cy="name-input" value={form.name} onChange={update('name')} placeholder="Your name" autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input data-cy="email-input" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            Password
            <input data-cy="password-input" type="password" value={form.password} onChange={update('password')} placeholder="At least 6 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} />
          </label>

          {error && <div className="alert" role="alert" data-cy="auth-error">{error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy} data-cy="auth-submit">
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="link" onClick={switchMode} data-cy="auth-switch">
              {isRegister ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
