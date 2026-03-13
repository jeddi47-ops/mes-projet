import api from './api';
import type { Order, OrderStatus, PaginationParams } from '@/types';

export const ordersService = {
  list: async (params?: PaginationParams): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/api/orders', { params });
    return data;
  },
  adminList: async (params?: PaginationParams): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/api/admin/orders', { params });
    return data;
  },
  get: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/api/orders/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const { data } = await api.put<Order>(`/api/orders/${id}/status`, { status });
    return data;
  },
  downloadInvoice: (id: string): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return `${apiUrl}/api/orders/${id}/invoice`;
  },
};
