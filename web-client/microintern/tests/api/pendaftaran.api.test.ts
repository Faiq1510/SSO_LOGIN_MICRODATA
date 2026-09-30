import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../backend/src/app";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { insertProfil } from "../../backend/src/repositories/profil-peserta.repository";
import { generateAccessToken } from "../../backend/src/utils/jwt";

describe("Pendaftaran HTTP API Integration Tests (Real DB)", () => {
  let userId: string;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await resetTestDatabase();

    const user = await insertUser({
      email: "peserta_api@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });
    userId = user.id;

    await insertProfil({
      user_id: user.id,
      nama_lengkap: "Peserta API",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "555666",
      institusi: "Kampus API",
      program_studi: "Teknik Informatika",
      onboarding_status: "step_1_selesai",
    });

    userToken = generateAccessToken({ id: user.id, email: user.email, role: "peserta" });

    const admin = await insertUser({
      email: "admin_api@example.com",
      password_hash: "hashed",
      role: "admin",
      email_verified: true,
    });

    adminToken = generateAccessToken({ id: admin.id, email: admin.email, role: "admin" });
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should create pendaftaran via HTTP POST /api/pendaftaran", async () => {
    const res = await request(app).post("/api/pendaftaran").set("Authorization", `Bearer ${userToken}`).send({
      tipePendaftaran: "Individu",
      tanggalMasuk: "2026-08-01",
      tanggalKeluar: "2026-08-31",
      suratPengantarUrl: "http://storage.local/surat.pdf",
      nama_penerbit_surat: "Fasilkom Kampus API",
      nomor_surat_pengantar: "001/API/2026",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Pengajuan PKL",
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.id).toBeDefined();
  });

  it("should allow admin to approve pengajuan via HTTP PUT /api/pendaftaran/admin/:id/terima", async () => {
    const createRes = await request(app).post("/api/pendaftaran").set("Authorization", `Bearer ${userToken}`).send({
      tipePendaftaran: "Individu",
      tanggalMasuk: "2026-08-01",
      tanggalKeluar: "2026-08-31",
      suratPengantarUrl: "http://storage.local/surat.pdf",
      nama_penerbit_surat: "Fasilkom Kampus API",
      nomor_surat_pengantar: "002/API/2026",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Pengajuan PKL Approve",
    });

    const pengajuanId = createRes.body.data.id;

    const approveRes = await request(app).put(`/api/pendaftaran/admin/${pengajuanId}/terima`).set("Authorization", `Bearer ${adminToken}`).send({
      catatan: "Disetujui untuk PKL",
    });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe("success");
    expect(approveRes.body.data.status).toBe("aktif");
  });
});
