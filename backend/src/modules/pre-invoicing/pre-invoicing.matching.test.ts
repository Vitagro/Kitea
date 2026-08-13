import { computeGap } from "./pre-invoicing.matching";

describe("computeGap", () => {
  it("returns PENDING_INVOICE when no carrier amount has been received yet", () => {
    const result = computeGap(100, undefined, 5);
    expect(result).toEqual({ gapAmount: 0, gapPercent: 0, matchingStatus: "PENDING_INVOICE" });
  });

  it("returns PENDING_INVOICE for a null carrier amount too", () => {
    const result = computeGap(100, null, 5);
    expect(result.matchingStatus).toBe("PENDING_INVOICE");
  });

  it("returns MATCHED when the gap is within the tolerance threshold", () => {
    const result = computeGap(100, 104, 5);
    expect(result.gapAmount).toBe(4);
    expect(result.gapPercent).toBe(4);
    expect(result.matchingStatus).toBe("MATCHED");
  });

  it("returns MATCHED exactly at the threshold boundary (inclusive)", () => {
    const result = computeGap(100, 105, 5);
    expect(result.gapPercent).toBe(5);
    expect(result.matchingStatus).toBe("MATCHED");
  });

  it("returns DISCREPANCY just above the threshold boundary", () => {
    const result = computeGap(100, 105.01, 5);
    expect(result.matchingStatus).toBe("DISCREPANCY");
  });

  it("returns DISCREPANCY when the carrier invoice is well above the theoretical cost", () => {
    const result = computeGap(5.47, 6.5, 5);
    expect(result.gapPercent).toBeCloseTo(18.83, 1);
    expect(result.matchingStatus).toBe("DISCREPANCY");
  });

  it("handles a negative gap (carrier billed less than the theoretical cost)", () => {
    const result = computeGap(100, 80, 5);
    expect(result.gapAmount).toBe(-20);
    expect(result.gapPercent).toBe(-20);
    expect(result.matchingStatus).toBe("DISCREPANCY");
  });

  it("does not divide by zero, and flags any non-zero charge against a zero theoretical cost as a discrepancy", () => {
    const result = computeGap(0, 50, 5);
    expect(result.gapPercent).toBe(0);
    expect(result.gapAmount).toBe(50);
    expect(result.matchingStatus).toBe("DISCREPANCY");
  });

  it("matches when both theoretical and carrier amounts are zero", () => {
    const result = computeGap(0, 0, 5);
    expect(result.matchingStatus).toBe("MATCHED");
  });
});
