import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfil, updateProfil, changePassword, getInstitusiSuggestions, getProdiSuggestions } from "@backend/controllers/profil.controller";
import * as profilRepo from "@backend/repositories/profil-peserta.repository";
import * as userRepo from "@backend/repositories/user.repository";
import bcrypt from "bcrypt";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/profil-peserta.repository");
vi.mock("@backend/repositories/user.repository");
vi.mock("bcrypt");

describe("Profil Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProfil", () => {
    it("should return profile details for authenticated user", async () => {
      const user = { id: "u1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      const mockFullUser = { ...user, google_id: null, password_hash: "hashed" };
      const mockProfil = { user_id: "u1", nama_lengkap: "Budi Santoso", nim_nisn: "12345" };

      vi.mocked(userRepo.findUserById).mockResolvedValue(mockFullUser as any);
      vi.mocked(profilRepo.findProfilByUserId).mockResolvedValue(mockProfil as any);

      await getProfil(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Profile retrieved successfully",
          data: expect.objectContaining({
            email: "user@test.com",
          }),
        })
      );
    });

    it("should return 404 if user not found", async () => {
      const user = { id: "invalid_user", email: "none@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(userRepo.findUserById).mockResolvedValue(null);

      await getProfil(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "User not found",
        })
      );
    });
  });

  describe("updateProfil", () => {
    it("should update user profile successfully", async () => {
      const user = { id: "u1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          nama_lengkap: "Budi New Name",
          nim_nisn: "67890",
          institusi: "ITB",
          program_studi: "Informatika",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(userRepo.findUserById).mockResolvedValue(user as any);
      vi.mocked(profilRepo.findProfilByUserId).mockResolvedValue({ user_id: "u1" } as any);
      vi.mocked(profilRepo.updateProfilByUserId).mockResolvedValue({
        user_id: "u1",
        nama_lengkap: "Budi New Name",
        nim_nisn: "67890",
      } as any);

      await updateProfil(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
        })
      );
    });
  });

  describe("changePassword", () => {
    it("should return 400 if current password is wrong", async () => {
      const user = { id: "u1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          currentPassword: "wrong_password",
          newPassword: "new_valid_password",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(userRepo.findUserById).mockResolvedValue({
        ...user,
        password_hash: "hashed",
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await changePassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Password saat ini salah",
        })
      );
    });

    it("should update password when current password is correct", async () => {
      const user = { id: "u1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          currentPassword: "correct_password",
          newPassword: "new_valid_password_123",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(userRepo.findUserById).mockResolvedValue({
        ...user,
        password_hash: "hashed",
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("new_hashed" as never);
      vi.mocked(userRepo.modifyUser).mockResolvedValue({ id: "u1" } as any);

      await changePassword(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Password updated successfully",
        })
      );
    });
  });

  describe("suggestions", () => {
    it("should return institution suggestions", async () => {
      const user = { id: "u1", role: "peserta" };
      const req = createMockReq({ user, query: { q: "UI" } });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(profilRepo.findInstitusiSuggestions).mockResolvedValue(["Universitas Indonesia"]);

      await getInstitusiSuggestions(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: ["Universitas Indonesia"],
        })
      );
    });

    it("should return prodi suggestions", async () => {
      const user = { id: "u1", role: "peserta" };
      const req = createMockReq({ user, query: { q: "Teknik" } });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(profilRepo.findProdiSuggestions).mockResolvedValue(["Teknik Informatika"]);

      await getProdiSuggestions(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: ["Teknik Informatika"],
        })
      );
    });
  });
});
