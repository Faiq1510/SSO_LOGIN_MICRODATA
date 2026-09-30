import { describe, it, expect } from "vitest";
import { generateOtp } from "@backend/utils/otp";

describe("OTP Utils", () => {
  it("should generate a 6-digit OTP string", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(Number(otp)).toBeGreaterThanOrEqual(100000);
    expect(Number(otp)).toBeLessThanOrEqual(999999);
  });
});
