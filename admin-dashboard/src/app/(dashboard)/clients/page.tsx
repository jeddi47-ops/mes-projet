'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Users, ShoppingBag, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { ordersService } from '@/services/orders';
import type { Order } from '@/types';

interface ClientSummary {
  user_id: string;
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  order_count: number;
  total_spent: number;
  last_order: string;
}

function buildClients(orders: Order[]): ClientSummary[] {
  const map: Record<string, ClientSummary> = {};
  for (const o of orders) {
    const uid = o.user_id;
    if (!map[uid]) {
      map[uid] = {
        user_id: uid,
        name: o.shipping_address?.full_name || 'Client anonyme',
        phone: o.shipping_address?.phone,
        city: o.shipping_address?.city,
        country: o.shipping_address?.country,
        order_count: 0,
        total_spent: 0,
        last_order: o.created_at,
      };
    }
    map[uid].order_count += 1;
    if (o.status === 'paid') map[uid].total_spent += o.total_amount;
    if (new Date(o.created_at) > new Date(map[uid].last_order)) {
      map[uid].last_order = o.created_at;
    }
  }
  return Object.values(map).sort(
    (a, b) => new Date(b.last_order).getTime() - new Date(a.last_order).getTime()
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-all'],
    queryFn: () => ordersService.adminList({ per_page: 100 }),
  });

  const clients = buildClients(orders);
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.country ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Clients" subtitle={`${clients.length} client(s) au total`} />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Clients uniques', value: clients.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Commandes totales', value: orders.length, icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
            {
              label: 'Revenu total',
              value: `${orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0).toFixed(0)} EUR`,
              icon: ShoppingBag,
              color: 'text-amber-600 bg-amber-50',
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-card border border-slate-100"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Client</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Téléphone</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Ville / Pays</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Commandes</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Total dépensé</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Dernière cmd</th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Aucun client trouvé</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((client) => (
                    <tr key={client.user_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {client.name[0]?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">{client.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{client.phone || '—'}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-700">{client.city || '—'}</p>
                        <p className="text-xs text-slate-400">{client.country || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="info">{client.order_count} cmd</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                        {client.total_spent.toFixed(2)} EUR
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {format(new Date(client.last_order), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/messages?user=${client.user_id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Contacter"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
