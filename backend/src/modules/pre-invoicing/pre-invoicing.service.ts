import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { computeGap } from "./pre-invoicing.matching";
import {
  AttachCarrierInvoiceInput,
  GeneratePreInvoiceInput,
  ResolveDiscrepancyInput,
} from "./pre-invoicing.schema";

export const preInvoicingService = {
  list(status?: string) {
    return prisma.preInvoice.findMany({
      where: { matchingStatus: status as never },
      include: { shipment: { include: { carrier: true, orders: true } }, carrierInvoice: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const preInvoice = await prisma.preInvoice.findUnique({
      where: { id },
      include: { shipment: true, carrierInvoice: true },
    });
    if (!preInvoice) throw AppError.notFound("Pré-facture");
    return preInvoice;
  },

  // Étape 1 du 3-way matching : "Ordre de Transport" (Shipment) -> génère la
  // pré-facture avec le coût théorique déjà calculé par le moteur de costing
  // lors de la consolidation (Shipment.theoreticalCost).
  async generate(input: GeneratePreInvoiceInput) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: input.shipmentId },
      include: { preInvoice: true },
    });
    if (!shipment) throw AppError.notFound("Shipment");
    if (shipment.preInvoice) throw AppError.conflict("Une pré-facture existe déjà pour ce shipment");
    if (shipment.theoreticalCost === null) {
      throw AppError.badRequest("Le coût théorique du shipment n'a pas été calculé");
    }

    const reference = `PINV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.preInvoice.create({
      data: {
        reference,
        shipmentId: shipment.id,
        theoreticalAmount: shipment.theoreticalCost,
        currency: shipment.currency,
        toleranceThresholdPercent: input.toleranceThresholdPercent,
        matchingStatus: "PENDING_INVOICE",
      },
    });
  },

  // Étape 2 : réception de la "Prestation Réalisée" -> facture réelle du
  // prestataire, rattachée à la pré-facture -> déclenche le 3-way matching.
  async attachCarrierInvoice(preInvoiceId: string, input: AttachCarrierInvoiceInput) {
    const preInvoice = await this.getById(preInvoiceId);

    const carrierInvoice = await prisma.carrierInvoice.create({ data: input });

    const { gapAmount, gapPercent, matchingStatus } = computeGap(
      preInvoice.theoreticalAmount,
      carrierInvoice.amount,
      preInvoice.toleranceThresholdPercent
    );

    return prisma.preInvoice.update({
      where: { id: preInvoiceId },
      data: {
        carrierInvoiceId: carrierInvoice.id,
        carrierAmount: carrierInvoice.amount,
        gapAmount,
        gapPercent,
        matchingStatus,
      },
      include: { carrierInvoice: true, shipment: true },
    });
  },

  // Étape 3 : workflow de validation des écarts (Approuver / Rejeter / Avoir).
  // Réservé aux pré-factures en écart (DISCREPANCY) ou déjà rapprochées
  // (MATCHED) que l'on souhaite clore formellement.
  async resolveDiscrepancy(preInvoiceId: string, input: ResolveDiscrepancyInput) {
    const preInvoice = await this.getById(preInvoiceId);
    if (preInvoice.matchingStatus === "PENDING_INVOICE") {
      throw AppError.badRequest("Impossible de statuer avant réception de la facture prestataire");
    }

    return prisma.preInvoice.update({
      where: { id: preInvoiceId },
      data: {
        matchingStatus: input.decision,
        validatedBy: input.validatedBy,
        validationNote: input.validationNote,
        validatedAt: new Date(),
      },
    });
  },
};
