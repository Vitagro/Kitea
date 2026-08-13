// Construit un lien de recherche Google Maps standard (aucune clé API
// requise) qui ouvre la fiche du lieu correspondant lorsqu'il est cliqué.
// Ne garantit pas de pointer sur des coordonnées exactes tant que le site
// n'a pas été géocodé (voir geocoding.service.ts).
export function buildGoogleMapsSearchUrl(parts: {
  name: string;
  address?: string | null;
  city: string;
  country?: string | null;
}): string {
  const query = [parts.name, parts.address, parts.city, parts.country ?? "Maroc"]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Fiche Google Maps stable à partir d'un Place ID résolu par géocodage —
// plus fiable qu'une recherche texte car insensible aux homonymes/renommages.
export function buildGoogleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}
