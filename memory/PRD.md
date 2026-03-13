# PRD — E-Commerce Backend Template

**Date de création :** Février 2026
**Étape actuelle :** Projet finalisé et documenté ✅

---

## Énoncé original du problème

Créer l'architecture de base d'un backend e-commerce réutilisable pouvant servir de template pour plusieurs sites e-commerce clients, accompagné d'un dashboard admin complet.

---

## Architecture et stack technique

| Composant       | Choix technique                                         |
|-----------------|---------------------------------------------------------|
| Framework       | FastAPI (Python 3.11+)                                  |
| Base de données | PostgreSQL 16                                           |
| ORM             | SQLAlchemy 2.0 (async)                                  |
| Migrations      | Alembic                                                 |
| Auth            | JWT (30min) + Refresh (7j) + Google OAuth 2.0           |
| Images          | Cloudinary (uploads signés)                             |
| Emails          | Resend (avec pièces jointes PDF)                        |
| PDF             | fpdf2 (génération de factures en mémoire)               |
| Conteneurs      | Docker + Docker Compose                                 |
| Frontend Admin  | Next.js 16 + TypeScript + Tailwind CSS 4                |
| État frontend   | Zustand (auth) + TanStack Query (requêtes)              |

---

## Ce qui a été implémenté

### Étape 1 — Architecture de base ✅
- Structure professionnelle FastAPI dans `/app/ecommerce-backend/`
- Docker + PostgreSQL + Alembic + JWT + Google OAuth + Cloudinary + Resend
- 14 modèles SQLAlchemy (UUID, TimestampMixin)

### Étape 2 — Gestion des produits et catalogue ✅
- CRUD complet produits, options, images (Cloudinary), avis
- Catalogue public paginé avec filtres (prix, catégorie, recherche) et tri
- Sécurité admin/user via `require_admin` / `get_current_user`

### Étape 3 — Panier, Commandes & Paiement Manuel ✅

**Endpoints (4 panier + 5 commandes)**

| Méthode | Route                             | Auth         | Description                                   |
|---------|-----------------------------------|--------------|-----------------------------------------------|
| GET     | `/api/cart`                       | User         | Voir son panier                               |
| POST    | `/api/cart/add`                   | User         | Ajouter un article                            |
| PUT     | `/api/cart/update`                | User         | Modifier la quantité                          |
| DELETE  | `/api/cart/remove/{item_id}`      | User         | Retirer un article                            |
| POST    | `/api/orders`                     | User         | Créer une commande + PDF + email              |
| GET     | `/api/orders`                     | User/Admin   | Lister les commandes                          |
| GET     | `/api/orders/{id}`                | User/Admin   | Détail d'une commande                         |
| PUT     | `/api/orders/{id}/status`         | Admin        | Changer le statut (stock décrémenté à `paid`) |
| GET     | `/api/orders/{id}/invoice`        | Admin        | Régénérer/télécharger la facture PDF          |

### Étape 4 — Chat & Messages ✅

| Méthode | Route                                   | Auth  | Description                                      |
|---------|-----------------------------------------|-------|--------------------------------------------------|
| POST    | `/api/messages/send`                    | User  | Envoyer un message (user→admin auto, admin→user) |
| GET     | `/api/messages/conversation/{user_id}` | User  | Conversation détaillée + marquage lu            |
| GET     | `/api/messages`                         | User  | Liste des conversations (résumé)                |

### Étape 5 — Dashboard Admin & Notifications ✅

| Méthode | Route                   | Auth  | Description                                           |
|---------|-------------------------|-------|-------------------------------------------------------|
| GET     | `/api/admin/stats`      | Admin | Statistiques : commandes, revenu, users, produits, aujourd'hui |
| GET     | `/api/admin/orders`     | Admin | Toutes les commandes avec info client, paginées       |
| GET     | `/api/admin/products`   | Admin | Tous les produits (y compris inactifs), paginés       |
| GET     | `/api/admin/messages`   | Admin | Toutes les conversations avec les utilisateurs        |
| GET     | `/api/admin/users`      | Admin | Liste des clients inscrits avec nombre de commandes   |

### Étape 6 — Frontend Admin Dashboard ✅
- Dashboard Next.js 16 dans `/app/admin-dashboard/`
- 8 pages : Dashboard, Produits, Commandes, Messages, Clients, Analytics, Promotions, Paramètres
- Authentification JWT avec vérification rôle admin
- Graphiques revenus/commandes (Recharts)
- Layout sidebar + header réutilisable

### Étape 7 — Finalisation & Documentation ✅
- Bug fixes : conflit de route `app/page.tsx`, gestion erreurs Axios login, annotation type `list_orders`
- Création `.env.local.example` pour admin-dashboard
- Création `scripts/seed_admin.py` — script interactif de création admin
- README complet `ecommerce-backend/README.md` (tous les endpoints, variables, schéma BDD)
- README complet `admin-dashboard/README.md` (installation, structure, déploiement)

---

## Backlog priorisé

### P0 — Terminé ✅
- [x] Architecture backend (Étape 1)
- [x] Gestion produits & catalogue (Étape 2)
- [x] Panier, Commandes & Paiement Manuel + Invoice (Étape 3)
- [x] Chat / Messages + Notifications (Étapes 4 & 5)
- [x] Frontend Admin Dashboard — Next.js (8 pages complètes)
- [x] Endpoint `GET /api/admin/users` — Page Clients admin
- [x] Documentation complète + scripts de démarrage

### P1 — Prochaines améliorations
- [ ] Vérification email à l'inscription (token Resend)
- [ ] Endpoint notifications utilisateur (`GET /api/notifications`)
- [ ] Filtres avancés admin commandes (par statut, date, recherche)

### P2 — Fonctionnalités avancées
- [ ] Paiement automatique via Stripe (webhooks)
- [ ] Analytics avancées (tracking page_views)
- [ ] Authentification Google OAuth (compléter le scaffold)

### P3 — Infrastructure
- [ ] Cache Redis + Rate limiting
- [ ] WebSocket pour le chat en temps réel
- [ ] Multi-tenancy

---

## Fichiers clés du projet

### Backend (`/app/ecommerce-backend/`)
- `app/main.py` — Point d'entrée + middlewares + routes
- `app/models/` — 14 modèles SQLAlchemy
- `app/routes/` — 6 routeurs FastAPI
- `app/services/` — 11 services métier
- `alembic/versions/001_initial_schema.py` — Migration initiale complète
- `scripts/seed_admin.py` — Création du premier admin
- `.env.example` — Template variables d'environnement

### Frontend (`/app/admin-dashboard/`)
- `src/app/(dashboard)/` — 8 pages protégées
- `src/services/api.ts` — Client Axios avec interceptors JWT
- `src/store/authStore.ts` — État auth Zustand persisté
- `src/types/index.ts` — Types TypeScript partagés
- `.env.local.example` — Template variables frontend

---

## Pour démarrer avec un nouveau client

```bash
# Backend
cp -r ecommerce-backend/ client-nom/
cd client-nom/
cp .env.example .env
# Éditer .env : SECRET_KEY, APP_NAME, FRONTEND_URL
docker-compose up -d
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_admin.py

# Frontend admin
cd admin-dashboard/
cp .env.local.example .env.local
# Éditer NEXT_PUBLIC_API_URL avec l'URL du backend
npm install && npm run dev -- --port 3001
```
