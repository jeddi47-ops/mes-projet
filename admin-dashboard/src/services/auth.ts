import api from './api';
import type { LoginCredentials, AuthResponse, User } from '@/types';

export const authService = {
  login: async (creds: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', creds);
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/api/auth/me');
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout').catch(() => {});
  },
};
