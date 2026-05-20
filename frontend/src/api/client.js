import axios from 'axios';

/** Backend root including `/api`. Override with `VITE_API_BASE_URL` in `frontend/.env`. */
const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
export const API_BASE_URL = String(rawBase).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

export async function fetchDashboard(role) {
  const { data } = await api.get(`/${role}/dashboard`);
  return data;
}

export async function performDashboardAction(role, action, label, payload = {}) {
  const { data } = await api.post('/actions', { role, action, label, payload });
  return data;
}

export async function fetchCollection(name) {
  const { data } = await api.get(`/collections/${name}`);
  return data;
}

export async function downloadDashboardReport(role) {
  const { data } = await api.get(`/${role}/report`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${role}-dashboard-report.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
