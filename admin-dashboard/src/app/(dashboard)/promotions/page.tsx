'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, Calendar, Percent, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface Promo {
  id: string;
  name: string;
  code: string;
  discount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  products?: string;
}

const SAMPLE_PROMOS: Promo[] = [
  { id: '1', name: 'Soldes Été', code: 'ETE20', discount: 20, start_date: '2026-06-01', end_date: '2026-08-31', is_active: true, products: 'Tous les produits' },
  { id: '2', name: 'Fidélité VIP', code: 'VIP10', discount: 10, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true, products: 'Catégorie Vêtements' },
];

function PromoForm({ onSubmit, loading, initial }: {
  onSubmit: (d: Omit<Promo, 'id'>) => void;
  loading: boolean;
  initial?: Promo;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    discount: initial?.discount ?? 10,
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    is_active: initial?.is_active ?? true,
    products: initial?.products ?? '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nom de la promotion *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Code promo *</label>
          <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono uppercase" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Réduction (%) *</label>
          <input required type="number" min="1" max="100" value={form.discount}
            onChange={e => setForm({ ...form, discount: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date de début *</label>
          <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date de fin *</label>
          <input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Produits concernés</label>
          <input value={form.products} onChange={e => setForm({ ...form, products: e.target.value })}
            placeholder="ex: Tous, Catégorie Vêtements, SKU-123..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" id="promo_active" checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600" />
          <label htmlFor="promo_active" className="text-sm text-slate-700">Promotion active</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>(SAMPLE_PROMOS);
  const [modalCreate, setModalCreate] = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);

  const handleCreate = (data: Omit<Promo, 'id'>) => {
    setPromos(prev => [{ ...data, id: Date.now().toString() }, ...prev]);
    toast.success('Promotion créée');
    setModalCreate(false);
  };

  const handleEdit = (data: Omit<Promo, 'id'>) => {
    setPromos(prev => prev.map(p => p.id === editPromo?.id ? { ...data, id: p.id } : p));
    toast.success('Promotion mise à jour');
    setEditPromo(null);
  };

  const handleDelete = (id: string) => {
    setPromos(prev => prev.filter(p => p.id !== id));
    toast.success('Promotion supprimée');
  };

  const isActive = (p: Promo) =>
    p.is_active && new Date(p.end_date) >= new Date();

  return (
    <div>
      <Header title="Promotions" subtitle="Gérer vos codes promotionnels" />

      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">{promos.filter(isActive).length} promotion(s) active(s)</p>
          <button onClick={() => setModalCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" />Créer une promotion
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {promos.map((promo) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-2xl shadow-card border border-slate-100 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive(promo) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <Tag className={`w-5 h-5 ${isActive(promo) ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{promo.name}</p>
                      <p className="font-mono text-xs text-indigo-600 font-bold">{promo.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditPromo(promo)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(promo.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-2xl font-bold text-slate-900">{promo.discount}%</span>
                    <span className="text-xs text-slate-500">de réduction</span>
                  </div>
                  {promo.products && (
                    <p className="text-xs text-slate-500">{promo.products}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {format(new Date(promo.start_date), 'dd MMM', { locale: fr })} —{' '}
                      {format(new Date(promo.end_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Badge variant={isActive(promo) ? 'success' : 'default'}>
                    {isActive(promo) ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Nouvelle promotion" size="lg">
        <PromoForm onSubmit={handleCreate} loading={false} />
      </Modal>
      <Modal open={!!editPromo} onClose={() => setEditPromo(null)} title="Modifier la promotion" size="lg">
        {editPromo && <PromoForm onSubmit={handleEdit} loading={false} initial={editPromo} />}
      </Modal>
    </div>
  );
}
