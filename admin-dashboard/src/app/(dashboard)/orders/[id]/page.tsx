'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, MessageSquare, MapPin, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { ordersService } from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import type { OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending_payment', label: 'En attente de paiement' },
  { value: 'payment_discussion', label: 'Paiement en discussion' },
  { value: 'paid', label: 'Payé' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { token } = useAuthStore();
  const id = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.get(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const handleDownload = () => {
    const url = ordersService.downloadInvoice(id);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  };

  if (isLoading) return (
    <div>
      <Header title="Détail commande" />
      <PageLoader />
    </div>
  );

  if (!order) return (
    <div>
      <Header title="Commande introuvable" />
      <div className="p-6 text-center text-slate-500">Cette commande n'existe pas.</div>
    </div>
  );

  return (
    <div>
      <Header
        title={`Commande #${order.id.slice(0, 8).toUpperCase()}`}
        subtitle={format(new Date(order.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}
      />

      <div className="p-6 space-y-5">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Facture PDF
            </button>
            <Link
              href={`/messages?user=${order.user_id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Contacter le client
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left — Order items */}
          <div className="xl:col-span-2 space-y-5">
            {/* Items */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-card border border-slate-100"
            >
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <Package className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Articles commandés</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                      {item.selected_options && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.selected_options.name}: {item.selected_options.value}
                          {item.selected_options.price_modifier !== 0 && ` (+${item.selected_options.price_modifier.toFixed(2)} EUR)`}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">Qté: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {(item.unit_price * item.quantity).toFixed(2)} EUR
                      </p>
                      <p className="text-xs text-slate-400">{item.unit_price.toFixed(2)} EUR/unité</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-900">{order.total_amount.toFixed(2)} EUR</span>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl shadow-card border border-slate-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Changer le statut</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => statusMutation.mutate(s.value)}
                    disabled={statusMutation.isPending || s.value === order.status}
                    className={`px-4 py-3 text-sm rounded-xl border transition-all text-left ${
                      s.value === order.status
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                    } disabled:opacity-60`}
                  >
                    {s.label}
                    {s.value === order.status && <span className="ml-2 text-xs opacity-70">(actuel)</span>}
                  </button>
                ))}
              </div>
              {order.notes && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-medium text-amber-700 mb-1">Note du client</p>
                  <p className="text-sm text-amber-800">{order.notes}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right — Client info */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-card border border-slate-100 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4">Informations client</h3>
              {order.shipping_address ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Nom</p>
                    <p className="text-sm font-medium text-slate-900">{order.shipping_address.full_name}</p>
                  </div>
                  {order.shipping_address.phone && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Téléphone</p>
                      <p className="text-sm text-slate-700">{order.shipping_address.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Adresse de livraison</p>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-slate-700 space-y-0.5">
                        <p>{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                        <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                        <p>{order.shipping_address.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Aucune adresse</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-card border border-slate-100 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4">Résumé</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Statut</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Paiement</span>
                  <span className="text-slate-700">{order.payment_method || 'Non défini'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Articles</span>
                  <span className="text-slate-700">{order.items.length}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-100">
                  <span className="text-slate-700">Total</span>
                  <span className="text-slate-900">{order.total_amount.toFixed(2)} EUR</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
