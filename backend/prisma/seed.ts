import bcrypt from "bcryptjs";
import { LocationType, PrismaClient } from "@prisma/client";
import { buildGoogleMapsSearchUrl } from "../src/common/utils/googleMaps";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Réseau KITEA — données compilées à partir de sources publiques (site
// officiel kitea.com, pages jaunes/annuaires marocains — Telecontact,
// annuaire-horaire.com, Tiendeo, VisitRabat —, presse logistique :
// Stratégies Logistique, L'Economiste, BK Systèmes).
//
// ⚠️ Limites connues :
//  - kitea.com et maps.google.com étaient inaccessibles depuis cet
//    environnement (proxy réseau sandbox) au moment de la collecte : cette
//    liste est un échantillon représentatif (~18 magasins sur ~23-24
//    annoncés), pas la liste exhaustive vérifiée en direct sur Google Maps.
//  - Le téléphone (+212 802 00 80 02) est le numéro d'accueil national
//    unique KITEA (centre d'appel), pas une ligne directe par magasin.
//  - Les horaires (09:00-22:00, 7j/7) sont la politique publiée pour la
//    majorité des magasins Géant ; à vérifier au cas par cas.
//  - Les coordonnées restent approximées au niveau de la ville (aucun accès
//    à un service de géocodage depuis ce sandbox). Un `plusCode` Google est
//    renseigné pour les 2 sites où il a pu être trouvé (Agadir, Laâyoune) à
//    titre de référence — non décodé en coordonnées ici par prudence.
//  - Utilisez POST /api/locations/:id/geocode (nécessite GOOGLE_MAPS_API_KEY,
//    voir README §7) une fois déployé pour résoudre les coordonnées exactes.
// ---------------------------------------------------------------------------

const KITEA_HOTLINE = "+212 802 00 80 02";
const KITEA_WEBSITE = "https://www.kitea.com";
const STANDARD_STORE_HOURS = "Lun-Dim 09:00-22:00";

interface SeedLocation {
  code: string;
  name: string;
  type: LocationType;
  city: string;
  region: string;
  address?: string;
  operatorName?: string;
  storageAreaM2?: number;
  phone?: string;
  openingHoursText?: string;
  plusCode?: string;
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
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-CASA-ELJADIDARD",
    name: "KITEA Route d'El Jadida",
    type: "STORE",
    city: "Casablanca",
    region: "Casablanca-Settat",
    address: "301, route d'El Jadida, Hay Batha, 20000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-CASA-CITY",
    name: "Kitea City Casa",
    type: "STORE",
    city: "Casablanca",
    region: "Casablanca-Settat",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-RABAT-CITY",
    name: "Kitea City Rabat",
    type: "STORE",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    address: "Arribat Center",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-RABAT-GEANT",
    name: "Kitea Géant Rabat",
    type: "STORE",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    address: "Route Bir Kacem, Hay Nahda, 10000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-MARRAKECH",
    name: "Kitea Classique Marrakech",
    type: "STORE",
    city: "Marrakech",
    region: "Marrakech-Safi",
    address: "183, avenue Mohammed V, Guéliz, 40000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-MOHAMMEDIA",
    name: "Kitea Classique Mohammedia",
    type: "STORE",
    city: "Mohammedia",
    region: "Casablanca-Settat",
    address: "Centre commercial Marjane, 28830",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-KENITRA",
    name: "Kitea Classique Kénitra",
    type: "STORE",
    city: "Kénitra",
    region: "Rabat-Salé-Kénitra",
    address: "Centre commercial Acima, 14060",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-AGADIR",
    name: "Kitea Géant Agadir",
    type: "STORE",
    city: "Agadir",
    region: "Souss-Massa",
    address: "80000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
    plusCode: "CF75+978",
  },
  {
    code: "KTA-STO-FES",
    name: "Kitea Géant Fès",
    type: "STORE",
    city: "Fès",
    region: "Fès-Meknès",
    address: "Route de Sefrou, 30100",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-TANGER",
    name: "Kitea Géant Tanger",
    type: "STORE",
    city: "Tanger",
    region: "Tanger-Tétouan-Al Hoceïma",
    address: "Commune Boukhalef, route de Rabat, 90060",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-OUJDA",
    name: "Kitea Géant Oujda",
    type: "STORE",
    city: "Oujda",
    region: "L'Oriental",
    address: "Parc d'activité commerciale Marjane, 60000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-LAAYOUNE",
    name: "Kitea Géant Laâyoune",
    type: "STORE",
    city: "Laâyoune",
    region: "Laâyoune-Sakia El Hamra",
    address: "70000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
    plusCode: "4RQ9+XM",
  },
  {
    code: "KTA-STO-ELJADIDA",
    name: "KITEA El Jadida",
    type: "STORE",
    city: "El Jadida",
    region: "Casablanca-Settat",
    address: "Centre Commercial Marhaba, Avenue Mohammed VI, 24000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-KHOURIBGA",
    name: "KITEA Khouribga",
    type: "STORE",
    city: "Khouribga",
    region: "Béni Mellal-Khénifra",
    address: "Centre Commercial Acima, Bd Zellaqua, 25000",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-BERRECHID",
    name: "KITEA Berrechid",
    type: "STORE",
    city: "Berrechid",
    region: "Casablanca-Settat",
    address: "Centre Commercial Acima, Bd Mohamed V",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-BENIMELLAL",
    name: "KITEA Béni Mellal",
    type: "STORE",
    city: "Béni Mellal",
    region: "Béni Mellal-Khénifra",
    address: "Centre commercial Acima",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
  },
  {
    code: "KTA-STO-SAFI",
    name: "KITEA Safi",
    type: "STORE",
    city: "Safi",
    region: "Marrakech-Safi",
    phone: KITEA_HOTLINE,
    openingHoursText: STANDARD_STORE_HOURS,
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
        phone: location.phone,
        website: KITEA_WEBSITE,
        openingHoursText: location.openingHoursText,
        plusCode: location.plusCode,
        googleMapsUrl: buildGoogleMapsSearchUrl({
          name: location.name,
          address: location.address,
          city: location.city,
        }),
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

  // Compte admin de bootstrap — permet la toute première connexion.
  // Personnalisable via ADMIN_EMAIL/ADMIN_PASSWORD ; à changer après coup.
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kitea.ma";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        fullName: "Administrateur KITEA",
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Compte admin créé : ${adminEmail} / ${adminPassword} (à changer après connexion)`);
  }

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
