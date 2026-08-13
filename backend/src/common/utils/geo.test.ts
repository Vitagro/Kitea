import { estimateDrivingDurationMin, haversineDistanceKm } from "./geo";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical points", () => {
    const point = { latitude: 33.5731, longitude: -7.5898 };
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 6);
  });

  it("matches the known great-circle distance between Casablanca and Rabat (~87 km)", () => {
    const casablanca = { latitude: 33.5731, longitude: -7.5898 };
    const rabat = { latitude: 34.0209, longitude: -6.8416 };
    expect(haversineDistanceKm(casablanca, rabat)).toBeGreaterThan(80);
    expect(haversineDistanceKm(casablanca, rabat)).toBeLessThan(95);
  });

  it("is symmetric (A→B equals B→A)", () => {
    const a = { latitude: 31.6295, longitude: -7.9811 };
    const b = { latitude: 30.4278, longitude: -9.5981 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 9);
  });
});

describe("estimateDrivingDurationMin", () => {
  it("applies the road winding factor and average speed to derive a duration", () => {
    // 100km * 1.3 winding / 55 km/h * 60 = 141.8... -> rounds to 142
    expect(estimateDrivingDurationMin(100)).toBe(142);
  });

  it("returns 0 for a 0km distance", () => {
    expect(estimateDrivingDurationMin(0)).toBe(0);
  });

  it("honors custom speed and winding factor overrides", () => {
    expect(estimateDrivingDurationMin(60, 60, 1)).toBe(60);
  });
});
