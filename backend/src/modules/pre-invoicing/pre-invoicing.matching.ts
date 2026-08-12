import { MatchingStatus } from "@prisma/client";

export interface GapResult {
  gapAmount: number;
  gapPercent: number;
  matchingStatus: MatchingStatus;
}

// Calcule l'écart entre le coût théorique (calculé par l'app) et le montant
// facturé par le prestataire, puis détermine le statut de rapprochement en
// fonction du seuil de tolérance configuré.
//
//  - Pas de facture prestataire reçue -> PENDING_INVOICE
//  - |écart %| <= seuil               -> MATCHED (rapprochement automatique)
//  - |écart %| >  seuil               -> DISCREPANCY (nécessite un arbitrage)
export function computeGap(
  theoreticalAmount: number,
  carrierAmount: number | null | undefined,
  toleranceThresholdPercent: number
): GapResult {
  if (carrierAmount === null || carrierAmount === undefined) {
    return { gapAmount: 0, gapPercent: 0, matchingStatus: "PENDING_INVOICE" };
  }

  const gapAmount = round2(carrierAmount - theoreticalAmount);
  const gapPercent =
    theoreticalAmount === 0 ? 0 : round2((gapAmount / theoreticalAmount) * 100);

  const matchingStatus: MatchingStatus =
    Math.abs(gapPercent) <= toleranceThresholdPercent ? "MATCHED" : "DISCREPANCY";

  return { gapAmount, gapPercent, matchingStatus };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
