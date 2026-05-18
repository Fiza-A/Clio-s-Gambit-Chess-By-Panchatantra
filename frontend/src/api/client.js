import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 8000,
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
