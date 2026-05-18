import { api } from './client.js';

export const authApi = {
  async login(payload) {
    const body = typeof payload === 'string' ? { role: payload } : payload;
    const { data } = await api.post('/auth/login', body);
    return data;
  },
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  async logout() {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
