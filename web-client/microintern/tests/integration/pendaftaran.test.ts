import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPendaftaran,
  adminTerimaPendaftaran,
  adminTolakPendaftaran,
  adminBatalPendaftaran,
  pesertaCancelPendaftaran,
  checkKuotaController,
} from "@backend/controllers/pendaftaran.controller";
import * as pendaftaranRepo from "@backend/repositories/pengajuan-pkl.repository";
import * as kelompokRepo from "@backend/repositories/kelompok.repository";
import * as settingsRepo from "@backend/repositories/settings.repository";
import * as profilRepo from "@backend/repositories/profil-peserta.repository";
import * as suratBalasanRepo from "@backend/repositories/surat-balasan.repository";
import * as configDb from "@backend/config/database";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/pengajuan-pkl.repository");
vi.mock("@backend/repositories/kelompok.repository");
vi.mock("@backend/repositories/settings.repository");
vi.mock("@backend/repositories/profil-peserta.repository");
vi.mock("@backend/repositories/surat-balasan.repository");

describe("Pendaftaran Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPendaftaran", () => {
    it("should successfully create pendaftaran", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          tipePendaftaran: "Individu",
          tanggalMasuk: "2026-08-01",
          tanggalKeluar: "2026-08-31",
          suratPengantarUrl: "https://mock-s3.com/surat.pdf",
          nama_penerbit_surat: "Dekan Fasilkom UI",
          nomor_surat_pengantar: "001/UI/2026",
          tanggal_surat_pengantar: "2026-07-15",
          perihal_surat: "Permohonan PKL Budi",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findPengajuanByUserId).mockResolvedValue(null);
      vi.mocked(pendaftaranRepo.checkKuota).mockResolvedValue({
        peserta_aktif: 0,
        kapasitas_maks: 10,
        tersedia: true,
      });
      vi.mocked(profilRepo.findProfilByUserId).mockResolvedValue({ nama_lengkap: "Budi" } as any);
      vi.mocked(kelompokRepo.createKelompok).mockResolvedValue({ id: "uuid-kelompok-1" } as any);
      vi.mocked(pendaftaranRepo.createPengajuan).mockResolvedValue({ id: "uuid-pengajuan-1", kelompok_id: "uuid-kelompok-1" } as any);

      await createPendaftaran(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Pengajuan PKL berhasil dibuat",
        })
      );
    });

    it("should return 400 if validation fails", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          tipePendaftaran: "Individu",
          tanggalMasuk: "",
          tanggalKeluar: "",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await createPendaftaran(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("adminTerimaPendaftaran", () => {
    it("should successfully accept registration as admin", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { id: "uuid-pengajuan-1" },
        body: { catatan: "Approved" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findPengajuanById).mockResolvedValue({
        id: "uuid-pengajuan-1",
        kelompok_id: "uuid-kelompok-1",
        tanggal_masuk: "2026-08-01",
        tanggal_keluar: "2026-08-31",
      } as any);

      vi.mocked(pendaftaranRepo.checkKuota).mockResolvedValue({
        peserta_aktif: 0,
        kapasitas_maks: 10,
        tersedia: true,
      });

      vi.mocked(kelompokRepo.countKelompokAnggota).mockResolvedValue(1);
      vi.mocked(kelompokRepo.getKelompokAnggota).mockResolvedValue([]);
      vi.mocked(settingsRepo.getSettings).mockResolvedValue({ email_notification: false } as any);

      await adminTerimaPendaftaran(req, res, next);
      expect(suratBalasanRepo.insertSuratBalasan).toHaveBeenCalled();
      expect(pendaftaranRepo.updatePengajuanStatus).toHaveBeenCalledWith(
        "uuid-pengajuan-1",
        expect.objectContaining({
          status: "aktif",
        }),
        expect.anything()
      );
    });
  });

  describe("adminTolakPendaftaran", () => {
    it("should successfully reject registration as admin with alasan_tolak", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { id: "uuid-pengajuan-1" },
        body: { alasan_tolak: "Quota full" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findPengajuanById).mockResolvedValue({
        id: "uuid-pengajuan-1",
        kelompok_id: "uuid-kelompok-1",
      } as any);
      vi.mocked(kelompokRepo.getKelompokAnggota).mockResolvedValue([]);
      vi.mocked(settingsRepo.getSettings).mockResolvedValue({ email_notification: false } as any);

      await adminTolakPendaftaran(req, res, next);
      expect(pendaftaranRepo.updatePengajuanStatus).toHaveBeenCalledWith(
        "uuid-pengajuan-1",
        expect.objectContaining({
          status: "ditolak",
          alasan_tolak: "Quota full",
        }),
        expect.anything()
      );
    });

    it("should return 400 if alasan_tolak is empty", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { id: "uuid-pengajuan-1" },
        body: { alasan_tolak: "" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminTolakPendaftaran(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("adminBatalPendaftaran", () => {
    it("should revert registration decision to menunggu", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { id: "uuid-pengajuan-1" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findPengajuanById).mockResolvedValue({
        id: "uuid-pengajuan-1",
      } as any);

      await adminBatalPendaftaran(req, res, next);
      expect(pendaftaranRepo.updatePengajuanStatus).toHaveBeenCalledWith(
        "uuid-pengajuan-1",
        expect.objectContaining({
          status: "menunggu",
        }),
        expect.anything()
      );
    });
  });

  describe("pesertaCancelPendaftaran", () => {
    it("should withdraw registration when status is menunggu", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(pendaftaranRepo.findPengajuanByUserId).mockResolvedValue({
        id: "uuid-pengajuan-1",
        status: "menunggu",
        kelompok_id: "uuid-kelompok-1",
        surat_pengantar_url: "https://mock-s3.com/surat.pdf",
      } as any);
      vi.mocked(kelompokRepo.getKelompokAnggota).mockResolvedValue([]);

      await pesertaCancelPendaftaran(req, res, next);
      expect(pendaftaranRepo.deletePengajuanById).toHaveBeenCalledWith("uuid-pengajuan-1", expect.anything());
      expect(kelompokRepo.deleteKelompok).toHaveBeenCalledWith("uuid-kelompok-1", expect.anything());
    });
  });
});
