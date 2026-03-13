# Admin Dashboard — E-Commerce

Dashboard d'administration e-commerce construit avec **Next.js 16**, **TypeScript** et **Tailwind CSS 4**.
Conçu pour se connecter au backend FastAPI du template e-commerce.

---

## Stack Technique

| Composant         | Technologie                     |
|-------------------|---------------------------------|
| Framework         | Next.js 16 (App Router)         |
| Language          | TypeScript 5                    |
| Styles            | Tailwind CSS 4                  |
| État global       | Zustand (authentification)      |
| Requêtes API      | TanStack Query (React Query 5)  |
| Client HTTP       | Axios                           |
| Graphiques        | Recharts                        |
| Animations        | Framer Motion                   |
| Notifications     | Sonner (toasts)                 |

---

## Fonctionnalités

| Page           | URL            | Description                                          |
|----------------|----------------|------------------------------------------------------|
| Dashboard      | `/`            | Stats globales, graphiques revenus/commandes, récentes commandes |
| Produits       | `/products`    | Liste des produits, activation/désactivation         |
| Commandes      | `/orders`      | Liste et gestion des statuts (pending → paid)        |
| Détail commande| `/orders/[id]` | Détail complet avec statut, articles et adresse      |
| Messages       | `/messages`    | Conversations avec les clients                       |
| Clients        | `/clients`     | Liste des clients inscrits avec stats               |
| Analytics      | `/analytics`   | Métriques avancées                                   |
| Paramètres     | `/settings`    | Configuration du dashboard                           |
| Connexion      | `/login`       | Authentification administrateur                     |

---

## Structure du projet

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Groupe de routes — layout avec sidebar
│   │   │   ├── layout.tsx      # Layout protégé (redirige vers /login si non auth)
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── products/       # Gestion produits
│   │   │   ├── orders/         # Gestion commandes
│   │   │   │   └── [id]/       # Détail d'une commande
│   │   │   ├── messages/       # Messagerie
│   │   │   ├── clients/        # Liste des clients
│   │   │   ├── analytics/      # Analytics
│   │   │   ├── promotions/     # Promotions
│   │   │   └── settings/       # Paramètres
│   │   ├── login/              # Page de connexion (non protégée)
│   │   ├── layout.tsx          # Layout racine (providers, fonts)
│   │   └── providers.tsx       # React Query + Sonner
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Navigation latérale
│   │   │   └── Header.tsx      # En-tête de page
│   │   └── ui/
│   │       ├── Badge.tsx       # Badges de statut
│   │       ├── Modal.tsx       # Composant modal
│   │       ├── Spinner.tsx     # Indicateurs de chargement
│   │       └── StatCard.tsx    # Carte de statistique
│   ├── services/               # Appels API
│   │   ├── api.ts              # Instance Axios configurée + interceptors
│   │   ├── auth.ts             # login, me, logout
│   │   ├── admin.ts            # stats, users
│   │   ├── products.ts         # CRUD produits
│   │   ├── orders.ts           # Commandes
│   │   └── messages.ts         # Messages
│   ├── store/
│   │   └── authStore.ts        # État auth Zustand (persisté localStorage)
│   └── types/
│       └── index.ts            # Types TypeScript partagés
├── .env.local.example          # Template variables d'environnement
├── next.config.ts              # Configuration Next.js
├── tailwind.config.ts          # Configuration Tailwind
└── package.json
```

---

## Installation et démarrage

### Prérequis

- Node.js 20+
- Le backend FastAPI doit être lancé (voir `../ecommerce-backend/README.md`)

### 1. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` :

```env
# URL du backend FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Lancer le serveur de développement

```bash
npm run dev
# ou
yarn dev
```

Accéder au dashboard : **http://localhost:3001**

> Par défaut `next dev` utilise le port 3000. Si le backend tourne sur 3000, changer le port :
> ```bash
> npm run dev -- --port 3001
> ```

### 4. Se connecter

Utiliser le compte admin créé avec le script `seed_admin.py` du backend.

---

## Connexion au backend

Le dashboard communique avec le backend via l'instance Axios configurée dans `src/services/api.ts` :

- **Base URL** : `NEXT_PUBLIC_API_URL` (depuis `.env.local`)
- **Authentification** : Token JWT injecté automatiquement dans chaque requête via un interceptor
- **Déconnexion automatique** : Sur toute réponse `401 Unauthorized`

### Flux d'authentification

```
1. POST /api/auth/login   → access_token + refresh_token
2. GET  /api/auth/me      → vérification rôle "admin"
3. Token stocké Zustand   → persisté dans localStorage
4. Interceptor Axios       → Bearer token sur chaque requête
```

---

## Build de production

```bash
npm run build
npm start
```

### Déploiement Vercel

```bash
# Configurer la variable d'environnement dans le dashboard Vercel :
NEXT_PUBLIC_API_URL=https://api.monsite.com
```

### Déploiement avec Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

---

## Personnalisation

### Changer le nom de la boutique

Rechercher `AdminShop` dans :
- `src/components/layout/Sidebar.tsx`
- `src/app/login/page.tsx`

### Ajouter une page

1. Créer `src/app/(dashboard)/ma-page/page.tsx`
2. Ajouter l'entrée dans `navItems` de `src/components/layout/Sidebar.tsx`

### Modifier le thème couleurs

Les couleurs principales sont `indigo-600` (primaire) et `slate-*` (neutres).
Le fond de la sidebar est `#0f172a` (défini directement dans le JSX).

---

## Variables d'environnement

| Variable                | Description                     | Exemple                     |
|-------------------------|---------------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL`   | URL du backend FastAPI          | `http://localhost:8000`     |
