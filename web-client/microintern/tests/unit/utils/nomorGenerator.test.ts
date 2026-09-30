import { describe, it, expect } from "vitest";
import { resolveTemplate } from "../../../backend/src/utils/nomorGenerator";

describe("nomorGenerator resolveTemplate", () => {
  it("should resolve placeholders correctly with default starting number 1", () => {
    const result = resolveTemplate("{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}", 0, 1);
    expect(result).toMatch(/^\d{3}\/SDM\/PT-MDI\/[I|V|X]+\/\d{4}$/);
    expect(result.startsWith("001")).toBe(true);
  });

  it("should respect custom starting number when countDb is less than starting number", () => {
    const result = resolveTemplate("{no}/SDM/{tahun}", 2, 10);
    expect(result.startsWith("010")).toBe(true);
  });

  it("should follow database count when database count exceeds starting number", () => {
    const result = resolveTemplate("CERT/MDI/{tahun}/{no}", 15, 5);
    expect(result.endsWith("016")).toBe(true);
  });

  it("should format two-digit month correctly for {bulan}", () => {
    const result = resolveTemplate("{bulan}-{no}", 0, 1);
    expect(result).toMatch(/^\d{2}-001$/);
  });
});
