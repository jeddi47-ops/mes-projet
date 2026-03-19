'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, LogOut, ChevronRight, Package, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';
import { Order } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'En attente de paiement',
  payment_discussion: 'Paiement en cours',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  payment_discussion: 'text-blue-700 bg-blue-50 border-blue-200',
  paid: 'text-green-700 bg-green-50 border-green-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
};

export default function AccountPage() {
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return; // Wait for auth hydration to finish
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    api.get('/api/orders')
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, isLoading]);

  if (!mounted || isLoading) {
    return (
      <>
        <Header />
        <div className="pt-[56px] min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bieli-border border-t-bieli-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : null; // null → show only email as subtitle, not as title

  return (
    <>
      <Header />
      <main data-testid="account-page" className="pt-[56px] min-h-screen bg-bieli-bg">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">

          {/* Page header */}
          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase text-bieli-muted mb-1">Espace personnel</p>
            <h1 className="font-playfair text-4xl font-medium">Mon compte</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* ── Profile card ── */}
            <div className="md:col-span-1">
              <div className="border border-bieli-border bg-white p-6" data-testid="profile-card">
                <div className="w-14 h-14 rounded-full bg-bieli-black flex items-center justify-center text-white font-playfair text-xl font-medium mb-4">
                  {initials}
                </div>

                <h2 className="font-medium text-bieli-black text-sm">{displayName ?? 'Mon compte'}</h2>
                <p className="text-sm text-bieli-muted mt-0.5">{user?.email}</p>

                {user?.role?.name && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-widest border border-bieli-gold text-bieli-gold px-2 py-0.5">
                    {user.role.name}
                  </span>
                )}

                {/* Quick links */}
                <div className="mt-6 pt-6 border-t border-bieli-border space-y-1">
                  <Link
                    href="/cart"
                    className="flex items-center justify-between text-sm text-bieli-gray hover:text-bieli-black transition-colors py-2"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={14} />
                      Mon panier
                    </span>
                    <ChevronRight size={14} />
                  </Link>

                  <Link
                    href="/chat"
                    className="flex items-center justify-between text-sm text-bieli-gray hover:text-bieli-black transition-colors py-2"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle size={14} />
                      Support chat
                    </span>
                    <ChevronRight size={14} />
                  </Link>

                  <button
                    onClick={handleLogout}
                    data-testid="account-logout-btn"
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors py-2 w-full mt-2"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>

            {/* ── Orders ── */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-2xl font-medium">Mes commandes</h2>
                {!loading && (
                  <span className="text-xs text-bieli-muted">
                    {orders.length} commande{orders.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-bieli-border animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div
                  className="border border-bieli-border bg-white p-12 text-center"
                  data-testid="no-orders"
                >
                  <Package size={32} className="text-bieli-muted mx-auto mb-4" />
                  <p className="font-playfair text-xl font-medium mb-2">Aucune commande</p>
                  <p className="text-sm text-bieli-gray mb-6">
                    Vous n'avez pas encore passé de commande.
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-2.5 bg-bieli-black text-white text-sm hover:bg-bieli-gray transition-colors"
                  >
                    Découvrir la boutique
                  </Link>
                </div>
              ) : (
                <div
                  className="border border-bieli-border bg-white divide-y divide-bieli-border"
                  data-testid="orders-list"
                >
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      data-testid={`order-${order.id}`}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-bieli-muted font-mono uppercase tracking-widest">
                          # {order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                          {order.items?.length
                            ? `${order.items.length} article${order.items.length > 1 ? 's' : ''}`
                            : 'Commande'}
                        </p>
                        {order.created_at && (
                          <p className="text-xs text-bieli-muted mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
                            STATUS_STYLES[order.status] ?? 'text-bieli-muted bg-bieli-soft border-bieli-border'
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                        <span className="font-playfair text-base font-medium">
                          {order.total_amount?.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
