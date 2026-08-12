import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Location, LocationType } from "../../types";
import { locationsService } from "../../services/locationsService";
import { buildLocationIcon, LOCATION_TYPE_LABELS } from "./locationIcons";
import { LocationDetailCard } from "./LocationDetailCard";

const DEFAULT_CENTER: [number, number] = [32.5, -7.5]; // centrage Maroc
const DEFAULT_ZOOM = 6;

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const ALL_TYPES: LocationType[] = ["STORE", "WAREHOUSE", "HUB_3PL", "CROSS_DOCK"];

// Carte interactive du réseau KITEA : mapping dynamique des magasins,
// entrepôts centraux et hubs prestataires 3PL, avec fiche détaillée par site.
export function KiteaNetworkMap() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTypes, setActiveTypes] = useState<Set<LocationType>>(new Set(ALL_TYPES));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    locationsService
      .list()
      .then(setLocations)
      .catch(() => setError("Impossible de charger le réseau KITEA depuis l'API."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredLocations = useMemo(
    () => locations.filter((loc) => activeTypes.has(loc.type)),
    [locations, activeTypes]
  );

  function toggleType(type: LocationType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="relative h-[calc(100vh-2rem)] w-full rounded-xl overflow-hidden border border-slate-200">
      <div className="absolute z-[1000] top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">Type de site</p>
        {ALL_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={activeTypes.has(type)}
              onChange={() => toggleType(type)}
              className="accent-kitea-blue"
            />
            {LOCATION_TYPE_LABELS[type]}
          </label>
        ))}
      </div>

      {error && (
        <div className="absolute z-[1000] top-4 right-4 bg-red-50 text-red-700 text-sm rounded-lg shadow px-3 py-2">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="absolute z-[1000] top-4 right-4 bg-white/95 text-sm rounded-lg shadow px-3 py-2">
          Chargement du réseau...
        </div>
      )}

      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={TILE_URL}
        />
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={buildLocationIcon(location.type)}
          >
            <Popup>
              <LocationDetailCard location={location} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
