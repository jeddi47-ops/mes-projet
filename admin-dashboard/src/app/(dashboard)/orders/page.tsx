'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Eye, Download, Filter, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { ordersService } from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending_payment', label: 'En attente' },
  { value: 'payment_discussion', label: 'En discussion' },
  { value: 'paid', label: 'Payé' },
  { value: 'cancelled', label: 'Annulé' },
];

function StatusChangeModal({
  order, open, onClose,
}: { order: Order | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<OrderStatus>(order?.status ?? 'pending_payment');

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersService.updateStatus(order!.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Statut mis à jour');
      onClose();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  if (!order) return null;
  return (
    <Modal open={open} onClose={onClose} title="Changer le statut" size="sm">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Commande #{order.id.slice(0, 8).toUpperCase()}</p>
        <div className="space-y-2">
          {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((s) => (
            <label key={s.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === s.value ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="status" value={s.value} checked={selected === s.value} onChange={() => setSelected(s.value as OrderStatus)} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">{s.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => mutation.mutate(selected)}
            disabled={mutation.isPending || selected === order.status}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60"
          >
            {mutation.isPending ? 'Mise à jour...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [statusModal, setStatusModal] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => ordersService.adminList({ page, per_page: 20 }),
  });

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.includes(search) ||
      o.shipping_address?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      '';
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDownloadInvoice = (order: Order) => {
    const url = ordersService.downloadInvoice(order.id);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  };

  return (
    <div>
      <Header title="Commandes" subtitle="Gérer les commandes clients" />

      <div className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une commande..."
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none"
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
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
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Commande</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Client</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Articles</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Montant</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Statut</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Date</th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Aucune commande</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-sm text-slate-700">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">
                          {order.shipping_address?.full_name || 'Client'}
                        </p>
                        {order.shipping_address?.phone && (
                          <p className="text-xs text-slate-400">{order.shipping_address.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {order.items.length} article(s)
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                        {order.total_amount.toFixed(2)} EUR
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/orders/${order.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStatusModal(order)}
                            className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors font-medium"
                          >
                            Statut
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400">{filtered.length} commande(s)</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Précédent</button>
                <span className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg">{page}</span>
                <button disabled={orders.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Suivant</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <StatusChangeModal order={statusModal} open={!!statusModal} onClose={() => setStatusModal(null)} />
    </div>
  );
}
