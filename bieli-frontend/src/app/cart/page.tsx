'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Minus, Plus, X, Tag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/cartStore';

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'BIELI10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Code invalide. Essayez BIELI10');
    }
  };

  const subtotal = total();
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const finalTotal = subtotal - discount;

  return (
    <>
      <Header />
      <main data-testid="cart-page" className="pt-[56px] min-h-screen bg-bieli-bg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-1 text-sm text-bieli-muted hover:text-bieli-black transition-colors mb-2">
                <ChevronLeft size={14} /> Continuer mes achats
              </Link>
              <h1 className="font-playfair text-4xl font-medium">Mon panier</h1>
            </div>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-bieli-muted hover:text-red-500 transition-colors uppercase tracking-widest">
                Vider le panier
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-24" data-testid="empty-cart">
              <p className="font-playfair text-3xl text-bieli-black mb-2">Votre panier est vide.</p>
              <p className="text-bieli-gray text-sm mb-8">Découvrez notre sélection de produits.</p>
              <Link href="/" className="inline-block px-8 py-3 bg-bieli-black text-white text-sm hover:bg-bieli-gray transition-colors">
                Voir la boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Items */}
              <div className="lg:col-span-2 space-y-0 border border-bieli-border" data-testid="cart-items">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-bieli-soft text-xs uppercase tracking-widest text-bieli-muted border-b border-bieli-border">
                  <span>Produit</span>
                  <span className="text-center">Prix</span>
                  <span className="text-center">Quantité</span>
                  <span className="text-right">Total</span>
                </div>

                {items.map((item) => {
                  const imageUrl = item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                  return (
                    <div
                      key={item.product.id}
                      data-testid={`cart-item-${item.product.id}`}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-5 border-b border-bieli-border last:border-0"
                    >
                      {/* Product info */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeItem(item.product.id)}
                          data-testid={`remove-item-${item.product.id}`}
                          className="text-bieli-muted hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                        <div className="w-16 h-16 bg-bieli-soft flex-shrink-0 overflow-hidden">
                          <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/product/${item.product.id}`} className="text-sm font-medium line-clamp-2 hover:text-bieli-gold transition-colors">
                            {item.product.name}
                          </Link>
                          {item.selectedOption && (
                            <p className="text-xs text-bieli-muted mt-0.5">{item.selectedOption}</p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center text-sm">{item.product.price.toFixed(2)} €</div>

                      {/* Qty */}
                      <div className="flex items-center justify-center gap-0 border border-bieli-border w-fit mx-auto">
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-bieli-soft transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm border-x border-bieli-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-bieli-soft transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right text-sm font-medium">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </div>
                    </div>
                  );
                })}

                {/* Coupon */}
                <div className="px-5 py-4 bg-bieli-soft border-t border-bieli-border">
                  <p className="text-xs uppercase tracking-widest text-bieli-muted mb-2 flex items-center gap-1">
                    <Tag size={12} /> Code promo
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => { setCoupon(e.target.value); setCouponError(''); }}
                      placeholder="Ex: BIELI10"
                      data-testid="coupon-input"
                      className="flex-1 border border-bieli-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-bieli-black transition-colors"
                    />
                    <button
                      onClick={applyCoupon}
                      data-testid="apply-coupon-btn"
                      className="px-5 py-2 bg-bieli-black text-white text-xs font-medium uppercase tracking-widest hover:bg-bieli-gray transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                  {couponApplied && <p className="text-xs text-green-600 mt-1">Code BIELI10 appliqué — -10% !</p>}
                  {couponError && <p className="text-xs text-red-500 mt-1" data-testid="coupon-error">{couponError}</p>}
                </div>
              </div>

              {/* Totals */}
              <div className="lg:col-span-1" data-testid="cart-totals">
                <div className="border border-bieli-border bg-white p-6 sticky top-24">
                  <h3 className="font-playfair text-xl font-medium mb-6">Récapitulatif</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-bieli-gray">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-bieli-gray">
                      <span>Livraison</span>
                      <span className="text-green-600">Gratuite</span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction (10%)</span>
                        <span>-{discount.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-bieli-gray">
                      <span>TVA (20%)</span>
                      <span>incluse</span>
                    </div>
                    <div className="border-t border-bieli-border pt-3 flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span data-testid="cart-total">{finalTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    data-testid="checkout-btn"
                    onClick={() => alert('Fonctionnalité de paiement bientôt disponible.')}
                    className="w-full mt-6 py-4 bg-bieli-black hover:bg-bieli-gray text-white text-sm font-medium uppercase tracking-widest transition-colors"
                  >
                    Passer la commande
                  </button>
                  <Link href="/" className="block text-center text-xs text-bieli-muted hover:text-bieli-black transition-colors mt-4">
                    <ChevronLeft className="inline" size={12} /> Continuer mes achats
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
