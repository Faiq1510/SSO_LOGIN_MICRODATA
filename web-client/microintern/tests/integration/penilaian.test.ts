import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminCreateEvaluation, adminUpdateEvaluation, participantGetMyEvaluation } from "@backend/controllers/penilaian.controller";
import * as penilaianRepo from "@backend/repositories/penilaian.repository";
import * as sertifikatRepo from "@backend/repositories/sertifikat.repository";
import * as settingsRepo from "@backend/repositories/settings.repository";
import * as templateRepo from "@backend/repositories/template-penilaian.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/penilaian.repository");
vi.mock("@backend/repositories/sertifikat.repository");
vi.mock("@backend/repositories/settings.repository");
vi.mock("@backend/repositories/presensi.repository");
vi.mock("@backend/repositories/template-penilaian.repository");

describe("Penilaian Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.mocked(penilaianRepo.checkPesertaStatusForEvaluation).mockResolvedValue({
      institusi: "ITB",
      status_pengajuan: "selesai",
      tanggal_keluar: "2026-07-20",
    } as any);

    vi.mocked(templateRepo.findTemplateByInstitusi).mockResolvedValue({
      id: "uuid-template-1",
      nama_template: "Template ITB",
      institusi: "ITB",
      is_default: false,
      kriteria: [
        { id: "uuid-kriteria-1", nama_kriteria: "Disiplin", urutan: 1 },
        { id: "uuid-kriteria-2", nama_kriteria: "Kehadiran", urutan: 2 },
      ],
    } as any);

    vi.mocked(templateRepo.findDefaultTemplate).mockResolvedValue({
      id: "uuid-template-default",
      nama_template: "Template Standar",
      institusi: null,
      is_default: true,
      kriteria: [
        { id: "uuid-kriteria-1", nama_kriteria: "Disiplin", urutan: 1 },
        { id: "uuid-kriteria-2", nama_kriteria: "Kehadiran", urutan: 2 },
      ],
    } as any);

    vi.mocked(templateRepo.findTemplateById).mockResolvedValue({
      id: "uuid-template-1",
      nama_template: "Template ITB",
      institusi: "ITB",
      is_default: false,
      kriteria: [
        { id: "uuid-kriteria-1", nama_kriteria: "Disiplin", urutan: 1 },
        { id: "uuid-kriteria-2", nama_kriteria: "Kehadiran", urutan: 2 },
      ],
    } as any);
  });

  describe("adminCreateEvaluation", () => {
    it("should successfully create evaluation for completed participant", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { userId: "uuid-user-1" },
        body: {
          template_id: "uuid-template-1",
          items: [
            { kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 90 },
            { kriteria_id: "uuid-kriteria-2", nama_kriteria: "Kehadiran", nilai: 95 },
          ],
          catatan: "Excellent performance",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({
        status: "selesai",
      } as any);

      vi.mocked(penilaianRepo.findLatestSelesaiPengajuan).mockResolvedValue("uuid-pengajuan-1");
      vi.mocked(penilaianRepo.findPenilaianByUserAndPengajuan).mockResolvedValue(null);

      vi.mocked(penilaianRepo.createPenilaian).mockResolvedValue({
        id: "uuid-penilaian-1",
        nilai_akhir: 92.5,
        template_id: "uuid-template-1",
        catatan: "Excellent performance",
        items: [
          { kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 90 },
          { kriteria_id: "uuid-kriteria-2", nama_kriteria: "Kehadiran", nilai: 95 },
        ],
      } as any);

      vi.mocked(sertifikatRepo.countSertifikatThisYear).mockResolvedValue(0);
      vi.mocked(sertifikatRepo.findPesertaInfoForSertifikat).mockResolvedValue({
        nama_lengkap: "Budi",
        email: "budi@test.com",
      } as any);
      vi.mocked(settingsRepo.getSettings).mockResolvedValue({ email_notification: false } as any);

      await adminCreateEvaluation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(penilaianRepo.createPenilaian).toHaveBeenCalled();
      expect(sertifikatRepo.insertSertifikat).toHaveBeenCalled();
    });

    it("should return 400 if user has not completed internship", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { userId: "uuid-user-1" },
        body: {
          template_id: "uuid-template-1",
          items: [{ kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 90 }],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({
        status: "aktif",
      } as any);

      await adminCreateEvaluation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Admin tidak bisa memberikan nilai jika peserta belum selesai magang.",
        })
      );
    });

    it("should return 400 if score is out of 0-100 bounds", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { userId: "uuid-user-1" },
        body: {
          template_id: "uuid-template-1",
          items: [{ kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 105 }],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({
        status: "selesai",
      } as any);
      vi.mocked(penilaianRepo.findLatestSelesaiPengajuan).mockResolvedValue("uuid-pengajuan-1");
      vi.mocked(penilaianRepo.findPenilaianByUserAndPengajuan).mockResolvedValue(null);

      await adminCreateEvaluation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Semua nilai kriteria harus diisi dan berada dalam range 0-100",
        })
      );
    });
  });

  describe("adminUpdateEvaluation", () => {
    it("should successfully update existing evaluation", async () => {
      const user = { id: "uuid-admin-1", email: "admin@test.com", role: "admin" };
      const req = createMockReq({
        user,
        params: { userId: "uuid-user-1" },
        body: {
          items: [{ kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 95 }],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({ status: "selesai" } as any);
      vi.mocked(penilaianRepo.findLatestSelesaiPengajuan).mockResolvedValue("uuid-pengajuan-1");
      vi.mocked(penilaianRepo.findPenilaianByUserAndPengajuan).mockResolvedValue({ id: "uuid-penilaian-1" } as any);

      vi.mocked(penilaianRepo.updatePenilaian).mockResolvedValue({
        id: "uuid-penilaian-1",
        nilai_akhir: 95,
        catatan: "",
        items: [{ kriteria_id: "uuid-kriteria-1", nama_kriteria: "Disiplin", nilai: 95 }],
      } as any);

      vi.mocked(sertifikatRepo.findSertifikatByUserAndPengajuan).mockResolvedValue({
        nomor_sertifikat: "CERT/MDI/2026/001",
      } as any);
      vi.mocked(sertifikatRepo.findPesertaInfoForSertifikat).mockResolvedValue({
        nama_lengkap: "Budi",
        email: "budi@test.com",
      } as any);
      vi.mocked(settingsRepo.getSettings).mockResolvedValue({ email_notification: false } as any);

      await adminUpdateEvaluation(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
        })
      );
    });
  });

  describe("participantGetMyEvaluation", () => {
    it("should allow completed participant to retrieve their evaluation", async () => {
      const user = { id: "uuid-user-1", email: "budi@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({ status: "selesai" } as any);
      vi.mocked(penilaianRepo.findLatestSelesaiPengajuan).mockResolvedValue("uuid-pengajuan-1");
      vi.mocked(penilaianRepo.findPenilaianByUserAndPengajuan).mockResolvedValue({ id: "uuid-penilaian-1" } as any);
      vi.mocked(sertifikatRepo.findSertifikatByUserAndPengajuan).mockResolvedValue({ file_url: "https://mock-s3.com/sertifikat.pdf" } as any);

      await participantGetMyEvaluation(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            sertifikat_url: "https://mock-s3.com/sertifikat.pdf",
          }),
        })
      );
    });

    it("should fail retrieval if participant has not finished", async () => {
      const user = { id: "uuid-user-1", email: "budi@test.com", role: "peserta" };
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(penilaianRepo.findPesertaSelesaiForEvaluation).mockResolvedValue({ status: "aktif" } as any);

      await participantGetMyEvaluation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Peserta belum bisa melihat nilai jika belum selesai magang.",
        })
      );
    });
  });
});
