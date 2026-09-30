import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { withTransaction } from "../../backend/src/config/database";
import { insertUser } from "../../backend/src/repositories/user.repository";
import { createKelompok, addKelompokAnggota } from "../../backend/src/repositories/kelompok.repository";
import { createPengajuan, updatePengajuanStatus, checkKuota, insertJadwalPkl } from "../../backend/src/repositories/pengajuan-pkl.repository";
import { updateSettings } from "../../backend/src/repositories/settings.repository";

describe("Race Condition & Quota Concurrency Integration Test", () => {
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

  it("should prevent exceeding max quota when multiple submissions attempt concurrent approval", async () => {
    await updateSettings({ kapasitas_maksimal: 1 });

    const user1 = await insertUser({ email: "user1@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k1 = await createKelompok({ ketua_id: user1.id, jenis: "individu" });
    await addKelompokAnggota(k1.id, user1.id);
    const p1 = await createPengajuan({
      kelompok_id: k1.id,
      surat_pengantar_url: "http://ex.com/1.pdf",
      nama_penerbit_surat: "Kampus 1",
      nomor_surat_pengantar: "S1",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "PKL 1",
    });
    await insertJadwalPkl({ pengajuan_id: p1.id, tanggal_mulai: "2026-08-01", tanggal_selesai: "2026-08-31" });

    const user2 = await insertUser({ email: "user2@example.com", password_hash: "h", role: "peserta", email_verified: true });
    const k2 = await createKelompok({ ketua_id: user2.id, jenis: "individu" });
    await addKelompokAnggota(k2.id, user2.id);
    const p2 = await createPengajuan({
      kelompok_id: k2.id,
      surat_pengantar_url: "http://ex.com/2.pdf",
      nama_penerbit_surat: "Kampus 2",
      nomor_surat_pengantar: "S2",
      tanggal_surat_pengantar: "2026-07-01",
      perihal_surat: "PKL 2",
    });
    await insertJadwalPkl({ pengajuan_id: p2.id, tanggal_mulai: "2026-08-01", tanggal_selesai: "2026-08-31" });

    const attemptApproval = async (pengajuanId: string) => {
      return withTransaction(async (client) => {
        await client.query("SELECT * FROM settings WHERE id = 1 FOR UPDATE");
        const kuota = await checkKuota("2026-08-01", "2026-08-31", null, client);
        if (!kuota.tersedia) {
          throw new Error("Kuota penuh");
        }
        await updatePengajuanStatus(pengajuanId, { status: "aktif", diproses_oleh: adminId }, client);
        return true;
      });
    };

    const results = await Promise.allSettled([attemptApproval(p1.id), attemptApproval(p2.id)]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const finalKuota = await checkKuota("2026-08-01", "2026-08-31");
    expect(finalKuota.peserta_aktif).toBe(1);
    expect(finalKuota.tersedia).toBe(false);
  });
});
