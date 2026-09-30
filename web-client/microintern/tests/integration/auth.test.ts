import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register, refreshToken, requestConfirmation, confirmEmailHandler, forgotPassword, resetPasswordHandler } from "@backend/controllers/auth.controller";
import * as userRepo from "@backend/repositories/user.repository";
import * as otpRepo from "@backend/repositories/pending-otp.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";
import bcrypt from "bcrypt";

vi.mock("@backend/repositories/user.repository");
vi.mock("@backend/repositories/pending-otp.repository");

describe("Auth Controller Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("register", () => {
    it("should register successfully", async () => {
      const req = createMockReq({ body: { email: "register@test.com", password: "password123" } });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(userRepo.findUserByEmail)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "1", email: "register@test.com", email_verified: false } as any);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(userRepo.insertUser).mockResolvedValue({ id: "1", email: "register@test.com" } as any);

      await register(req, res, next);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Registration successful",
        })
      );
    });

    it("should return 400 if email/password is missing", async () => {
      const req = createMockReq({ body: { email: "" } });
      const res = createMockRes();
      const next = createMockNext();

      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Email and password are required",
        })
      );
    });
  });

  describe("login", () => {
    it("should return login success", async () => {
      const req = createMockReq({ body: { email: "login@test.com", password: "password123" } });
      const res = createMockRes();
      const next = createMockNext();

      const user = {
        id: "1",
        email: "login@test.com",
        role: "peserta",
        email_verified: true,
        password_hash: "hashed",
        google_id: null,
        name: "Test User",
        password: "hashed",
      };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await login(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Login successful",
        })
      );
    });
  });

  describe("refreshToken", () => {
    it("should return error when refreshToken is missing", async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();
      const next = createMockNext();

      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("confirmEmailHandler", () => {
    it("should confirm email successfully with correct OTP", async () => {
      const req = createMockReq({ body: { email: "verify@test.com", otp: "123456" } });
      const res = createMockRes();
      const next = createMockNext();

      const user = { id: "1", email: "verify@test.com", email_verified: false };
      const pendingOtp = { email: "verify@test.com", otp_code: "123456", expires_at: new Date(Date.now() + 60000) };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(pendingOtp as any);

      await confirmEmailHandler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Email confirmed successfully",
        })
      );
    });
  });

  describe("forgotPassword & resetPasswordHandler", () => {
    it("should initiate forgot password", async () => {
      const req = createMockReq({ body: { email: "reset@test.com" } });
      const res = createMockRes();
      const next = createMockNext();

      const user = { id: "1", email: "reset@test.com", password_hash: "hash", password: "hash" };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);

      await forgotPassword(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Password reset email sent",
        })
      );
    });

    it("should reset password", async () => {
      const req = createMockReq({ body: { email: "reset@test.com", otp: "123456", newPassword: "newpassword" } });
      const res = createMockRes();
      const next = createMockNext();

      const user = { id: "1", email: "reset@test.com" };
      const pendingOtp = { email: "reset@test.com", otp_code: "123456", expires_at: new Date(Date.now() + 60000) };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(pendingOtp as any);
      vi.mocked(bcrypt.hash).mockResolvedValue("newhash" as never);

      await resetPasswordHandler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Password reset successfully",
        })
      );
    });
  });
});
