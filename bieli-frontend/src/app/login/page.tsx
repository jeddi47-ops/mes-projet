'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const token = res.data.access_token;
      const me = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuth(token, me.data);
      router.push('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google/login`;
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex">
      {/* Left dark panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-bieli-black relative overflow-hidden flex-col items-center justify-center p-16">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full border border-white/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 right-12 w-[120px] h-[120px] rounded-full border border-bieli-gold/20" />

        <div className="relative z-10 text-center">
          <Link href="/" className="font-playfair text-5xl font-medium text-white mb-6 block">
            bieli.
          </Link>
          <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-12">Curated Shop</p>

          <div className="space-y-6 text-left max-w-xs">
            {[
              'Produits sélectionnés avec soin.',
              'Livraison rapide partout en France.',
              'Retours gratuits sous 30 jours.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-bieli-gold/20 border border-bieli-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-bieli-gold" />
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2 justify-center mt-16">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-6 h-2 bg-bieli-gold' : 'w-2 h-2 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 md:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden font-playfair text-3xl font-semibold text-bieli-black block mb-10">
            bieli.
          </Link>

          <p className="text-xs tracking-widest uppercase text-bieli-muted mb-2">Bienvenue</p>
          <h1 className="font-playfair text-3xl font-medium text-bieli-black mb-1">Se connecter</h1>
          <p className="text-sm text-bieli-gray mb-8">Connectez-vous à votre compte bieli.</p>

          {/* Social buttons */}
          <div className="space-y-3 mb-6">
            <button
              data-testid="google-login-btn"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 border border-bieli-border hover:border-bieli-black transition-colors text-sm font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <button
              data-testid="apple-login-btn"
              className="w-full flex items-center justify-center gap-3 py-3 border border-bieli-border hover:border-bieli-black transition-colors text-sm font-medium opacity-50 cursor-not-allowed"
              disabled
              title="Bientôt disponible"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
              </svg>
              Continuer avec Apple
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-bieli-border" />
            <span className="text-xs text-bieli-muted uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-bieli-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="login-error" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                placeholder="vous@exemple.com"
                className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="password-input"
                  placeholder="••••••••"
                  className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-bieli-muted hover:text-bieli-black"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs text-bieli-muted hover:text-bieli-black transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              data-testid="submit-login"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-bieli-gold hover:bg-bieli-gold-hover disabled:opacity-60 text-white font-medium tracking-wide transition-colors mt-2"
            >
              {loading ? 'Connexion...' : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-bieli-gray mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-bieli-black font-medium hover:text-bieli-gold transition-colors">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
