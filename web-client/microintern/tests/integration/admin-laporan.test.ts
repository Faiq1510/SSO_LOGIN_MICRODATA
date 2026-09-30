import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLaporanExport } from "@backend/controllers/admin-laporan.controller";
import * as laporanRepo from "@backend/repositories/laporan.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/laporan.repository");

describe("Admin Laporan Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 403 if request user is not admin", async () => {
    const user = { id: "u1", role: "peserta" };
    const req = createMockReq({ user, query: { type: "peserta" } });
    const res = createMockRes();
    const next = createMockNext();

    await getLaporanExport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Forbidden: Admin access only",
      })
    );
  });

  it("should return 400 if type parameter is missing or invalid", async () => {
    const user = { id: "admin1", role: "admin" };
    const req = createMockReq({ user, query: { type: "invalid_type" } });
    const res = createMockRes();
    const next = createMockNext();

    await getLaporanExport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Invalid export type. Must be 'peserta', 'presensi', or 'nilai'.",
      })
    );
  });

  it("should return CSV attachment for type peserta", async () => {
    const user = { id: "admin1", role: "admin" };
    const req = createMockReq({ user, query: { type: "peserta", format: "csv" } });
    const res = createMockRes();
    res.setHeader = vi.fn();
    res.send = vi.fn();
    const next = createMockNext();

    vi.mocked(laporanRepo.fetchPeserta).mockResolvedValue([
      {
        Nama: "Budi",
        "NIM/NISN": "123",
        Email: "budi@test.com",
        Institusi: "UI",
        "Program Studi": "TI",
        Status: "Aktif",
        "Tgl Daftar": "01 Aug 2026",
      },
    ]);

    await getLaporanExport(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
    expect(res.send).toHaveBeenCalled();
  });

  it("should return CSV attachment for type presensi", async () => {
    const user = { id: "admin1", role: "admin" };
    const req = createMockReq({ user, query: { type: "presensi", format: "csv" } });
    const res = createMockRes();
    res.setHeader = vi.fn();
    res.send = vi.fn();
    const next = createMockNext();

    vi.mocked(laporanRepo.fetchPresensi).mockResolvedValue([
      {
        Nama: "Budi",
        Institusi: "UI",
        Tanggal: "2026-08-01",
        "Jam Masuk": "08:00",
        "Jam Keluar": "17:00",
        Status: "Hadir",
      },
    ]);

    await getLaporanExport(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
    expect(res.send).toHaveBeenCalled();
  });

  it("should return CSV attachment for type nilai", async () => {
    const user = { id: "admin1", role: "admin" };
    const req = createMockReq({ user, query: { type: "nilai", format: "csv" } });
    const res = createMockRes();
    res.setHeader = vi.fn();
    res.send = vi.fn();
    const next = createMockNext();

    vi.mocked(laporanRepo.fetchNilai).mockResolvedValue([
      {
        Nama: "Budi",
        "NIM/NISN": "123",
        Institusi: "UI",
        "Program Studi": "TI",
        "Tgl Selesai PKL": "2026-08-31",
        "Nilai Akhir": 90,
        Catatan: "Sangat Baik",
      },
    ]);

    await getLaporanExport(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
    expect(res.send).toHaveBeenCalled();
  });
});
