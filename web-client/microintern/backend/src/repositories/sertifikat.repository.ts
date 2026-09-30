import { db, DbClient } from "../config/database";

export const findSertifikatByUserAndPengajuan = async (userId: string, pengajuanId: string, dbClient: DbClient = db): Promise<any | null> => {
  const result = await dbClient.query(`SELECT nomor_sertifikat, file_url FROM sertifikat WHERE user_id = $1 AND pengajuan_id = $2`, [userId, pengajuanId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findSertifikatByUserId = async (userId: string, dbClient: DbClient = db): Promise<any | null> => {
  const result = await dbClient.query(`SELECT file_url FROM sertifikat WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const insertSertifikat = async (
  data: { user_id: string; pengajuan_id: string; nomor_sertifikat: string; file_url: string; generated_oleh: string },
  dbClient: DbClient = db
): Promise<void> => {
  await dbClient.query(`INSERT INTO sertifikat (user_id, pengajuan_id, nomor_sertifikat, file_url, generated_oleh) VALUES ($1, $2, $3, $4, $5)`, [
    data.user_id,
    data.pengajuan_id,
    data.nomor_sertifikat,
    data.file_url,
    data.generated_oleh,
  ]);
};

export const updateSertifikatFileUrl = async (userId: string, pengajuanId: string, file_url: string, generated_oleh: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query(`UPDATE sertifikat SET file_url = $1, generated_oleh = $2 WHERE user_id = $3 AND pengajuan_id = $4`, [file_url, generated_oleh, userId, pengajuanId]);
};

export const findPesertaInfoForSertifikat = async (userId: string, pengajuanId: string, dbClient: DbClient = db): Promise<any | null> => {
  const fullInfoQuery = `
    SELECT p.nama_lengkap, p.nim_nisn, p.institusi, p.program_studi, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, u.email
    FROM profil_peserta p
    JOIN users u ON u.id = p.user_id
    JOIN kelompok_anggota ka ON ka.user_id = u.id
    JOIN pengajuan_pkl pp ON pp.kelompok_id = ka.kelompok_id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE p.user_id = $1 AND pp.id = $2
  `;
  const result = await dbClient.query(fullInfoQuery, [userId, pengajuanId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findAllSertifikat = async (page: number, limit: number, dbClient: DbClient = db): Promise<{ data: any[]; total: number }> => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      s.id,
      s.nomor_sertifikat,
      s.file_url,
      s.generated_at,
      pr.nama_lengkap,
      pr.institusi,
      pr.program_studi
    FROM sertifikat s
    JOIN profil_peserta pr ON pr.user_id = s.user_id
    ORDER BY s.generated_at DESC
    LIMIT $1 OFFSET $2
  `;
  const countQuery = `SELECT COUNT(*) FROM sertifikat`;
  const [dataResult, countResult] = await Promise.all([dbClient.query(query, [limit, offset]), dbClient.query(countQuery)]);
  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};
