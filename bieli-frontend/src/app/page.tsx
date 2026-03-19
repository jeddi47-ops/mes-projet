'use client';
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import { Product } from '@/types';
import { MOCK_PRODUCTS, CATEGORIES } from '@/lib/mockData';
import api from '@/lib/api';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.get('/api/catalog', { params: { per_page: 20 } })
      .then((res) => {
        const items = res.data?.items ?? res.data ?? [];
        setProducts(items.length > 0 ? items : MOCK_PRODUCTS);
      })
      .catch(() => setProducts(MOCK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Header />
      <main className="pt-[56px]">

        {/* ── Hero ── */}
        <section
          className="relative h-[75vh] min-h-[480px] flex items-end overflow-hidden"
          style={{ background: `url(${HERO_IMAGE}) center/cover no-repeat` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-16 w-full animate-fade-up">
            <p className="text-xs text-white/60 tracking-[0.3em] uppercase mb-3">Nouvelle collection 2025</p>
            <h1 className="font-playfair text-6xl md:text-8xl font-medium text-white leading-none mb-6">
              bieli.<br />
              <span className="text-bieli-gold">Curated.</span>
            </h1>
            <div className="flex flex-wrap gap-3">
              <a
                href="#shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-bieli-gold hover:bg-bieli-gold-hover text-white text-sm font-medium transition-colors"
              >
                Découvrir <ChevronRight size={16} />
              </a>
              <a
                href="#shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/40 hover:border-white text-white text-sm font-medium transition-colors"
              >
                Voir tout
              </a>
            </div>
          </div>
        </section>

        {/* ── Banner ── */}
        <section className="border-y border-bieli-border bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-wrap gap-8 justify-center md:justify-between items-center text-sm text-bieli-gray">
            {[
              ['Livraison gratuite', 'dès 80€ d\'achat'],
              ['Retours gratuits', 'sous 30 jours'],
              ['Paiement sécurisé', 'SSL 256-bit'],
              ['Support client', '7j/7 par email'],
            ].map(([title, sub]) => (
              <div key={title} className="text-center">
                <p className="font-medium text-bieli-black text-xs uppercase tracking-widest">{title}</p>
                <p className="text-xs text-bieli-muted mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Shop ── */}
        <section id="shop" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs tracking-widest uppercase text-bieli-muted mb-1">Collection</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-medium">Notre boutique</h2>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-bieli-muted" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="product-search"
                className="pl-10 pr-4 py-2.5 border border-bieli-border bg-white text-sm w-64 focus:outline-none focus:border-bieli-black transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar */}
            <aside className="lg:w-52 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-1">
                <p className="text-xs tracking-widest uppercase text-bieli-muted mb-3 flex items-center gap-2">
                  <SlidersHorizontal size={12} /> Catégories
                </p>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    data-testid={`category-${cat}`}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      category === cat
                        ? 'bg-bieli-black text-white font-medium'
                        : 'text-bieli-gray hover:text-bieli-black hover:bg-bieli-soft'
                    }`}
                  >
                    {cat}
                    {cat === 'All' && (
                      <span className="ml-auto float-right text-xs opacity-60">{products.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </aside>

            {/* Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-bieli-border animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center text-bieli-muted">
                  <p>Aucun produit trouvé.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              <p className="text-xs text-bieli-muted mt-8 text-center">
                {filtered.length} produit{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </section>

        {/* ── Recommendations ── */}
        {products.length > 0 && (
          <section className="py-16 bg-bieli-soft">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs tracking-widest uppercase text-bieli-muted mb-1">Sélection</p>
                  <h2 className="font-playfair text-3xl font-medium">Nos recommandations</h2>
                </div>
                <a href="#shop" className="text-sm text-bieli-gray hover:text-bieli-black transition-colors flex items-center gap-1">
                  Voir tout <ChevronRight size={14} />
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
