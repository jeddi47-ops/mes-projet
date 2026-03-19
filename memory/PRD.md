# bieli.shop — Product Requirements Document

## Problème original
Construire un frontend e-commerce complet et moderne nommé "bieli.shop" avec Next.js (App Router), connecté à un backend FastAPI déployé sur Railway.

## Architecture

```
/app/
├── bieli-frontend/         # Frontend Next.js (port 3002) ← FOCUS ACTUEL
│   ├── src/app/            # Pages (login, home, product, cart, chat)
│   ├── src/components/     # Header, Footer, ProductCard, StarRating
│   ├── src/lib/            # api.ts, authStore.ts, cartStore.ts, mockData.ts
│   ├── src/types/          # TypeScript interfaces
│   └── .env.local          # NEXT_PUBLIC_API_URL + NEXT_PUBLIC_BACKEND_URL
├── admin-dashboard/        # Dashboard admin (hors scope)
└── ecommerce-backend/      # FastAPI (stable, déployé Railway)
```

## Stack Technique
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Axios
- **Backend:** FastAPI, PostgreSQL, déployé sur Railway
- **Design:** Playfair Display / DM Sans, palette noir (#111111) + or (#D4AF37)
- **Proxy:** Next.js rewrites `/api/*` → Railway (évite CORS)

## URLs importantes
- **Frontend dev:** http://localhost:3002
- **Backend Railway:** https://mes-projet-production.up.railway.app
- **Credentials test:** admin@test.com / 123456
- **Code promo:** BIELI10 (-10%)

## Fonctionnalités implémentées

### Pages
- `/login` — Split-screen, email/password + Google OAuth, formulaire en français
- `/register` — Inscription nouvel utilisateur
- `/` — Accueil avec hero, grille de produits, sidebar catégories, recherche
- `/product/[id]` — Détail produit, galerie, sélecteur quantité, options, tabs description/avis
- `/cart` — Panier avec quantités, suppression, code promo (BIELI10), récapitulatif
- `/chat` — Interface chat vendeur (UI seulement, static)
- `/auth/callback` — Gère le retour OAuth Google (`?token=...`)

### Composants
- `Header` — Navigation sticky, compteur panier, auth state, search
- `Footer` — Newsletter, liens, réseaux sociaux
- `ProductCard` — Image + titre + prix + boutons "Panier" / "Acheter"
- `StarRating` — Affichage étoiles avec compteur avis

### Logique métier
- **Auth:** JWT stocké dans `localStorage` (`bieli_token`), réhydratation au chargement
- **Cart:** Zustand + `persist` middleware (localStorage), opérations CRUD complètes
- **API Proxy:** Next.js rewrites `/api/*` → Railway (pas de CORS en dev ni prod)
- **Data:** Fallback mock en français si API catalog vide (9 produits)

## Ce qui a été accompli (Session courante)

### 2026-03-19
- Créé le fichier `.env.local` avec `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_BACKEND_URL`
- Configuré le proxy API dans `next.config.js` (rewrites) → résolution CORS
- Démarré le serveur Next.js (port 3002), compilé sans erreurs
- Testé tous les flows: login, cart, product, chat → **100% de succès**
- Traduit les données mock de l'anglais vers le français
- Corrigé l'hydratation Zustand (SSR + localStorage → state `mounted`)

### 2026-03-19 — Session 2
- **[x] Toasts sonner** : toast "Ajouté au panier !" sur ProductCard + page produit, avec nom du produit
- **[x] Chat temps réel** : polling API toutes les 2.5s via `/api/messages` + `/api/messages/conversation/{id}`, envoi via `/api/messages/send`, optimistic update + rollback sur erreur, invite de connexion si non-authentifié
- **[x] Page /account** : profil utilisateur, historique commandes depuis `/api/orders`, états loading/empty, bouton déconnexion, lien depuis l'icône User dans le header
- Corrigé race condition auth sur /account (check `isLoading` avant redirect)
- Corrigé email affiché deux fois dans le profil

## Backlog priorisé

### P0 — Critique
- [x] Projet compilé et démarré sans erreur
- [x] Login email/password fonctionnel (token stocké)
- [x] Pages principales rendues correctement
- [x] Panier fonctionnel (add/remove/update)
- [x] Chat temps réel (polling)
- [x] Page compte / historique commandes
- [x] Notifications toast sonner

### P1 — Important
- [ ] Ajouter des produits réels dans le backend Railway (catalog vide → fallback mock)
- [ ] Vérifier le flow complet Google OAuth en environnement déployé
- [ ] Tester le déploiement en production (Vercel/Railway)

### P2 — Souhaitable
- [ ] Revue fidélité design vs images de référence fournies
- [ ] Page "Confirmation de commande" après checkout
- [ ] Fonctionnalité "Favoris"

### Future (Backlog)
- [ ] Intégration paiement Stripe
- [ ] Favoris / wishlist persistante
