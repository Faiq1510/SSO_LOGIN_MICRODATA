import { db, DbClient } from "../config/database";

export interface Izin {
  id: string;
  user_id: string;
  tanggal: Date | string;
  kategori: string;
  alasan: string;
  bukti_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export const createIzin = async (
  data: { user_id: string; tanggal: string | Date; kategori: string; alasan: string; bukti_url?: string | null },
  dbClient: DbClient = db
): Promise<Izin> => {
  const buktiUrl = data.bukti_url || null;

  const result = await dbClient.query(
    `INSERT INTO izin (user_id, tanggal, kategori, alasan, bukti_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.user_id, data.tanggal, data.kategori, data.alasan, buktiUrl]
  );

  return result.rows[0];
};

export const findIzinById = async (id: string, dbClient: DbClient = db): Promise<Izin | null> => {
  const result = await dbClient.query("SELECT * FROM izin WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const findIzinByUserId = async (userId: string, dbClient: DbClient = db): Promise<Izin[]> => {
  const result = await dbClient.query("SELECT * FROM izin WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return result.rows;
};

export const findAllIzin = async (filters?: { tanggal?: string | Date; nama_peserta?: string }, dbClient: DbClient = db): Promise<any[]> => {
  let query = `
    SELECT i.*, pr.nama_lengkap, pr.institusi, pr.program_studi, u.email
    FROM izin i
    JOIN users u ON u.id = i.user_id
    JOIN profil_peserta pr ON pr.user_id = u.id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (filters?.tanggal) {
    values.push(filters.tanggal);
    conditions.push(`i.tanggal = $${values.length}`);
  }

  if (filters?.nama_peserta) {
    values.push(`%${filters.nama_peserta}%`);
    conditions.push(`pr.nama_lengkap ILIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY i.created_at DESC";

  const result = await dbClient.query(query, values);
  return result.rows;
};

export const deleteIzinByUserAndDate = async (userId: string, date: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM izin WHERE user_id = $1 AND tanggal = $2", [userId, date]);
};

export const deleteIzinById = async (id: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM izin WHERE id = $1", [id]);
};
