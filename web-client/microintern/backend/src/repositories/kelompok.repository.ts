import { db, DbClient } from "../config/database";

export interface Kelompok {
  id: string;
  ketua_id: string;
  jenis: "individu" | "kelompok";
  created_at: Date;
  updated_at: Date;
}

export interface KelompokAnggota {
  id: string;
  kelompok_id: string;
  user_id: string;
  created_at: Date;
}

export interface KelompokAnggotaDetail {
  user_id: string;
  email: string;
  nama_lengkap: string | null;
  nim_nisn: string | null;
  institusi: string | null;
  program_studi: string | null;
}

export const createKelompok = async (data: { ketua_id: string; jenis: "individu" | "kelompok" }, dbClient: DbClient = db): Promise<Kelompok> => {
  const result = await dbClient.query(
    `INSERT INTO kelompok (ketua_id, jenis)
     VALUES ($1, $2)
     RETURNING *`,
    [data.ketua_id, data.jenis]
  );
  return result.rows[0];
};

export const findKelompokById = async (id: string, dbClient: DbClient = db): Promise<Kelompok | null> => {
  const result = await dbClient.query("SELECT * FROM kelompok WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const findKelompokByKetuaId = async (ketuaId: string, dbClient: DbClient = db): Promise<Kelompok | null> => {
  const result = await dbClient.query("SELECT * FROM kelompok WHERE ketua_id = $1", [ketuaId]);
  return result.rows[0] || null;
};

export const addKelompokAnggota = async (kelompokId: string, userId: string, dbClient: DbClient = db): Promise<KelompokAnggota> => {
  const result = await dbClient.query(
    `INSERT INTO kelompok_anggota (kelompok_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (kelompok_id, user_id) DO NOTHING
     RETURNING *`,
    [kelompokId, userId]
  );
  return result.rows[0];
};

export const removeKelompokAnggota = async (kelompokId: string, userId: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM kelompok_anggota WHERE kelompok_id = $1 AND user_id = $2", [kelompokId, userId]);
  return (result.rowCount ?? 0) > 0;
};

export const getKelompokAnggota = async (kelompokId: string, dbClient: DbClient = db): Promise<KelompokAnggotaDetail[]> => {
  const result = await dbClient.query(
    `SELECT ka.user_id, u.email, p.nama_lengkap, p.nim_nisn, p.institusi, p.program_studi
     FROM kelompok_anggota ka
     JOIN users u ON u.id = ka.user_id
     LEFT JOIN profil_peserta p ON p.user_id = u.id
     WHERE ka.kelompok_id = $1`,
    [kelompokId]
  );
  return result.rows;
};

export const findKelompokByUserId = async (userId: string, dbClient: DbClient = db): Promise<Kelompok | null> => {
  const result = await dbClient.query(
    `SELECT k.*
     FROM kelompok k
     JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
     WHERE ka.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const removeKelompokById = async (id: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM kelompok WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const deleteKelompok = async (id: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM kelompok WHERE id = $1", [id]);
};

export const countKelompokAnggota = async (kelompokId: string, dbClient: DbClient = db): Promise<number> => {
  const result = await dbClient.query("SELECT COUNT(user_id)::int AS count FROM kelompok_anggota WHERE kelompok_id = $1", [kelompokId]);
  return parseInt(result.rows[0]?.count || 0);
};
