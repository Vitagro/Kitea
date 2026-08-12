import { ExcelColumn } from "../../common/utils/excel";

// Colonnes attendues pour un export de commandes issu de l'ERP au format
// Excel. Volontairement alignées sur InboundOrderWebhookInput (pas de
// fragile/empilable : ces attributs ne sont pas portés par le flux ERP).
export interface ErpOrderImportRow extends Record<string, unknown> {
  reference: unknown;
  originCode: unknown;
  destinationCode: unknown;
  volumeM3: unknown;
  weightKg: unknown;
  deliveryWindowStart: unknown;
  deliveryWindowEnd: unknown;
  erpSourceRef: unknown;
}

export const ERP_ORDER_IMPORT_COLUMNS: ExcelColumn<ErpOrderImportRow>[] = [
  { header: "Référence", key: "reference", width: 22 },
  { header: "Code site origine", key: "originCode", width: 20 },
  { header: "Code site destination", key: "destinationCode", width: 22 },
  { header: "Volume (m3)", key: "volumeM3", width: 12 },
  { header: "Poids (kg)", key: "weightKg", width: 12 },
  { header: "Livraison début (AAAA-MM-JJ HH:mm)", key: "deliveryWindowStart", width: 30 },
  { header: "Livraison fin (AAAA-MM-JJ HH:mm)", key: "deliveryWindowEnd", width: 28 },
  { header: "Référence ERP", key: "erpSourceRef", width: 22 },
];
