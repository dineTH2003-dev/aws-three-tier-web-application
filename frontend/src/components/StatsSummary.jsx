import React from 'react';

export function StatsSummary({ tasks }) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const highPriority = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-label">Total Tasks</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className="stat-card stat-pending">
        <span className="stat-label">Pending</span>
        <span className="stat-value">{pending}</span>
      </div>
      <div className="stat-card stat-progress">
        <span className="stat-label">In Progress</span>
        <span className="stat-value">{inProgress}</span>
      </div>
      <div className="stat-card stat-completed">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{completed}</span>
      </div>
      <div className="stat-card stat-high">
        <span className="stat-label">High Priority</span>
        <span className="stat-value">{highPriority}</span>
      </div>
    </div>
  );
}
