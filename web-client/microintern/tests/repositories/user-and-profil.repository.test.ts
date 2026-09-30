import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser, findUserByEmail, findUserById, findUserByGoogleId, modifyUser, searchUsers } from "../../backend/src/repositories/user.repository";
import { insertProfil, findProfilByUserId, updateProfil } from "../../backend/src/repositories/profil-peserta.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";

describe("User & Profil Peserta Repositories", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should create user and retrieve by email and google_id", async () => {
    const created = await insertUser({
      email: "user_test@example.com",
      password_hash: "hashed_pass",
      google_id: "google_123",
      role: "peserta",
      email_verified: true,
    });

    expect(created.id).toBeDefined();
    expect(created.email).toBe("user_test@example.com");

    const byEmail = await findUserByEmail("user_test@example.com");
    expect(byEmail?.id).toBe(created.id);

    const byGoogle = await findUserByGoogleId("google_123");
    expect(byGoogle?.id).toBe(created.id);

    const byId = await findUserById(created.id);
    expect(byId?.email).toBe("user_test@example.com");
  });

  it("should enforce unique constraint on email", async () => {
    await insertUser({
      email: "duplicate@example.com",
      password_hash: "pass",
    });

    await expect(
      insertUser({
        email: "duplicate@example.com",
        password_hash: "pass2",
      })
    ).rejects.toThrow();
  });

  it("should update user properties with modifyUser", async () => {
    const user = await insertUser({
      email: "old@example.com",
      password_hash: "old_pass",
      email_verified: false,
    });

    const updated = await modifyUser(user.id, {
      email: "new@example.com",
      email_verified: true,
    });

    expect(updated?.email).toBe("new@example.com");
    expect(updated?.email_verified).toBe(true);
  });

  it("should create and update profil peserta", async () => {
    const user = await insertUser({
      email: "profil_user@example.com",
      password_hash: "pass",
    });

    const profil = await insertProfil({
      user_id: user.id,
      nama_lengkap: "Budi Santoso",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "12345678",
      institusi: "Institut Tekno",
      program_studi: "Teknik Komputer",
      onboarding_status: "step_1_selesai",
    });

    expect(profil.id).toBeDefined();
    expect(profil.nama_lengkap).toBe("Budi Santoso");

    const fetched = await findProfilByUserId(user.id);
    expect(fetched?.nim_nisn).toBe("12345678");

    const updatedProfil = await updateProfil(profil.id, {
      nama_lengkap: "Budi Santoso Updated",
      onboarding_status: "selesai",
    });

    expect(updatedProfil?.nama_lengkap).toBe("Budi Santoso Updated");
    expect(updatedProfil?.onboarding_status).toBe("selesai");
  });

  it("should exclude active PKL participants from searchUsers", async () => {
    const admin = await insertUser({
      email: "admin_test@example.com",
      password_hash: "pass",
      role: "admin",
      email_verified: true,
    });

    const activeUser = await insertUser({
      email: "active_peserta@example.com",
      password_hash: "pass",
      role: "peserta",
      email_verified: true,
    });
    await insertProfil({
      user_id: activeUser.id,
      nama_lengkap: "Peserta Aktif",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "111",
      institusi: "Kampus A",
      program_studi: "Informatika",
    });

    const kelompok = await createKelompok({ ketua_id: activeUser.id, jenis: "individu" });
    await addKelompokAnggota(kelompok.id, activeUser.id);
    const pengajuan = await createPengajuan({
      kelompok_id: kelompok.id,
      surat_pengantar_url: "http://example.com/surat.pdf",
    });
    await updatePengajuanStatus(pengajuan!.id, { status: "aktif", diproses_oleh: admin.id });
    await insertJadwalPkl({
      pengajuan_id: pengajuan!.id,
      tanggal_mulai: "2026-01-01",
      tanggal_selesai: "2026-12-31",
    });

    const inactiveUser = await insertUser({
      email: "inactive_peserta@example.com",
      password_hash: "pass",
      role: "peserta",
      email_verified: true,
    });
    await insertProfil({
      user_id: inactiveUser.id,
      nama_lengkap: "Peserta Inaktif",
      jenjang_pendidikan: "kuliah",
      nim_nisn: "222",
      institusi: "Kampus B",
      program_studi: "Sistem Informasi",
    });

    const results = await searchUsers("peserta");
    const foundActive = results.find((u) => u.id === activeUser.id);
    const foundInactive = results.find((u) => u.id === inactiveUser.id);

    expect(foundActive).toBeUndefined();
    expect(foundInactive).toBeDefined();
  });
});
