import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate } from "@backend/middlewares/auth.middleware";
import * as jwtUtils from "@backend/utils/jwt";
import * as userRepo from "@backend/repositories/user.repository";
import { createMockReq, createMockRes, createMockNext } from "../../helpers/mock-req-res";

vi.mock("@backend/utils/jwt");
vi.mock("@backend/repositories/user.repository");

describe("Auth Middleware Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should return 401 if authorization header is missing", async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Unauthorized: Token is missing.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is invalid or expired", async () => {
    const req = createMockReq({ headers: { authorization: "Bearer invalid_token" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Unauthorized: Invalid or expired token.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if decoded user is not found in database", async () => {
    const req = createMockReq({ headers: { authorization: "Bearer valid_token" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ id: "user_1" } as any);
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Unauthorized: User not found.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user to req and call next() if token is valid and user exists", async () => {
    const req = createMockReq({ headers: { authorization: "Bearer valid_token" } });
    const res = createMockRes();
    const next = createMockNext();
    const mockUser = { id: "user_1", email: "user@test.com", role: "peserta" };

    vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ id: "user_1" } as any);
    vi.mocked(userRepo.findUserById).mockResolvedValue(mockUser as any);

    await authenticate(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
