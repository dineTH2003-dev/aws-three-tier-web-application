import { apiClient } from './client.js';

export async function listTasksApi(token, { status, priority } = {}) {
  const queryParams = new URLSearchParams();
  if (status) queryParams.set('status', status);
  if (priority) queryParams.set('priority', priority);

  const queryStr = queryParams.toString();
  const endpoint = queryStr ? `/tasks?${queryStr}` : '/tasks';

  return apiClient(endpoint, {
    method: 'GET',
    token,
  });
}

export async function createTaskApi(token, taskData) {
  return apiClient('/tasks', {
    method: 'POST',
    body: taskData,
    token,
  });
}

export async function getTaskApi(token, id) {
  return apiClient(`/tasks/${id}`, {
    method: 'GET',
    token,
  });
}

export async function updateTaskApi(token, id, updates) {
  return apiClient(`/tasks/${id}`, {
    method: 'PATCH',
    body: updates,
    token,
  });
}

export async function deleteTaskApi(token, id) {
  return apiClient(`/tasks/${id}`, {
    method: 'DELETE',
    token,
  });
}
