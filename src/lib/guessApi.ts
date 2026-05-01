import http from './api';

export const getActiveEvent = async () => {
  const res = await http.get('/api/guess-balance/active');
  return res.data;
};

export const submitGuess = async (eventId: string, guess: number, token: string) => {
  const res = await http.post(`/api/guess-balance/${eventId}/guess`, { guess }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAllGuessEvents = async (token: string) => {
  const res = await http.get('/api/guess-balance/admin/all', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createGuessEvent = async (title: string, token: string) => {
  const res = await http.post('/api/guess-balance', { title }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const closeGuessEvent = async (eventId: string, token: string) => {
  const res = await http.post(`/api/guess-balance/${eventId}/close`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const reopenGuessEvent = async (eventId: string, token: string) => {
  const res = await http.post(`/api/guess-balance/${eventId}/reopen`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const resolveGuessEvent = async (eventId: string, finalBalance: number, token: string) => {
  const res = await http.post(`/api/guess-balance/${eventId}/resolve`, { finalBalance }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteGuessEvent = async (eventId: string, token: string) => {
  const res = await http.delete(`/api/guess-balance/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default {
  getActiveEvent,
  submitGuess,
  getAllGuessEvents,
  createGuessEvent,
  closeGuessEvent,
  reopenGuessEvent,
  resolveGuessEvent,
  deleteGuessEvent,
};
