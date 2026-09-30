import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, checkKuota, getJadwalPublik, insertJadwalPkl, findJadwalByUserId } from "../../backend/src/repositories/pengajuan-pkl.repository";
import { updateSettings } from "../../backend/src/repositories/settings.repository";
import { insertProfil } from "../../backend/src/repositories/profil-peserta.repository";

describe("Pengajuan PKL Repository & SQL Kuota Function", () => {
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

  it("should return correct quota calculation for empty database", async () => {
    const kuota = await checkKuota("2026-08-01", "2026-08-31");
    expect(kuota.kapasitas_maks).toBe(10);
    expect(kuota.peserta_aktif).toBe(0);
    expect(kuota.tersedia).toBe(true);
  });

  it("should correctly calculate active participants when overlapping PKL exists", async () => {
    const user = await insertUser({
      email: "ketua@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });

    const kelompok = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, user.id);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus A",
      nomor_surat_pengantar: "123/ABC",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Permohonan PKL",
    });

    await insertJadwalPkl({
      pengajuan_id: pengajuan.id,
      tanggal_mulai: "2026-08-01",
      tanggal_selesai: "2026-08-31",
    });

    await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });

    const checkOverlap = await checkKuota("2026-08-15", "2026-09-15");
    expect(checkOverlap.peserta_aktif).toBe(1);
    expect(checkOverlap.tersedia).toBe(true);

    const checkNoOverlap = await checkKuota("2026-09-01", "2026-09-30");
    expect(checkNoOverlap.peserta_aktif).toBe(0);
    expect(checkNoOverlap.tersedia).toBe(true);
  });

  it("should report quota unavailable when active participants reach max capacity", async () => {
    await updateSettings({ kapasitas_maksimal: 2 });

    for (let i = 1; i <= 2; i++) {
      const user = await insertUser({
        email: `user${i}@example.com`,
        password_hash: "hashed",
        role: "peserta",
        email_verified: true,
      });

      const kelompok = await createKelompok({ ketua_id: user.id, jenis: "individu" });
      await addKelompokAnggota(kelompok.id, user.id);

      const pengajuan = await createPengajuan({
        kelompok_id: kelompok.id,
        surat_pengantar_url: `http://example.com/surat${i}.pdf`,
        nama_penerbit_surat: "Kampus B",
        nomor_surat_pengantar: `SURAT-${i}`,
        tanggal_surat_pengantar: "2026-07-01",
        perihal_surat: "Permohonan PKL",
      });

      await insertJadwalPkl({
        pengajuan_id: pengajuan.id,
        tanggal_mulai: "2026-08-01",
        tanggal_selesai: "2026-08-31",
      });

      await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });
    }

    const kuota = await checkKuota("2026-08-10", "2026-08-20");
    expect(kuota.peserta_aktif).toBe(2);
    expect(kuota.kapasitas_maks).toBe(2);
    expect(kuota.tersedia).toBe(false);
  });

  it("should exclude specified pengajuan id when checking quota during edit", async () => {
    await updateSettings({ kapasitas_maksimal: 1 });

    const user = await insertUser({
      email: "user_edit@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });

    const kelompok = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, user.id);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus C",
      nomor_surat_pengantar: "SURAT-EDIT",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Permohonan PKL",
    });

    await insertJadwalPkl({
      pengajuan_id: pengajuan.id,
      tanggal_mulai: "2026-08-01",
      tanggal_selesai: "2026-08-31",
    });

    await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });

    const checkWithExclude = await checkKuota("2026-08-01", "2026-08-31", pengajuan.id);
    expect(checkWithExclude.peserta_aktif).toBe(0);
    expect(checkWithExclude.tersedia).toBe(true);
  });

  it("should correctly populate public schedule view v_jadwal_pkl_publik", async () => {
    const user = await insertUser({
      email: "pub@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });

    await insertProfil({
      user_id: user.id,
      nama_lengkap: "Peserta Publik",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "123456",
      institusi: "Universitas Tekno",
      program_studi: "Informatika",
    });

    const kelompok = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, user.id);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus D",
      nomor_surat_pengantar: "SURAT-PUB",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Permohonan PKL",
    });

    await insertJadwalPkl({
      pengajuan_id: pengajuan.id,
      tanggal_mulai: "2026-08-01",
      tanggal_selesai: "2026-08-31",
    });

    await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });

    const jadwalPublik = await getJadwalPublik();
    expect(jadwalPublik.length).toBe(1);
    expect(jadwalPublik[0].institusi).toBe("Universitas Tekno");
    expect(jadwalPublik[0].program_studi).toBe("Informatika");
  });

  it("should prioritize active running PKL schedule over past completed PKL in findJadwalByUserId", async () => {
    const user = await insertUser({
      email: "multi_pkl@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });

    const kOld = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kOld.id, user.id);
    const pOld = await createPengajuan({
      kelompok_id: kOld.id,
      surat_pengantar_url: "http://example.com/surat_old.pdf",
      nama_penerbit_surat: "Kampus Old",
      nomor_surat_pengantar: "SURAT-OLD",
      tanggal_surat_pengantar: "2025-01-01",
      perihal_surat: "Permohonan PKL Lama",
    });
    await insertJadwalPkl({
      pengajuan_id: pOld.id,
      tanggal_mulai: "2025-01-01",
      tanggal_selesai: "2025-02-01",
    });
    await updatePengajuanStatus(pOld.id, { status: "aktif", diproses_oleh: adminId });

    const kNew = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kNew.id, user.id);
    const pNew = await createPengajuan({
      kelompok_id: kNew.id,
      surat_pengantar_url: "http://example.com/surat_new.pdf",
      nama_penerbit_surat: "Kampus New",
      nomor_surat_pengantar: "SURAT-NEW",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Permohonan PKL Baru",
    });
    await insertJadwalPkl({
      pengajuan_id: pNew.id,
      tanggal_mulai: "2026-07-01",
      tanggal_selesai: "2026-12-31",
    });
    await updatePengajuanStatus(pNew.id, { status: "aktif", diproses_oleh: adminId });

    const activeJadwal = await findJadwalByUserId(user.id);
    expect(activeJadwal).not.toBeNull();
    expect(activeJadwal?.pengajuan_id).toBe(pNew.id);
    expect(activeJadwal?.status).toBe("aktif");
  });
});
