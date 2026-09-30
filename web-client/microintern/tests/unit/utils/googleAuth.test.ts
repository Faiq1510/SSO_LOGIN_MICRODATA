import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuth2Client } from "google-auth-library";

vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: vi.fn(),
    })),
  };
});

describe("Google Auth Utility Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should return null if GOOGLE_CLIENT_ID is not configured", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const { verifyGoogleIdToken } = await import("@backend/utils/googleAuth");
    const result = await verifyGoogleIdToken("some_token");
    expect(result).toBeNull();
  });

  it("should verify token and return payload when valid", async () => {
    process.env.GOOGLE_CLIENT_ID = "mock-client-id";

    const mockPayload = {
      sub: "g123",
      email: "user@google.com",
      email_verified: true,
      name: "Google User",
      picture: "https://pic.jpg",
    };

    const mockVerifyIdToken = vi.fn().mockResolvedValue({
      getPayload: () => mockPayload,
    });

    vi.mocked(OAuth2Client).mockImplementation(function () {
      return { verifyIdToken: mockVerifyIdToken } as any;
    });

    const { verifyGoogleIdToken } = await import("@backend/utils/googleAuth");
    const result = await verifyGoogleIdToken("valid_id_token");
    expect(result).toEqual({
      googleId: "g123",
      email: "user@google.com",
      emailVerified: true,
      name: "Google User",
      picture: "https://pic.jpg",
    });
  });

  it("should return null if token verification throws an error", async () => {
    process.env.GOOGLE_CLIENT_ID = "mock-client-id";

    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error("Invalid token signature"));

    vi.mocked(OAuth2Client).mockImplementation(function () {
      return { verifyIdToken: mockVerifyIdToken } as any;
    });

    vi.spyOn(console, "error").mockImplementation(() => {});

    const { verifyGoogleIdToken } = await import("@backend/utils/googleAuth");
    const result = await verifyGoogleIdToken("invalid_id_token");
    expect(result).toBeNull();
  });
});
