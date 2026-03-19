'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';

function AuthInit({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('bieli_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/api/auth/me')
      .then((res) => setAuth(token, res.data))
      .catch(() => {
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
