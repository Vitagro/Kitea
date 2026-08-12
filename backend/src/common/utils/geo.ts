const EARTH_RADIUS_KM = 6371;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Distance orthodromique entre deux points GPS (formule de Haversine).
// Sert de fallback rapide tant qu'aucune API de routing externe n'est branchée.
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

// Estimation du temps de trajet routier à partir de la distance à vol d'oiseau.
// Applique un facteur de sinuosité route (routes non rectilignes) et une vitesse
// moyenne urbaine/interurbaine paramétrable.
export function estimateDrivingDurationMin(
  distanceKm: number,
  averageSpeedKmH = 55,
  roadWindingFactor = 1.3
): number {
  const roadDistanceKm = distanceKm * roadWindingFactor;
  return Math.round((roadDistanceKm / averageSpeedKmH) * 60);
}
