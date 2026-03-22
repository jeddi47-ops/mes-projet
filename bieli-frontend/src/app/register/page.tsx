'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const token = res.data.access_token;
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setAuth(token, me.data);
      router.push('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-page" className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-bieli-black flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full border border-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full border border-bieli-gold/10" />
        <div className="relative z-10 text-center">
          <Link href="/" className="mb-4 block">
            <img src="/nelstore-logo.jpg" alt="nel.store" className="h-16 w-auto mx-auto" />
          </Link>
          <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-12">Rejoignez-nous</p>
          <p className="text-white/60 text-sm max-w-xs leading-relaxed">
            Créez votre compte pour profiter d'offres exclusives, suivre vos commandes et accéder à notre collection complète.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 md:p-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block mb-10">
            <img src="/nelstore-logo.jpg" alt="nel.store" className="h-10 w-auto" />
          </Link>

          <p className="text-xs tracking-widest uppercase text-bieli-muted mb-2">Nouveau compte</p>
          <h1 className="font-playfair text-3xl font-medium mb-1">Créer un compte</h1>
          <p className="text-sm text-bieli-gray mb-8">Rejoignez la communauté nel.store.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="register-error" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Prénom</label>
                <input
                  name="first_name" type="text" required value={form.first_name} onChange={onChange}
                  data-testid="first-name-input" placeholder="Jean"
                  className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Nom</label>
                <input
                  name="last_name" type="text" required value={form.last_name} onChange={onChange}
                  data-testid="last-name-input" placeholder="Dupont"
                  className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Email</label>
              <input
                name="email" type="email" required value={form.email} onChange={onChange}
                data-testid="register-email-input" placeholder="vous@exemple.com"
                className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-bieli-gray uppercase tracking-widest mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} required
                  value={form.password} onChange={onChange} data-testid="register-password-input"
                  placeholder="••••••••" minLength={6}
                  className="w-full border-b border-bieli-border bg-transparent py-3 text-sm placeholder:text-bieli-muted focus:border-bieli-black focus:outline-none transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-bieli-muted">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading} data-testid="submit-register"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-bieli-gold hover:bg-bieli-gold-hover disabled:opacity-60 text-white font-medium transition-colors mt-2"
            >
              {loading ? 'Création...' : <><span>Créer mon compte</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-bieli-gray mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-bieli-black font-medium hover:text-bieli-gold transition-colors">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
