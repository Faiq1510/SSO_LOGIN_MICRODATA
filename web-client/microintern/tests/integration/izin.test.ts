import { describe, it, expect, vi, beforeEach } from "vitest";
import { postIzin, deleteIzinById, adminGetAllIzin, getIzinSaya } from "@backend/controllers/izin.controller";
import * as izinRepo from "@backend/repositories/izin.repository";
import * as presensiRepo from "@backend/repositories/presensi.repository";
import * as pendaftaranRepo from "@backend/repositories/pengajuan-pkl.repository";
import * as profilRepo from "@backend/repositories/profil-peserta.repository";
import * as configDb from "@backend/config/database";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";
import { getLocalDateString } from "@backend/utils/date";

vi.mock("@backend/repositories/izin.repository");
vi.mock("@backend/repositories/presensi.repository");
vi.mock("@backend/repositories/pengajuan-pkl.repository");
vi.mock("@backend/repositories/profil-peserta.repository");
vi.mock("@backend/repositories/notification.repository");

describe("Izin Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postIzin", () => {
    it("should successfully apply for leave starting today or in the future", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const today = getLocalDateString();
      const req = createMockReq({
        user,
        body: {
          tanggalMulai: today,
          tanggalSelesai: today,
          kategori: "Izin Sakit",
          alasan: "Demam tinggi",
          buktiUrl: "https://mock-s3.com/bukti.jpg",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: "2026-08-31",
      } as any);

      vi.mocked(configDb.db.query).mockResolvedValue({ rows: [] } as any);

      await postIzin(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Pengajuan izin berhasil dicatat",
        })
      );
      expect(izinRepo.createIzin).toHaveBeenCalled();
    });

    it("should return 400 when tanggalMulai is in the past", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          tanggalMulai: "2026-07-01",
          tanggalSelesai: "2026-07-02",
          kategori: "Izin Sakit",
          alasan: "Demam",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await postIzin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: expect.stringContaining("periode PKL aktif"),
        })
      );
    });

    it("should return 400 when tanggalSelesai is before tanggalMulai", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const today = getLocalDateString();
      const req = createMockReq({
        user,
        body: {
          tanggalMulai: today,
          tanggalSelesai: "2026-07-01",
          kategori: "Izin Sakit",
          alasan: "Demam",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await postIzin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Tanggal selesai harus sama atau setelah tanggal mulai",
        })
      );
    });
  });

  describe("deleteIzinById", () => {
    it("should successfully cancel leave for today or future dates", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const today = getLocalDateString();
      const req = createMockReq({
        user,
        params: { id: "uuid-izin-1" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(izinRepo.findIzinById).mockResolvedValue({
        id: "uuid-izin-1",
        user_id: "uuid-user-1",
        tanggal: today,
      } as any);

      await deleteIzinById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Pengajuan izin berhasil dibatalkan",
        })
      );
    });

    it("should return 400 when trying to cancel leave in the past", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        params: { id: "uuid-izin-1" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(izinRepo.findIzinById).mockResolvedValue({
        id: "uuid-izin-1",
        user_id: "uuid-user-1",
        tanggal: "2026-07-01",
      } as any);

      await deleteIzinById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Tidak dapat membatalkan izin untuk hari yang sudah lewat.",
        })
      );
    });
  });
});
