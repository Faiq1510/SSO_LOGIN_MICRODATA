import { describe, it, expect } from "vitest";
import { getLocalDateString, localDayjs } from "@backend/utils/date";

describe("Date Utils", () => {
  it("should get local date string for a given date", () => {
    const date = new Date("2026-07-16T12:00:00Z");
    const str = getLocalDateString(date);
    expect(str).toBe("2026-07-16");
  });

  it("should parse date using localDayjs", () => {
    const parsed = localDayjs("2026-07-16");
    expect(parsed.format("YYYY-MM-DD")).toBe("2026-07-16");
  });

  it("should default to current date when no argument is passed to getLocalDateString", () => {
    const str = getLocalDateString();
    expect(str).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
