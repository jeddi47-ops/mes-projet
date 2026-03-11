# E-Commerce Backend Template

Backend e-commerce professionnel et réutilisable basé sur **FastAPI + PostgreSQL + Docker**.
Conçu pour déployer rapidement plusieurs sites e-commerce pour différents clients.

---

## Stack Technique

| Composant       | Technologie                    |
|-----------------|--------------------------------|
| Framework       | FastAPI (Python 3.11+)         |
| Base de données | PostgreSQL 16                  |
| ORM             | SQLAlchemy 2.0 (async)         |
| Migrations      | Alembic                        |
| Authentification| JWT + Google OAuth 2.0         |
| Stockage images | Cloudinary                     |
| Emails          | Resend                         |
| Conteneurisation| Docker + Docker Compose        |

---

## Structure du projet

```
ecommerce-backend/
├── app/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── config.py            # Configuration (variables d'environnement)
│   ├── database.py          # Moteur async SQLAlchemy + session
│   ├── models/              # Modèles SQLAlchemy (tables BDD)
│   │   ├── base.py          # TimestampMixin (id, created_at, updated_at)
│   │   ├── user.py          # User, Role, RefreshToken
│   │   ├── product.py       # Product, ProductOption, ProductImage, Review
│   │   ├── cart.py          # Cart, CartItem
│   │   ├── order.py         # Order, OrderItem + Enums
│   │   ├── message.py       # Message
│   │   ├── notification.py  # Notification + Enum
│   │   └── analytics.py     # PageView
│   ├── schemas/             # Schémas Pydantic (validation/sérialisation)
│   │   ├── auth.py          # RegisterRequest, LoginRequest, TokenResponse
│   │   ├── user.py          # UserResponse, UserUpdate
│   │   ├── product.py       # ProductResponse, ReviewResponse
│   │   ├── cart.py          # CartResponse, CartItemResponse
│   │   └── order.py         # OrderResponse, OrderItemResponse
│   ├── routes/              # Routeurs FastAPI
│   │   └── auth.py          # Endpoints d'authentification
│   ├── services/            # Logique métier
│   │   ├── auth_service.py  # Inscription, connexion, refresh, OAuth
│   │   ├── cloudinary_service.py  # Upload/suppression images
│   │   └── email_service.py # Emails transactionnels (Resend)
│   ├── auth/                # Authentification
│   │   ├── jwt.py           # Création/validation tokens JWT
│   │   ├── google_oauth.py  # Client Google OAuth (Authlib)
│   │   └── dependencies.py  # Dépendances FastAPI (get_current_user)
│   └── utils/               # Utilitaires
│       └── helpers.py       # slugify, paginate, format_price
├── alembic/                 # Migrations base de données
│   ├── versions/            # Fichiers de migration générés
│   ├── env.py               # Configuration Alembic
│   └── script.py.mako       # Template de migration
├── alembic.ini              # Configuration Alembic
├── requirements.txt         # Dépendances Python
├── Dockerfile               # Image Docker
├── docker-compose.yml       # Services Docker (app + PostgreSQL)
└── .env.example             # Variables d'environnement (template)
```

---

## Installation et démarrage

### Prérequis
- Docker & Docker Compose installés

### 1. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplir les valeurs dans `.env` :
- `SECRET_KEY` : générer avec `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` : depuis Google Cloud Console
- `CLOUDINARY_*` : depuis votre dashboard Cloudinary
- `RESEND_API_KEY` : depuis votre dashboard Resend

### 2. Lancer les services Docker

```bash
docker-compose up -d
```

### 3. Appliquer les migrations

```bash
# Générer la migration initiale
docker-compose exec backend alembic revision --autogenerate -m "migration_initiale"

# Appliquer les migrations
docker-compose exec backend alembic upgrade head
```

### 4. Accéder à la documentation

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **Health check** : http://localhost:8000/api/health

---

## Installation locale (sans Docker)

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

```bash
# Migrations Alembic
alembic revision --autogenerate -m "migration_initiale"
alembic upgrade head
```

---

## Variables d'environnement

| Variable                     | Description                              | Exemple                        |
|------------------------------|------------------------------------------|--------------------------------|
| `DATABASE_URL`               | URL PostgreSQL async (asyncpg)           | `postgresql+asyncpg://...`     |
| `SYNC_DATABASE_URL`          | URL PostgreSQL sync (Alembic)            | `postgresql+psycopg2://...`    |
| `SECRET_KEY`                 | Clé secrète JWT (min. 32 caractères)     | `openssl rand -hex 32`         |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Durée access token (minutes)             | `30`                           |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | Durée refresh token (jours)              | `7`                            |
| `GOOGLE_CLIENT_ID`           | Client ID Google OAuth                   | `xxx.apps.googleusercontent.com`|
| `GOOGLE_CLIENT_SECRET`       | Client Secret Google OAuth               | `GOCSPX-xxx`                   |
| `CLOUDINARY_CLOUD_NAME`      | Nom du cloud Cloudinary                  | `mon-cloud`                    |
| `CLOUDINARY_API_KEY`         | Clé API Cloudinary                       | `123456789`                    |
| `CLOUDINARY_API_SECRET`      | Secret API Cloudinary                    | `xxxxx`                        |
| `RESEND_API_KEY`             | Clé API Resend                           | `re_xxxxx`                     |
| `SENDER_EMAIL`               | Adresse d'envoi emails                   | `noreply@monsite.com`          |
| `APP_NAME`                   | Nom de l'application                     | `Ma Boutique`                  |
| `FRONTEND_URL`               | URL du frontend (CORS)                   | `https://monsite.com`          |

---

## Endpoints d'authentification

| Méthode | Route                    | Description                     | Auth requise |
|---------|--------------------------|---------------------------------|--------------|
| `POST`  | `/api/auth/register`     | Inscription utilisateur         | Non          |
| `POST`  | `/api/auth/login`        | Connexion email/mot de passe    | Non          |
| `POST`  | `/api/auth/refresh`      | Renouveler l'access token       | Non          |
| `POST`  | `/api/auth/logout`       | Déconnexion                     | Non          |
| `GET`   | `/api/auth/me`           | Profil utilisateur courant      | Oui (JWT)    |
| `GET`   | `/api/auth/google`       | Redirection Google OAuth        | Non          |
| `GET`   | `/api/auth/google/callback` | Callback Google OAuth        | Non          |

---

## Tables de base de données

| Table              | Description                              |
|--------------------|------------------------------------------|
| `users`            | Comptes utilisateurs                     |
| `roles`            | Rôles et permissions (admin, user, etc.) |
| `refresh_tokens`   | Tokens de rafraîchissement JWT           |
| `products`         | Catalogue produits                       |
| `product_options`  | Options produits (taille, couleur, etc.) |
| `product_images`   | Images produits (stockées sur Cloudinary)|
| `reviews`          | Avis et notations clients                |
| `carts`            | Paniers d'achat                          |
| `cart_items`       | Articles dans le panier                  |
| `orders`           | Commandes                                |
| `order_items`      | Articles d'une commande                  |
| `messages`         | Messages entre utilisateurs              |
| `notifications`    | Notifications utilisateurs               |
| `page_views`       | Données analytics (vues de pages)        |

Chaque table possède : `id` (UUID), `created_at`, `updated_at`

---

## Personnalisation par client

Pour créer un nouveau site e-commerce :

1. **Copier** ce template dans un nouveau répertoire
2. **Configurer** `.env` avec les credentials du client
3. **Adapter** `APP_NAME`, `FRONTEND_URL` et `SENDER_EMAIL`
4. **Ajouter** les routes e-commerce spécifiques au client (Étape 2+)
5. **Lancer** avec `docker-compose up -d`

---

## Prochaines étapes (Étape 2+)

- [ ] Routes CRUD produits (`/api/products`)
- [ ] Routes gestion panier (`/api/cart`)
- [ ] Routes commandes (`/api/orders`)
- [ ] Routes messages/chat (`/api/messages`)
- [ ] Routes notifications (`/api/notifications`)
- [ ] Analytics dashboard (`/api/analytics`)
- [ ] Webhooks paiement (Stripe/PayPal)
- [ ] Recherche et filtres produits
- [ ] Gestion des rôles (admin, vendeur, client)
