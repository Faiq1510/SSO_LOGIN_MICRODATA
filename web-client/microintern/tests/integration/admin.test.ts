import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminDashboard } from "@backend/controllers/dashboard-admin.controller";
import { getWebsiteSettings, updateWebsiteSettings } from "@backend/controllers/admin-settings.controller";
import { getParticipants, updateParticipant } from "@backend/controllers/admin-peserta.controller";
import * as dashboardRepo from "@backend/repositories/dashboard-admin.repository";
import * as settingsRepo from "@backend/repositories/settings.repository";
import * as adminPesertaRepo from "@backend/repositories/admin-peserta.repository";
import * as pendaftaranRepo from "@backend/repositories/pengajuan-pkl.repository";
import * as configDb from "@backend/config/database";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/dashboard-admin.repository");
vi.mock("@backend/repositories/settings.repository");
vi.mock("@backend/repositories/admin-peserta.repository");
vi.mock("@backend/repositories/pengajuan-pkl.repository");

describe("Admin Controllers Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAdminDashboard", () => {
    it("should return admin dashboard statistics", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(dashboardRepo.getDashboardAdmin).mockResolvedValue({
        total_menunggu: 2,
        total_aktif: 5,
        total_selesai: 10,
        total_ditolak: 1,
        total_semua: 18,
      } as any);

      vi.mocked(pendaftaranRepo.findAllPengajuan).mockResolvedValue({
        data: [],
        total: 0,
      });

      await getAdminDashboard(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            stats: expect.objectContaining({
              total_aktif: 5,
            }),
          }),
        })
      );
    });

    it("should return 403 if user is not admin", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      await getAdminDashboard(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("updateWebsiteSettings", () => {
    it("should successfully update website settings", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        body: {
          kapasitas_maksimal: 25,
          batas_waktu_bolos: "12:00:00",
          emailNotification: true,
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(settingsRepo.updateSettings).mockResolvedValue({
        kapasitas_maksimal: 25,
        batas_waktu_bolos: "12:00:00",
        email_notification: true,
      } as any);

      await updateWebsiteSettings(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            kapasitas_maksimal: 25,
          }),
        })
      );
    });
  });

  describe("getParticipants", () => {
    it("should return list of participants for admin", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(adminPesertaRepo.findParticipants).mockResolvedValue({
        data: [{ id: "uuid-user-1", nama: "Peserta 1" }],
        total: 1,
      });

      await getParticipants(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.arrayContaining([
            expect.objectContaining({
              nama: "Peserta 1",
            }),
          ]),
        })
      );
    });
  });

  describe("updateParticipant", () => {
    it("should successfully update participant details", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { id: "uuid-user-1" },
        body: {
          nama: "Budi Santoso Updated",
          nim: "123456",
          institusi: "UI",
          prodi: "TI",
          email: "budi.updated@test.com",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(adminPesertaRepo.checkEmailExistsOtherThanUser).mockResolvedValue(false);
      vi.mocked(configDb.db.query).mockResolvedValue({ rows: [] } as any);
      vi.mocked(adminPesertaRepo.updateProfilPeserta).mockResolvedValue({
        user_id: "uuid-user-1",
        nama_lengkap: "Budi Santoso Updated",
      } as any);

      await updateParticipant(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Participant updated successfully",
        })
      );
    });
  });
});
