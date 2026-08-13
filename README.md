# KITEA Logistics Control Tower & Pre-Invoicing Engine

> Plateforme de pilotage logistique et de pré-facturation intragroupe pour l'écosystème KITEA (Magasins, Entrepôts, Hubs 3PL, Prestataires de transport et de stockage).

---

## 1. Vision du projet

KITEA opère un réseau logistique complexe mêlant entrepôts centraux, hubs opérés par des prestataires 3PL, et un large parc de points de vente (magasins, showrooms, outlets). Aujourd'hui, le pilotage des coûts de transport et de stockage, le choix du type de véhicule, et le contrôle des factures prestataires reposent en grande partie sur des processus manuels (tableurs, échanges d'e-mails, saisies a posteriori).

La **Logistics Control Tower & Pre-Invoicing Engine** a pour objectif de :

1. **Cartographier** l'ensemble du réseau KITEA (sites, capacités, fenêtres de livraison) sur une carte interactive.
2. **Calculer automatiquement** le coût théorique de transport et de stockage à partir de grilles tarifaires paramétrables.
3. **Optimiser** le regroupement des commandes (consolidation) et recommander le type de véhicule le plus adapté au profil volumétrique/poids.
4. **Générer des pré-factures intragroupe** avant réception des factures réelles des prestataires, et **rapprocher automatiquement** (3-way matching) les écarts.
5. **S'intégrer à l'ERP central de KITEA** via une couche API REST/Webhooks, pour les flux de commandes, statuts d'expédition et imputations logistiques.

## 2. Rôle métier pour KITEA

Ce produit s'adresse en priorité à la **Direction Logistique (Head of Logistics)** et à ses équipes :

- **Control Tower** : vision temps réel du réseau, des flux et des coûts.
- **Achats Transport & Stockage** : négociation basée sur un coût théorique benchmarké, pas seulement sur le déclaratif prestataire.
- **Finance / Comptabilité intragroupe** : accélération de la clôture par la pré-facturation automatisée et réduction des litiges grâce au 3-way matching.
- **Exploitation / Dispatch** : recommandation d'affectation véhicule et taux de remplissage pour limiter les trajets à vide et le sur-dimensionnement de flotte.

## 3. Modules fonctionnels

| # | Module | Description |
|---|--------|-------------|
| 1 | **Cartographie & Géolocalisation** | Carte interactive du réseau (magasins, entrepôts, hubs 3PL), fiches sites (capacité m²/m³, horaires, restrictions accès), matrice de distances/temps de trajet. |
| 2 | **Engine d'Optimisation des Commandes** | Consolidation automatique des commandes par zone/fenêtre de livraison/compatibilité de charge, sélection intelligente du véhicule (volume/poids → typologie flotte), taux de remplissage (bin packing 2D/3D). |
| 3 | **Dynamic Costing & Configurateur de Tarifs** | Grilles tarifaires paramétrables (trajet, stockage, manutention), comparatif coût théorique vs coût prestataire, alertes de dépassement de seuil. |
| 4 | **Facturation Intragroupe & Pré-Facturation** | Génération automatique des pré-factures, 3-way matching (Ordre de Transport / Prestation Réalisée / Pré-facture), workflow de validation des écarts. |
| 5 | **ERP Integration Layer** | API REST/Webhooks pour échange inbound (commandes, réassorts, transferts) et outbound (statuts, coûts imputés, pré-factures validées) avec l'ERP KITEA (SAP, Dynamics, Oracle, Odoo...). Import de commandes en masse depuis l'ERP (lot JSON ou fichier Excel). |
| 6 | **Import / Export Excel** | Écran Commandes : export `.xlsx` du carnet de commandes, import en masse (modèle Excel fourni) pour la saisie manuelle ou la reprise de données. |

## 4. Architecture technique

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│         Frontend             │  REST  │            Backend             │
│  React + TypeScript + Vite   │◄──────►│  Node.js + Express + TypeScript│
│  Tailwind CSS · Leaflet      │  JSON  │  Prisma ORM                    │
│  Recharts · lucide-react     │        │  Modular services              │
└──────────────────────────────┘        └───────────────┬─────────────────┘
                                                          │
                                          ┌───────────────▼─────────────────┐
                                          │   PostgreSQL + PostGIS           │
                                          │   (géolocalisation & calcul      │
                                          │    spatial)                      │
                                          └───────────────────────────────┘
                                                          ▲
                                          ┌───────────────┴─────────────────┐
                                          │   ERP Integration Layer          │
                                          │   (Webhooks / REST connectors)   │
                                          └───────────────────────────────┘
```

### Stack

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, `lucide-react`, `react-leaflet` (cartographie), Recharts (analytics), Zustand (state management léger), Axios.
- **Backend** : Node.js, Express, TypeScript, Prisma ORM, Zod (validation), architecture modulaire orientée services/contrôleurs/routes.
- **Base de données** : PostgreSQL 15+ avec extension **PostGIS** pour les calculs géospatiaux (distances, zones de chalandise, matching géographique).
- **Intégration ERP** : couche API REST + Webhooks, adaptateurs découplés par ERP cible (SAP / Dynamics / Oracle / Odoo).
- **Qualité** : ESLint, Prettier, Jest (tests unitaires), variables d'environnement via `.env` (jamais committées).

### Arborescence du projet

```
kitea/
├── README.md
├── .gitignore
├── docs/
│   └── architecture.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── config/
│       │   ├── env.ts
│       │   └── prisma.ts
│       ├── common/
│       │   ├── errors/AppError.ts
│       │   ├── middleware/
│       │   │   ├── errorHandler.ts
│       │   │   └── validateRequest.ts
│       │   └── utils/geo.ts
│       └── modules/
│           ├── locations/          # Module 1 - Sites, CRUD & import/export Excel
│           ├── distance/           # Module 1 - Matrice de distances
│           ├── pricing/            # Module 3 - Configurateur de tarifs
│           ├── vehicle-types/      # Module 2 - Typologie de flotte (CRUD)
│           ├── carriers/           # Transporteurs internes/3PL (CRUD)
│           ├── orders/             # Commandes, import/export Excel
│           ├── consolidation/      # Module 2 - Regroupement & choix véhicule
│           ├── shipments/          # Expéditions consolidées (lecture)
│           ├── pre-invoicing/      # Module 4 - Pré-facturation & 3-way matching
│           └── erp-integration/    # Module 5 - API ERP inbound/outbound + import masse
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/
        ├── services/            # Clients API (axios)
        ├── components/
        │   ├── Map/             # Carte interactive du réseau
        │   ├── Locations/       # Gestion des sites (liste, CRUD, Excel)
        │   ├── Pricing/         # Configurateur de tarifs (admin)
        │   ├── Orders/          # Liste commandes, import/export Excel
        │   ├── Shipments/       # Expéditions consolidées
        │   ├── References/      # Types de véhicules & transporteurs
        │   ├── Invoicing/       # Pré-facturation & rapprochement
        │   ├── Layout/
        │   └── Common/
        └── pages/
```

## 5. Modèle de données (extrait)

Le schéma complet est défini dans [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). Tables clés :

- **`locations`** : sites du réseau KITEA (magasins, entrepôts, hubs 3PL) — coordonnées GPS, capacités m²/m³, horaires, restrictions d'accès.
- **`distance_matrix`** : distances/temps de trajet calculés ou importés entre paires de sites.
- **`vehicle_types`** : typologie de flotte (utilitaire léger, camion moyen, porteur 14T, semi-remorque...) avec capacités volume/poids.
- **`pricing_rules`** : grilles tarifaires paramétrables (trajet, stockage, manutention), internes vs prestataires 3PL.
- **`orders`** : commandes à livrer (origine, destination, volume, poids, fenêtre de livraison).
- **`shipments`** : regroupements de commandes affectés à un véhicule, avec coût théorique calculé.
- **`carrier_invoices`** : factures réelles saisies/importées des prestataires.
- **`pre_invoices`** : pré-factures générées automatiquement, écarts vs factures réelles, statut de rapprochement (3-way matching).

## 6. Installation & démarrage

### Pré-requis

- Node.js ≥ 18
- PostgreSQL ≥ 15 avec extension PostGIS
- npm ≥ 9

### Backend

```bash
cd backend
cp .env.example .env      # renseigner DATABASE_URL, PORT, etc.
npm install
npx prisma migrate dev    # crée le schéma en base
npx prisma db seed        # (optionnel) données de démonstration
npm run dev                # démarre l'API sur http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                # démarre l'app sur http://localhost:5173
```

### Variables d'environnement principales

| Variable | Emplacement | Description |
|----------|-------------|--------------|
| `DATABASE_URL` | backend/.env | Connexion PostgreSQL (PostGIS activé) |
| `PORT` | backend/.env | Port de l'API (défaut 4000) |
| `JWT_SECRET` | backend/.env | Secret de signature des tokens |
| `ERP_WEBHOOK_SECRET` | backend/.env | Secret de vérification des webhooks entrants ERP |
| `GOOGLE_MAPS_API_KEY` | backend/.env | Optionnelle — active le géocodage précis des sites (voir §7.4) |
| `VITE_API_BASE_URL` | frontend/.env | URL de base de l'API consommée par le frontend |
| `VITE_MAP_TILE_URL` | frontend/.env | URL des tuiles cartographiques (OSM/Mapbox) |

### Import / Export de commandes

| Endpoint | Description |
|----------|-------------|
| `GET /api/orders/export` | Export Excel du carnet de commandes (filtrable par statut) |
| `GET /api/orders/import/template` | Modèle Excel vierge pour l'import manuel |
| `POST /api/orders/import` | Import en masse (multipart, champ `file`, .xlsx) |
| `POST /api/erp/webhooks/orders` | Webhook inbound ERP — une commande, temps réel |
| `POST /api/erp/import/orders` | Import en masse depuis l'ERP — lot JSON (`{ orders: [...] }`) |
| `POST /api/erp/import/orders/excel` | Import en masse depuis l'ERP — fichier Excel (multipart, champ `file`) |
| `GET /api/erp/import/orders/template` | Modèle Excel attendu pour un export ERP |
| `GET /api/locations/export` · `POST /api/locations/import` | Export/import Excel du réseau de sites (upsert par `code`) |
| `POST /api/locations/:id/geocode` | Résout latitude/longitude + Place ID via Google Geocoding API (nécessite `GOOGLE_MAPS_API_KEY`, voir §7.4) |

Les sites d'origine/destination sont référencés par leur `code` (ex: `KTA-WH-CASA-KSH`), pas par leur UUID interne — cohérent avec le `code` unique du modèle `Location`. Chaque ligne d'un import est traitée indépendamment : une ligne invalide ou une référence de commande déjà existante est reportée dans la réponse (`errors[]`) sans bloquer le reste du lot.

## 7. Déploiement (Vercel + Render + Supabase)

Configuration cible pour un environnement de test/démo :

- **Base de données** → [Supabase](https://supabase.com) (PostgreSQL managé + PostGIS disponible).
- **Backend** → [Render](https://render.com) (serveur Node.js long-running, requis par Express/Prisma — Vercel ne fait tourner que des fonctions serverless, incompatible avec ce type de backend).
- **Frontend** → [Vercel](https://vercel.com) (build statique Vite, fait pour ça).

### 7.1 Supabase (base de données)

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **Project Settings → Database → Connection string**, récupérer :
   - la connexion **pooled** (port 6543, pgbouncer) → `DATABASE_URL`
   - la connexion **directe** (port 5432) → `DIRECT_URL` (requise par `prisma migrate`)
3. (Optionnel) Activer l'extension **PostGIS** dans **Database → Extensions**.

### 7.2 Render (backend)

Le fichier [`render.yaml`](render.yaml) à la racine décrit le service (blueprint Git) :

1. Sur [dashboard.render.com](https://dashboard.render.com), **New → Blueprint**, sélectionner ce repo.
2. Render détecte `render.yaml` et provisionne un service web `kitea-logistics-backend` (rootDir `backend/`).
3. Renseigner les variables marquées `sync: false` dans **Environment** : `DATABASE_URL`, `DIRECT_URL` (Supabase), `JWT_SECRET`, `ERP_WEBHOOK_SECRET`, `CORS_ORIGIN` (URL Vercel du frontend), `ERP_BASE_URL`.
4. Au déploiement, Render exécute `prisma generate` au build puis `prisma migrate deploy` au démarrage (applique les migrations sur Supabase).

### 7.3 Vercel (frontend)

Le fichier [`vercel.json`](vercel.json) à la racine pointe le build sur `frontend/` (monorepo) :

1. Sur [vercel.com](https://vercel.com), importer ce repo dans le projet cible.
2. Vercel lit `vercel.json` à la racine — aucune configuration manuelle du *Root Directory* n'est nécessaire.
3. Renseigner la variable d'environnement **`VITE_API_BASE_URL`** = URL du service Render (ex: `https://kitea-logistics-backend.onrender.com/api`).
4. Chaque push sur la branche connectée redéploie automatiquement le frontend.

### 7.4 Google Maps (géocodage précis des sites)

Le réseau KITEA est pré-rempli (`prisma/seed.ts`) à partir de recherches web publiques : adresses, téléphone (centre d'appel national), horaires standards sont réels, mais les **coordonnées GPS restent approximées au niveau ville** — ni `kitea.com` ni `google.com` n'étaient joignables depuis l'environnement de développement utilisé pour la collecte (proxy réseau sandbox), donc aucune coordonnée exacte n'a pu être vérifiée en direct sur Google Maps.

Pour résoudre les coordonnées précises **une fois déployé** (Render n'a pas cette restriction réseau) :

1. Créer une clé API sur [Google Cloud Console](https://console.cloud.google.com/) → activer **Geocoding API** → **Credentials** → créer une clé, la restreindre à cette API + à l'IP/domaine du service Render.
2. Renseigner `GOOGLE_MAPS_API_KEY` dans les variables d'environnement Render.
3. Depuis l'écran **Sites**, cliquer sur l'icône 🎯 en face de chaque site pour appeler `POST /api/locations/:id/geocode` — la latitude/longitude et le lien Google Maps du site sont alors mis à jour avec les données officielles Google (Place ID inclus).

Sans clé configurée, cet endpoint répond une erreur explicite (`400`) plutôt que d'échouer silencieusement. Le lien "Voir sur Google Maps" (icône 🔗), lui, fonctionne dans tous les cas : c'est une recherche Google Maps construite à partir du nom/adresse, sans dépendance à l'API.

## 8. Feuille de route (Roadmap)

- [x] **Phase 0** — Cadrage, architecture, schéma de données, scaffolding du repo.
- [ ] **Phase 1** — Module Cartographie : CRUD sites, carte interactive, fiches sites, matrice de distances (Haversine puis API routing externe).
- [ ] **Phase 2** — Module Costing : configurateur de tarifs (CRUD grilles), calcul du coût théorique, comparatif vs coût prestataire, alertes de seuil.
- [ ] **Phase 3** — Module Optimisation : algorithme de consolidation des commandes, sélection du véhicule, indicateur de taux de remplissage.
- [ ] **Phase 4** — Module Pré-Facturation : génération automatique, workflow de validation, 3-way matching, exports comptables.
- [x] **Phase 5 (partiel)** — Intégration ERP : webhook inbound temps réel + import en masse (lot JSON ou Excel) opérationnels ; authentification API et mapping avancé des référentiels restent à faire.
- [ ] **Phase 6** — Durcissement : authentification/rôles (RBAC), audit trail, tests end-to-end, observabilité (logs/metrics), déploiement CI/CD.

## 9. Contribution

Ce dépôt suit une architecture modulaire : chaque module métier (pricing, consolidation, pre-invoicing, erp-integration...) est isolé sous `backend/src/modules/*` avec ses propres routes/contrôleurs/services, et son pendant `frontend/src/components/*`. Toute nouvelle fonctionnalité doit respecter ce découpage et ne pas introduire de couplage direct entre modules (passer par des services partagés dans `common/`).

## 10. Licence

Propriété interne KITEA — usage restreint. Licence à définir par la Direction Logistique.
