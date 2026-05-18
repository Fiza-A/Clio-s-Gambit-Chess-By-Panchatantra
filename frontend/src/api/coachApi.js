import { api } from './client.js';

export const coachApi = {
  list: (resource) => api.get(`/coach/${resource}`).then((r) => r.data),
  detail: (resource, id) => api.get(`/coach/${resource}/${id}`).then((r) => r.data),
  createClass: (payload) => api.post('/coach/classes', payload).then((r) => r.data),
  updateClass: (id, payload) => api.patch(`/coach/classes/${id}`, payload).then((r) => r.data),
  deleteClass: (id) => api.delete(`/coach/classes/${id}`).then((r) => r.data),
  updateNotes: (id, notes) => api.patch(`/coach/students/${id}/notes`, { notes }).then((r) => r.data),
  createAssignment: (payload) => api.post('/coach/assignments', payload).then((r) => r.data),
  createResource: (payload) => api.post('/coach/resources', payload).then((r) => r.data),
  sendMessage: (id, text) => api.post(`/coach/messages/${id}`, { text }).then((r) => r.data),
  generateReport: (payload) => api.post('/coach/reports/generate', payload).then((r) => r.data),
  saveSettings: (payload) => api.patch('/coach/settings', payload).then((r) => r.data),
};
