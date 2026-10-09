import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Alert.jsx';

export function RegisterPage({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError({ message: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError({
        message: err.message || 'Registration failed',
        details: err.details,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>Create Account</h1>
          <p className="text-muted">Start organizing tasks with high-availability cloud backing</p>
        </div>

        {error && <Alert type="error" message={error.message} details={error.details} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password (min 8 characters)</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-muted text-sm">
            Already have an account?{' '}
            <button type="button" onClick={onNavigateToLogin} className="btn-link">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
