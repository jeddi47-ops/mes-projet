'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { productsService } from '@/services/products';
import type { Product, ProductCreate } from '@/types';

function ProductForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Product>;
  onSubmit: (data: ProductCreate) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ProductCreate>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    discount_price: initial?.discount_price,
    stock: initial?.stock ?? 0,
    category: initial?.category ?? '',
    is_active: initial?.is_active ?? true,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Prix (EUR) *</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Prix promo (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discount_price ?? ''}
            onChange={(e) => setForm({ ...form, discount_price: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Stock *</label>
          <input
            type="number"
            required
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
          <input
            value={form.category ?? ''}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Produit actif</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalCreate, setModalCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => productsService.list({ page, per_page: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: productsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produit créé'); setModalCreate(false); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductCreate> }) => productsService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produit mis à jour'); setEditProduct(null); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: productsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produit supprimé'); setDeleteProduct(null); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => productsService.toggleActive(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Erreur'),
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Produits" subtitle="Gérer votre catalogue" />

      <div className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <button
            onClick={() => setModalCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
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
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Produit</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Catégorie</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Prix</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Stock</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Statut</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500">Créé le</th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Aucun produit trouvé</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img src={product.images[0].url} alt={product.name} className="w-9 h-9 rounded-xl object-cover bg-slate-100" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-400">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="default">{product.category || '—'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          {product.discount_price ? (
                            <>
                              <span className="text-sm font-semibold text-emerald-600">{product.discount_price.toFixed(2)} EUR</span>
                              <span className="text-xs text-slate-400 line-through ml-1.5">{product.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-slate-900">{product.price.toFixed(2)} EUR</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>
                          {product.stock} unités
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggleMutation.mutate({ id: product.id, is_active: !product.is_active })}
                          className={`flex items-center gap-1.5 text-xs font-medium ${product.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                        >
                          {product.is_active
                            ? <ToggleRight className="w-5 h-5" />
                            : <ToggleLeft className="w-5 h-5" />}
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {format(new Date(product.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditProduct(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProduct(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              <p className="text-xs text-slate-400">{filtered.length} produit(s)</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Précédent</button>
                <span className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg">{page}</span>
                <button disabled={products.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Suivant</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Ajouter un produit" size="lg">
        <ProductForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Modifier le produit" size="lg">
        {editProduct && (
          <ProductForm
            initial={editProduct}
            onSubmit={(data) => updateMutation.mutate({ id: editProduct.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Supprimer le produit" size="sm">
        {deleteProduct && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">"{deleteProduct.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteProduct(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Annuler</button>
              <button
                onClick={() => deleteMutation.mutate(deleteProduct.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
