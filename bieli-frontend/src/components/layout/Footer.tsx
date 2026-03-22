import Link from 'next/link';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bieli-black text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-bieli-gold mb-2">Newsletter</p>
            <h3 className="font-playfair text-3xl md:text-4xl font-medium">Restez informé.</h3>
            <p className="text-sm text-white/50 mt-2">Nouveautés, offres exclusives et inspirations.</p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full md:w-auto gap-2"
          >
            <input
              type="email"
              placeholder="votre@email.com"
              data-testid="newsletter-input"
              className="flex-1 md:w-72 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-bieli-gold transition-colors"
            />
            <button
              type="submit"
              data-testid="newsletter-submit"
              className="px-6 py-3 bg-bieli-gold hover:bg-bieli-gold-hover text-white text-sm font-medium tracking-wide transition-colors"
            >
              S'abonner
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="inline-flex items-center">
            <img src="/nelstore-logo.jpg" alt="nel.store" className="h-10 w-auto" />
          </Link>
          <p className="text-white/40 text-sm mt-3 max-w-xs leading-relaxed">
            Une sélection de produits pensée pour ceux qui exigent le meilleur. Qualité, design, durabilité.
          </p>
          <div className="flex gap-4 mt-6">
            {[Instagram, Twitter, Facebook, Mail].map((Icon, i) => (
              <a key={i} href="#" className="text-white/30 hover:text-bieli-gold transition-colors">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="text-xs tracking-widest uppercase text-white/40 mb-4">Boutique</p>
          <ul className="space-y-2">
            {['Tous les produits', 'Nouveautés', 'Meilleures ventes', 'Promotions'].map((l) => (
              <li key={l}>
                <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase text-white/40 mb-4">Support</p>
          <ul className="space-y-2">
            {['FAQ', 'Livraison', 'Retours', 'Contact'].map((l) => (
              <li key={l}>
                <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} nel.store — Tous droits réservés.</p>
          <div className="flex gap-4 text-xs text-white/30">
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGV</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
