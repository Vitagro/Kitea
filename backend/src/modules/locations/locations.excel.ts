import { Location } from "@prisma/client";
import { ExcelColumn } from "../../common/utils/excel";

export interface LocationExportRow extends Record<string, unknown> {
  code: string;
  name: string;
  type: string;
  city: string;
  region: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  storageAreaM2: number | null;
  storageVolumeM3: number | null;
  bufferStockUnits: number | null;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  truckAccessRestriction: string;
  operatingDays: string;
  operatorName: string;
  isActive: string;
}

export const LOCATION_EXPORT_COLUMNS: ExcelColumn<LocationExportRow>[] = [
  { header: "Code", key: "code", width: 22 },
  { header: "Nom", key: "name", width: 28 },
  { header: "Type", key: "type", width: 14 },
  { header: "Ville", key: "city", width: 16 },
  { header: "Région", key: "region", width: 20 },
  { header: "Pays", key: "country", width: 8 },
  { header: "Adresse", key: "address", width: 32 },
  { header: "Latitude", key: "latitude", width: 12 },
  { header: "Longitude", key: "longitude", width: 12 },
  { header: "Surface (m2)", key: "storageAreaM2", width: 14 },
  { header: "Volume (m3)", key: "storageVolumeM3", width: 14 },
  { header: "Stock tampon (unités)", key: "bufferStockUnits", width: 18 },
  { header: "Livraison début", key: "deliveryWindowStart", width: 16 },
  { header: "Livraison fin", key: "deliveryWindowEnd", width: 16 },
  { header: "Restriction accès camion", key: "truckAccessRestriction", width: 28 },
  { header: "Jours d'exploitation", key: "operatingDays", width: 18 },
  { header: "Opérateur", key: "operatorName", width: 22 },
  { header: "Actif", key: "isActive", width: 10 },
];

export function toLocationExportRow(location: Location): LocationExportRow {
  return {
    code: location.code,
    name: location.name,
    type: location.type,
    city: location.city,
    region: location.region ?? "",
    country: location.country,
    address: location.address ?? "",
    latitude: location.latitude,
    longitude: location.longitude,
    storageAreaM2: location.storageAreaM2,
    storageVolumeM3: location.storageVolumeM3,
    bufferStockUnits: location.bufferStockUnits,
    deliveryWindowStart: location.deliveryWindowStart ?? "",
    deliveryWindowEnd: location.deliveryWindowEnd ?? "",
    truckAccessRestriction: location.truckAccessRestriction ?? "",
    operatingDays: location.operatingDays ?? "",
    operatorName: location.operatorName ?? "",
    isActive: location.isActive ? "OUI" : "NON",
  };
}

export interface LocationImportRow extends Record<string, unknown> {
  code: unknown;
  name: unknown;
  type: unknown;
  city: unknown;
  region: unknown;
  country: unknown;
  address: unknown;
  latitude: unknown;
  longitude: unknown;
  storageAreaM2: unknown;
  storageVolumeM3: unknown;
  bufferStockUnits: unknown;
  deliveryWindowStart: unknown;
  deliveryWindowEnd: unknown;
  truckAccessRestriction: unknown;
  operatingDays: unknown;
  operatorName: unknown;
}

export const LOCATION_IMPORT_COLUMNS: ExcelColumn<LocationImportRow>[] = [
  { header: "Code", key: "code", width: 22 },
  { header: "Nom", key: "name", width: 28 },
  { header: "Type (STORE/WAREHOUSE/HUB_3PL/CROSS_DOCK)", key: "type", width: 36 },
  { header: "Ville", key: "city", width: 16 },
  { header: "Région", key: "region", width: 20 },
  { header: "Pays (code ISO2, ex: MA)", key: "country", width: 20 },
  { header: "Adresse", key: "address", width: 32 },
  { header: "Latitude", key: "latitude", width: 12 },
  { header: "Longitude", key: "longitude", width: 12 },
  { header: "Surface (m2)", key: "storageAreaM2", width: 14 },
  { header: "Volume (m3)", key: "storageVolumeM3", width: 14 },
  { header: "Stock tampon (unités)", key: "bufferStockUnits", width: 18 },
  { header: "Livraison début (HH:mm)", key: "deliveryWindowStart", width: 20 },
  { header: "Livraison fin (HH:mm)", key: "deliveryWindowEnd", width: 18 },
  { header: "Restriction accès camion", key: "truckAccessRestriction", width: 28 },
  { header: "Jours d'exploitation", key: "operatingDays", width: 18 },
  { header: "Opérateur (si Hub 3PL)", key: "operatorName", width: 22 },
];
