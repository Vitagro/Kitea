import L from "leaflet";
import { LocationType } from "../../types";

const COLORS: Record<LocationType, string> = {
  STORE: "#1D4ED8",
  WAREHOUSE: "#0B1F3A",
  HUB_3PL: "#F59E0B",
  CROSS_DOCK: "#059669",
};

export function buildLocationIcon(type: LocationType): L.DivIcon {
  const color = COLORS[type];
  return L.divIcon({
    className: "kitea-location-marker",
    html: `<span style="
      display:block;
      width:16px;height:16px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 0 1px rgba(0,0,0,0.25);
    "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  STORE: "Magasin",
  WAREHOUSE: "Entrepôt central",
  HUB_3PL: "Hub 3PL",
  CROSS_DOCK: "Cross-dock",
};
