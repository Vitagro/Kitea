# Architecture — KITEA Logistics Control Tower & Pre-Invoicing Engine

## Vue d'ensemble

```
                         ┌────────────────────────────┐
                         │        ERP KITEA            │
                         │  (SAP / Dynamics / Oracle /  │
                         │        Odoo...)              │
                         └──────────────┬───────────────┘
                       Webhooks / REST  │  Webhooks / REST
                          (inbound)     │     (outbound)
                                        ▼
┌───────────────────────────────────────────────────────────────┐
│                     Backend — Node.js / Express                │
│                                                                  │
│  modules/locations        modules/distance                     │
│  modules/pricing          modules/orders                       │
│  modules/consolidation    modules/pre-invoicing                │
│  modules/erp-integration                                       │
│                                                                  │
│  common/  (errors, middleware, utils géospatiaux)               │
└───────────────────────────────┬─────────────────────────────────┘
                                 │ Prisma ORM
                                 ▼
                  ┌───────────────────────────────┐
                  │ PostgreSQL + PostGIS            │
                  └───────────────────────────────┘
                                 ▲
                                 │ REST (JSON)
┌───────────────────────────────┴─────────────────────────────────┐
│                    Frontend — React / TypeScript                 │
│                                                                    │
│  components/Map        (cartographie interactive du réseau)       │
│  components/Pricing    (configurateur de tarifs)                  │
│  components/Orders     (consolidation & sélection véhicule)       │
│  components/Invoicing  (control desk pré-facturation)             │
└────────────────────────────────────────────────────────────────┘
```

## Flux métier principal

1. **Réception de commande** (ERP → `POST /api/erp/webhooks/orders`) : crée un `Order` en statut `PENDING`, rattaché aux `Location` origine/destination résolues par code site.
2. **Consolidation** (`POST /api/consolidation/run`) : regroupe les commandes `PENDING` compatibles (trajet, fenêtre de livraison, charge) en clusters, puis les répartit en `Shipment` via un bin packing (First-Fit Decreasing) qui sélectionne le plus petit véhicule suffisant. Les commandes passent en statut `CONSOLIDATED`.
3. **Costing théorique** : au moment de la création du `Shipment`, le module `pricing` résout la règle tarifaire applicable (forfait véhicule > prix au km > forfait zone) et calcule `Shipment.theoreticalCost` à partir de la distance (`distance_matrix`, Haversine par défaut).
4. **Pré-facturation** (`POST /api/pre-invoices/generate`) : matérialise une `PreInvoice` à partir du coût théorique du shipment, en attente de la facture prestataire (`PENDING_INVOICE`).
5. **Réception facture prestataire** (`POST /api/pre-invoices/:id/carrier-invoice`) : crée un `CarrierInvoice`, calcule l'écart (`gapAmount`/`gapPercent`) vs seuil de tolérance, et positionne le statut `MATCHED` ou `DISCREPANCY` (3-way matching : Ordre de Transport / Prestation Réalisée / Pré-facture).
6. **Résolution des écarts** (`POST /api/pre-invoices/:id/resolve`) : workflow de validation (Approuver / Rejeter / Demander un avoir) par le Control Desk.
7. **Retour ERP** : chaque événement significatif (statut expédition, pré-facture validée) est journalisé dans `ErpSyncLog` (direction `OUTBOUND`) pour synchronisation vers l'ERP.

## Décisions d'architecture

- **Modularité stricte** : chaque module backend (`modules/*`) expose ses propres `schema` (validation Zod), `service` (logique métier + accès Prisma), `controller` (adaptation HTTP) et `routes`. Aucun couplage direct entre modules — les dépendances transverses (ex: consolidation → pricing/distance) passent par l'appel du service public du module cible.
- **Algorithmes purs et testables** : la logique de consolidation (`consolidation.algorithm.ts`), de calcul de coût (`pricing.calculator.ts`) et de matching (`pre-invoicing.matching.ts`) est isolée en fonctions pures, sans dépendance à Prisma/Express, pour faciliter les tests unitaires.
- **PostGIS** : bien que le MVP utilise la formule de Haversine pour les distances, le schéma est conçu pour migrer vers des calculs spatiaux natifs PostGIS (`ST_Distance`, `ST_DWithin`, clustering `ST_ClusterDBSCAN`) sans changement de modèle de données majeur.
- **Traçabilité ERP** : tous les échanges (inbound/outbound) sont journalisés dans `erp_sync_logs` pour permettre le rejeu en cas d'échec et l'audit des flux comptables.
