import api from './api';
import type { Product, ProductCreate, ProductOption, PaginationParams } from '@/types';

export const productsService = {
  list: async (params?: PaginationParams & { search?: string }): Promise<Product[]> => {
    const { data } = await api.get<Product[]>('/api/admin/products', { params });
    return data;
  },
  get: async (id: string): Promise<Product> => {
    const { data } = await api.get<Product>(`/api/products/${id}`);
    return data;
  },
  create: async (payload: ProductCreate): Promise<Product> => {
    const { data } = await api.post<Product>('/api/products', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ProductCreate>): Promise<Product> => {
    const { data } = await api.put<Product>(`/api/products/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/products/${id}`);
  },
  toggleActive: async (id: string, is_active: boolean): Promise<Product> => {
    const { data } = await api.put<Product>(`/api/products/${id}`, { is_active });
    return data;
  },
  addOption: async (productId: string, option: Omit<ProductOption, 'id'>): Promise<ProductOption> => {
    const { data } = await api.post<ProductOption>(`/api/products/${productId}/options`, option);
    return data;
  },
  removeOption: async (productId: string, optionId: string): Promise<void> => {
    await api.delete(`/api/products/${productId}/options/${optionId}`);
  },
};
