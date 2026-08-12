import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const casaWarehouse = await prisma.location.upsert({
    where: { code: "KTA-WH-CASA-001" },
    update: {},
    create: {
      code: "KTA-WH-CASA-001",
      name: "Entrepôt Central Casablanca",
      type: "WAREHOUSE",
      latitude: 33.5731,
      longitude: -7.5898,
      city: "Casablanca",
      region: "Casablanca-Settat",
      storageAreaM2: 12000,
      storageVolumeM3: 48000,
      deliveryWindowStart: "06:00",
      deliveryWindowEnd: "20:00",
      operatingDays: "MON-SAT",
    },
  });

  const rabatHub = await prisma.location.upsert({
    where: { code: "KTA-HUB3PL-RABAT-001" },
    update: {},
    create: {
      code: "KTA-HUB3PL-RABAT-001",
      name: "Hub 3PL Rabat - GéodisMaroc",
      type: "HUB_3PL",
      latitude: 34.0209,
      longitude: -6.8416,
      city: "Rabat",
      region: "Rabat-Salé-Kénitra",
      storageAreaM2: 5000,
      storageVolumeM3: 18000,
      operatorName: "GéodisMaroc",
      deliveryWindowStart: "07:00",
      deliveryWindowEnd: "19:00",
    },
  });

  const storeMarrakech = await prisma.location.upsert({
    where: { code: "KTA-STO-MARRAKECH-012" },
    update: {},
    create: {
      code: "KTA-STO-MARRAKECH-012",
      name: "KITEA Marrakech Menara",
      type: "STORE",
      latitude: 31.6295,
      longitude: -7.9811,
      city: "Marrakech",
      region: "Marrakech-Safi",
      storageAreaM2: 300,
      storageVolumeM3: 900,
      truckAccessRestriction: "Max 8T, pas de semi-remorque",
      deliveryWindowStart: "08:00",
      deliveryWindowEnd: "12:00",
    },
  });

  const vehicleTypes = [
    { code: "VAN_LIGHT", name: "Utilitaire léger", maxVolumeM3: 8, maxWeightKg: 1200 },
    { code: "TRUCK_MEDIUM", name: "Camion Moyen", maxVolumeM3: 20, maxWeightKg: 7000 },
    { code: "PORTEUR_14T", name: "Porteur 14T", maxVolumeM3: 45, maxWeightKg: 14000 },
    { code: "SEMI_TRAILER", name: "Semi-remorque", maxVolumeM3: 80, maxWeightKg: 24000 },
  ];

  for (const vt of vehicleTypes) {
    await prisma.vehicleType.upsert({ where: { code: vt.code }, update: {}, create: vt });
  }

  const internalCarrier = await prisma.carrier.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "KITEA Logistics (interne)",
      isInternal: true,
    },
  });

  await prisma.pricingRule.upsert({
    where: { id: "00000000-0000-0000-0000-0000000000a1" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-0000000000a1",
      label: "Tarif interne au km",
      ruleType: "TRANSPORT_PER_KM",
      source: "INTERNAL",
      carrierId: internalCarrier.id,
      unitPrice: 3.5,
      currency: "MAD",
      validFrom: new Date("2026-01-01"),
    },
  });

  console.log("Seed terminé:", { casaWarehouse: casaWarehouse.code, rabatHub: rabatHub.code, storeMarrakech: storeMarrakech.code });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
