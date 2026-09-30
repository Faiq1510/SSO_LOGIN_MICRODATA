import { db, DbClient } from "../config/database";

export const insertSuratBalasan = async (
  data: { pengajuan_id: string; jenis: string; nomor_surat: string; file_url: string; generated_oleh: string },
  dbClient: DbClient = db
): Promise<void> => {
  await dbClient.query(`INSERT INTO surat_balasan (pengajuan_id, jenis, nomor_surat, file_url, generated_oleh) VALUES ($1, $2, $3, $4, $5)`, [
    data.pengajuan_id,
    data.jenis,
    data.nomor_surat,
    data.file_url,
    data.generated_oleh,
  ]);
};

export const findSuratBalasanByPengajuanId = async (id: string, dbClient: DbClient = db): Promise<{ file_url: string } | null> => {
  const result = await dbClient.query("SELECT file_url FROM surat_balasan WHERE pengajuan_id = $1", [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const deleteSuratBalasanByPengajuanId = async (id: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM surat_balasan WHERE pengajuan_id = $1", [id]);
};

export const findAllSuratBalasan = async (page: number, limit: number, dbClient: DbClient = db): Promise<{ data: any[]; total: number }> => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      sb.id,
      sb.nomor_surat,
      sb.jenis,
      sb.file_url,
      sb.generated_at,
      pp.id AS pengajuan_id,
      json_agg(DISTINCT jsonb_build_object('nama_lengkap', pr.nama_lengkap, 'institusi', pr.institusi)) AS anggota
    FROM surat_balasan sb
    JOIN pengajuan_pkl pp ON pp.id = sb.pengajuan_id
    JOIN kelompok k ON k.id = pp.kelompok_id
    JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
    JOIN profil_peserta pr ON pr.user_id = ka.user_id
    GROUP BY sb.id, sb.nomor_surat, sb.jenis, sb.file_url, sb.generated_at, pp.id
    ORDER BY sb.generated_at DESC
    LIMIT $1 OFFSET $2
  `;
  const countQuery = `SELECT COUNT(*) FROM surat_balasan`;
  const [dataResult, countResult] = await Promise.all([dbClient.query(query, [limit, offset]), dbClient.query(countQuery)]);
  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};
