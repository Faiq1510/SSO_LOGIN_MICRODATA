import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { insertProfil } from "../../backend/src/repositories/profil-peserta.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, checkKuota, findPengajuanByKelompokId, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";
import { updateSettings } from "../../backend/src/repositories/settings.repository";

describe("Pendaftaran & Onboarding Quota Consistency Integration Test", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should enforce consistent quota behavior for onboarding vs pendaftaran flows when quota is full", async () => {
    await updateSettings({ kapasitas_maksimal: 1 });

    const activeUser = await insertUser({ email: "active@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const activeKelompok = await createKelompok({ ketua_id: activeUser.id, jenis: "individu" });
    await addKelompokAnggota(activeKelompok.id, activeUser.id);
    const activePengajuan = await createPengajuan({
      kelompok_id: activeKelompok.id,
      surat_pengantar_url: "http://ex.com/active.pdf",
      nama_penerbit_surat: "Univ X",
      nomor_surat_pengantar: "S-ACT",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "PKL Active",
    });
    await insertJadwalPkl({ pengajuan_id: activePengajuan.id, tanggal_mulai: "2026-08-01", tanggal_selesai: "2026-08-31" });

    const admin = await insertUser({ email: "admin@example.com", password_hash: "h", role: "admin", email_verified: true });
    const { updatePengajuanStatus } = await import("../../backend/src/repositories/pengajuan-pkl.repository");
    await updatePengajuanStatus(activePengajuan.id, { status: "aktif", diproses_oleh: admin.id });

    const kuotaCheck = await checkKuota("2026-08-10", "2026-08-20");
    expect(kuotaCheck.tersedia).toBe(false);

    const onboardingUser = await insertUser({ email: "onboarding@example.com", password_hash: "h", role: "peserta", email_verified: true });
    await insertProfil({
      user_id: onboardingUser.id,
      nama_lengkap: "Peserta Onboarding",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "111222",
      institusi: "Univ Y",
      program_studi: "Informatika",
    });
    const onboardingKelompok = await createKelompok({ ketua_id: onboardingUser.id, jenis: "individu" });
    await addKelompokAnggota(onboardingKelompok.id, onboardingUser.id);

    const checkBeforeOnboardingSubmit = await checkKuota("2026-08-10", "2026-08-20");
    expect(checkBeforeOnboardingSubmit.tersedia).toBe(false);

    const pendaftaranUser = await insertUser({ email: "pendaftaran@example.com", password_hash: "h", role: "peserta", email_verified: true });
    await insertProfil({
      user_id: pendaftaranUser.id,
      nama_lengkap: "Peserta Pendaftaran",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "333444",
      institusi: "Univ Z",
      program_studi: "Sistem Informasi",
    });
    const pendaftaranKelompok = await createKelompok({ ketua_id: pendaftaranUser.id, jenis: "individu" });
    await addKelompokAnggota(pendaftaranKelompok.id, pendaftaranUser.id);

    const checkBeforePendaftaranSubmit = await checkKuota("2026-08-10", "2026-08-20");
    expect(checkBeforePendaftaranSubmit.tersedia).toBe(false);

    expect(checkBeforeOnboardingSubmit.tersedia).toEqual(checkBeforePendaftaranSubmit.tersedia);
  });
});
