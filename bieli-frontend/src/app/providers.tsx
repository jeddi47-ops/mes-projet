'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';

function AuthInit({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('bieli_token');
    console.log('[bieli] AuthInit — token présent:', !!token);

    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/api/auth/me')
      .then((res) => {
        console.log('[bieli] AuthInit — /api/auth/me OK:', res.data?.email);
        setAuth(token, res.data);
      })
      .catch((err) => {
        console.error('[bieli] AuthInit — /api/auth/me FAILED:', err.response?.status);
        localStorage.removeItem('bieli_token');
        setLoading(false);
      });
  }, []);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthInit>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        theme="light"
        toastOptions={{
          style: { fontFamily: 'var(--font-dm-sans)', borderRadius: '0px' },
        }}
      />
    </AuthInit>
  );
}
