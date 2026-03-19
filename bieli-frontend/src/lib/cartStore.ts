'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, qty?: number, option?: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1, option) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({ items: items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i) });
        } else {
          set({ items: [...items, { product, quantity: qty, selectedOption: option }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return; }
        set({ items: get().items.map((i) => i.product.id === id ? { ...i, quantity: qty } : i) });
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'bieli-cart' }
  )
);
