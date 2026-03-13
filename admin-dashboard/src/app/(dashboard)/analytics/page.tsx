'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { subDays, format, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import { PageLoader } from '@/components/ui/Spinner';
import { ordersService } from '@/services/orders';
import type { Order } from '@/types';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function buildDailyRevenue(orders: Order[], days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const label = format(date, 'dd MMM', { locale: fr });
    const dayOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.toDateString() === date.toDateString() && o.status === 'paid';
    });
    return { date: label, revenu: dayOrders.reduce((s, o) => s + o.total_amount, 0) };
  });
}

function buildTopProducts(orders: Order[]) {
  const map: Record<string, { name: string; qty: number; revenu: number }> = {};
  for (const o of orders) {
    for (const item of o.items) {
      if (!map[item.product_name]) map[item.product_name] = { name: item.product_name, qty: 0, revenu: 0 };
      map[item.product_name].qty += item.quantity;
      if (o.status === 'paid') map[item.product_name].revenu += item.unit_price * item.quantity;
    }
  }
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
}

function buildStatusPie(orders: Order[]) {
  const map: Record<string, number> = {
    pending_payment: 0, payment_discussion: 0, paid: 0, cancelled: 0,
  };
  const labels: Record<string, string> = {
    pending_payment: 'En attente', payment_discussion: 'En discussion', paid: 'Payé', cancelled: 'Annulé',
  };
  for (const o of orders) map[o.status] = (map[o.status] || 0) + 1;
  return Object.entries(map).map(([k, v]) => ({ name: labels[k], value: v }));
}

function buildMonthlyRevenue(orders: Order[]) {
  const months: Record<string, number> = {};
  for (const o of orders) {
    if (o.status !== 'paid') continue;
    const key = format(new Date(o.created_at), 'MMM yyyy', { locale: fr });
    months[key] = (months[key] || 0) + o.total_amount;
  }
  return Object.entries(months).map(([month, revenu]) => ({ month, revenu })).slice(-6);
}

export default function AnalyticsPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-analytics'],
    queryFn: () => ordersService.adminList({ per_page: 200 }),
  });

  const dailyRevenue = buildDailyRevenue(orders, 30);
  const topProducts = buildTopProducts(orders);
  const statusPie = buildStatusPie(orders);
  const monthlyRevenue = buildMonthlyRevenue(orders);

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.filter(o => o.status === 'paid').length : 0;
  const conversionRate = orders.length > 0
    ? ((orders.filter(o => o.status === 'paid').length / orders.length) * 100).toFixed(1)
    : '0';

  if (isLoading) return (
    <div><Header title="Analytics" /><PageLoader /></div>
  );

  return (
    <div>
      <Header title="Analytics" subtitle="Performance de votre boutique" />

      <div className="p-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Revenu total', value: `${totalRevenue.toFixed(0)} EUR`, sub: 'Commandes payées' },
            { label: 'Valeur moy. commande', value: `${avgOrderValue.toFixed(0)} EUR`, sub: 'Par commande payée' },
            { label: 'Taux de conversion', value: `${conversionRate}%`, sub: 'Pending → Paid' },
            { label: 'Total commandes', value: orders.length, sub: 'Toutes statuts confondus' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-card border border-slate-100"
            >
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{kpi.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue 30 days */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-1">Revenus — 30 derniers jours</h3>
          <p className="text-xs text-slate-400 mb-5">Commandes payées uniquement</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                formatter={(v: unknown) => [`${Number(v).toFixed(2)} EUR`, 'Revenu']} />
              <Area type="monotone" dataKey="revenu" stroke="#4f46e5" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Top products */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-1">Produits les plus vendus</h3>
            <p className="text-xs text-slate-400 mb-5">Par quantité commandée</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="qty" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Quantité" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status pie */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-1">Répartition des statuts</h3>
            <p className="text-xs text-slate-400 mb-5">Toutes les commandes</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Monthly revenue */}
        {monthlyRevenue.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-1">Revenus mensuels</h3>
            <p className="text-xs text-slate-400 mb-5">6 derniers mois</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(v: unknown) => [`${Number(v).toFixed(2)} EUR`, 'Revenu']} />
                <Bar dataKey="revenu" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenu" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
