'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Users, ShoppingBag, Globe, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { adminService } from '@/services/admin';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminService.users({ page, per_page: PER_PAGE }),
  });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.country ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Clients" subtitle="Utilisateurs inscrits sur la boutique" />

      <div className="p-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Clients inscrits', value: users.length, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Ont commandé', value: users.filter(u => u.orders_count > 0).length, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Pays représentés', value: new Set(users.map(u => u.country).filter(Boolean)).size, icon: Globe, color: 'bg-amber-50 text-amber-600' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nom, email ou pays..."
            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Table */}
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
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Pays</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Commandes</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Inscrit le</th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Aucun client trouvé</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {user.name[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {user.phone ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {user.country
                          ? <Badge variant="default">{user.country}</Badge>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={user.orders_count > 0 ? 'info' : 'default'}>
                          {user.orders_count} commande{user.orders_count !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <Link
                            href={`/messages?user=${user.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Envoyer un message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {filtered.length} client(s) affiché(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg font-medium">
                  {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={users.length < PER_PAGE}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
