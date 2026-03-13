'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShoppingCart, DollarSign, Users, Package,
  TrendingUp, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { adminService } from '@/services/admin';
import { ordersService } from '@/services/orders';
import type { Order } from '@/types';

// Génère des données de tendance simulées sur 7 jours (remplacer par vrai endpoint)
function generateTrendData(orders: Order[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const label = format(date, 'dd MMM', { locale: fr });
    const dayOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.toDateString() === date.toDateString();
    });
    return {
      date: label,
      commandes: dayOrders.length,
      revenu: dayOrders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0),
    };
  });
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.stats,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersService.adminList({ per_page: 100 }),
  });

  const trendData = generateTrendData(orders);
  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  if (statsLoading || ordersLoading) return (
    <div>
      <Header title="Dashboard" subtitle="Vue d'ensemble de votre boutique" />
      <PageLoader />
    </div>
  );

  return (
    <div>
      <Header title="Dashboard" subtitle="Vue d'ensemble de votre boutique" />

      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Commandes aujourd'hui"
            value={stats?.orders_today ?? 0}
            icon={ShoppingCart}
            color="indigo"
            subtitle="Nouvelles commandes"
          />
          <StatCard
            title="Chiffre d'affaires"
            value={`${(stats?.total_revenue ?? 0).toFixed(0)} EUR`}
            icon={DollarSign}
            color="emerald"
            subtitle="Commandes payées"
          />
          <StatCard
            title="Clients"
            value={stats?.total_users ?? 0}
            icon={Users}
            color="amber"
            subtitle="Utilisateurs actifs"
          />
          <StatCard
            title="Produits"
            value={stats?.total_products ?? 0}
            icon={Package}
            color="rose"
            subtitle="Produits actifs"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Area chart — Revenus */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">Revenus — 7 derniers jours</h3>
                <p className="text-slate-400 text-xs mt-0.5">Commandes payées</p>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(v: unknown) => [`${Number(v).toFixed(2)} EUR`, 'Revenu']}
                />
                <Area type="monotone" dataKey="revenu" stroke="#4f46e5" strokeWidth={2} fill="url(#revenuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar chart — Commandes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">Commandes</h3>
                <p className="text-slate-400 text-xs mt-0.5">7 derniers jours</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-amber-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(v: unknown) => [Number(v), 'Commandes']}
                />
                <Bar dataKey="commandes" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Commandes récentes</h3>
            </div>
            <a href="/orders" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Voir tout →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400">Commande</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400">Montant</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">Aucune commande</td></tr>
                )}
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {order.shipping_address?.full_name || 'Client'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">
                      {order.total_amount.toFixed(2)} EUR
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
