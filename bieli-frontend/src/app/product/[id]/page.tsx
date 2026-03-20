'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, ChevronRight, Plus, Minus, Check } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import { StarRating } from '@/components/shop/StarRating';
import { Product } from '@/types';
import { useCartStore } from '@/lib/cartStore';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import api from '@/lib/api';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  useEffect(() => {
    setLoading(true);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isMockId = !UUID_REGEX.test(id);

    if (isMockId) {
      // Mock product (p1–p9): skip API call entirely, no 422
      const mock = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
      setProduct(mock);
      if (mock) {
        setRelated(MOCK_PRODUCTS.filter((p) => p.id !== id).slice(0, 4));
      }
      setLoading(false);
      return;
    }

    // Real UUID: call the live API
    api.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        return api.get('/catalog', { params: { per_page: 4, category: res.data.category } });
      })
      .then((res) => {
        const items = res.data?.items ?? res.data ?? [];
        setRelated(items.filter((p: Product) => p.id !== id).slice(0, 4));
      })
      .catch(() => {
        setProduct(null); // Show 404 UI
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty, selectedOption || undefined);
    toast.success('Ajouté au panier !', { description: product.name });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, qty, selectedOption || undefined);
    router.push('/cart');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="pt-[56px] min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bieli-border border-t-bieli-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!product) return (
    <>
      <Header />
      <main className="pt-[56px] min-h-screen flex items-center justify-center bg-bieli-bg">
        <div className="text-center max-w-sm px-4" data-testid="product-not-found">
          <p className="text-xs tracking-widest uppercase text-bieli-muted mb-3">Erreur 404</p>
          <h1 className="font-playfair text-3xl font-medium mb-3">Produit introuvable</h1>
          <p className="text-sm text-bieli-gray mb-8">
            Ce produit n'existe pas ou a été supprimé.
          </p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-bieli-black text-white text-sm hover:bg-bieli-gray transition-colors">
            Retour à la boutique
          </Link>
        </div>
      </main>
    </>
  );

  const images = product.images?.length ? product.images : [{ id: 'ph', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' }];
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <>
      <Header />
      <main className="pt-[56px]" data-testid="product-page">
        {/* Breadcrumb */}
        <div className="border-b border-bieli-border bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs text-bieli-muted">
            <Link href="/" className="hover:text-bieli-black transition-colors">Accueil</Link>
            <ChevronRight size={12} />
            <Link href="/" className="hover:text-bieli-black transition-colors">Boutique</Link>
            <ChevronRight size={12} />
            <span className="text-bieli-black truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        {/* Product detail */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

            {/* Gallery */}
            <div className="space-y-3" data-testid="product-gallery">
              <div className="aspect-square bg-bieli-soft overflow-hidden">
                <img
                  src={images[activeImage]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-bieli-black' : 'border-transparent hover:border-bieli-border'}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div data-testid="product-info">
              {product.category && (
                <span className="inline-block text-xs tracking-widest uppercase text-bieli-gold border border-bieli-gold px-3 py-1 mb-4">
                  {product.category}
                </span>
              )}
              <h1 className="font-playfair text-3xl md:text-4xl font-medium text-bieli-black leading-tight mb-3">
                {product.name}
              </h1>

              {product.average_rating !== undefined && (
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={product.average_rating} count={product.reviews_count} />
                  <span className="text-xs text-bieli-muted">
                    {product.stock && product.stock > 0 ? (
                      <span className="text-green-600 font-medium">● En stock</span>
                    ) : (
                      <span className="text-red-500 font-medium">● Rupture</span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-playfair text-3xl font-medium" data-testid="product-price">
                  {product.price.toFixed(2)} €
                </span>
                {product.original_price && (
                  <>
                    <span className="text-bieli-muted line-through">{product.original_price.toFixed(2)} €</span>
                    <span className="bg-bieli-black text-white text-xs px-2 py-0.5 font-medium">-{discount}%</span>
                  </>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-bieli-gray leading-relaxed mb-6 border-l-2 border-bieli-gold pl-4">
                  {product.description}
                </p>
              )}

              {/* Options */}
              {product.options && product.options.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs tracking-widest uppercase text-bieli-muted mb-2">Options</p>
                  <div className="flex flex-wrap gap-2" data-testid="product-options">
                    {product.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.value)}
                        className={`px-4 py-1.5 text-sm border transition-colors ${
                          selectedOption === opt.value
                            ? 'border-bieli-black bg-bieli-black text-white'
                            : 'border-bieli-border hover:border-bieli-black'
                        }`}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-bieli-muted mb-2">Quantité</p>
                <div className="flex items-center gap-0 border border-bieli-border w-fit" data-testid="qty-selector">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-bieli-soft transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-bieli-border">
                    {qty}
                  </span>
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-bieli-soft transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  data-testid="add-to-cart-btn"
                  className={`flex-1 flex items-center justify-center gap-2 py-4 border text-sm font-medium transition-all ${
                    addedToCart
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-bieli-black text-bieli-black hover:bg-bieli-black hover:text-white'
                  }`}
                >
                  {addedToCart ? <><Check size={16} /> Ajouté !</> : <><ShoppingCart size={16} /> Ajouter au panier</>}
                </button>
                <button
                  onClick={handleBuyNow}
                  data-testid="buy-now-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-bieli-gold hover:bg-bieli-gold-hover text-white text-sm font-medium transition-colors"
                >
                  Acheter maintenant
                </button>
              </div>

              <button className="flex items-center gap-2 text-sm text-bieli-muted hover:text-bieli-black transition-colors">
                <Heart size={16} /> Ajouter aux favoris
              </button>

              {/* Meta */}
              <div className="mt-6 pt-6 border-t border-bieli-border space-y-1.5 text-xs text-bieli-muted">
                {product.id && <p><span className="uppercase tracking-widest">SKU :</span> {product.id.slice(0, 8).toUpperCase()}</p>}
                {product.category && <p><span className="uppercase tracking-widest">Catégorie :</span> {product.category}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <div className="border-b border-bieli-border flex gap-8 mb-8">
            {(['description', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize tracking-wide transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-bieli-black text-bieli-black' : 'border-transparent text-bieli-muted hover:text-bieli-black'
                }`}
              >
                {tab === 'description' ? 'Description' : 'Avis clients'}
              </button>
            ))}
          </div>

          {activeTab === 'description' ? (
            <div className="max-w-2xl text-sm text-bieli-gray leading-relaxed space-y-3">
              <p>{product.description || 'Aucune description disponible pour ce produit.'}</p>
            </div>
          ) : (
            <div className="max-w-2xl">
              {product.reviews_count ? (
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="font-playfair text-5xl font-medium">{product.average_rating?.toFixed(1)}</p>
                    <StarRating rating={product.average_rating || 0} size={16} />
                    <p className="text-xs text-bieli-muted mt-1">{product.reviews_count} avis</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-bieli-muted">Aucun avis pour ce produit.</p>
              )}
            </div>
          )}
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="bg-bieli-soft py-16">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-bieli-muted mb-1">À découvrir</p>
                <h2 className="font-playfair text-3xl font-medium">Produits similaires</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((p) => (
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
