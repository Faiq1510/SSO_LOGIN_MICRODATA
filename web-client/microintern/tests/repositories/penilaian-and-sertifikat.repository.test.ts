import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { insertProfil } from "../../backend/src/repositories/profil-peserta.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";
import { createPenilaian, findPenilaianByUserAndPengajuan, findPesertaSelesaiForEvaluation } from "../../backend/src/repositories/penilaian.repository";
import { insertSertifikat, findSertifikatByUserAndPengajuan, findAllSertifikat } from "../../backend/src/repositories/sertifikat.repository";
import { insertSuratBalasan, findSuratBalasanByPengajuanId, findAllSuratBalasan } from "../../backend/src/repositories/surat-balasan.repository";
import { findDefaultTemplate } from "../../backend/src/repositories/template-penilaian.repository";

describe("Penilaian, Sertifikat, and Surat Balasan Repositories", () => {
  let adminId: string;
  let userId: string;
  let pengajuanId: string;

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
      nama_lengkap: "Peserta Cert",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "999000",
      institusi: "Kampus Cert",
      program_studi: "Teknik Elektro",
    });

    const kelompok = await createKelompok({ ketua_id: user.id, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, user.id);

    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
      nama_penerbit_surat: "Kampus Cert",
      nomor_surat_pengantar: "SURAT-CERT",
      tanggal_surat_pengantar: "2026-06-01",
      perihal_surat: "Permohonan PKL Cert",
    });
    pengajuanId = pengajuan.id;
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should create and fetch penilaian using default template criteria", async () => {
    const template = await findDefaultTemplate();
    expect(template).not.toBeNull();
    expect(template?.kriteria?.length).toBeGreaterThan(0);

    const items = template!.kriteria!.map((k) => ({ kriteria_id: k.id, nilai: 90 }));

    const penilaian = await createPenilaian({
      user_id: userId,
      pengajuan_id: pengajuanId,
      dinilai_oleh: adminId,
      template_id: template!.id,
      nilai_akhir: 90.0,
      catatan: "Sangat baik",
      items,
    });

    expect(penilaian.id).toBeDefined();
    expect(penilaian.nilai_akhir).toBe("90.00");
    expect(penilaian.items?.length).toBe(items.length);

    const fetched = await findPenilaianByUserAndPengajuan(userId, pengajuanId);
    expect(fetched?.nilai_akhir).toBe("90.00");
  });

  it("should insert and query sertifikat", async () => {
    const nomor = "CERT/2026/001";
    const fileUrl = "http://storage.local/cert.pdf";

    await insertSertifikat({
      user_id: userId,
      pengajuan_id: pengajuanId,
      nomor_sertifikat: nomor,
      file_url: fileUrl,
      generated_oleh: adminId,
    });

    const found = await findSertifikatByUserAndPengajuan(userId, pengajuanId);
    expect(found).not.toBeNull();
    expect(found?.nomor_sertifikat).toBe(nomor);
    expect(found?.file_url).toBe(fileUrl);

    const all = await findAllSertifikat(1, 10);
    expect(all.total).toBe(1);
    expect(all.data[0].nomor_sertifikat).toBe(nomor);
  });

  it("should insert and query surat balasan", async () => {
    const nomor = "001/SDM/PT-MDI/VI/2026";
    const fileUrl = "http://storage.local/balasan.pdf";

    await insertSuratBalasan({
      pengajuan_id: pengajuanId,
      jenis: "diterima",
      nomor_surat: nomor,
      file_url: fileUrl,
      generated_oleh: adminId,
    });

    const found = await findSuratBalasanByPengajuanId(pengajuanId);
    expect(found).not.toBeNull();
    expect(found?.file_url).toBe(fileUrl);

    const all = await findAllSuratBalasan(1, 10);
    expect(all.total).toBe(1);
    expect(all.data[0].nomor_surat).toBe(nomor);
  });

  it("should return status selesai for evaluation on today's tanggal_selesai", async () => {
    await updatePengajuanStatus(pengajuanId, { status: "aktif", diproses_oleh: adminId });
    const today = new Date().toISOString().split("T")[0];
    await insertJadwalPkl({
      pengajuan_id: pengajuanId,
      tanggal_mulai: "2026-01-01",
      tanggal_selesai: today,
    });

    const evalStatus = await findPesertaSelesaiForEvaluation(userId);
    expect(evalStatus?.status).toBe("selesai");
  });
});
