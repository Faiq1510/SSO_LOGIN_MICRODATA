import { describe, it, expect, vi, beforeEach } from "vitest";
import puppeteer from "puppeteer";
import * as minioService from "@backend/services/minio.service";
import fs from "fs";

vi.mock("puppeteer");
vi.mock("fs");
vi.mock("@backend/services/minio.service");

describe("PDF Service Unit Tests", () => {
  let mockPage: any;
  let mockBrowser: any;
  let pdfService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();

    mockPage = {
      setContent: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from("fake-pdf")),
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);
    vi.mocked(fs.readFileSync).mockReturnValue("<html>{{NOMOR_SURAT}}{{NOMOR_SERTIFIKAT}}{{TRANSCRIPT_PAGES}}</html>");
    vi.mocked(minioService.uploadFile).mockResolvedValue("https://mock-s3.com/generated.pdf");

    pdfService = await vi.importActual("@backend/services/pdf.service");
  });

  describe("generateSuratBalasan", () => {
    it("should compile template html, launch puppeteer, and upload generated pdf", async () => {
      const data = {
        tanggal_surat_pengantar: "2026-07-01",
        tanggal_masuk: "2026-08-01",
        tanggal_keluar: "2026-08-31",
        nama_penerbit_surat: "Dekan UI",
        nomor_surat_pengantar: "123/UI",
        perihal_surat: "Permohonan PKL",
        anggota: [{ nama_lengkap: "Budi", nim_nisn: "123", program_studi: "TI", jenjang_pendidikan: "kuliah" }],
      };

      const result = await pdfService.generateSuratBalasan(data, "diterima", "001/SURAT");

      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(minioService.uploadFile).toHaveBeenCalled();
      expect(result).toBe("https://mock-s3.com/generated.pdf");
    });
  });

  describe("generateSertifikat", () => {
    it("should compile sertifikat template with transcript pages and upload pdf", async () => {
      const dataPeserta = {
        nama_lengkap: "Budi Santoso",
        nim_nisn: "123456",
        institusi: "UI",
        tanggal_masuk: "2026-08-01",
        tanggal_keluar: "2026-08-31",
        jenjang_pendidikan: "kuliah",
      };

      const dataNilai = {
        nilai_akhir: 90,
        catatan: "Sangat Baik",
        items: [
          { nama_kriteria: "Disiplin", nilai: 90 },
          { nama_kriteria: "Kerjasama", nilai: 90 },
        ],
      };

      const result = await pdfService.generateSertifikat(dataPeserta, dataNilai, "CERT-001");

      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(result).toBe("https://mock-s3.com/generated.pdf");
    });
  });
});
