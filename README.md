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
| 7 | **Collaborateurs & KPIs** | Fiches collaborateurs (magasin, dépôt, livreur, planificateur), suivi de livraison réel (chauffeur + horodatage départ/arrivée), calcul automatique de la ponctualité, dashboard de KPIs (coûts de transport, taux à l'heure/en retard) et classements magasins/livreurs/responsables de dépôt. |
| 8 | **Synchronisation Google Maps** | Découverte automatique des sites KITEA déjà référencés sur Google Maps (Places API), géocodage précis d'un site à partir de son adresse (Geocoding API), champ de capacité de stockage (emplacements palettes) par site. |

## 4. Architecture technique

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│      Frontend (web/)         │  REST  │            Backend             │
│  Next.js 14 (App Router)     │◄──────►│  Node.js + Express + TypeScript│
│  TypeScript · Tailwind CSS   │  JSON  │  Prisma ORM                    │
│  Leaflet · Recharts          │        │  Modular services              │
└──────────────────────────────┘        └───────────────┬─────────────────┘
                                                          │
                                          ┌───────────────▼─────────────────┐
                                          │   Supabase (PostgreSQL managé)   │
                                          │   + extension PostGIS            │
                                          │   (géolocalisation & calcul      │
                                          │    spatial)                      │
                                          └───────────────────────────────┘
                                                          ▲
                                          ┌───────────────┴─────────────────┐
                                          │   Intégrations externes          │
                                          │   ERP (Webhooks/REST) · Google   │
                                          │   Maps (Geocoding/Places API)    │
                                          └───────────────────────────────┘
```

> **Note d'architecture** : Next.js est le frontend, mais il **consomme l'API REST Express existante** — il ne parle pas directement à Supabase. Ce choix a été fait pour ne pas réécrire les ~25 modules métier déjà en place (consolidation, pré-facturation, import Excel/ERP, géocodage...). Supabase reste la base Postgres hébergée derrière Prisma, exactement comme configuré en §7.1. Un legacy frontend Vite/React existe encore dans [`frontend/`](frontend/) (première itération) ; **`web/` (Next.js) est désormais le frontend de référence** et remplace `frontend/` à terme.

### Stack

- **Frontend** (`web/`) : Next.js 14 (App Router), TypeScript, Tailwind CSS, `lucide-react`, `react-leaflet` (cartographie, chargée en `dynamic(..., { ssr: false })`), Recharts (KPIs), client HTTP `fetch` natif (pas d'axios).
- **Backend** (`backend/`) : Node.js, Express, TypeScript, Prisma ORM, Zod (validation), architecture modulaire orientée services/contrôleurs/routes.
- **Base de données** : Supabase (PostgreSQL managé) avec extension **PostGIS** pour les calculs géospatiaux (distances, zones de chalandise, matching géographique).
- **Intégrations externes** : ERP (webhooks + import de masse REST), Google Maps (Geocoding API pour la position exacte d'un site, Places API pour la découverte automatique du réseau).
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
│           ├── locations/          # Module 1 - Sites, CRUD, capacité, Excel, geocode & sync Google Places
│           ├── distance/           # Module 1 - Matrice de distances
│           ├── pricing/            # Module 3 - Configurateur de tarifs
│           ├── vehicle-types/      # Module 2 - Typologie de flotte (CRUD)
│           ├── carriers/           # Transporteurs internes/3PL (CRUD)
│           ├── orders/             # Commandes, import/export Excel
│           ├── consolidation/      # Module 2 - Regroupement & choix véhicule
│           ├── shipments/          # Expéditions + suivi de livraison réel (chauffeur, horodatage)
│           ├── pre-invoicing/      # Module 4 - Pré-facturation & 3-way matching
│           ├── erp-integration/    # Module 5 - API ERP inbound/outbound + import masse
│           ├── employees/          # Module 6 - Collaborateurs (CRUD)
│           └── kpi/                # Module 6 - Classements & indicateurs de coûts
├── web/                        # ★ Frontend de référence (Next.js)
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── src/
│       ├── app/                 # Routes (App Router) : /, /locations, /employees,
│       │                        # /orders, /consolidation, /shipments, /pricing,
│       │                        # /pre-invoicing, /erp, /references, /map
│       ├── components/
│       │   ├── Dashboard/       # StatTile, RankingCard, TransportCostPanel (KPIs)
│       │   ├── Map/             # Carte interactive (chargée côté client uniquement)
│       │   ├── Locations/       # Gestion des sites + sync Google Places
│       │   ├── Employees/       # Gestion des collaborateurs
│       │   ├── Shipments/       # Expéditions + suivi de livraison
│       │   ├── Pricing/ Orders/ Invoicing/ References/ Layout/ Common/
│       ├── services/            # Clients API (fetch natif, un fichier par domaine)
│       ├── lib/apiClient.ts     # Wrapper fetch (GET/POST/PATCH/DELETE/upload/blob)
│       └── types/
└── frontend/                   # Legacy (Vite/React) — conservé pour référence,
    └── ...                     # superseded par web/, à supprimer une fois web/ validé en prod
```

## 5. Modèle de données (extrait)

Le schéma complet est défini dans [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). Tables clés :

- **`locations`** : sites du réseau KITEA (magasins, entrepôts, hubs 3PL) — coordonnées GPS, **capacité (`capacity_pallets`, m²/m³)**, horaires, restrictions d'accès, téléphone/site web/horaires client, `google_place_id`/`google_maps_url`/`plus_code` (intégration Google Maps).
- **`distance_matrix`** : distances/temps de trajet calculés ou importés entre paires de sites.
- **`vehicle_types`** : typologie de flotte (utilitaire léger, camion moyen, porteur 14T, semi-remorque...) avec capacités volume/poids.
- **`pricing_rules`** : grilles tarifaires paramétrables (trajet, stockage, manutention), internes vs prestataires 3PL.
- **`orders`** : commandes à livrer (origine, destination, volume, poids, fenêtre de livraison).
- **`shipments`** : regroupements de commandes affectés à un véhicule, avec coût théorique calculé, **chauffeur affecté (`driver_id`), horodatage réel départ/arrivée, et `delivery_performance`** (ON_TIME/LATE/CANCELLED, calculé automatiquement à l'arrivée réelle).
- **`carrier_invoices`** : factures réelles saisies/importées des prestataires.
- **`pre_invoices`** : pré-factures générées automatiquement, écarts vs factures réelles, statut de rapprochement (3-way matching).
- **`employees`** : collaborateurs (magasin, dépôt, livreur, planificateur, direction logistique) — rôle, site de rattachement ; base du suivi de KPI par collaborateur et des classements.

### KPIs & classements (module 6)

Aucune table d'agrégation dédiée : les KPIs sont **calculés à la volée** (`backend/src/modules/kpi/kpi.service.ts`) à partir des `shipments` livrés (`delivery_performance` renseigné) et de leur `pre_invoice` associée — suffisant au volume d'un control tower, à remplacer par des vues matérialisées/jobs planifiés si le volume grandit significativement (voir commentaire en tête du fichier).

| Endpoint | Description |
|----------|-------------|
| `GET /api/kpi/overview?from=&to=` | Volumétrie, taux de ponctualité, coût transport théorique vs facturé, écart moyen |
| `GET /api/kpi/rankings/drivers` | Classement livreurs par taux de ponctualité |
| `GET /api/kpi/rankings/stores` | Classement magasins par ponctualité des livraisons reçues |
| `GET /api/kpi/rankings/warehouse-managers` | Classement responsables de dépôt (ponctualité + écart de coût moyen) |
| `GET /api/kpi/transport-costs` | Ventilation des coûts théoriques par type de véhicule et par transporteur |
| `PATCH /api/shipments/:id/delivery` | Affecte un chauffeur + horodatage réel départ/arrivée — calcule `delivery_performance` automatiquement (tolérance 15 min) |

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
npx prisma migrate dev    # applique backend/prisma/migrations/ (déjà versionnées dans ce repo)
npx prisma db seed        # (optionnel) données de démonstration
npm run dev                # démarre l'API sur http://localhost:4000
```

> Ce flux a été exécuté et vérifié en conditions réelles sur une base PostgreSQL locale (migration → seed → API → consolidation → suivi de livraison → KPIs → pré-facturation → export/import Excel → frontend Next.js dans un vrai navigateur). Deux bugs trouvés lors de ces tests ont été corrigés : les expéditions n'avaient jamais d'heure planifiée (donc la ponctualité ne se calculait jamais — corrigé dans `consolidation.service.ts`), et un fichier exporté ne pouvait pas être réimporté tel quel (en-têtes Excel non concordantes — corrigé dans `common/utils/excel.ts`). Voir `backend/src/**/*.test.ts` (`npm test`) pour les tests automatisés qui couvrent l'algorithme de consolidation, le calcul d'écart de pré-facturation et le calcul de distance.

### Tests automatisés

```bash
cd backend
npm test          # Jest — algorithme de consolidation, matching pré-facturation, calculateur de coûts, Haversine
```

### Frontend (`web/` — Next.js, frontend de référence)

```bash
cd web
cp .env.example .env      # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                # démarre l'app sur http://localhost:3000
```

> L'ancien frontend Vite (`frontend/`) reste démarrable de la même façon (`cd frontend && npm install && npm run dev`, port 5173) mais n'est plus maintenu activement — `backend/.env` autorise déjà les deux origines par défaut (`CORS_ORIGIN`).

### Variables d'environnement principales

| Variable | Emplacement | Description |
|----------|-------------|--------------|
| `DATABASE_URL` / `DIRECT_URL` | backend/.env | Connexion PostgreSQL Supabase (pooled / directe) |
| `PORT` | backend/.env | Port de l'API (défaut 4000) |
| `CORS_ORIGIN` | backend/.env | Origines autorisées, séparées par des virgules (Next.js :3000, Vite legacy :5173) |
| `JWT_SECRET` | backend/.env | Secret de signature des tokens |
| `ERP_WEBHOOK_SECRET` | backend/.env | Secret de vérification des webhooks entrants ERP |
| `GOOGLE_MAPS_API_KEY` | backend/.env | Optionnelle — active le géocodage précis et la synchronisation Google Places (voir §7.4) |
| `NEXT_PUBLIC_API_BASE_URL` | web/.env | URL de base de l'API consommée par le frontend Next.js |
| `NEXT_PUBLIC_MAP_TILE_URL` | web/.env | URL des tuiles cartographiques (OSM/Mapbox) |

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
| `POST /api/locations/sync-google-places` | Découverte automatique du réseau via Google Places (`{ query?, dryRun? }`, `dryRun: true` par défaut = aperçu sans écriture) |

Les sites d'origine/destination sont référencés par leur `code` (ex: `KTA-WH-CASA-KSH`), pas par leur UUID interne — cohérent avec le `code` unique du modèle `Location`. Chaque ligne d'un import est traitée indépendamment : une ligne invalide ou une référence de commande déjà existante est reportée dans la réponse (`errors[]`) sans bloquer le reste du lot.

## 7. Déploiement (Vercel + Render + Supabase)

Configuration cible pour un environnement de test/démo :

- **Base de données** → [Supabase](https://supabase.com) (PostgreSQL managé + PostGIS disponible).
- **Backend** → [Render](https://render.com) (serveur Node.js long-running, requis par Express/Prisma — Vercel ne fait tourner que des fonctions serverless, incompatible avec ce type de backend).
- **Frontend** → [Vercel](https://vercel.com) (support natif Next.js).

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

### 7.3 Vercel (frontend Next.js — `web/`)

Contrairement au build statique Vite (géré via un `vercel.json` racine sans configuration dashboard), **Next.js utilise le builder natif de Vercel**, ce qui nécessite de déclarer explicitement le sous-dossier du monorepo :

1. Sur [vercel.com](https://vercel.com), importer ce repo dans le projet cible.
2. Dans **Project Settings → General → Root Directory**, renseigner `web` (Vercel détecte alors automatiquement le framework Next.js — aucune autre configuration requise).
3. Renseigner la variable d'environnement **`NEXT_PUBLIC_API_BASE_URL`** = URL du service Render (ex: `https://kitea-logistics-backend.onrender.com/api`).
4. Chaque push sur la branche connectée redéploie automatiquement le frontend.

Le [`vercel.json`](vercel.json) racine a été simplifié en conséquence (il servait auparavant à rediriger le build statique vers `frontend/dist`, inutile — voire incompatible — avec le builder Next.js).

### 7.4 Google Maps (géocodage précis des sites)

Le réseau KITEA est pré-rempli (`prisma/seed.ts`) à partir de recherches web publiques : adresses, téléphone (centre d'appel national), horaires standards sont réels, mais les **coordonnées GPS restent approximées au niveau ville** — ni `kitea.com` ni `google.com` n'étaient joignables depuis l'environnement de développement utilisé pour la collecte (proxy réseau sandbox), donc aucune coordonnée exacte n'a pu être vérifiée en direct sur Google Maps.

Pour résoudre les coordonnées précises **une fois déployé** (Render n'a pas cette restriction réseau) :

1. Créer une clé API sur [Google Cloud Console](https://console.cloud.google.com/) → activer **Geocoding API** → **Credentials** → créer une clé, la restreindre à cette API + à l'IP/domaine du service Render.
2. Renseigner `GOOGLE_MAPS_API_KEY` dans les variables d'environnement Render.
3. Depuis l'écran **Sites**, cliquer sur l'icône 🎯 en face de chaque site pour appeler `POST /api/locations/:id/geocode` — la latitude/longitude et le lien Google Maps du site sont alors mis à jour avec les données officielles Google (Place ID inclus).
4. Pour découvrir automatiquement de nouveaux sites (plutôt que corriger un site existant), utiliser le bouton **"Synchroniser depuis Google Maps"** en haut de l'écran Sites : il interroge Google Places (`POST /api/locations/sync-google-places`) avec une requête libre (ex: `"KITEA magasin meuble Maroc"`), affiche un aperçu (CREATE/UPDATE/SKIP par établissement trouvé) **sans rien écrire**, puis applique les changements uniquement après confirmation explicite.

Sans clé configurée, ces deux endpoints répondent une erreur explicite (`400`) plutôt que d'échouer silencieusement. Le lien "Voir sur Google Maps" (icône 🔗), lui, fonctionne dans tous les cas : c'est une recherche Google Maps construite à partir du nom/adresse, sans dépendance à l'API.

## 8. Feuille de route (Roadmap)

- [x] **Phase 0** — Cadrage, architecture, schéma de données, scaffolding du repo.
- [x] **Phase 1** — Module Cartographie : CRUD sites, carte interactive, fiches sites, matrice de distances (Haversine). Vérifié en local (20 sites réels, carte + popups fonctionnels). Reste à faire : API de routing externe pour des distances routières précises (Haversine est une approximation à vol d'oiseau).
- [x] **Phase 2** — Module Costing : configurateur de tarifs (CRUD grilles), calcul du coût théorique. Vérifié en local (règle au km résolue et appliquée sur une expédition réelle). Reste à faire : alertes automatiques de dépassement de seuil (le calcul d'écart existe côté pré-facturation, l'alerte proactive côté configurateur reste à ajouter).
- [x] **Phase 3** — Module Optimisation : algorithme de consolidation des commandes, sélection du véhicule, taux de remplissage. Vérifié en local avec tests automatisés (regroupement, bin packing, sélection véhicule, calcul de taux de remplissage).
- [x] **Phase 4** — Module Pré-Facturation : génération automatique, 3-way matching, workflow de validation. Vérifié en local (génération, rattachement facture prestataire, détection d'écart hors tolérance, approbation). Reste à faire : exports comptables.
- [x] **Phase 5 (partiel)** — Intégration ERP : webhook inbound temps réel + import en masse (lot JSON ou Excel) opérationnels, vérifiés en local (doublon et référence inconnue correctement rejetés sans bloquer le lot) ; authentification API et mapping avancé des référentiels restent à faire.
- [x] **Phase 6 (partiel)** — Collaborateurs & KPIs : CRUD employés, suivi de livraison réel, classements magasins/livreurs/responsables de dépôt, indicateurs de coûts transport, migration frontend vers Next.js (`web/`), intégration Google Maps (géocodage + découverte automatique du réseau). Chaîne complète vérifiée en local (commande → consolidation → livraison → ponctualité → classements). Reste à faire : authentification/rôles (RBAC), audit trail, observabilité, CI/CD, retrait définitif du frontend Vite legacy, déploiement réel (Supabase/Render/Vercel) et clé Google Maps en production.

## 9. Contribution

Ce dépôt suit une architecture modulaire : chaque module métier (pricing, consolidation, pre-invoicing, erp-integration, kpi...) est isolé sous `backend/src/modules/*` avec ses propres routes/contrôleurs/services, et son pendant `web/src/components/*` (frontend Next.js de référence). Toute nouvelle fonctionnalité doit respecter ce découpage et ne pas introduire de couplage direct entre modules (passer par des services partagés dans `common/`). Le frontend Vite (`frontend/`) est conservé pour référence mais ne doit plus recevoir de nouveau développement.

## 10. Licence

Propriété interne KITEA — usage restreint. Licence à définir par la Direction Logistique.
