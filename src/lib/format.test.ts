import { describe, expect, it } from "vitest";
import { formatRange, formatRWF, normalizeMsisdn, providerFor } from "./format";

describe("formatRWF", () => {
  it("formats whole francs with comma grouping and no decimals", () => {
    expect(formatRWF(70000)).toBe("RWF 70,000");
    expect(formatRWF(0)).toBe("RWF 0");
    expect(formatRWF(1234567)).toBe("RWF 1,234,567");
  });
  it("rounds stray fractions instead of printing decimals", () => {
    expect(formatRWF(999.6)).toBe("RWF 1,000");
  });
  it("formats ranges", () => {
    expect(formatRange(850, 1000)).toBe("RWF 850 – 1,000");
  });
});

describe("mobile money numbers", () => {
  it.each([
    ["0788123456", "250788123456", "mtn"],
    ["+250 79 123 4567", "250791234567", "mtn"],
    ["0731234567", "250731234567", "airtel"],
    ["072 123 4567", "250721234567", "airtel"],
  ])("%s → %s (%s)", (input, msisdn, provider) => {
    expect(normalizeMsisdn(input)).toBe(msisdn);
    expect(providerFor(normalizeMsisdn(input))).toBe(provider);
  });
  it.each(["0751234567", "078812345", "12345", ""])("rejects %s", (input) => {
    expect(normalizeMsisdn(input)).toBeNull();
  });
});
