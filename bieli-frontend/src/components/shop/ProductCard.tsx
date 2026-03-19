'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/types';
import { useCartStore } from '@/lib/cartStore';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const imageUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=60';
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="product-card group bg-white border border-bieli-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative overflow-hidden aspect-[4/5] bg-bieli-soft">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-card-img w-full h-full object-cover"
        />
        {discount && (
          <span className="absolute top-3 right-3 bg-bieli-black text-white text-[10px] font-medium px-2 py-0.5 tracking-wide">
            -{discount}%
          </span>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 text-bieli-gray text-[10px] uppercase tracking-widest px-2 py-0.5 border border-bieli-border">
            {product.category}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-sm leading-snug text-bieli-black hover:text-bieli-gold transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {product.average_rating !== undefined && (
          <div className="mb-2">
            <StarRating rating={product.average_rating} count={product.reviews_count} size={12} />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold text-bieli-black">{product.price.toFixed(2)} €</span>
          {product.original_price && (
            <span className="text-sm text-bieli-muted line-through">{product.original_price.toFixed(2)} €</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            data-testid={`add-to-cart-${product.id}`}
            onClick={() => {
              addItem(product);
              toast.success('Ajouté au panier !', { description: product.name });
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-bieli-black text-bieli-black text-xs font-medium hover:bg-bieli-black hover:text-white transition-colors"
          >
            <ShoppingCart size={13} />
            Panier
          </button>
          <Link
            href={`/product/${product.id}`}
            data-testid={`buy-now-${product.id}`}
            className="flex-1 flex items-center justify-center py-2 bg-bieli-gold hover:bg-bieli-gold-hover text-white text-xs font-medium transition-colors"
          >
            Acheter
          </Link>
        </div>
      </div>
    </article>
  );
}
