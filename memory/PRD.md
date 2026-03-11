# PRD — E-Commerce Backend Template

**Date de création :** Février 2026
**Étape actuelle :** Étape 1 — Architecture de base du backend

---

## Énoncé original du problème

Créer l'architecture de base d'un backend e-commerce réutilisable pouvant servir de template pour plusieurs sites e-commerce clients.

---

## Architecture et stack technique

| Composant       | Choix technique               |
|-----------------|-------------------------------|
| Framework       | FastAPI (Python 3.11+)        |
| Base de données | PostgreSQL 16                 |
| ORM             | SQLAlchemy 2.0 (async)        |
| Migrations      | Alembic                       |
| Auth            | JWT (30min) + Refresh (7j) + Google OAuth 2.0 |
| Images          | Cloudinary (uploads signés)   |
| Emails          | Resend                        |
| Conteneurs      | Docker + Docker Compose       |

---

## Ce qui a été implémenté (Étape 1)

### Structure du projet
- `/app/ecommerce-backend/` — Projet standalone, séparé de l'app Emergent existante
- Structure professionnelle : `app/`, `models/`, `schemas/`, `routes/`, `services/`, `auth/`, `utils/`

### Fichiers de configuration
- `requirements.txt` — 17 dépendances Python
- `.env.example` — Template variables d'environnement avec placeholders
- `Dockerfile` — Image Python 3.11-slim
- `docker-compose.yml` — PostgreSQL 16 + Backend avec healthcheck
- `alembic.ini` — Configuration Alembic
- `README.md` — Documentation complète

### Modèles de base de données (14 tables)
Chaque table possède `id` (UUID), `created_at`, `updated_at`

| Table              | Colonnes principales                                    |
|--------------------|---------------------------------------------------------|
| `users`            | email, hashed_password, first_name, last_name, is_active, is_verified, google_id, avatar_url, role_id |
| `roles`            | name, description                                       |
| `refresh_tokens`   | user_id, token_hash, expires_at, is_revoked, device_info|
| `products`         | name, description, price, stock, category, slug, is_active |
| `product_options`  | product_id, name, value, price_modifier, stock         |
| `product_images`   | product_id, url, public_id, alt_text, is_primary, order|
| `reviews`          | product_id, user_id, rating, comment, is_verified      |
| `carts`            | user_id, session_id                                    |
| `cart_items`       | cart_id, product_id, product_option_id, quantity, price|
| `orders`           | user_id, status, total_amount, shipping_address, payment_status, payment_method |
| `order_items`      | order_id, product_id, product_option_id, quantity, unit_price, product_name |
| `messages`         | sender_id, receiver_id, content, is_read               |
| `notifications`    | user_id, type, title, content, is_read, data           |
| `page_views`       | path, user_id, session_id, ip_address, user_agent      |

### Authentification (routes `/api/auth/`)
- `POST /register` — Inscription + émission tokens JWT
- `POST /login` — Connexion email/password
- `POST /refresh` — Rotation des tokens (révocation de l'ancien)
- `POST /logout` — Révocation refresh token
- `GET /me` — Profil utilisateur (JWT requis)
- `GET /google` — Redirection Google OAuth
- `GET /google/callback` — Callback OAuth → tokens JWT

### Services
- `auth_service.py` — Logique complète d'authentification
- `cloudinary_service.py` — Génération signatures + suppression assets
- `email_service.py` — send_welcome, send_verification, send_password_reset, send_order_confirmation

### Auth
- `jwt.py` — create_access_token (30min), create_refresh_token (7j), decode_token
- `google_oauth.py` — Client Authlib (Starlette)
- `dependencies.py` — Dépendance FastAPI `get_current_user`

### Migrations
- `alembic/env.py` — Configuré avec import de tous les modèles
- `alembic/script.py.mako` — Template de migration

---

## Décisions d'architecture

- **UUIDs** comme clés primaires (pas d'entiers auto-incrémentés)
- **Refresh tokens en base** pour permettre la révocation et le multi-device
- **Rotation des tokens** : nouveau refresh token à chaque renouvellement
- **Upload Cloudinary signé** : la signature est générée côté backend, l'API secret ne quitte pas le serveur
- **Emails async** : `asyncio.to_thread` pour ne pas bloquer la boucle événementielle FastAPI
- **Alembic sync** : `SYNC_DATABASE_URL` séparé pour les migrations (psycopg2)

---

## Ce qui a été implémenté (Étape 2) — Gestion des produits et catalogue

### Modification du modèle
- `products.discount_price` (Float, nullable) — Prix remisé ajouté

### Fichiers créés/modifiés
- `app/services/product_service.py` — Service complet produits
- `app/routes/products.py` — 14 routes produits
- `app/schemas/product.py` — Réécriture complète avec requête + réponse
- `app/auth/dependencies.py` — Ajout `require_admin` + `selectinload(User.role)`
- `app/main.py` — Routeur produits inclus

### Endpoints disponibles (préfixe /api)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/catalog` | Public | Catalogue paginé, filtrable, triable |
| POST | `/products` | Admin | Créer un produit |
| GET | `/products` | Public | Lister les produits |
| GET | `/products/{id}` | Public | Détail + avis + stats |
| PUT | `/products/{id}` | Admin | Modifier un produit |
| DELETE | `/products/{id}` | Admin | Supprimer + nettoyage Cloudinary |
| POST | `/products/{id}/options` | Admin | Ajouter une option |
| GET | `/products/{id}/options` | Public | Lister les options |
| DELETE | `/options/{id}` | Admin | Supprimer une option |
| GET | `/cloudinary/signature` | Admin | Signature upload Cloudinary |
| POST | `/products/{id}/images` | Admin | Associer une image |
| DELETE | `/images/{id}` | Admin | Supprimer image (BDD + Cloudinary) |
| POST | `/products/{id}/reviews` | User connecté | Laisser un avis |
| GET | `/products/{id}/reviews` | Public | Lister les avis |

### Fonctionnalités catalogue
- Filtres : `min_price`, `max_price`, `category`, `search`
- Tri : `newest`, `oldest`, `price_asc`, `price_desc`, `best_rated`
- Pagination : `page`, `per_page` (max 100)
- `average_rating` et `reviews_count` calculés en base par SQL

### Sécurité
- `require_admin` → vérifie `user.role.name == "admin"`
- `get_current_user` → charge le rôle avec `selectinload`
- Un utilisateur = un seul avis par produit (contrainte DB + validation)
- Cloudinary : nettoyage automatique lors de la suppression d'un produit/image



### P0 — Étape 2 (Routes e-commerce)
- [ ] CRUD Produits (`/api/products`)
- [ ] Gestion Panier (`/api/cart`)
- [ ] Gestion Commandes (`/api/orders`)
- [ ] Upload images produits (Cloudinary)

### P1 — Étape 3 (Communication)
- [ ] Chat/Messages (`/api/messages`)
- [ ] Notifications push (`/api/notifications`)
- [ ] Webhooks paiement (Stripe)

### P2 — Étape 4 (Analytics & Admin)
- [ ] Analytics (`/api/analytics`)
- [ ] Dashboard admin
- [ ] Gestion des rôles (admin, vendeur)
- [ ] Recherche et filtres produits

---

## Pour démarrer avec un nouveau client

```bash
cp -r ecommerce-backend/ client-nom/
cd client-nom/
cp .env.example .env
# Remplir les credentials du client dans .env
docker-compose up -d
docker-compose exec backend alembic revision --autogenerate -m "init"
docker-compose exec backend alembic upgrade head
```
