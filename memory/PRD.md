# PRD — E-Commerce Backend Template

**Date de création :** Février 2026
**Étape actuelle :** Étape 3 — Panier, Commandes & Paiement Manuel ✅

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

#### Nouveaux fichiers
| Fichier                          | Description                                                  |
|----------------------------------|--------------------------------------------------------------|
| `app/services/pdf_service.py`    | Génération de factures PDF en mémoire avec fpdf2            |
| `app/services/cart_service.py`   | Logique panier (ajout, MAJ, suppression)                     |
| `app/services/order_service.py`  | Logique commandes (création, liste, détail, statut)          |
| `app/routes/cart.py`             | 4 endpoints panier                                           |
| `app/routes/orders.py`           | 4 endpoints commandes                                        |
| `alembic/versions/001_initial_schema.py` | Migration initiale complète (14 tables)            |

#### Endpoints disponibles (Étape 3)

| Méthode | Route                        | Auth         | Description                                  |
|---------|------------------------------|--------------|----------------------------------------------|
| GET     | `/api/cart`                  | User         | Voir son panier (créé auto si inexistant)    |
| POST    | `/api/cart/add`              | User         | Ajouter un article (vérif. stock + actif)   |
| PUT     | `/api/cart/update`           | User         | Modifier la quantité d'un article           |
| DELETE  | `/api/cart/remove/{item_id}` | User         | Retirer un article du panier                |
| POST    | `/api/orders`                | User         | Créer une commande depuis le panier          |
| GET     | `/api/orders`                | User / Admin | Lister les commandes (filtrées par rôle)     |
| GET     | `/api/orders/{id}`           | User / Admin | Détail d'une commande                        |
| PUT     | `/api/orders/{id}/status`    | Admin        | Changer le statut (stock décrémenté à paid) |

#### Règles métier implémentées
- `POST /cart/add` : vérifie `product.is_active == True` + stock disponible
- Prix capturé au moment de l'ajout (discount_price en priorité)
- Même article (même product + option) → quantité incrémentée
- `POST /orders` : snapshot product_name, unit_price, selected_options par article
- Panier vidé automatiquement après création de commande
- Stock décrémenté **uniquement** au passage du statut à `paid`
- Facture PDF générée avec fpdf2 et envoyée en pièce jointe via Resend
- Un utilisateur ne peut voir que ses propres commandes (admin voit tout)

#### Contenu de la facture PDF
- Numéro de commande (8 premiers caractères de l'UUID)
- Date de création
- Nom + téléphone du client
- Adresse de livraison complète
- Tableau : Produit, Quantité, Prix unitaire, Sous-total
- Total en EUR
- Message de bas de page

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

### P0 — En cours
- [x] Architecture backend (Étape 1)
- [x] Gestion produits & catalogue (Étape 2)
- [x] Panier, Commandes & Paiement Manuel (Étape 3)

### P1 — Prochaines étapes
- [ ] Module chat/messages en temps réel (Étape 4)
- [ ] Notifications push (Étape 4)

### P2 — Fonctionnalités avancées
- [ ] Dashboard admin
- [ ] Analytics (page_views)
- [ ] Webhooks Stripe (paiement automatique)
- [ ] Gestion multi-rôles (vendeur, manager)

### P3 — Améliorations futures
- [ ] Multi-tenancy (adaptation pour chaque client)
- [ ] Recherche avancée (Elasticsearch)
- [ ] Cache Redis (sessions, catalogue)
- [ ] Rate limiting

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
