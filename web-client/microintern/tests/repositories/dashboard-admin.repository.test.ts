import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";
import { getDashboardAdmin } from "../../backend/src/repositories/dashboard-admin.repository";

describe("Dashboard Admin Repository & View v_dashboard_admin", () => {
  let adminId: string;

  beforeEach(async () => {
    await resetTestDatabase();
    const admin = await insertUser({
      email: "admin@example.com",
      password_hash: "hashed",
      role: "admin",
      email_verified: true,
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should return zeros for empty database", async () => {
    const stats = await getDashboardAdmin();
    expect(stats.total_menunggu).toBe(0);
    expect(stats.total_aktif).toBe(0);
    expect(stats.total_selesai).toBe(0);
    expect(stats.total_ditolak).toBe(0);
    expect(stats.total_semua).toBe(0);
  });

  it("should correctly count pengajuan with different status states", async () => {
    const user1 = await insertUser({ email: "p1@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k1 = await createKelompok({ ketua_id: user1.id, jenis: "individu" });
    await addKelompokAnggota(k1.id, user1.id);
    await createPengajuan({
      kelompok_id: k1.id,
      surat_pengantar_url: "http://ex.com/1.pdf",
      nama_penerbit_surat: "A",
      nomor_surat_pengantar: "N1",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "P1",
    });

    const user2 = await insertUser({ email: "p2@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k2 = await createKelompok({ ketua_id: user2.id, jenis: "individu" });
    await addKelompokAnggota(k2.id, user2.id);
    const p2 = await createPengajuan({
      kelompok_id: k2.id,
      surat_pengantar_url: "http://ex.com/2.pdf",
      nama_penerbit_surat: "B",
      nomor_surat_pengantar: "N2",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "P2",
    });
    await updatePengajuanStatus(p2.id, { status: "ditolak", alasan_tolak: "Berkas kurang", diproses_oleh: adminId });

    const user3 = await insertUser({ email: "p3@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k3 = await createKelompok({ ketua_id: user3.id, jenis: "individu" });
    await addKelompokAnggota(k3.id, user3.id);
    const p3 = await createPengajuan({
      kelompok_id: k3.id,
      surat_pengantar_url: "http://ex.com/3.pdf",
      nama_penerbit_surat: "C",
      nomor_surat_pengantar: "N3",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "P3",
    });
    await insertJadwalPkl({ pengajuan_id: p3.id, tanggal_mulai: "2026-01-01", tanggal_selesai: "2026-01-31" });
    await updatePengajuanStatus(p3.id, { status: "aktif", diproses_oleh: adminId });

    const user4 = await insertUser({ email: "p4@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k4 = await createKelompok({ ketua_id: user4.id, jenis: "individu" });
    await addKelompokAnggota(k4.id, user4.id);
    const p4 = await createPengajuan({
      kelompok_id: k4.id,
      surat_pengantar_url: "http://ex.com/4.pdf",
      nama_penerbit_surat: "D",
      nomor_surat_pengantar: "N4",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "P4",
    });
    await insertJadwalPkl({ pengajuan_id: p4.id, tanggal_mulai: "2026-08-01", tanggal_selesai: "2026-12-31" });
    await updatePengajuanStatus(p4.id, { status: "aktif", diproses_oleh: adminId });

    const stats = await getDashboardAdmin();
    expect(stats.total_menunggu).toBe(1);
    expect(stats.total_ditolak).toBe(1);
    expect(stats.total_selesai).toBe(1);
    expect(stats.total_aktif).toBe(1);
    expect(stats.total_semua).toBe(4);
  });
});
