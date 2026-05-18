import { api } from './client.js';

export const studentApi = {
  list: (resource) => api.get(`/student/${resource}`).then((r) => r.data),
  detail: (resource, id) => api.get(`/student/${resource}/${id}`).then((r) => r.data),
  getStoryModules: () => api.get('/student/story-modules').then((r) => r.data),
  getStoryModule: (moduleId) => api.get(`/student/story-modules/${moduleId}`).then((r) => r.data),
  getModuleChapters: (moduleId) => api.get(`/student/story-modules/${moduleId}/chapters`).then((r) => r.data),
  getChapterStories: (moduleId, chapterId) => api.get(`/student/story-modules/${moduleId}/chapters/${chapterId}/stories`).then((r) => r.data),
  getStoryDetail: (storyId) => api.get(`/student/stories/${storyId}`).then((r) => r.data),
  updateStoryProgress: (storyId, progress) => api.patch(`/student/stories/${storyId}/progress`, { progress }).then((r) => r.data),
  updateStory: (id, payload) => api.patch(`/student/stories/${id}/progress`, payload).then((r) => r.data),
  learnPrinciple: (id, payload) => api.patch(`/student/principles/${id}/learned`, payload).then((r) => r.data),
  submitPuzzle: (id, payload) => api.post(`/student/puzzles/${id}/submit`, payload).then((r) => r.data),
  joinClass: (id) => api.post(`/student/classes/${id}/join`).then((r) => r.data),
  updateProfile: (payload) => api.patch('/student/profile', payload).then((r) => r.data),
};
