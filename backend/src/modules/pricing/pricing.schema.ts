import { z } from "zod";

export const pricingRuleTypeEnum = z.enum([
  "TRANSPORT_FLAT_ZONE",
  "TRANSPORT_PER_KM",
  "TRANSPORT_PER_VEHICLE",
  "STORAGE_PER_PALLET_DAY",
  "STORAGE_PER_M2_MONTH",
  "HANDLING_IN",
  "HANDLING_OUT",
]);

export const pricingSourceEnum = z.enum(["INTERNAL", "EXTERNAL_3PL"]);

export const createPricingRuleSchema = z.object({
  body: z
    .object({
      label: z.string().min(1),
      ruleType: pricingRuleTypeEnum,
      source: pricingSourceEnum.default("INTERNAL"),
      carrierId: z.string().uuid().optional(),
      vehicleTypeId: z.string().uuid().optional(),
      storageLocationId: z.string().uuid().optional(),
      zoneName: z.string().optional(),
      unitPrice: z.number().positive(),
      currency: z.string().default("MAD"),
      validFrom: z.coerce.date(),
      validTo: z.coerce.date().optional(),
    })
    .refine(
      (data) => {
        if (data.ruleType === "TRANSPORT_FLAT_ZONE") return !!data.zoneName;
        return true;
      },
      { message: "zoneName est requis pour une règle de type TRANSPORT_FLAT_ZONE", path: ["zoneName"] }
    )
    .refine(
      (data) => {
        if (data.ruleType === "TRANSPORT_PER_VEHICLE") return !!data.vehicleTypeId;
        return true;
      },
      { message: "vehicleTypeId est requis pour une règle de type TRANSPORT_PER_VEHICLE", path: ["vehicleTypeId"] }
    )
    .refine(
      (data) => {
        if (data.ruleType === "STORAGE_PER_PALLET_DAY" || data.ruleType === "STORAGE_PER_M2_MONTH") {
          return !!data.storageLocationId;
        }
        return true;
      },
      { message: "storageLocationId est requis pour une règle de stockage", path: ["storageLocationId"] }
    ),
});

export const updatePricingRuleSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    unitPrice: z.number().positive().optional(),
    currency: z.string().optional(),
    zoneName: z.string().optional(),
    validFrom: z.coerce.date().optional(),
    validTo: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>["body"];
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>["body"];
