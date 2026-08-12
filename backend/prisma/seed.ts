import { LocationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Réseau KITEA — données compilées à partir de sources publiques (site
// officiel kitea.com/maplist, presse logistique : Stratégies Logistique,
// L'Economiste, BK Systèmes...).
//
// ⚠️ Limites connues :
//  - kitea.com était inaccessible depuis cet environnement (proxy réseau) au
//    moment de la collecte : cette liste est un échantillon représentatif
//    (~18 magasins identifiés sur les ~24 annoncés), pas la liste exhaustive
//    et à jour en temps réel.
//  - Les coordonnées sont approximées au niveau de la ville (pas de service
//    de géocodage disponible ici). Un léger décalage déterministe est
//    appliqué aux sites partageant une même ville pour éviter la
//    superposition des marqueurs sur la carte — À REMPLACER par un
//    géocodage précis (Google/Mapbox Geocoding API) avant mise en
//    production.
// ---------------------------------------------------------------------------

interface SeedLocation {
  code: string;
  name: string;
  type: LocationType;
  city: string;
  region: string;
  address?: string;
  operatorName?: string;
  storageAreaM2?: number;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  Casablanca: [33.5731, -7.5898],
  Rabat: [34.0209, -6.8416],
  Marrakech: [31.6295, -7.9811],
  Agadir: [30.4278, -9.5981],
  Fès: [34.0331, -5.0003],
  Tanger: [35.7595, -5.834],
  Oujda: [34.6814, -1.9086],
  Laâyoune: [27.1418, -13.1878],
  Mohammedia: [33.6863, -7.383],
  Kénitra: [34.261, -6.5802],
  "El Jadida": [33.2316, -8.5007],
  Khouribga: [32.8811, -6.9063],
  Berrechid: [33.2655, -7.5871],
  "Béni Mellal": [32.3373, -6.3498],
  Safi: [32.2994, -9.2372],
};

// Décalage artificiel (~1-3km) pour désempiler les sites d'une même ville sur
// la carte. Purement visuel — ne reflète pas la position réelle du site.
function jitteredCoordinates(city: string, index: number): { latitude: number; longitude: number } {
  const base = CITY_COORDINATES[city];
  if (!base) throw new Error(`Coordonnées inconnues pour la ville: ${city}`);
  const angle = (index * 47 * Math.PI) / 180; // pas d'angle arbitraire pour répartir les points
  const radiusDeg = index === 0 ? 0 : 0.015;
  return {
    latitude: Number((base[0] + radiusDeg * Math.cos(angle)).toFixed(6)),
    longitude: Number((base[1] + radiusDeg * Math.sin(angle)).toFixed(6)),
  };
}

const LOCATIONS: SeedLocation[] = [
  // --- Hubs logistiques internes (KSH - Kitea Smart Hub) ---------------------
  {
    code: "KTA-WH-CASA-KSH",
    name: "KSH Casablanca (Kitea Smart Hub)",
    type: "WAREHOUSE",
    city: "Casablanca",
    region: "Casablanca-Settat",
    address: "Zone industrielle Ouled Rahou, lot. Médersa n°1, Aïn Chock, 20470",
    operatorName: "KSH Logistics (Kitea Group)",
    storageAreaM2: 45000, // 70 000 emplacements palettes, ~400 collaborateurs, 4000 cmd/j (source presse)
  },
  {
    code: "KTA-WH-RABAT-KSH",
    name: "KSH Rabat (Kitea Smart Hub)",
    type: "WAREHOUSE",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    operatorName: "KSH Logistics (Kitea Group)",
    // Plateforme inaugurée en 2025 - surface non confirmée par une source distincte.
  },

  // --- Magasins ----------------------------------------------------------
  {
    code: "KTA-STO-CASA-BEAUSEJOUR",
    name: "Kitea Classique Beauséjour",
    type: "STORE",
    city: "Casablanca",
    region: "Casablanca-Settat",
    address: "301 Bd Brahim Roudani, 20000",
  },
  {
    code: "KTA-STO-CASA-ELJADIDARD",
    name: "KITEA Route d'El Jadida",
    type: "STORE",
    city: "Casablanca",
    region: "Casablanca-Settat",
    address: "Route d'El Jadida, 20000",
  },
  {
    code: "KTA-STO-CASA-CITY",
    name: "Kitea City Casa",
    type: "STORE",
    city: "Casablanca",
    region: "Casablanca-Settat",
  },
  {
    code: "KTA-STO-RABAT-CITY",
    name: "Kitea City Rabat",
    type: "STORE",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
  },
  {
    code: "KTA-STO-RABAT-GEANT",
    name: "Kitea Géant Rabat",
    type: "STORE",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    address: "Centre Commercial Marjane, Hay Riad",
  },
  {
    code: "KTA-STO-MARRAKECH",
    name: "Kitea Classique Marrakech",
    type: "STORE",
    city: "Marrakech",
    region: "Marrakech-Safi",
    address: "183, avenue Mohammed V, Guéliz, 40000",
  },
  {
    code: "KTA-STO-MOHAMMEDIA",
    name: "Kitea Classique Mohammedia",
    type: "STORE",
    city: "Mohammedia",
    region: "Casablanca-Settat",
    address: "Centre commercial Marjane, 28830",
  },
  {
    code: "KTA-STO-KENITRA",
    name: "Kitea Classique Kénitra",
    type: "STORE",
    city: "Kénitra",
    region: "Rabat-Salé-Kénitra",
    address: "Centre commercial Acima, 14060",
  },
  {
    code: "KTA-STO-AGADIR",
    name: "Kitea Géant Agadir",
    type: "STORE",
    city: "Agadir",
    region: "Souss-Massa",
    address: "80000",
  },
  {
    code: "KTA-STO-FES",
    name: "Kitea Géant Fès",
    type: "STORE",
    city: "Fès",
    region: "Fès-Meknès",
    address: "Route de Sefrou, 30100",
  },
  {
    code: "KTA-STO-TANGER",
    name: "Kitea Géant Tanger",
    type: "STORE",
    city: "Tanger",
    region: "Tanger-Tétouan-Al Hoceïma",
    address: "Commune Boukhalef, route de Rabat, 90060",
  },
  {
    code: "KTA-STO-OUJDA",
    name: "Kitea Géant Oujda",
    type: "STORE",
    city: "Oujda",
    region: "L'Oriental",
    address: "Parc d'activité commerciale Marjane, 60000",
  },
  {
    code: "KTA-STO-LAAYOUNE",
    name: "Kitea Géant Laâyoune",
    type: "STORE",
    city: "Laâyoune",
    region: "Laâyoune-Sakia El Hamra",
    address: "70000",
  },
  {
    code: "KTA-STO-ELJADIDA",
    name: "KITEA El Jadida",
    type: "STORE",
    city: "El Jadida",
    region: "Casablanca-Settat",
    address: "Centre Commercial Marhaba, Avenue Mohammed VI",
  },
  {
    code: "KTA-STO-KHOURIBGA",
    name: "KITEA Khouribga",
    type: "STORE",
    city: "Khouribga",
    region: "Béni Mellal-Khénifra",
    address: "Centre Commercial Acima, Bd Zellaqua",
  },
  {
    code: "KTA-STO-BERRECHID",
    name: "KITEA Berrechid",
    type: "STORE",
    city: "Berrechid",
    region: "Casablanca-Settat",
    address: "Centre Commercial Acima, Bd Mohamed V",
  },
  {
    code: "KTA-STO-BENIMELLAL",
    name: "KITEA Béni Mellal",
    type: "STORE",
    city: "Béni Mellal",
    region: "Béni Mellal-Khénifra",
    address: "Centre commercial Acima",
  },
  {
    code: "KTA-STO-SAFI",
    name: "KITEA Safi",
    type: "STORE",
    city: "Safi",
    region: "Marrakech-Safi",
  },
];

async function seedLocations() {
  const cityIndexCounters = new Map<string, number>();
  let count = 0;

  for (const location of LOCATIONS) {
    const index = cityIndexCounters.get(location.city) ?? 0;
    cityIndexCounters.set(location.city, index + 1);

    const { latitude, longitude } = jitteredCoordinates(location.city, index);

    await prisma.location.upsert({
      where: { code: location.code },
      update: {},
      create: {
        code: location.code,
        name: location.name,
        type: location.type,
        latitude,
        longitude,
        city: location.city,
        region: location.region,
        address: location.address,
        operatorName: location.operatorName,
        storageAreaM2: location.storageAreaM2,
        deliveryWindowStart: location.type === "STORE" ? "09:00" : "06:00",
        deliveryWindowEnd: location.type === "STORE" ? "21:00" : "20:00",
        operatingDays: "MON-SAT",
      },
    });
    count += 1;
  }

  return count;
}

async function main() {
  const locationsCount = await seedLocations();

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

  console.log("Seed terminé:", {
    locations: locationsCount,
    vehicleTypes: vehicleTypes.length,
    carrier: internalCarrier.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
