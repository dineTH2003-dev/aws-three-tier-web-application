import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../api/tasks.js';
import { StatsSummary } from '../components/StatsSummary.jsx';
import { TaskFilter } from '../components/TaskFilter.jsx';
import { TaskCard } from '../components/TaskCard.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import { Alert } from '../components/Alert.jsx';

export function DashboardPage() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listTasksApi(token, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(res.data);
    } catch (err) {
      setError({
        message: err.message || 'Failed to load tasks',
        details: err.details,
      });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateOrUpdateTask = async (taskData) => {
    if (editingTask) {
      await updateTaskApi(token, editingTask.id, taskData);
      setSuccessMsg('Task updated successfully.');
    } else {
      await createTaskApi(token, taskData);
      setSuccessMsg('Task created successfully.');
    }
    fetchTasks();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskApi(token, taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError({ message: err.message || 'Failed to update task status' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskApi(token, taskId);
      setSuccessMsg('Task deleted successfully.');
      fetchTasks();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError({ message: err.message || 'Failed to delete task' });
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  // Client-side text filter by search query
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(query);
    const descMatch = t.description?.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Task Workspace</h1>
            <p className="text-muted">
              Welcome back, <strong>{user?.name}</strong>. Manage your cloud priorities below.
            </p>
          </div>
        </div>

        {error && <Alert type="error" message={error.message} details={error.details} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

        <StatsSummary tasks={tasks} />

        <TaskFilter
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={openCreateModal}
        />

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your tasks from PostgreSQL...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3>No tasks found</h3>
            <p className="text-muted">
              {searchQuery || statusFilter || priorityFilter
                ? 'No tasks match your current filter settings.'
                : "You don't have any tasks yet. Create your first task to get started!"}
            </p>
            <button onClick={openCreateModal} className="btn btn-primary mt-4">
              Create a Task
            </button>
          </div>
        ) : (
          <div className="task-grid">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
        initialTask={editingTask}
      />
    </div>
  );
}
