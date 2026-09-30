import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWebsiteSettings, updateWebsiteSettings, getDokumenSuratBalasan, getDokumenSertifikat } from "@backend/controllers/admin-settings.controller";
import * as settingsRepo from "@backend/repositories/settings.repository";
import * as suratBalasanRepo from "@backend/repositories/surat-balasan.repository";
import * as sertifikatRepo from "@backend/repositories/sertifikat.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/settings.repository");
vi.mock("@backend/repositories/surat-balasan.repository");
vi.mock("@backend/repositories/sertifikat.repository");

describe("Admin Settings Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getWebsiteSettings", () => {
    it("should return website settings for admin", async () => {
      const req = createMockReq({ user: { id: "a1", role: "admin" } });
      const res = createMockRes();
      const next = createMockNext();

      const mockSettings = { kapasitas_maksimal: 20, email_notification: true, updated_oleh: "a1" };
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(mockSettings as any);
      vi.mocked(settingsRepo.getActiveQuotaCount).mockResolvedValue(5);
      vi.mocked(settingsRepo.getSettingsUpdater).mockResolvedValue({ name: "Admin", email: "admin@test.com" });
      vi.mocked(settingsRepo.getActiveParticipants).mockResolvedValue([]);

      await getWebsiteSettings(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            kapasitas_maksimal: 20,
            used_quota: 5,
          }),
        })
      );
    });

    it("should return 403 for non-admin", async () => {
      const req = createMockReq({ user: { id: "u1", role: "peserta" } });
      const res = createMockRes();
      const next = createMockNext();

      await getWebsiteSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("updateWebsiteSettings", () => {
    it("should return 400 if kapasitas_maksimal is less than 1", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        body: { kapasitas_maksimal: 0 },
      });
      const res = createMockRes();
      const next = createMockNext();

      await updateWebsiteSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Kapasitas maksimal harus berupa angka positif",
        })
      );
    });
  });

  describe("dokumen list", () => {
    it("should return list of surat balasan documents", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        query: { page: "1", limit: "10" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(suratBalasanRepo.findAllSuratBalasan).mockResolvedValue({
        data: [{ id: "sb1", nomor_surat: "001" }],
        total: 1,
      });

      await getDokumenSuratBalasan(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            data: expect.arrayContaining([expect.objectContaining({ id: "sb1" })]),
          }),
        })
      );
    });

    it("should return list of sertifikat documents", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        query: { page: "1", limit: "10" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(sertifikatRepo.findAllSertifikat).mockResolvedValue({
        data: [{ id: "s1", nomor_sertifikat: "CERT-001" }],
        total: 1,
      });

      await getDokumenSertifikat(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            data: expect.arrayContaining([expect.objectContaining({ id: "s1" })]),
          }),
        })
      );
    });
  });
});
