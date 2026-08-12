import { Location, Order } from "@prisma/client";
import { ExcelColumn } from "../../common/utils/excel";

export interface OrderExportRow extends Record<string, unknown> {
  reference: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  volumeM3: number;
  weightKg: number;
  isFragile: string;
  isStackable: string;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  status: string;
  erpSourceRef: string;
}

export const ORDER_EXPORT_COLUMNS: ExcelColumn<OrderExportRow>[] = [
  { header: "Référence", key: "reference", width: 22 },
  { header: "Code site origine", key: "originCode", width: 20 },
  { header: "Ville origine", key: "originCity", width: 18 },
  { header: "Code site destination", key: "destinationCode", width: 22 },
  { header: "Ville destination", key: "destinationCity", width: 18 },
  { header: "Volume (m3)", key: "volumeM3", width: 12 },
  { header: "Poids (kg)", key: "weightKg", width: 12 },
  { header: "Fragile", key: "isFragile", width: 10 },
  { header: "Empilable", key: "isStackable", width: 10 },
  { header: "Livraison début", key: "deliveryWindowStart", width: 20 },
  { header: "Livraison fin", key: "deliveryWindowEnd", width: 20 },
  { header: "Statut", key: "status", width: 14 },
  { header: "Référence ERP", key: "erpSourceRef", width: 20 },
];

export function toOrderExportRow(order: Order & { origin: Location; destination: Location }): OrderExportRow {
  return {
    reference: order.reference,
    originCode: order.origin.code,
    originCity: order.origin.city,
    destinationCode: order.destination.code,
    destinationCity: order.destination.city,
    volumeM3: order.volumeM3,
    weightKg: order.weightKg,
    isFragile: order.isFragile ? "OUI" : "NON",
    isStackable: order.isStackable ? "OUI" : "NON",
    deliveryWindowStart: order.deliveryWindowStart.toISOString(),
    deliveryWindowEnd: order.deliveryWindowEnd.toISOString(),
    status: order.status,
    erpSourceRef: order.erpSourceRef ?? "",
  };
}

// Colonnes communes à l'import manuel (écran Commandes) et à l'import de
// lots ERP au format Excel : les sites sont identifiés par leur `code`
// (lisible), pas par leur UUID interne.
export interface OrderImportRow extends Record<string, unknown> {
  reference: unknown;
  originCode: unknown;
  destinationCode: unknown;
  volumeM3: unknown;
  weightKg: unknown;
  isFragile: unknown;
  isStackable: unknown;
  deliveryWindowStart: unknown;
  deliveryWindowEnd: unknown;
  erpSourceRef: unknown;
}

export const ORDER_IMPORT_COLUMNS: ExcelColumn<OrderImportRow>[] = [
  { header: "Référence", key: "reference", width: 22 },
  { header: "Code site origine", key: "originCode", width: 20 },
  { header: "Code site destination", key: "destinationCode", width: 22 },
  { header: "Volume (m3)", key: "volumeM3", width: 12 },
  { header: "Poids (kg)", key: "weightKg", width: 12 },
  { header: "Fragile (OUI/NON)", key: "isFragile", width: 16 },
  { header: "Empilable (OUI/NON)", key: "isStackable", width: 18 },
  { header: "Livraison début (AAAA-MM-JJ HH:mm)", key: "deliveryWindowStart", width: 30 },
  { header: "Livraison fin (AAAA-MM-JJ HH:mm)", key: "deliveryWindowEnd", width: 28 },
  { header: "Référence ERP (optionnel)", key: "erpSourceRef", width: 24 },
];
