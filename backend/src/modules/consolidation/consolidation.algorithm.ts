// Algorithme de consolidation des commandes (Order Consolidation & Batching)
// et de sélection du véhicule le plus adapté au profil volumétrique/poids.
//
// Étapes :
//  1. Grouper les commandes compatibles (même trajet origine->zone destination,
//     fenêtres de livraison qui se chevauchent, compatibilité de charge).
//  2. Répartir chaque groupe en un ou plusieurs "shipments" via un bin packing
//     glouton (First-Fit Decreasing) respectant les capacités volume/poids
//     de la flotte disponible.
//  3. Recommander, pour chaque shipment, le plus petit type de véhicule
//     capable de transporter la charge (optimisation du taux de remplissage).

export interface ConsolidatableOrder {
  id: string;
  originLocationId: string;
  destinationLocationId: string;
  destinationZone: string; // ex: ville ou code zone de chalandise
  volumeM3: number;
  weightKg: number;
  isFragile: boolean;
  isStackable: boolean;
  deliveryWindowStart: Date;
  deliveryWindowEnd: Date;
}

export interface VehicleCapacity {
  id: string;
  code: string;
  name: string;
  maxVolumeM3: number;
  maxWeightKg: number;
}

export interface ConsolidatedShipment {
  orders: ConsolidatableOrder[];
  vehicleType: VehicleCapacity | null;
  totalVolumeM3: number;
  totalWeightKg: number;
  fillRatePercent: number; // taux de remplissage basé sur le volume
  originLocationId: string;
  destinationLocationId: string;
}

// Deux fenêtres de livraison sont compatibles si elles se chevauchent.
function windowsOverlap(a: ConsolidatableOrder, b: ConsolidatableOrder): boolean {
  return a.deliveryWindowStart <= b.deliveryWindowEnd && b.deliveryWindowStart <= a.deliveryWindowEnd;
}

// Deux commandes sont "chargeables ensemble" si elles partagent le même trajet
// (origine + zone destination) et si un article fragile n'est pas combiné à
// un article non-empilable qui pourrait l'écraser.
function isLoadCompatible(a: ConsolidatableOrder, b: ConsolidatableOrder): boolean {
  if (a.originLocationId !== b.originLocationId) return false;
  if (a.destinationZone !== b.destinationZone) return false;
  if (!windowsOverlap(a, b)) return false;
  if ((a.isFragile && !b.isStackable) || (b.isFragile && !a.isStackable)) return false;
  return true;
}

// Regroupe les commandes en clusters compatibles (trajet + fenêtre + charge).
// Complexité O(n²) : suffisant pour des lots de consolidation journaliers/zone
// (quelques centaines de commandes) ; à remplacer par un clustering spatial
// (PostGIS ST_ClusterDBSCAN) si le volume augmente significativement.
export function clusterOrders(orders: ConsolidatableOrder[]): ConsolidatableOrder[][] {
  const clusters: ConsolidatableOrder[][] = [];
  const assigned = new Set<string>();

  for (const order of orders) {
    if (assigned.has(order.id)) continue;

    const cluster = [order];
    assigned.add(order.id);

    for (const candidate of orders) {
      if (assigned.has(candidate.id)) continue;
      const compatibleWithAll = cluster.every((member) => isLoadCompatible(member, candidate));
      if (compatibleWithAll) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// Sélectionne le plus petit véhicule (par volume croissant) capable de porter
// le volume ET le poids donnés. Retourne null si aucun véhicule de la flotte
// n'est suffisant (le cluster doit alors être scindé).
export function selectSmallestFittingVehicle(
  totalVolumeM3: number,
  totalWeightKg: number,
  fleet: VehicleCapacity[]
): VehicleCapacity | null {
  const sortedFleet = [...fleet].sort((a, b) => a.maxVolumeM3 - b.maxVolumeM3);
  return (
    sortedFleet.find(
      (vehicle) => totalVolumeM3 <= vehicle.maxVolumeM3 && totalWeightKg <= vehicle.maxWeightKg
    ) ?? null
  );
}

// Découpe un cluster en un ou plusieurs shipments via First-Fit Decreasing :
// les commandes sont triées par volume décroissant puis placées dans le
// premier véhicule (du plus grand type disponible) où elles rentrent encore ;
// un nouveau véhicule est ouvert dès que nécessaire.
export function binPackCluster(
  cluster: ConsolidatableOrder[],
  fleet: VehicleCapacity[]
): ConsolidatedShipment[] {
  if (cluster.length === 0) return [];
  if (fleet.length === 0) {
    throw new Error("Aucun type de véhicule disponible pour la consolidation");
  }

  const largestVehicle = [...fleet].sort((a, b) => b.maxVolumeM3 - a.maxVolumeM3)[0];
  const sortedOrders = [...cluster].sort((a, b) => b.volumeM3 - a.volumeM3);

  const bins: { orders: ConsolidatableOrder[]; volume: number; weight: number }[] = [];

  for (const order of sortedOrders) {
    let placed = false;
    for (const bin of bins) {
      const nextVolume = bin.volume + order.volumeM3;
      const nextWeight = bin.weight + order.weightKg;
      if (nextVolume <= largestVehicle.maxVolumeM3 && nextWeight <= largestVehicle.maxWeightKg) {
        bin.orders.push(order);
        bin.volume = nextVolume;
        bin.weight = nextWeight;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push({ orders: [order], volume: order.volumeM3, weight: order.weightKg });
    }
  }

  return bins.map((bin) => {
    const vehicleType = selectSmallestFittingVehicle(bin.volume, bin.weight, fleet);
    const capacityRef = vehicleType ?? largestVehicle;
    return {
      orders: bin.orders,
      vehicleType,
      totalVolumeM3: round2(bin.volume),
      totalWeightKg: round2(bin.weight),
      fillRatePercent: round2((bin.volume / capacityRef.maxVolumeM3) * 100),
      originLocationId: bin.orders[0].originLocationId,
      destinationLocationId: bin.orders[0].destinationLocationId,
    };
  });
}

// Point d'entrée : consolide un ensemble de commandes en shipments optimisés.
export function consolidateOrders(
  orders: ConsolidatableOrder[],
  fleet: VehicleCapacity[]
): ConsolidatedShipment[] {
  const clusters = clusterOrders(orders);
  return clusters.flatMap((cluster) => binPackCluster(cluster, fleet));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
