import { Location } from "../../types";
import { LOCATION_TYPE_LABELS } from "./locationIcons";

interface Props {
  location: Location;
}

// Fiche détaillée d'un site : capacités, horaires, restrictions d'accès.
export function LocationDetailCard({ location }: Props) {
  return (
    <div className="text-sm space-y-1 min-w-[220px]">
      <p className="font-semibold text-slate-900">{location.name}</p>
      <p className="text-xs text-slate-500">
        {LOCATION_TYPE_LABELS[location.type]} · {location.code}
      </p>
      <p className="text-xs text-slate-500">{location.city}{location.region ? `, ${location.region}` : ""}</p>

      <div className="pt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {location.storageAreaM2 != null && (
          <div>
            <span className="text-slate-400">Surface</span>
            <p className="font-medium">{location.storageAreaM2.toLocaleString()} m²</p>
          </div>
        )}
        {location.storageVolumeM3 != null && (
          <div>
            <span className="text-slate-400">Volume</span>
            <p className="font-medium">{location.storageVolumeM3.toLocaleString()} m³</p>
          </div>
        )}
        {(location.deliveryWindowStart || location.deliveryWindowEnd) && (
          <div>
            <span className="text-slate-400">Livraison</span>
            <p className="font-medium">
              {location.deliveryWindowStart} - {location.deliveryWindowEnd}
            </p>
          </div>
        )}
        {location.bufferStockUnits != null && (
          <div>
            <span className="text-slate-400">Stock tampon</span>
            <p className="font-medium">{location.bufferStockUnits} unités</p>
          </div>
        )}
      </div>

      {location.truckAccessRestriction && (
        <p className="pt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          ⚠ {location.truckAccessRestriction}
        </p>
      )}

      {location.operatorName && (
        <p className="text-xs text-slate-500 pt-1">Opéré par {location.operatorName}</p>
      )}
    </div>
  );
}
