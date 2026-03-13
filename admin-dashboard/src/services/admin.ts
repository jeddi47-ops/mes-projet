import api from './api';
import type { AdminStats, AdminUser } from '@/types';

export const adminService = {
  stats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/api/admin/stats');
    return data;
  },
  users: async (params?: { page?: number; per_page?: number }): Promise<AdminUser[]> => {
    const { data } = await api.get<AdminUser[]>('/api/admin/users', { params });
    return data;
  },
};
