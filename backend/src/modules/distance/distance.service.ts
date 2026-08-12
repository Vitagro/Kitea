import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { estimateDrivingDurationMin, haversineDistanceKm } from "../../common/utils/geo";

export const distanceService = {
  async getOrCompute(fromLocationId: string, toLocationId: string) {
    if (fromLocationId === toLocationId) {
      return { distanceKm: 0, durationMin: 0, source: "HAVERSINE" as const };
    }

    const existing = await prisma.distanceMatrix.findUnique({
      where: { fromLocationId_toLocationId: { fromLocationId, toLocationId } },
    });
    if (existing) return existing;

    const [from, to] = await Promise.all([
      prisma.location.findUnique({ where: { id: fromLocationId } }),
      prisma.location.findUnique({ where: { id: toLocationId } }),
    ]);
    if (!from) throw AppError.notFound("Site d'origine");
    if (!to) throw AppError.notFound("Site de destination");

    const distanceKm = haversineDistanceKm(from, to);
    const durationMin = estimateDrivingDurationMin(distanceKm);

    return prisma.distanceMatrix.create({
      data: { fromLocationId, toLocationId, distanceKm, durationMin, source: "HAVERSINE" },
    });
  },

  // Recalcule et met en cache la matrice complète pour un ensemble de sites
  // (utilisé par le module de consolidation pour le zonage géographique).
  async buildMatrix(locationIds: string[]) {
    const results = [];
    for (const fromId of locationIds) {
      for (const toId of locationIds) {
        if (fromId === toId) continue;
        results.push(await this.getOrCompute(fromId, toId));
      }
    }
    return results;
  },
};
