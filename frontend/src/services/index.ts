import api from './api';
import type { Visit, Visitor } from '../types';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const visitsService = {
  create: async (data: any) => {
    const res = await api.post('/visits', data);
    return res.data as Visit;
  },
  getMyVisits: async (params?: any) => {
    const res = await api.get('/visits/my', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/visits/${id}`);
    return res.data as Visit;
  },
  cancel: async (id: string) => {
    const res = await api.patch(`/visits/${id}/cancel`);
    return res.data as Visit;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/visits/${id}`, data);
    return res.data as Visit;
  },
};

export const guardService = {
  getStats: async () => {
    const res = await api.get('/guard/stats');
    return res.data;
  },
  search: async (q: string) => {
    const res = await api.get('/guard/search', { params: { q } });
    return res.data;
  },
  getCurrentlyInside: async () => {
    const res = await api.get('/guard/currently-inside');
    return res.data as Visit[];
  },
  checkIn: async (id: string, data?: any) => {
    const res = await api.patch(`/guard/visits/${id}/checkin`, data || {});
    return res.data as Visit;
  },
  checkOut: async (id: string) => {
    const res = await api.patch(`/guard/visits/${id}/checkout`);
    return res.data as Visit;
  },
  createWalkIn: async (data: any) => {
    const res = await api.post('/guard/walkin', data);
    return res.data as Visit;
  },
  verify: async (id: string, data: any) => {
    const res = await api.patch(`/guard/visits/${id}/verify`, data);
    return res.data as Visit;
  },
};

export const recordsService = {
  getAll: async (params?: any) => {
    const res = await api.get('/records', { params });
    return res.data;
  },
};

export const adminService = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  getUsers: async (params?: any) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  updateUser: async (id: string, data: any) => {
    const res = await api.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  getMembers: async () => {
    const res = await api.get('/admin/members');
    return res.data;
  },
};

export const notificationsService = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};
