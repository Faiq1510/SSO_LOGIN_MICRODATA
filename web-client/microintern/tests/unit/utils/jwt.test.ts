import { describe, it, expect } from "vitest";
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from "@backend/utils/jwt";

describe("JWT Utils", () => {
  const payload = { id: "123", email: "test@example.com", role: "peserta" };

  it("should generate and verify access tokens", () => {
    const token = generateAccessToken(payload);
    expect(token).toBeDefined();
    const verified = verifyAccessToken(token) as any;
    expect(verified.id).toBe(payload.id);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it("should generate and verify refresh tokens", () => {
    const token = generateRefreshToken(payload);
    expect(token).toBeDefined();
    const verified = verifyRefreshToken(token) as any;
    expect(verified.id).toBe(payload.id);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it("should throw error on invalid access token verification", () => {
    expect(() => verifyAccessToken("invalid-token")).toThrow();
  });

  it("should throw error on invalid refresh token verification", () => {
    expect(() => verifyRefreshToken("invalid-token")).toThrow();
  });
});
