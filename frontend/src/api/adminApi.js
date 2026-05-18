import { api } from './client.js';

export const adminApi = {
  list: (resource) => api.get(`/admin/${resource}`).then((r) => {
    console.log(`[adminApi] GET /admin/${resource} response:`, r.data);
    return r.data;
  }),
  detail: (resource, id) => api.get(`/admin/${resource}/${id}`).then((r) => r.data),
  create: (resource, payload) => api.post(`/admin/${resource}`, payload).then((r) => r.data),
  update: (resource, id, payload) => api.patch(`/admin/${resource}/${id}`, payload).then((r) => r.data),
  remove: (resource, id) => api.delete(`/admin/${resource}/${id}`).then((r) => r.data),
  curriculum: () => api.get('/admin/curriculum').then((r) => r.data),
  createModule: (payload) => api.post('/admin/modules', payload).then((r) => r.data),
  updateModule: (id, payload) => api.patch(`/admin/modules/${id}`, payload).then((r) => r.data),
  deleteModule: (id) => api.delete(`/admin/modules/${id}`).then((r) => r.data),
  createChapter: (payload) => api.post('/admin/chapters', payload).then((r) => r.data),
  updateChapter: (id, payload) => api.patch(`/admin/chapters/${id}`, payload).then((r) => r.data),
  deleteChapter: (id) => api.delete(`/admin/chapters/${id}`).then((r) => r.data),
  createStory: (payload) => api.post('/admin/stories', payload).then((r) => r.data),
  updateStory: (id, payload) => api.patch(`/admin/stories/${id}`, payload).then((r) => r.data),
  deleteStory: (id) => api.delete(`/admin/stories/${id}`).then((r) => r.data),
  rolesPermissions: () => api.get('/admin/roles-permissions').then((r) => r.data),
  saveRolesPermissions: (payload) => api.patch('/admin/roles-permissions', payload).then((r) => r.data),
  analytics: () => api.get('/admin/analytics').then((r) => r.data),
  generateReport: (payload) => api.post('/admin/reports/generate', payload).then((r) => r.data),
  saveSettings: (payload) => api.patch('/admin/settings', payload).then((r) => r.data),
};
