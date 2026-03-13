import api from './api';
import type { AdminStats } from '@/types';

export const adminService = {
  stats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/api/admin/stats');
    return data;
  },
};
