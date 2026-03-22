'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.count());
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header
      data-testid="main-header"
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.06)]' : ''}`}
    >
      {/* Top promo bar */}
      <div className="bg-bieli-black text-white text-xs text-center py-2 tracking-widest uppercase">
        Livraison gratuite dès 80€ · Code&nbsp;<span className="text-bieli-gold font-medium">BIELI10</span>&nbsp;pour -10%
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" data-testid="header-logo" className="flex items-center">
            <img src="/nelstore-logo.jpg" alt="nel.store" className="h-8 w-auto" />
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {[['Accueil', '/'], ['Boutique', '/?scroll=shop'], ['Chat', '/chat']].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-bieli-gray hover:text-bieli-black transition-colors tracking-wide"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              data-testid="search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:text-bieli-gold transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <Link href="/cart" data-testid="cart-btn" className="relative p-2 hover:text-bieli-gold transition-colors">
              <ShoppingBag size={18} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-bieli-gold text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/account"
                  data-testid="account-btn"
                  className="p-2 hover:text-bieli-gold transition-colors"
                  aria-label="Mon compte"
                >
                  <User size={18} />
                </Link>
                <button
                  data-testid="logout-btn"
                  onClick={() => { logout(); router.push('/login'); }}
                  className="flex items-center gap-1.5 text-sm px-4 py-1.5 border border-bieli-border hover:border-bieli-black transition-colors rounded-full"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                data-testid="login-btn"
                className="hidden md:flex items-center gap-1.5 text-sm px-4 py-1.5 bg-bieli-black text-white hover:bg-bieli-gray transition-colors rounded-full"
              >
                <User size={14} />
                Connexion
              </Link>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3 border-t border-bieli-border animate-fade-up">
            <form onSubmit={handleSearch} className="flex items-center gap-2 pt-3">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
                className="flex-1 bg-bieli-soft px-4 py-2 text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-bieli-gold"
              />
              <button type="submit" className="px-5 py-2 bg-bieli-black text-white text-sm rounded-full hover:bg-bieli-gray transition-colors">
                Chercher
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-bieli-border bg-white px-4 py-4 space-y-3 animate-fade-up">
          {[['Accueil', '/'], ['Boutique', '/'], ['Chat', '/chat']].map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="block text-sm py-2 text-bieli-gray hover:text-bieli-black">
              {label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="block text-sm py-2 text-bieli-gray hover:text-bieli-black">
            Panier ({cartCount})
          </Link>
          {isAuthenticated ? (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left text-sm py-2 text-bieli-gray hover:text-bieli-black">
              Déconnexion
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm py-2 font-medium">
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
