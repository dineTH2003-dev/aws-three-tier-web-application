import { apiClient } from './client.js';

export async function registerApi({ name, email, password }) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function loginApi({ email, password }) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function getProfileApi(token) {
  return apiClient('/auth/me', {
    method: 'GET',
    token,
  });
}

export async function checkHealthReady() {
  const base = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : '';
  const res = await fetch(`${base}/health/ready`).catch(() => null);
  return res ? res.ok : false;
}

