"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Search } from "lucide-react";
import { locationsService, GooglePlacesSyncResult } from "../../services/locationsService";
import { ApiError } from "../../lib/apiClient";

interface Props {
  onImported: () => void;
}

const ACTION_STYLES: Record<GooglePlacesSyncResult["items"][number]["action"], string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  SKIP: "bg-slate-100 text-slate-500",
};

// Découverte automatique des sites KITEA déjà référencés sur Google Maps
// (Places API). Fonctionne en 2 temps, toujours en aperçu d'abord :
//  1. "Rechercher" -> dryRun=true, ne rien écrire, juste montrer les actions proposées
//  2. "Confirmer l'import" -> dryRun=false, applique réellement les changements
export function GooglePlacesSyncPanel({ onImported }: Props) {
  const [query, setQuery] = useState("KITEA magasin meuble Maroc");
  const [preview, setPreview] = useState<GooglePlacesSyncResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSearch() {
    setIsSearching(true);
    setError(null);
    setPreview(null);
    try {
      const result = await locationsService.syncGooglePlaces(query, true);
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de la recherche Google Maps.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleConfirm() {
    setIsImporting(true);
    setError(null);
    try {
      const result = await locationsService.syncGooglePlaces(query, false);
      setPreview(result);
      onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'import.");
    } finally {
      setIsImporting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <MapPin size={16} /> Synchroniser depuis Google Maps
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Synchroniser depuis Google Maps</h2>
          <p className="text-sm text-slate-500">
            Recherche tous les établissements Google correspondant à la requête, et propose de créer/mettre à
            jour les sites correspondants. Rien n&apos;est écrit avant confirmation.
          </p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
          Fermer
        </button>
      </div>

      <div className="flex gap-2">
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ex: KITEA magasin meuble Maroc" />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="flex items-center gap-2 rounded-lg bg-kitea-blue text-white text-sm px-4 py-2 disabled:opacity-50 whitespace-nowrap"
        >
          <Search size={16} /> {isSearching ? "Recherche..." : "Rechercher"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {preview && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {preview.totalFound} établissement(s) trouvé(s) — {preview.created} à créer, {preview.updated} à mettre à jour, {preview.skipped} ignoré(s).
            {preview.dryRun && " (aperçu, rien n'a encore été enregistré)"}
          </p>

          <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100">
            {preview.items.map((item) => (
              <div key={item.placeId} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.formattedAddress}</p>
                  {item.reason && <p className="text-xs text-amber-600">{item.reason}</p>}
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 shrink-0 ml-2 ${ACTION_STYLES[item.action]}`}>
                  {item.action}
                </span>
              </div>
            ))}
          </div>

          {preview.dryRun && preview.items.some((i) => i.action !== "SKIP") && (
            <button
              onClick={handleConfirm}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm px-4 py-2 disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> {isImporting ? "Import en cours..." : `Confirmer l'import (${preview.created + preview.updated})`}
            </button>
          )}
          {!preview.dryRun && (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> Import terminé.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
