import { KiteaNetworkMap } from "../components/Map/KiteaNetworkMap";

export function MapPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Cartographie du réseau KITEA</h1>
      <KiteaNetworkMap />
    </div>
  );
}
