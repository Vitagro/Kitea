import { z } from "zod";

// Saisie du suivi réel d'une expédition (affectation chauffeur, horodatage
// départ/arrivée) — alimente le calcul de ponctualité (module KPI).
export const recordDeliverySchema = z.object({
  body: z.object({
    driverId: z.string().uuid().optional(),
    actualDeparture: z.coerce.date().optional(),
    actualArrival: z.coerce.date().optional(),
  }),
});

export type RecordDeliveryInput = z.infer<typeof recordDeliverySchema>["body"];
