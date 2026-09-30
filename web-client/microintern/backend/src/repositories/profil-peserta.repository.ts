import { db, DbClient } from "../config/database";

export interface ProfilPeserta {
  id: string;
  user_id: string;
  nama_lengkap: string;
  jenjang_pendidikan: string;
  nim_nisn: string;
  institusi: string;
  program_studi: string;
  cv_url: string | null;
  onboarding_status: "belum_mulai" | "step_1_selesai" | "selesai";
  created_at: Date;
  updated_at: Date;
}

export const findProfilById = async (id: string, dbClient: DbClient = db): Promise<ProfilPeserta | null> => {
  const result = await dbClient.query("SELECT * FROM profil_peserta WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const findProfilByUserId = async (userId: string, dbClient: DbClient = db): Promise<ProfilPeserta | null> => {
  const result = await dbClient.query("SELECT * FROM profil_peserta WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
};

export const insertProfil = async (
  data: {
    user_id: string;
    nama_lengkap: string;
    jenjang_pendidikan?: string;
    nim_nisn: string;
    institusi: string;
    program_studi: string;
    cv_url?: string | null;
    onboarding_status?: "belum_mulai" | "step_1_selesai" | "selesai";
  },
  dbClient: DbClient = db
): Promise<ProfilPeserta> => {
  const cvUrl = data.cv_url || null;
  const onboardingStatus = data.onboarding_status || "belum_mulai";
  const jenjangPendidikan = data.jenjang_pendidikan || "kuliah";

  const result = await dbClient.query(
    `INSERT INTO profil_peserta (user_id, nama_lengkap, jenjang_pendidikan, nim_nisn, institusi, program_studi, cv_url, onboarding_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [data.user_id, data.nama_lengkap, jenjangPendidikan, data.nim_nisn, data.institusi, data.program_studi, cvUrl, onboardingStatus]
  );
  return result.rows[0];
};

export const updateProfil = async (
  id: string,
  data: {
    nama_lengkap?: string;
    jenjang_pendidikan?: string;
    nim_nisn?: string;
    institusi?: string;
    program_studi?: string;
    cv_url?: string | null;
    onboarding_status?: "belum_mulai" | "step_1_selesai" | "selesai";
  },
  dbClient: DbClient = db
): Promise<ProfilPeserta | null> => {
  const existing = await findProfilById(id, dbClient);
  if (!existing) return null;

  const namaLengkap = data.nama_lengkap !== undefined ? data.nama_lengkap : existing.nama_lengkap;
  const jenjangPendidikan = data.jenjang_pendidikan !== undefined ? data.jenjang_pendidikan : existing.jenjang_pendidikan;
  const nimNisn = data.nim_nisn !== undefined ? data.nim_nisn : existing.nim_nisn;
  const institusi = data.institusi !== undefined ? data.institusi : existing.institusi;
  const programStudi = data.program_studi !== undefined ? data.program_studi : existing.program_studi;
  const cvUrl = data.cv_url !== undefined ? data.cv_url : existing.cv_url;
  const onboardingStatus = data.onboarding_status !== undefined ? data.onboarding_status : existing.onboarding_status;

  const result = await dbClient.query(
    `UPDATE profil_peserta
     SET nama_lengkap = $1, jenjang_pendidikan = $2, nim_nisn = $3, institusi = $4, program_studi = $5, cv_url = $6, onboarding_status = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [namaLengkap, jenjangPendidikan, nimNisn, institusi, programStudi, cvUrl, onboardingStatus, id]
  );
  return result.rows[0] || null;
};

export const updateProfilByUserId = async (
  userId: string,
  data: {
    nama_lengkap?: string;
    jenjang_pendidikan?: string;
    nim_nisn?: string;
    institusi?: string;
    program_studi?: string;
    cv_url?: string | null;
    onboarding_status?: "belum_mulai" | "step_1_selesai" | "selesai";
  },
  dbClient: DbClient = db
): Promise<ProfilPeserta | null> => {
  const existing = await findProfilByUserId(userId, dbClient);
  if (!existing) return null;

  const namaLengkap = data.nama_lengkap !== undefined ? data.nama_lengkap : existing.nama_lengkap;
  const jenjangPendidikan = data.jenjang_pendidikan !== undefined ? data.jenjang_pendidikan : existing.jenjang_pendidikan;
  const nimNisn = data.nim_nisn !== undefined ? data.nim_nisn : existing.nim_nisn;
  const institusi = data.institusi !== undefined ? data.institusi : existing.institusi;
  const programStudi = data.program_studi !== undefined ? data.program_studi : existing.program_studi;
  const cvUrl = data.cv_url !== undefined ? data.cv_url : existing.cv_url;
  const onboardingStatus = data.onboarding_status !== undefined ? data.onboarding_status : existing.onboarding_status;

  const result = await dbClient.query(
    `UPDATE profil_peserta
     SET nama_lengkap = $1, jenjang_pendidikan = $2, nim_nisn = $3, institusi = $4, program_studi = $5, cv_url = $6, onboarding_status = $7, updated_at = NOW()
     WHERE user_id = $8
     RETURNING *`,
    [namaLengkap, jenjangPendidikan, nimNisn, institusi, programStudi, cvUrl, onboardingStatus, userId]
  );
  return result.rows[0] || null;
};

export const removeProfilById = async (id: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM profil_peserta WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const findInstitusiSuggestions = async (query?: string, dbClient: DbClient = db): Promise<string[]> => {
  if (!query || query.trim() === "") return [];
  let sql = `SELECT DISTINCT TRIM(institusi) AS value FROM profil_peserta WHERE institusi IS NOT NULL AND TRIM(institusi) != '' AND TRIM(institusi) != '-'`;
  const params: unknown[] = [];
  params.push(`%${query.trim()}%`);
  sql += ` AND institusi ILIKE $1 ORDER BY value ASC LIMIT 10`;
  const result = await dbClient.query(sql, params);
  return result.rows.map((row: { value: string }) => row.value);
};

export const findProdiSuggestions = async (query?: string, institusi?: string, dbClient: DbClient = db): Promise<string[]> => {
  if (!query || query.trim() === "") return [];
  let sql = `SELECT DISTINCT TRIM(program_studi) AS value FROM profil_peserta WHERE program_studi IS NOT NULL AND TRIM(program_studi) != '' AND TRIM(program_studi) != '-'`;
  const params: unknown[] = [];
  let paramIdx = 1;
  params.push(`%${query.trim()}%`);
  sql += ` AND program_studi ILIKE $${paramIdx++}`;
  if (institusi && institusi.trim() !== "" && institusi.trim() !== "-") {
    params.push(institusi.trim());
    sql += ` AND institusi ILIKE $${paramIdx++}`;
  }
  sql += ` ORDER BY value ASC LIMIT 10`;
  const result = await dbClient.query(sql, params);
  return result.rows.map((row: { value: string }) => row.value);
};
