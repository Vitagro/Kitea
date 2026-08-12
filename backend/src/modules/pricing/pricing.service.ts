import { PricingRuleType, PricingSource } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreatePricingRuleInput, UpdatePricingRuleInput } from "./pricing.schema";

export const pricingService = {
  list(filters: { ruleType?: PricingRuleType; source?: PricingSource; activeOnly?: boolean }) {
    return prisma.pricingRule.findMany({
      where: {
        ruleType: filters.ruleType,
        source: filters.source,
        isActive: filters.activeOnly ? true : undefined,
      },
      include: { carrier: true, vehicleType: true, storageLocation: true },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getById(id: string) {
    const rule = await prisma.pricingRule.findUnique({
      where: { id },
      include: { carrier: true, vehicleType: true, storageLocation: true },
    });
    if (!rule) throw AppError.notFound("Règle tarifaire");
    return rule;
  },

  create(input: CreatePricingRuleInput) {
    return prisma.pricingRule.create({ data: input });
  },

  async update(id: string, input: UpdatePricingRuleInput) {
    await this.getById(id);
    return prisma.pricingRule.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.pricingRule.update({ where: { id }, data: { isActive: false } });
  },

  // Résout la règle de tarif transport applicable pour un trajet + véhicule donnés,
  // à une date de référence. Priorité : forfait véhicule > prix au km > forfait zone.
  async resolveTransportRule(params: {
    vehicleTypeId?: string;
    zoneName?: string;
    source?: PricingSource;
    at?: Date;
  }) {
    const at = params.at ?? new Date();
    const baseWhere = {
      isActive: true,
      source: params.source,
      validFrom: { lte: at },
      OR: [{ validTo: null }, { validTo: { gte: at } }],
    };

    if (params.vehicleTypeId) {
      const perVehicle = await prisma.pricingRule.findFirst({
        where: { ...baseWhere, ruleType: "TRANSPORT_PER_VEHICLE", vehicleTypeId: params.vehicleTypeId },
        orderBy: { updatedAt: "desc" },
      });
      if (perVehicle) return perVehicle;
    }

    if (params.zoneName) {
      const flatZone = await prisma.pricingRule.findFirst({
        where: { ...baseWhere, ruleType: "TRANSPORT_FLAT_ZONE", zoneName: params.zoneName },
        orderBy: { updatedAt: "desc" },
      });
      if (flatZone) return flatZone;
    }

    const perKm = await prisma.pricingRule.findFirst({
      where: { ...baseWhere, ruleType: "TRANSPORT_PER_KM" },
      orderBy: { updatedAt: "desc" },
    });
    return perKm;
  },
};
