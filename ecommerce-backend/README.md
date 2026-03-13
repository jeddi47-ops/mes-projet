# E-Commerce Backend Template

Backend e-commerce professionnel et réutilisable basé sur **FastAPI + PostgreSQL + Docker**.
Conçu pour déployer rapidement plusieurs sites e-commerce pour différents clients.

---

## Stack Technique

| Composant        | Technologie                      |
|------------------|----------------------------------|
| Framework        | FastAPI (Python 3.11+)           |
| Base de données  | PostgreSQL 16                    |
| ORM              | SQLAlchemy 2.0 (async)           |
| Migrations       | Alembic                          |
| Authentification | JWT + Refresh Token + Google OAuth 2.0 |
| Stockage images  | Cloudinary (uploads signés)      |
| Emails           | Resend (avec pièces jointes PDF) |
| PDF              | fpdf2 (génération en mémoire)    |
| Conteneurisation | Docker + Docker Compose          |

---

## Structure du projet

```
ecommerce-backend/
├── app/
│   ├── main.py              # Point d'entrée FastAPI (middlewares + routes)
│   ├── config.py            # Configuration via pydantic-settings
│   ├── database.py          # Moteur async SQLAlchemy + session
│   ├── auth/
│   │   ├── jwt.py           # Création/validation tokens JWT
│   │   ├── google_oauth.py  # Client Google OAuth (Authlib)
│   │   └── dependencies.py  # Dépendances FastAPI (get_current_user, require_admin)
│   ├── models/              # Modèles SQLAlchemy (tables BDD)
│   │   ├── base.py          # TimestampMixin : id (UUID), created_at, updated_at
│   │   ├── user.py          # User, Role, RefreshToken
│   │   ├── product.py       # Product, ProductOption, ProductImage, Review
│   │   ├── cart.py          # Cart, CartItem
│   │   ├── order.py         # Order, OrderItem, OrderStatus (enum)
│   │   ├── message.py       # Message
│   │   ├── notification.py  # Notification, NotificationType (enum)
│   │   └── analytics.py     # PageView
│   ├── schemas/             # Schémas Pydantic (validation/sérialisation)
│   │   ├── auth.py          # RegisterRequest, LoginRequest, TokenResponse
│   │   ├── user.py          # UserResponse, AdminUserResponse, UserUpdate
│   │   ├── product.py       # ProductCreate/Update/Response, ReviewResponse...
│   │   ├── cart.py          # CartResponse, CartItemAdd
│   │   ├── order.py         # OrderCreate, OrderResponse, OrderStatusUpdate
│   │   ├── message.py       # MessageSend, MessageResponse, ConversationSummary
│   │   └── admin.py         # AdminStats
│   ├── routes/              # Routeurs FastAPI
│   │   ├── auth.py          # /api/auth/*
│   │   ├── products.py      # /api/catalog, /api/products/*, /api/options/*, /api/images/*
│   │   ├── cart.py          # /api/cart/*
│   │   ├── orders.py        # /api/orders/*
│   │   ├── messages.py      # /api/messages/*
│   │   └── admin.py         # /api/admin/*
│   ├── services/            # Logique métier
│   │   ├── auth_service.py        # Inscription, connexion, refresh, OAuth
│   │   ├── product_service.py     # CRUD produits, options, images, avis
│   │   ├── cart_service.py        # Panier
│   │   ├── order_service.py       # Commandes + décrémentation stock
│   │   ├── message_service.py     # Messagerie admin/user
│   │   ├── notification_service.py# Notifications
│   │   ├── admin_service.py       # Stats, listes admin
│   │   ├── cloudinary_service.py  # Upload/suppression images
│   │   ├── email_service.py       # Emails transactionnels (Resend)
│   │   └── pdf_service.py         # Génération factures PDF (fpdf2)
│   └── utils/
│       └── helpers.py             # slugify, format_price
├── alembic/
│   ├── versions/
│   │   └── 001_initial_schema.py  # Migration initiale (toutes les tables)
│   ├── env.py                     # Configuration Alembic
│   └── script.py.mako
├── scripts/
│   └── seed_admin.py              # Script de création du premier admin
├── alembic.ini
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example                   # Template variables d'environnement
└── .env                           # Variables réelles (ne pas committer)
```

---

## Installation et démarrage

### Prérequis

- Docker & Docker Compose installés

### 1. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```env
# Générer la clé secrète
SECRET_KEY=$(openssl rand -hex 32)

# Adapter le nom de l'app
APP_NAME=Ma Boutique

# URL du frontend pour CORS
FRONTEND_URL=http://localhost:3001
```

> **Services optionnels :** Cloudinary, Resend et Google OAuth peuvent rester vides au démarrage.
> L'application fonctionne sans eux (les fonctionnalités correspondantes retourneront des erreurs si appelées).

### 2. Lancer les services Docker

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL 16 sur le port `5432`
- L'application FastAPI sur le port `8000`

### 3. Appliquer la migration initiale

```bash
docker-compose exec backend alembic upgrade head
```

### 4. Créer le premier administrateur

```bash
docker-compose exec backend python scripts/seed_admin.py
```

Le script interactif vous demandera l'email et le mot de passe du compte admin.

### 5. Accéder à la documentation

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **Health check** : http://localhost:8000/api/health

---

## Installation locale (sans Docker)

```bash
# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations (PostgreSQL doit être lancé)
alembic upgrade head

# Créer le compte admin
python scripts/seed_admin.py

# Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

---

## Endpoints complets

### Authentification (`/api/auth`)

| Méthode | Route                       | Auth      | Description                       |
|---------|-----------------------------|-----------|-----------------------------------|
| `POST`  | `/api/auth/register`        | Non       | Inscription utilisateur           |
| `POST`  | `/api/auth/login`           | Non       | Connexion email/mot de passe      |
| `POST`  | `/api/auth/refresh`         | Non       | Renouveler l'access token         |
| `POST`  | `/api/auth/logout`          | Non       | Déconnexion (révocation token)    |
| `GET`   | `/api/auth/me`              | JWT       | Profil utilisateur courant        |
| `GET`   | `/api/auth/google`          | Non       | Redirection Google OAuth          |
| `GET`   | `/api/auth/google/callback` | Non       | Callback Google OAuth             |

### Catalogue & Produits

| Méthode  | Route                              | Auth      | Description                       |
|----------|------------------------------------|-----------|-----------------------------------|
| `GET`    | `/api/catalog`                     | Non       | Catalogue public paginé + filtres |
| `GET`    | `/api/products`                    | Non       | Liste des produits (simple)       |
| `POST`   | `/api/products`                    | Admin     | Créer un produit                  |
| `GET`    | `/api/products/{id}`               | Non       | Détail produit + avis             |
| `PUT`    | `/api/products/{id}`               | Admin     | Modifier un produit               |
| `DELETE` | `/api/products/{id}`               | Admin     | Supprimer un produit              |
| `POST`   | `/api/products/{id}/options`       | Admin     | Ajouter une option                |
| `GET`    | `/api/products/{id}/options`       | Non       | Lister les options                |
| `DELETE` | `/api/options/{option_id}`         | Admin     | Supprimer une option              |
| `GET`    | `/api/cloudinary/signature`        | Admin     | Signature upload Cloudinary       |
| `POST`   | `/api/products/{id}/images`        | Admin     | Enregistrer une image Cloudinary  |
| `DELETE` | `/api/images/{image_id}`           | Admin     | Supprimer une image               |
| `POST`   | `/api/products/{id}/reviews`       | JWT       | Ajouter un avis                   |
| `GET`    | `/api/products/{id}/reviews`       | Non       | Lister les avis                   |

### Panier (`/api/cart`)

| Méthode   | Route                      | Auth | Description               |
|-----------|----------------------------|------|---------------------------|
| `GET`     | `/api/cart`                | JWT  | Voir son panier           |
| `POST`    | `/api/cart/add`            | JWT  | Ajouter un article        |
| `PUT`     | `/api/cart/update`         | JWT  | Modifier la quantité      |
| `DELETE`  | `/api/cart/remove/{id}`    | JWT  | Retirer un article        |

### Commandes (`/api/orders`)

| Méthode | Route                         | Auth        | Description                          |
|---------|-------------------------------|-------------|--------------------------------------|
| `POST`  | `/api/orders`                 | JWT         | Créer une commande depuis le panier  |
| `GET`   | `/api/orders`                 | JWT         | Mes commandes (admin = toutes)       |
| `GET`   | `/api/orders/{id}`            | JWT         | Détail d'une commande                |
| `PUT`   | `/api/orders/{id}/status`     | Admin       | Changer le statut                    |
| `GET`   | `/api/orders/{id}/invoice`    | Admin       | Télécharger la facture PDF           |

### Messages (`/api/messages`)

| Méthode | Route                              | Auth  | Description                         |
|---------|------------------------------------|-------|-------------------------------------|
| `POST`  | `/api/messages/send`               | JWT   | Envoyer un message                  |
| `GET`   | `/api/messages/conversation/{uid}` | JWT   | Conversation avec un utilisateur    |
| `GET`   | `/api/messages`                    | JWT   | Liste des conversations (résumé)    |

### Admin (`/api/admin`) — Accès administrateur requis

| Méthode | Route                   | Description                                  |
|---------|-------------------------|----------------------------------------------|
| `GET`   | `/api/admin/stats`      | Statistiques globales du site                |
| `GET`   | `/api/admin/orders`     | Toutes les commandes paginées                |
| `GET`   | `/api/admin/products`   | Tous les produits (y compris inactifs)       |
| `GET`   | `/api/admin/messages`   | Toutes les conversations                     |
| `GET`   | `/api/admin/users`      | Liste des clients inscrits + nb commandes    |

---

## Statuts de commande

```
pending_payment   →  En attente de paiement (statut initial)
payment_discussion →  Discussion en cours avec le client
paid              →  Paiement confirmé ✓ (stock décrémenté ici)
cancelled         →  Commande annulée
```

> **Important :** Le stock des produits n'est décrémenté **qu'au passage au statut `paid`**.

---

## Variables d'environnement

| Variable                      | Description                              | Défaut / Exemple                         |
|-------------------------------|------------------------------------------|------------------------------------------|
| `DATABASE_URL`                | URL PostgreSQL async (asyncpg)           | `postgresql+asyncpg://user:pwd@db/name`  |
| `SYNC_DATABASE_URL`           | URL PostgreSQL sync (Alembic)            | `postgresql+psycopg2://user:pwd@db/name` |
| `SECRET_KEY`                  | Clé secrète JWT (min. 32 caractères)     | `openssl rand -hex 32`                   |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée access token                       | `30`                                     |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Durée refresh token                      | `7`                                      |
| `GOOGLE_CLIENT_ID`            | Client ID Google OAuth                   | (optionnel)                              |
| `GOOGLE_CLIENT_SECRET`        | Client Secret Google OAuth               | (optionnel)                              |
| `CLOUDINARY_CLOUD_NAME`       | Nom du cloud Cloudinary                  | (optionnel)                              |
| `CLOUDINARY_API_KEY`          | Clé API Cloudinary                       | (optionnel)                              |
| `CLOUDINARY_API_SECRET`       | Secret API Cloudinary                    | (optionnel)                              |
| `RESEND_API_KEY`              | Clé API Resend (emails)                  | (optionnel)                              |
| `SENDER_EMAIL`                | Adresse d'envoi des emails               | `noreply@example.com`                    |
| `APP_NAME`                    | Nom de l'application                     | `E-Commerce API`                         |
| `FRONTEND_URL`                | URL du frontend (CORS)                   | `http://localhost:3001`                  |
| `DEBUG`                       | Mode debug SQLAlchemy                    | `False`                                  |

---

## Schéma de la base de données

| Table              | Description                                          |
|--------------------|------------------------------------------------------|
| `roles`            | Rôles utilisateurs (`admin`, `user`)                 |
| `users`            | Comptes utilisateurs (email, mot de passe hashé, Google OAuth) |
| `refresh_tokens`   | Tokens de rafraîchissement JWT (rotation + révocation) |
| `products`         | Produits du catalogue                                |
| `product_options`  | Options produits (taille, couleur, etc.)             |
| `product_images`   | Images produits (URLs Cloudinary)                    |
| `reviews`          | Avis et notations clients (1 avis par user/produit)  |
| `carts`            | Paniers d'achat utilisateurs                         |
| `cart_items`       | Articles dans le panier                              |
| `orders`           | Commandes avec adresse de livraison                  |
| `order_items`      | Articles d'une commande (snapshot nom/prix/options)  |
| `messages`         | Messages entre utilisateurs et admin                 |
| `notifications`    | Notifications en temps réel                          |
| `page_views`       | Analytics — vues de pages                            |

Chaque table possède : `id` (UUID v4), `created_at`, `updated_at`

---

## Personnalisation par client

```bash
# 1. Copier le template
cp -r ecommerce-backend/ client-nom/
cd client-nom/

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env : SECRET_KEY, APP_NAME, FRONTEND_URL, credentials tiers

# 3. Lancer
docker-compose up -d

# 4. Initialiser la base de données
docker-compose exec backend alembic upgrade head

# 5. Créer l'administrateur
docker-compose exec backend python scripts/seed_admin.py
```

---

## Backlog

### P1 — Prochaines améliorations
- [ ] Vérification email à l'inscription (token Resend)
- [ ] Endpoint notifications utilisateur (`GET /api/notifications`)
- [ ] Filtres avancés sur `/api/admin/orders` (par statut, date)

### P2 — Fonctionnalités avancées
- [ ] Paiement automatique via Stripe (webhooks)
- [ ] Analytics avancées (tracking page_views)

### P3 — Infrastructure
- [ ] Cache Redis + Rate limiting
- [ ] WebSocket pour le chat en temps réel
- [ ] Multi-tenancy (partage de la base)
