import React from 'react';

export function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const isCompleted = task.status === 'completed';

  const priorityColors = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
  };

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  const formattedDate = new Date(task.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`task-card ${isCompleted ? 'task-completed' : ''}`}>
      <div className="task-header">
        <div className="task-meta-top">
          <span className={`priority-badge ${priorityColors[task.priority] || 'badge-medium'}`}>
            {task.priority.toUpperCase()}
          </span>
          <span className="task-date">{formattedDate}</span>
        </div>

        <div className="task-actions">
          <button
            onClick={() => onEdit(task)}
            className="icon-btn"
            title="Edit task"
            aria-label="Edit task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="icon-btn delete-btn"
            title="Delete task"
            aria-label="Delete task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-footer">
        <label className="status-selector-label">
          <span className="text-xs text-muted">Status:</span>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className={`status-select status-${task.status}`}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
    </div>
  );
}
