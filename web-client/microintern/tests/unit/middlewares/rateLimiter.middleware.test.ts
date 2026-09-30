import { describe, it, expect } from "vitest";
import { apiLimiter } from "@backend/middlewares/rateLimiter.middleware";

describe("Rate Limiter Middleware Unit Tests", () => {
  it("should be defined and be a middleware function", () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe("function");
  });
});
