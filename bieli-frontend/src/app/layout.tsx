import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'bieli. — Curated Shop',
  description: 'Curated products for the discerning customer.',
  keywords: 'shop, premium, curated, bieli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-bieli-bg text-bieli-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
