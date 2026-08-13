import { ExternalLink, Phone, Clock, Globe } from "lucide-react";
import { Location } from "../../types";
import { LOCATION_TYPE_LABELS } from "./locationIcons";

interface Props {
  location: Location;
}

export function LocationDetailCard({ location }: Props) {
  return (
    <div className="text-sm space-y-1 min-w-[240px]">
      <p className="font-semibold text-slate-900">{location.name}</p>
      <p className="text-xs text-slate-500">
        {LOCATION_TYPE_LABELS[location.type]} · {location.code}
      </p>
      {location.address && <p className="text-xs text-slate-500">{location.address}</p>}
      <p className="text-xs text-slate-500">{location.city}{location.region ? `, ${location.region}` : ""}</p>

      <div className="pt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {location.capacityPallets != null && (
          <div>
            <span className="text-slate-400">Capacité</span>
            <p className="font-medium">{location.capacityPallets.toLocaleString()} palettes</p>
          </div>
        )}
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
      </div>

      {(location.phone || location.openingHoursText || location.website) && (
        <div className="pt-2 space-y-1 text-xs text-slate-600">
          {location.phone && (
            <p className="flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" /> {location.phone}
            </p>
          )}
          {location.openingHoursText && (
            <p className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400" /> {location.openingHoursText}
            </p>
          )}
          {location.website && (
            <p className="flex items-center gap-1.5">
              <Globe size={12} className="text-slate-400" />
              <a href={location.website} target="_blank" rel="noreferrer" className="text-kitea-blue hover:underline">
                {location.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </div>
      )}

      {location.truckAccessRestriction && (
        <p className="pt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          ⚠ {location.truckAccessRestriction}
        </p>
      )}

      {location.operatorName && (
        <p className="text-xs text-slate-500 pt-1">Opéré par {location.operatorName}</p>
      )}

      {location.googleMapsUrl && (
        <a
          href={location.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5"
        >
          <ExternalLink size={12} /> Voir sur Google Maps
        </a>
      )}
    </div>
  );
}
