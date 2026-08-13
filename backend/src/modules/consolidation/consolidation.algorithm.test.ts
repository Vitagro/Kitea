import {
  ConsolidatableOrder,
  VehicleCapacity,
  clusterOrders,
  consolidateOrders,
  selectSmallestFittingVehicle,
} from "./consolidation.algorithm";

const FLEET: VehicleCapacity[] = [
  { id: "van", code: "VAN_LIGHT", name: "Utilitaire léger", maxVolumeM3: 8, maxWeightKg: 1200 },
  { id: "truck", code: "TRUCK_MEDIUM", name: "Camion Moyen", maxVolumeM3: 20, maxWeightKg: 7000 },
  { id: "porteur", code: "PORTEUR_14T", name: "Porteur 14T", maxVolumeM3: 45, maxWeightKg: 14000 },
];

function makeOrder(overrides: Partial<ConsolidatableOrder> & { id: string }): ConsolidatableOrder {
  return {
    originLocationId: "WH1",
    destinationLocationId: "STORE1",
    destinationZone: "Casablanca",
    volumeM3: 1,
    weightKg: 100,
    isFragile: false,
    isStackable: true,
    deliveryWindowStart: new Date("2026-01-01T08:00:00Z"),
    deliveryWindowEnd: new Date("2026-01-01T18:00:00Z"),
    ...overrides,
  };
}

describe("clusterOrders", () => {
  it("groups orders sharing origin, destination zone and overlapping windows", () => {
    const a = makeOrder({ id: "a" });
    const b = makeOrder({ id: "b" });
    const clusters = clusterOrders([a, b]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].map((o) => o.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps orders with different destination zones in separate clusters", () => {
    const a = makeOrder({ id: "a", destinationZone: "Casablanca" });
    const b = makeOrder({ id: "b", destinationZone: "Rabat" });
    const clusters = clusterOrders([a, b]);
    expect(clusters).toHaveLength(2);
  });

  it("keeps orders with non-overlapping delivery windows in separate clusters", () => {
    const a = makeOrder({
      id: "a",
      deliveryWindowStart: new Date("2026-01-01T08:00:00Z"),
      deliveryWindowEnd: new Date("2026-01-01T10:00:00Z"),
    });
    const b = makeOrder({
      id: "b",
      deliveryWindowStart: new Date("2026-01-01T14:00:00Z"),
      deliveryWindowEnd: new Date("2026-01-01T18:00:00Z"),
    });
    const clusters = clusterOrders([a, b]);
    expect(clusters).toHaveLength(2);
  });

  it("does not combine a fragile order with a non-stackable order", () => {
    const fragile = makeOrder({ id: "fragile", isFragile: true });
    const nonStackable = makeOrder({ id: "heavy", isStackable: false });
    const clusters = clusterOrders([fragile, nonStackable]);
    expect(clusters).toHaveLength(2);
  });
});

describe("selectSmallestFittingVehicle", () => {
  it("picks the smallest vehicle that fits both volume and weight", () => {
    const vehicle = selectSmallestFittingVehicle(10, 2000, FLEET);
    expect(vehicle?.code).toBe("TRUCK_MEDIUM");
  });

  it("returns null when no vehicle in the fleet is large enough", () => {
    const vehicle = selectSmallestFittingVehicle(1000, 100, FLEET);
    expect(vehicle).toBeNull();
  });

  it("is bound by weight even when volume would fit a smaller vehicle", () => {
    // 5 m3 fits the van (8 m3) but 5000 kg exceeds its 1200 kg limit.
    const vehicle = selectSmallestFittingVehicle(5, 5000, FLEET);
    expect(vehicle?.code).toBe("TRUCK_MEDIUM");
  });
});

describe("consolidateOrders (bin packing + vehicle selection)", () => {
  it("fits compatible orders into a single shipment when capacity allows", () => {
    const orders = [
      makeOrder({ id: "a", volumeM3: 5, weightKg: 800 }),
      makeOrder({ id: "b", volumeM3: 3, weightKg: 400 }),
    ];
    const shipments = consolidateOrders(orders, FLEET);
    expect(shipments).toHaveLength(1);
    expect(shipments[0].orders).toHaveLength(2);
    expect(shipments[0].totalVolumeM3).toBe(8);
    expect(shipments[0].vehicleType?.code).toBe("VAN_LIGHT");
    expect(shipments[0].fillRatePercent).toBe(100);
  });

  it("splits into multiple shipments when total volume exceeds the largest vehicle", () => {
    const orders = [
      makeOrder({ id: "a", volumeM3: 30, weightKg: 5000 }),
      makeOrder({ id: "b", volumeM3: 30, weightKg: 5000 }),
    ];
    const shipments = consolidateOrders(orders, FLEET);
    // 60 m3 total > 45 m3 (largest vehicle) -> must split into 2 shipments.
    expect(shipments).toHaveLength(2);
    for (const shipment of shipments) {
      expect(shipment.totalVolumeM3).toBeLessThanOrEqual(45);
      expect(shipment.vehicleType?.code).toBe("PORTEUR_14T");
    }
  });

  it("returns vehicleType null when even the largest vehicle cannot carry a single order", () => {
    const orders = [makeOrder({ id: "a", volumeM3: 100, weightKg: 100 })];
    const shipments = consolidateOrders(orders, FLEET);
    expect(shipments).toHaveLength(1);
    expect(shipments[0].vehicleType).toBeNull();
  });

  it("keeps orders for different routes in separate shipments", () => {
    const orders = [
      makeOrder({ id: "a", destinationLocationId: "STORE1", destinationZone: "Casablanca" }),
      makeOrder({ id: "b", destinationLocationId: "STORE2", destinationZone: "Rabat" }),
    ];
    const shipments = consolidateOrders(orders, FLEET);
    expect(shipments).toHaveLength(2);
  });

  it("returns no shipments for an empty order list", () => {
    expect(consolidateOrders([], FLEET)).toEqual([]);
  });
});
