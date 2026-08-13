import { env } from "../../config/env";
import { AppError } from "../../common/errors/AppError";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results: {
    formatted_address: string;
    place_id: string;
    geometry: { location: { lat: number; lng: number } };
  }[];
}

// Résout une adresse texte en coordonnées précises via l'API Google
// Geocoding. Nécessite GOOGLE_MAPS_API_KEY (voir README §7) — sans clé
// configurée, renvoie une erreur explicite plutôt que d'échouer en silence.
//
// Note : cet appel réseau vers maps.googleapis.com ne peut pas être testé
// depuis le sandbox de développement (egress bloqué vers google.com), mais
// fonctionnera normalement une fois déployé (Render/Vercel n'ont pas cette
// restriction).
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  if (!env.googleMapsApiKey) {
    throw AppError.badRequest(
      "GOOGLE_MAPS_API_KEY non configurée côté serveur — voir README §7 pour l'activer."
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", env.googleMapsApiKey);
  url.searchParams.set("region", "ma");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw AppError.badRequest(`Échec de l'appel à l'API Google Geocoding (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;

  if (payload.status !== "OK" || payload.results.length === 0) {
    throw AppError.badRequest(
      `Aucun résultat de géocodage pour "${query}" (statut Google: ${payload.status}${
        payload.error_message ? ` — ${payload.error_message}` : ""
      })`
    );
  }

  const best = payload.results[0];
  return {
    latitude: best.geometry.location.lat,
    longitude: best.geometry.location.lng,
    formattedAddress: best.formatted_address,
    placeId: best.place_id,
  };
}
