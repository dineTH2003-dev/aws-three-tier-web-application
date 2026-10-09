import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { checkHealthReady } from '../api/auth.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isHealthy, setIsHealthy] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const ok = await checkHealthReady();
        if (isMounted) setIsHealthy(ok);
      } catch {
        if (isMounted) setIsHealthy(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="nav-brand">
          <div className="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="brand-title">TaskFlow AWS</span>
            <span className="brand-subtitle">Three-Tier Architecture</span>
          </div>
        </div>

        <div className="nav-actions">
          {/* Health status badge */}
          <div className="health-badge" title={isHealthy ? 'Backend & PostgreSQL Connected' : 'Health check failing'}>
            <span className={`status-dot ${isHealthy === true ? 'healthy' : isHealthy === false ? 'degraded' : 'checking'}`}></span>
            <span className="health-text">
              {isHealthy === true ? 'ALB / RDS Ready' : isHealthy === false ? 'Service Degraded' : 'Checking...'}
            </span>
          </div>

          {user && (
            <div className="user-profile">
              <div className="user-avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
