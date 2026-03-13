# PRD — E-Commerce Backend Template

**Date de création :** Février 2026
**Étape actuelle :** Étapes 1 à 5 + Frontend Admin ✅

---

## Énoncé original du problème

Créer l'architecture de base d'un backend e-commerce réutilisable pouvant servir de template pour plusieurs sites e-commerce clients.

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

#### Modèles mis à jour
- `OrderStatus` → `pending_payment`, `payment_discussion`, `paid`, `cancelled`
- `PaymentStatus` supprimé (redondant avec le nouveau flux)
- `Order` → ajout `invoice_url`, suppression `payment_status`
- `OrderItem` → ajout `selected_options` (JSON snapshot des options choisies)

#### Endpoints (4 panier + 5 commandes)

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

#### Règles métier
- Vérification `product.is_active` + stock à l'ajout au panier
- Prix capturé au moment de l'ajout (discount_price en priorité)
- Snapshot `product_name`, `unit_price`, `selected_options` par article de commande
- Panier vidé automatiquement après création de commande
- Stock décrémenté **uniquement** au passage du statut à `paid`
- Facture PDF (fpdf2) envoyée en pièce jointe Resend + notification admin créée

---

### Étape 4 — Chat & Messages ✅

#### Nouveaux fichiers
| Fichier                             | Description                                          |
|-------------------------------------|------------------------------------------------------|
| `app/schemas/message.py`            | MessageSend, MessageResponse, ConversationSummary   |
| `app/services/message_service.py`   | Envoi, conversation, liste + notification auto      |
| `app/routes/messages.py`            | 3 endpoints                                          |

#### Endpoints

| Méthode | Route                                   | Auth  | Description                                      |
|---------|-----------------------------------------|-------|--------------------------------------------------|
| POST    | `/api/messages/send`                    | User  | Envoyer un message (user→admin auto, admin→user) |
| GET     | `/api/messages/conversation/{user_id}` | User  | Conversation détaillée + marquage lu            |
| GET     | `/api/messages`                         | User  | Liste des conversations (résumé)                |

#### Règles
- Utilisateur normal → envoie toujours à l'admin (auto-détection du premier admin)
- Admin → `receiver_id` requis pour répondre
- Marquage automatique des messages comme lus à la consultation
- Notification créée pour le destinataire à chaque message

---

### Étape 5 — Dashboard Admin & Notifications ✅

#### Nouveaux fichiers
| Fichier                               | Description                                       |
|---------------------------------------|---------------------------------------------------|
| `app/schemas/admin.py`                | AdminStats                                        |
| `app/services/notification_service.py`| create_notification, get_user_notifications       |
| `app/services/admin_service.py`       | stats, all_orders, all_products, all_conversations|
| `app/routes/admin.py`                 | 4 endpoints admin                                 |

#### Endpoints

| Méthode | Route                   | Auth  | Description                                           |
|---------|-------------------------|-------|-------------------------------------------------------|
| GET     | `/api/admin/stats`      | Admin | Statistiques : commandes, revenu, users, produits, aujourd'hui |
| GET     | `/api/admin/orders`     | Admin | Toutes les commandes avec info client, paginées       |
| GET     | `/api/admin/products`   | Admin | Tous les produits (y compris inactifs), paginés       |
| GET     | `/api/admin/messages`   | Admin | Toutes les conversations avec les utilisateurs        |

#### Notifications automatiques
- Création de commande → notification `ORDER` pour l'admin
- Envoi de message → notification `MESSAGE` pour le destinataire

---

## Endpoints complets (tous préfixés `/api`)

### Auth
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /auth/me`, `GET /auth/google`, `GET /auth/google/callback`

### Catalogue & Produits
- `GET /catalog` — public, filtrable, paginable
- `POST/GET/PUT/DELETE /products` et sous-ressources (options, images, reviews)

### Panier
- `GET/POST /cart`, `PUT /cart/update`, `DELETE /cart/remove/{id}`

### Commandes
- `POST/GET /orders`, `GET /orders/{id}`, `PUT /orders/{id}/status`

---

## Migration Alembic

Fichier : `alembic/versions/001_initial_schema.py`

Pour initialiser la base de données :
```bash
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

---

## Backlog priorisé

### P0 — Terminé ✅
- [x] Architecture backend (Étape 1)
- [x] Gestion produits & catalogue (Étape 2)
- [x] Panier, Commandes & Paiement Manuel + Invoice (Étape 3)
- [x] Chat / Messages + Notifications (Étapes 4 & 5)
- [x] Frontend Admin Dashboard — Next.js (8 pages complètes)

### P1 — Prochaines étapes
- [ ] Authentification Google OAuth (compléter le scaffold)
- [ ] Vérification email à l'inscription

### P2 — Fonctionnalités avancées
- [ ] Webhooks Stripe (paiement automatique)
- [ ] Analytics (page_views)

### P3 — Améliorations futures
- [ ] Multi-tenancy (adaptation pour chaque client)
- [ ] Cache Redis + Rate limiting
- [ ] WebSocket pour le chat en temps réel

---

## Pour démarrer avec un nouveau client

```bash
cp -r ecommerce-backend/ client-nom/
cd client-nom/
cp .env.example .env
# Remplir les credentials du client dans .env
docker-compose up -d
docker-compose exec backend alembic upgrade head
```
