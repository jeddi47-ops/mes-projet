'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Mail, DollarSign, Clock, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';

interface Settings {
  shop_name: string;
  shop_email: string;
  currency: string;
  timezone: string;
  country: string;
  logo_url: string;
  support_phone: string;
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'MAD', 'XOF', 'CAD', 'CHF'];
const TIMEZONES = ['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Africa/Casablanca', 'Africa/Lagos', 'Asia/Dubai'];

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-card border border-slate-100"
  >
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
  />
);

export default function SettingsPage() {
  const [loading, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    shop_name: 'Ma Boutique',
    shop_email: 'contact@maboutique.com',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    country: 'France',
    logo_url: '',
    support_phone: '',
  });

  const set = (key: keyof Settings, val: string) =>
    setSettings((s) => ({ ...s, [key]: val }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success('Paramètres enregistrés');
  };

  return (
    <div>
      <Header title="Paramètres" subtitle="Configuration de votre boutique" />

      <form onSubmit={handleSave} className="p-6 space-y-5 max-w-3xl">
        {/* Boutique */}
        <Section title="Informations boutique" icon={Store}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nom de la boutique">
              <Input value={settings.shop_name} onChange={(e) => set('shop_name', e.target.value)} />
            </Field>
            <Field label="Pays">
              <Input value={settings.country} onChange={(e) => set('country', e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="URL du logo">
                <div className="flex gap-3">
                  <Input
                    value={settings.logo_url}
                    onChange={(e) => set('logo_url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="logo" className="w-10 h-10 rounded-xl object-contain border border-slate-200" />
                  )}
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact & Support" icon={Mail}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Email de contact">
              <Input type="email" value={settings.shop_email} onChange={(e) => set('shop_email', e.target.value)} />
            </Field>
            <Field label="Téléphone support">
              <Input value={settings.support_phone} onChange={(e) => set('support_phone', e.target.value)} placeholder="+33 6 00 00 00 00" />
            </Field>
          </div>
        </Section>

        {/* Régional */}
        <Section title="Paramètres régionaux" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Devise">
              <select
                value={settings.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fuseau horaire">
              <select
                value={settings.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  );
}
