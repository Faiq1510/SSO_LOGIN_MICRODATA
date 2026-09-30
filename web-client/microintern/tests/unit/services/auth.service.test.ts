import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import * as userRepo from "@backend/repositories/user.repository";
import * as otpRepo from "@backend/repositories/pending-otp.repository";
import {
  loginUser,
  registerUser,
  googleLoginOrRegister,
  refreshAccessToken,
  requestEmailConfirmation,
  confirmEmail,
  requestPasswordReset,
  resetPassword,
} from "@backend/services/auth.service";

vi.mock("@backend/repositories/user.repository");
vi.mock("@backend/repositories/pending-otp.repository");

describe("Auth Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("loginUser", () => {
    it("should login successfully with correct credentials", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "peserta",
        email_verified: true,
        password_hash: "hashed",
        google_id: null,
        name: "Test User",
        password: "hashed",
      };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await loginUser("test@example.com", "password");
      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error if user not found", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      await expect(loginUser("unknown@example.com", "password")).rejects.toThrow("Invalid email or password");
    });

    it("should throw error if account is Google-only", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "peserta",
        email_verified: true,
        password_hash: null,
        google_id: "google123",
        name: "Test User",
        password: null,
      };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(mockUser as any);
      await expect(loginUser("test@example.com", "password")).rejects.toThrow("This account is configured for Google login. Please use Google Login.");
    });

    it("should throw error if email is not verified", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "peserta",
        email_verified: false,
        password_hash: "hashed",
        google_id: null,
        name: "Test User",
        password: "hashed",
      };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(mockUser as any);
      await expect(loginUser("test@example.com", "password")).rejects.toThrow("Please confirm your email address before logging in.");
    });

    it("should throw error if password is incorrect", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "peserta",
        email_verified: true,
        password_hash: "hashed",
        google_id: null,
        name: "Test User",
        password: "hashed",
      };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(loginUser("test@example.com", "wrongpassword")).rejects.toThrow("Invalid email or password");
    });
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      vi.mocked(userRepo.findUserByEmail)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "1", email: "test@example.com", email_verified: false } as any);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(userRepo.insertUser).mockResolvedValue({ id: "1", email: "test@example.com", email_verified: false } as any);

      const result = await registerUser("test@example.com", "password");
      expect(result.message).toContain("Silakan periksa email Anda");
      expect(userRepo.insertUser).toHaveBeenCalled();
    });

    it("should update password and resend OTP if user exists but is not verified", async () => {
      const existing = { id: "1", email: "test@example.com", email_verified: false };
      vi.mocked(userRepo.findUserByEmail)
        .mockResolvedValueOnce(existing as any)
        .mockResolvedValueOnce(existing as any);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);

      const result = await registerUser("test@example.com", "newpassword");
      expect(result.message).toContain("Silakan periksa email Anda");
      expect(userRepo.modifyUser).toHaveBeenCalledWith("1", { password_hash: "hashed" });
    });

    it("should throw error if user exists and is already verified", async () => {
      const existing = { id: "1", email: "test@example.com", email_verified: true };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(existing as any);

      await expect(registerUser("test@example.com", "password")).rejects.toThrow("Email is already registered");
    });
  });

  describe("confirmEmail", () => {
    it("should confirm email successfully with valid OTP", async () => {
      const user = { id: "1", email: "test@example.com", email_verified: false };
      const pendingOtp = { email: "test@example.com", otp_code: "123456", expires_at: new Date(Date.now() + 60000) };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(pendingOtp as any);

      await confirmEmail("test@example.com", "123456");
      expect(userRepo.modifyUser).toHaveBeenCalledWith("1", { email_verified: true }, expect.anything());
      expect(otpRepo.deleteOtp).toHaveBeenCalledWith("test@example.com", "email_confirmation", expect.anything());
    });

    it("should throw error if user is not found", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      await expect(confirmEmail("test@example.com", "123456")).rejects.toThrow("User not found");
    });

    it("should throw error if OTP is invalid", async () => {
      const user = { id: "1", email: "test@example.com", email_verified: false };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(null);

      await expect(confirmEmail("test@example.com", "123456")).rejects.toThrow("Invalid OTP");
    });

    it("should throw error if OTP has expired", async () => {
      const user = { id: "1", email: "test@example.com", email_verified: false };
      const pendingOtp = { email: "test@example.com", otp_code: "123456", expires_at: new Date(Date.now() - 60000) };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(pendingOtp as any);

      await expect(confirmEmail("test@example.com", "123456")).rejects.toThrow("OTP has expired");
    });
  });

  describe("requestPasswordReset", () => {
    it("should request password reset successfully", async () => {
      const user = { id: "1", email: "test@example.com", password_hash: "hashed", password: "hashed" };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);

      await requestPasswordReset("test@example.com");
      expect(otpRepo.deleteOtp).toHaveBeenCalledWith("test@example.com", "forgot_password");
      expect(otpRepo.insertOtp).toHaveBeenCalled();
    });

    it("should throw error if user is not found", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      await expect(requestPasswordReset("test@example.com")).rejects.toThrow("User not found");
    });

    it("should throw error if user is Google-only account", async () => {
      const user = { id: "1", email: "test@example.com", password_hash: null, password: null };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      await expect(requestPasswordReset("test@example.com")).rejects.toThrow("Cannot reset password for Google-linked accounts.");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const user = { id: "1", email: "test@example.com" };
      const pendingOtp = { email: "test@example.com", otp_code: "123456", expires_at: new Date(Date.now() + 60000) };
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(user as any);
      vi.mocked(otpRepo.findOtp).mockResolvedValue(pendingOtp as any);
      vi.mocked(bcrypt.hash).mockResolvedValue("newhashed" as never);

      await resetPassword("test@example.com", "123456", "newpassword");
      expect(userRepo.modifyUser).toHaveBeenCalledWith("1", { password_hash: "newhashed" }, expect.anything());
      expect(otpRepo.deleteOtp).toHaveBeenCalledWith("test@example.com", "forgot_password", expect.anything());
    });
  });

  describe("googleLoginOrRegister", () => {
    it("should login with google if user exists with google_id", async () => {
      const mockUser = { id: "1", email: "google@test.com", google_id: "google123", role: "peserta" };
      vi.mocked(userRepo.findUserByGoogleId).mockResolvedValue(mockUser as any);

      const result = await googleLoginOrRegister({ googleId: "google123", email: "google@test.com", name: "Google User" });
      expect(result.user.id).toBe("1");
      expect(result.accessToken).toBeDefined();
    });

    it("should connect and login with google if user exists with email but no google_id", async () => {
      const mockUser = { id: "1", email: "google@test.com", google_id: null, role: "peserta" };
      vi.mocked(userRepo.findUserByGoogleId).mockResolvedValue(null);
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(userRepo.findUserById).mockResolvedValue({ ...mockUser, google_id: "google123", email_verified: true } as any);

      const result = await googleLoginOrRegister({ googleId: "google123", email: "google@test.com", name: "Google User" });
      expect(userRepo.modifyUser).toHaveBeenCalledWith("1", { google_id: "google123", email_verified: true });
      expect(result.user.id).toBe("1");
    });

    it("should register new user if google user does not exist", async () => {
      vi.mocked(userRepo.findUserByGoogleId).mockResolvedValue(null);
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.insertUser).mockResolvedValue({ id: "2", email: "google@test.com", google_id: "google123", role: "peserta" } as any);

      const result = await googleLoginOrRegister({ googleId: "google123", email: "google@test.com", name: "Google User" });
      expect(userRepo.insertUser).toHaveBeenCalledWith({
        email: "google@test.com",
        google_id: "google123",
        role: "peserta",
        email_verified: true,
      });
      expect(result.user.id).toBe("2");
    });
  });
});
