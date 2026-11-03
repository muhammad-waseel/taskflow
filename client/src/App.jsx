import { useEffect, useState } from 'react';
import { api, tokenStore } from './api.js';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  const handleAuth = ({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="center-screen" data-cy="loading">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthPage onAuth={handleAuth} />;
}
