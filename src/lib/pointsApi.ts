import http from './api';

type ProductPayload = {
  title: string;
  description?: string;
  cost: number;
  stock?: number;
  requiresApproval?: boolean;
  active?: boolean;
  metadata?: Record<string, unknown>;
};

export const getUserPoints = async (userId: string, token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await http.get(`/api/points/users/${userId}`, { headers });
  return res.data;
};

export const claimDaily = async (token: string) => {
  const res = await http.post('/api/points/daily', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const listProducts = async () => {
  const res = await http.get('/api/rewards/products');
  return res.data;
};

export const listProductsAdmin = async (token: string) => {
  const res = await http.get('/api/rewards/products/admin', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createProduct = async (payload: ProductPayload, token: string) => {
  const res = await http.post('/api/rewards/products', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateProduct = async (id: string, payload: Partial<ProductPayload>, token: string) => {
  const res = await http.put(`/api/rewards/products/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteProduct = async (id: string, token: string) => {
  const res = await http.delete(`/api/rewards/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createRedemption = async (productId: string, token: string) => {
  const res = await http.post(
    '/api/rewards/redemptions',
    { productId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const listRedemptions = async (token: string, status?: string) => {
  const params: { status?: string } = {};
  if (status) params.status = status;
  const res = await http.get('/api/rewards/redemptions', { headers: { Authorization: `Bearer ${token}` }, params });
  return res.data;
};

export const updateRedemption = async (id: string, action: 'approve' | 'reject' | 'complete', token: string) => {
  const res = await http.patch(`/api/rewards/redemptions/${id}`, { action }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getPointsLeaderboard = async (token: string, limit = 100) => {
  const res = await http.get('/api/points/leaderboard', {
    params: { limit },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getStreamUsers = async (token: string, limit = 500) => {
  const res = await http.get('/api/stream-points/admin', {
    params: { limit },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const syncStreamPoints = async (token: string, options?: { onlyUserId?: string; dryRun?: boolean; limit?: number }) => {
  const res = await http.post('/api/stream-points/sync', options || {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default {
  getUserPoints,
  claimDaily,
  listProducts,
  listProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  createRedemption,
  listRedemptions,
  updateRedemption,
  getPointsLeaderboard,
  getStreamUsers,
  syncStreamPoints,
};
