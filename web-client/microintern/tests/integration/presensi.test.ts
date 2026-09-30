import { describe, it, expect, vi, beforeEach } from "vitest";
import { postDatang, postPulang, getPresensiHariIni, adminGetPresensiHarian } from "@backend/controllers/presensi.controller";
import * as presensiRepo from "@backend/repositories/presensi.repository";
import * as pendaftaranRepo from "@backend/repositories/pengajuan-pkl.repository";
import * as settingsRepo from "@backend/repositories/settings.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";
import { getLocalDateString, localDayjs } from "@backend/utils/date";

vi.mock("@backend/repositories/presensi.repository");
vi.mock("@backend/repositories/pengajuan-pkl.repository");
vi.mock("@backend/repositories/settings.repository");

describe("Presensi Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postDatang", () => {
    it("should successfully log clock-in within active period and before limit time", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      const today = getLocalDateString();
      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: today,
      } as any);

      vi.mocked(settingsRepo.getSettings).mockResolvedValue({
        batas_waktu_bolos: "23:59:00",
      } as any);

      vi.mocked(presensiRepo.findPresensiByUserIdAndDate).mockResolvedValue(null);
      vi.mocked(presensiRepo.recordMasuk).mockResolvedValue({ id: "uuid-presensi-1" } as any);

      await postDatang(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Presensi datang berhasil dicatat",
        })
      );
    });

    it("should fail clock-in if no active schedule exists", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue(null);

      await postDatang(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Anda tidak memiliki jadwal PKL yang berjalan.",
        })
      );
    });

    it("should fail clock-in if past limit time", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      const today = getLocalDateString();
      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: today,
      } as any);

      vi.mocked(settingsRepo.getSettings).mockResolvedValue({
        batas_waktu_bolos: "00:01:00",
      } as any);

      await postDatang(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: expect.stringContaining("Batas waktu presensi hari ini"),
        })
      );
    });

    it("should fail clock-in if already clocked-in for the day", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      const today = getLocalDateString();
      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: today,
      } as any);

      vi.mocked(settingsRepo.getSettings).mockResolvedValue({
        batas_waktu_bolos: "23:59:00",
      } as any);

      vi.mocked(presensiRepo.findPresensiByUserIdAndDate).mockResolvedValue({
        jam_masuk: "08:00:00",
      } as any);

      await postDatang(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Anda sudah melakukan presensi datang hari ini.",
        })
      );
    });
  });

  describe("postPulang", () => {
    it("should successfully log clock-out after clock-in", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      const today = getLocalDateString();
      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: today,
      } as any);

      vi.mocked(presensiRepo.findPresensiByUserIdAndDate).mockResolvedValue({
        jam_masuk: "08:00:00",
        jam_keluar: null,
      } as any);

      vi.mocked(presensiRepo.recordKeluar).mockResolvedValue({ id: "uuid-presensi-1", jam_keluar: "17:00:00" } as any);

      await postPulang(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Presensi pulang berhasil dicatat",
        })
      );
    });

    it("should fail clock-out if not clocked-in yet", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      const today = getLocalDateString();
      vi.mocked(pendaftaranRepo.findJadwalByUserId).mockResolvedValue({
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: today,
      } as any);

      vi.mocked(presensiRepo.findPresensiByUserIdAndDate).mockResolvedValue(null);

      await postPulang(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Anda belum melakukan presensi datang hari ini.",
        })
      );
    });
  });
});
