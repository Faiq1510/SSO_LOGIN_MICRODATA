import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { insertProfil } from "../../backend/src/repositories/profil-peserta.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";
import {
  recordMasuk,
  recordKeluar,
  findPresensiByUserIdAndDate,
  getRekapPresensiByUserId,
  findPresensiByUserId,
  getPresensiHarian,
} from "../../backend/src/repositories/presensi.repository";
import { createIzin } from "../../backend/src/repositories/izin.repository";

describe("Presensi Repository & View v_rekap_presensi", () => {
  let userId: string;
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

    const user = await insertUser({
      email: "peserta@example.com",
      password_hash: "hashed",
      role: "peserta",
      email_verified: true,
    });
    userId = user.id;

    await insertProfil({
      user_id: user.id,
      nama_lengkap: "Peserta Presensi",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "777888",
      institusi: "Kampus Presensi",
      program_studi: "Sistem Informasi",
    });
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should record clock-in and clock-out correctly", async () => {
    const tanggal = "2026-06-01";
    const presensiMasuk = await recordMasuk(userId, tanggal, "hadir");
    expect(presensiMasuk).toBeDefined();
    expect(presensiMasuk.status).toBe("hadir");
    expect(presensiMasuk.jam_masuk).not.toBeNull();
    expect(presensiMasuk.jam_keluar).toBeNull();

    const presensiKeluar = await recordKeluar(userId, tanggal);
    expect(presensiKeluar).toBeDefined();
    expect(presensiKeluar?.jam_keluar).not.toBeNull();

    const found = await findPresensiByUserIdAndDate(userId, tanggal);
    expect(found?.status).toBe("hadir");
  });

  it("should update status on conflict if recordMasuk is called twice", async () => {
    const tanggal = "2026-06-01";
    await recordMasuk(userId, tanggal, "hadir");
    const updated = await recordMasuk(userId, tanggal, "izin");
    expect(updated.status).toBe("izin");
  });

  it("should calculate automatic alpha for past weekdays without attendance via v_rekap_presensi", async () => {
    const kelompok = await createKelompok({ ketua_id: userId, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, userId);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus X",
      nomor_surat_pengantar: "SURAT-PAST",
      tanggal_surat_pengantar: "2026-05-01",
      perihal_surat: "PKL Past",
    });

    await insertJadwalPkl({
      pengajuan_id: pengajuan.id,
      tanggal_mulai: "2026-05-04",
      tanggal_selesai: "2026-05-10",
    });

    await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });

    await recordMasuk(userId, "2026-05-04", "hadir");

    await createIzin({
      user_id: userId,
      tanggal: "2026-05-05",
      kategori: "sakit",
      alasan: "Demam",
    });
    await recordMasuk(userId, "2026-05-05", "izin");

    const rekap = await getRekapPresensiByUserId(userId);
    expect(rekap).not.toBeNull();
    expect(rekap?.total_hadir).toBe(1);
    expect(rekap?.total_izin).toBe(1);
    expect(rekap?.total_alpha).toBe(3);
    expect(rekap?.total_tercatat).toBe(5);
  });

  it("should list presensi records with correct derived alpha status for past dates", async () => {
    const kelompok = await createKelompok({ ketua_id: userId, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, userId);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus Y",
      nomor_surat_pengantar: "SURAT-LIST",
      tanggal_surat_pengantar: "2026-05-01",
      perihal_surat: "PKL List",
    });

    await insertJadwalPkl({
      pengajuan_id: pengajuan.id,
      tanggal_mulai: "2026-05-04",
      tanggal_selesai: "2026-05-08",
    });

    await updatePengajuanStatus(pengajuan.id, { status: "aktif", diproses_oleh: adminId });

    const records = await findPresensiByUserId(userId);
    expect(records.length).toBe(5);
    expect(records.every((r) => r.status === "alpha")).toBe(true);
  });

  it("should only generate presensi history from current active PKL start date and exclude past finished PKLs", async () => {
    const kOld = await createKelompok({ ketua_id: userId, jenis: "individu" });
    await addKelompokAnggota(kOld.id, userId);
    const pOld = await createPengajuan({
      kelompok_id: kOld.id,
      surat_pengantar_url: "http://example.com/surat_old.pdf",
      nama_penerbit_surat: "Kampus Old",
      nomor_surat_pengantar: "OLD-123",
      tanggal_surat_pengantar: "2025-06-01",
      perihal_surat: "PKL Lama",
    });
    await insertJadwalPkl({
      pengajuan_id: pOld.id,
      tanggal_mulai: "2025-06-27",
      tanggal_selesai: "2025-07-20",
    });
    await updatePengajuanStatus(pOld.id, { status: "aktif", diproses_oleh: adminId });

    const kNew = await createKelompok({ ketua_id: userId, jenis: "individu" });
    await addKelompokAnggota(kNew.id, userId);
    const pNew = await createPengajuan({
      kelompok_id: kNew.id,
      surat_pengantar_url: "http://example.com/surat_new.pdf",
      nama_penerbit_surat: "Kampus New",
      nomor_surat_pengantar: "NEW-456",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "PKL Baru",
    });
    await insertJadwalPkl({
      pengajuan_id: pNew.id,
      tanggal_mulai: "2026-07-21",
      tanggal_selesai: "2026-07-24",
    });
    await updatePengajuanStatus(pNew.id, { status: "aktif", diproses_oleh: adminId });

    const records = await findPresensiByUserId(userId);
    const earliestDate = records[records.length - 1].tanggal;
    const earliestStr = new Date(earliestDate).toISOString().split("T")[0];
    expect(earliestStr).toBe("2026-07-21");
  });

  it("should return distinct participant list in getPresensiHarian for multi-group active schedules", async () => {
    const k1 = await createKelompok({ ketua_id: userId, jenis: "individu" });
    await addKelompokAnggota(k1.id, userId);
    const p1 = await createPengajuan({
      kelompok_id: k1.id,
      surat_pengantar_url: "http://example.com/surat1.pdf",
      nama_penerbit_surat: "Kampus A",
      nomor_surat_pengantar: "NOMOR-1",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "Permohonan 1",
    });
    await insertJadwalPkl({
      pengajuan_id: p1.id,
      tanggal_mulai: "2026-07-20",
      tanggal_selesai: "2026-07-30",
    });
    await updatePengajuanStatus(p1.id, { status: "aktif", diproses_oleh: adminId });

    const harian = await getPresensiHarian("2026-07-23");
    const userRecords = harian.filter((r) => r.user_id === userId);
    expect(userRecords.length).toBe(1);
  });
});
