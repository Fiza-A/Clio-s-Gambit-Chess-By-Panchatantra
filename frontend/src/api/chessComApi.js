import { api } from './client.js';

export const chessComApi = {
  fetchPlayerDate: (chessComId, date) => api.post('/chesscom/fetch-player-date', { chessComId, date }).then(r => r.data),
  fetchPlayerMonth: (chessComId, year, month) => api.post('/chesscom/fetch-player-month', { chessComId, year, month }).then(r => r.data),
  autoCompleteActivity: () => api.post('/chesscom/auto-complete-activity').then(r => r.data),
  getPlayerActivity: (chessComId) => api.get(`/chesscom/player/${encodeURIComponent(chessComId)}/activity`).then(r => r.data),
  debugFetch: (chessComId, date) => api.post('/chesscom/debug-fetch', { chessComId, date }).then(r => r.data),
};
