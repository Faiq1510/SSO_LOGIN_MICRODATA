import { db } from "../config/database";

export interface Settings {
  kapasitas_maksimal: number;
  email_notification: boolean;
  batas_waktu_bolos?: string;
  template_nomor_surat?: string;
  template_nomor_sertifikat?: string;
  nomor_awal_surat?: number;
  nomor_awal_sertifikat?: number;
  counter_surat?: number;
  counter_sertifikat?: number;
  updated_at?: Date;
  updated_oleh?: string | null;
}

export const getSettings = async (): Promise<Settings> => {
  const result = await db.query(`SELECT * FROM settings WHERE id = 1`);
  if (result.rows.length === 0) {
    return {
      kapasitas_maksimal: 10,
      email_notification: true,
      batas_waktu_bolos: "23:59:00",
      template_nomor_surat: "{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}",
      template_nomor_sertifikat: "CERT/MDI/{tahun}/{no}",
      nomor_awal_surat: 1,
      nomor_awal_sertifikat: 1,
      counter_surat: 0,
      counter_sertifikat: 0,
      updated_oleh: null,
    };
  }
  return result.rows[0];
};

export const updateSettings = async (updates: Partial<Settings>): Promise<Settings> => {
  const current = await getSettings();
  const kapasitasMaksimal = updates.kapasitas_maksimal !== undefined ? updates.kapasitas_maksimal : current.kapasitas_maksimal;
  const emailNotification = updates.email_notification !== undefined ? updates.email_notification : current.email_notification;
  const batasWaktuBolos = updates.batas_waktu_bolos !== undefined ? updates.batas_waktu_bolos : current.batas_waktu_bolos;
  const templateNomorSurat = updates.template_nomor_surat !== undefined ? updates.template_nomor_surat : (current.template_nomor_surat ?? "{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}");
  const templateNomorSertifikat =
    updates.template_nomor_sertifikat !== undefined ? updates.template_nomor_sertifikat : (current.template_nomor_sertifikat ?? "CERT/MDI/{tahun}/{no}");
  const nomorAwalSurat = updates.nomor_awal_surat !== undefined ? updates.nomor_awal_surat : (current.nomor_awal_surat ?? 1);
  const nomorAwalSertifikat = updates.nomor_awal_sertifikat !== undefined ? updates.nomor_awal_sertifikat : (current.nomor_awal_sertifikat ?? 1);
  const updatedOleh = updates.updated_oleh !== undefined ? updates.updated_oleh : current.updated_oleh || null;

  const result = await db.query(
    `
    UPDATE settings
    SET kapasitas_maksimal = $1, email_notification = $2, batas_waktu_bolos = $3,
        template_nomor_surat = $4, template_nomor_sertifikat = $5,
        nomor_awal_surat = $6, nomor_awal_sertifikat = $7,
        updated_oleh = $8, updated_at = NOW()
    WHERE id = 1
    RETURNING *
    `,
    [kapasitasMaksimal, emailNotification, batasWaktuBolos, templateNomorSurat, templateNomorSertifikat, nomorAwalSurat, nomorAwalSertifikat, updatedOleh]
  );

  if (result.rows.length === 0) {
    const insertRes = await db.query(
      `
        INSERT INTO settings (id, kapasitas_maksimal, email_notification, batas_waktu_bolos,
                              template_nomor_surat, template_nomor_sertifikat,
                              nomor_awal_surat, nomor_awal_sertifikat, updated_oleh)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
     `,
      [kapasitasMaksimal, emailNotification, batasWaktuBolos, templateNomorSurat, templateNomorSertifikat, nomorAwalSurat, nomorAwalSertifikat, updatedOleh]
    );
    return insertRes.rows[0];
  }
  return result.rows[0];
};

export const getActiveQuotaCount = async (): Promise<number> => {
  const activeRes = await db.query(`
    SELECT COUNT(ka.user_id)::int AS active_count
    FROM jadwal_pkl jp
    JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
    JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
    WHERE pp.status = 'aktif' AND CURRENT_DATE BETWEEN jp.tanggal_mulai AND jp.tanggal_selesai
  `);
  return activeRes.rows[0]?.active_count || 0;
};

export const getSettingsUpdater = async (userId: string | null | undefined): Promise<any | null> => {
  if (!userId) return null;
  const updaterRes = await db.query(
    `
    SELECT p.nama_lengkap AS name, u.email
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.id = $1
  `,
    [userId]
  );
  return updaterRes.rows[0] || null;
};

export const getActiveParticipants = async (): Promise<any[]> => {
  const activeParticipantsRes = await db.query(`
    SELECT jp.pengajuan_id, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, k.jenis AS jenis_kelompok,
           (SELECT json_agg(json_build_object('nama_lengkap', pr.nama_lengkap, 'email', u.email, 'institusi', pr.institusi, 'program_studi', pr.program_studi))
            FROM kelompok_anggota ka
            JOIN users u ON u.id = ka.user_id
            JOIN profil_peserta pr ON pr.user_id = u.id
            WHERE ka.kelompok_id = pp.kelompok_id) AS anggota
    FROM jadwal_pkl jp
    JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
    JOIN kelompok k ON k.id = pp.kelompok_id
    WHERE pp.status = 'aktif' AND CURRENT_DATE BETWEEN jp.tanggal_mulai AND jp.tanggal_selesai
  `);
  return activeParticipantsRes.rows || [];
};

export const incrementSuratCounter = async (): Promise<number> => {
  const result = await db.query(`
    UPDATE settings
    SET counter_surat = counter_surat + 1
    WHERE id = 1
    RETURNING counter_surat
  `);
  return result.rows[0].counter_surat;
};

export const incrementSertifikatCounter = async (): Promise<number> => {
  const result = await db.query(`
    UPDATE settings
    SET counter_sertifikat = counter_sertifikat + 1
    WHERE id = 1
    RETURNING counter_sertifikat
  `);
  return result.rows[0].counter_sertifikat;
};
