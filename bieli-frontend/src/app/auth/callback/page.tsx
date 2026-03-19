'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setAuth(token, res.data);
        router.replace('/');
      })
      .catch(() => {
        setLoading(false);
        router.replace('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bieli-bg">
      <div className="text-center">
        <div className="font-playfair text-3xl font-medium text-bieli-black mb-4">bieli.</div>
        <div className="w-8 h-8 border-2 border-bieli-border border-t-bieli-gold rounded-full animate-spin mx-auto" />
        <p className="text-sm text-bieli-muted mt-4">Connexion en cours…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bieli-border border-t-bieli-gold rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
