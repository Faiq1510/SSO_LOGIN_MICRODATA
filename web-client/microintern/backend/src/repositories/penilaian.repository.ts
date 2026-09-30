import { db, DbClient } from "../config/database";
import { PaginatedResult } from "./admin-peserta.repository";

export interface PenilaianItem {
  id: string;
  penilaian_id: string;
  kriteria_id: string;
  nilai: number;
  nama_kriteria?: string;
  urutan?: number;
}

export interface Penilaian {
  id: string;
  user_id: string;
  pengajuan_id: string;
  dinilai_oleh: string;
  template_id: string;
  nilai_akhir: number;
  catatan: string | null;
  created_at: Date;
  updated_at: Date;
  items?: PenilaianItem[];
}

const getPenilaianItems = async (penilaianId: string, dbClient: DbClient = db): Promise<PenilaianItem[]> => {
  const result = await dbClient.query(
    `SELECT pi.*, tk.nama_kriteria, tk.urutan
     FROM penilaian_item pi
     JOIN template_kriteria tk ON tk.id = pi.kriteria_id
     WHERE pi.penilaian_id = $1
     ORDER BY tk.urutan ASC, tk.created_at ASC`,
    [penilaianId]
  );
  return result.rows;
};

export const createPenilaian = async (
  data: {
    user_id: string;
    pengajuan_id: string;
    dinilai_oleh: string;
    template_id: string;
    nilai_akhir: number;
    catatan?: string | null;
    items: { kriteria_id: string; nilai: number }[];
  },
  dbClient: DbClient = db
): Promise<Penilaian> => {
  const catatan = data.catatan || null;

  const result = await dbClient.query(
    `INSERT INTO penilaian (user_id, pengajuan_id, dinilai_oleh, template_id, nilai_akhir, catatan)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.user_id, data.pengajuan_id, data.dinilai_oleh, data.template_id, data.nilai_akhir, catatan]
  );
  const penilaian = result.rows[0];

  for (const item of data.items) {
    await dbClient.query(
      `INSERT INTO penilaian_item (penilaian_id, kriteria_id, nilai)
       VALUES ($1, $2, $3)`,
      [penilaian.id, item.kriteria_id, item.nilai]
    );
  }

  penilaian.items = await getPenilaianItems(penilaian.id, dbClient);
  return penilaian;
};

export const findPenilaianById = async (id: string, dbClient: DbClient = db): Promise<Penilaian | null> => {
  const result = await dbClient.query("SELECT * FROM penilaian WHERE id = $1", [id]);
  const penilaian = result.rows[0] || null;
  if (penilaian) {
    penilaian.items = await getPenilaianItems(penilaian.id, dbClient);
  }
  return penilaian;
};

export const findPenilaianByUserId = async (userId: string, dbClient: DbClient = db): Promise<Penilaian | null> => {
  const result = await dbClient.query("SELECT * FROM penilaian WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
  const penilaian = result.rows[0] || null;
  if (penilaian) {
    penilaian.items = await getPenilaianItems(penilaian.id, dbClient);
  }
  return penilaian;
};

export const findPenilaianByUserAndPengajuan = async (userId: string, pengajuanId: string, dbClient: DbClient = db): Promise<Penilaian | null> => {
  const result = await dbClient.query("SELECT * FROM penilaian WHERE user_id = $1 AND pengajuan_id = $2", [userId, pengajuanId]);
  const penilaian = result.rows[0] || null;
  if (penilaian) {
    penilaian.items = await getPenilaianItems(penilaian.id, dbClient);
  }
  return penilaian;
};

export const findAllPenilaian = async (filters?: { nama_peserta?: string }, dbClient: DbClient = db): Promise<any[]> => {
  let query = `
    SELECT p.*, pr.nama_lengkap, pr.institusi, pr.program_studi, u.email,
           admin_pr.nama_lengkap AS nama_penilai
    FROM penilaian p
    JOIN users u ON u.id = p.user_id
    JOIN profil_peserta pr ON pr.user_id = u.id
    JOIN users admin_u ON admin_u.id = p.dinilai_oleh
    LEFT JOIN profil_peserta admin_pr ON admin_pr.user_id = admin_u.id
  `;

  const values: any[] = [];
  if (filters?.nama_peserta) {
    values.push(`%${filters.nama_peserta}%`);
    query += " WHERE pr.nama_lengkap ILIKE $1";
  }

  query += " ORDER BY p.created_at DESC";

  const result = await dbClient.query(query, values);
  return result.rows;
};

export const updatePenilaian = async (
  id: string,
  data: {
    nilai_akhir: number;
    catatan?: string | null;
    template_id?: string;
    items: { kriteria_id: string; nilai: number }[];
  },
  dbClient: DbClient = db
): Promise<Penilaian | null> => {
  const existing = await findPenilaianById(id, dbClient);
  if (!existing) {
    return null;
  }

  const catatan = data.catatan !== undefined ? data.catatan : existing.catatan;
  const templateId = data.template_id !== undefined ? data.template_id : existing.template_id;

  const result = await dbClient.query(
    `UPDATE penilaian
     SET nilai_akhir = $1, catatan = $2, template_id = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [data.nilai_akhir, catatan, templateId, id]
  );
  const penilaian = result.rows[0];

  await dbClient.query("DELETE FROM penilaian_item WHERE penilaian_id = $1", [id]);

  for (const item of data.items) {
    await dbClient.query(
      `INSERT INTO penilaian_item (penilaian_id, kriteria_id, nilai)
       VALUES ($1, $2, $3)`,
      [id, item.kriteria_id, item.nilai]
    );
  }

  penilaian.items = await getPenilaianItems(id, dbClient);
  return penilaian;
};

export const removePenilaianById = async (id: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM penilaian WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const findPesertaSelesaiForEvaluation = async (userId: string, dbClient: DbClient = db): Promise<any | null> => {
  const checkQuery = `
    SELECT
      CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
      END AS status
    FROM pengajuan_pkl pp
    JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE ka.user_id = $1
    ORDER BY jp.tanggal_selesai DESC
    LIMIT 1
  `;
  const checkRes = await dbClient.query(checkQuery, [userId]);
  return checkRes.rows.length > 0 ? checkRes.rows[0] : null;
};

export const findLatestSelesaiPengajuan = async (userId: string, dbClient: DbClient = db): Promise<string | null> => {
  const latestSelesaiQuery = `
    SELECT pp.id FROM pengajuan_pkl pp
    JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE ka.user_id = $1 AND pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE
    ORDER BY jp.tanggal_selesai DESC LIMIT 1
  `;
  const latestRes = await dbClient.query(latestSelesaiQuery, [userId]);
  return latestRes.rows[0]?.id || null;
};

export const findAllEvaluationsAdmin = async (page = 1, limit = 10, dbClient: DbClient = db): Promise<PaginatedResult<any>> => {
  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    JOIN kelompok_anggota ka ON ka.user_id = u.id
    JOIN kelompok k ON k.id = ka.kelompok_id
    JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE u.role = 'peserta' AND pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE
  `;

  const countResult = await dbClient.query(countQuery);
  const total = countResult.rows[0]?.count || 0;

  const queryText = `
    SELECT 
      u.id AS user_id,
      u.email,
      p.nama_lengkap AS nama,
      p.nim_nisn AS nim,
      p.institusi,
      p.program_studi AS prodi,
      CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
      END AS status_pengajuan,
      jp.tanggal_mulai AS tanggal_masuk,
      jp.tanggal_selesai AS tanggal_keluar,
      pp.id AS pengajuan_id,
      pn.id AS penilaian_id,
      pn.nilai_akhir,
      pn.created_at AS penilaian_created_at,
      s.file_url AS sertifikat_url
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    JOIN kelompok_anggota ka ON ka.user_id = u.id
    JOIN kelompok k ON k.id = ka.kelompok_id
    JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    LEFT JOIN penilaian pn ON pn.pengajuan_id = pp.id AND pn.user_id = u.id
    LEFT JOIN sertifikat s ON s.pengajuan_id = pp.id AND s.user_id = u.id
    WHERE u.role = 'peserta' AND pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE
    ORDER BY jp.tanggal_selesai DESC, p.nama_lengkap ASC
    LIMIT $1 OFFSET $2
  `;

  const offset = (page - 1) * limit;
  const result = await dbClient.query(queryText, [limit, offset]);
  return {
    data: result.rows,
    total,
  };
};

export const checkPesertaStatusForEvaluation = async (userId: string, dbClient: DbClient = db): Promise<any | null> => {
  const checkQuery = `
    SELECT 
      u.id AS user_id,
      p.nama_lengkap AS nama,
      p.nim_nisn AS nim,
      p.institusi,
      p.program_studi AS prodi,
      CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
      END AS status_pengajuan,
      jp.tanggal_selesai AS tanggal_keluar
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    JOIN kelompok_anggota ka ON ka.user_id = u.id
    JOIN kelompok k ON k.id = ka.kelompok_id
    JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE u.id = $1 AND u.role = 'peserta'
    ORDER BY jp.tanggal_selesai DESC
    LIMIT 1
  `;
  const checkRes = await dbClient.query(checkQuery, [userId]);
  return checkRes.rows.length > 0 ? checkRes.rows[0] : null;
};

export const syncEvaluationsForInstitusi = async (institusi: string, templateId: string, dbClient: DbClient = db): Promise<void> => {
  if (!institusi || !templateId) return;

  const kriteriaRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1 ORDER BY urutan ASC, created_at ASC", [templateId]);
  const targetKriteria = kriteriaRes.rows;
  if (targetKriteria.length === 0) return;

  const evaluationsRes = await dbClient.query(
    `SELECT pn.* 
     FROM penilaian pn
     JOIN profil_peserta pr ON pr.user_id = pn.user_id
     WHERE LOWER(pr.institusi) = LOWER($1)`,
    [institusi]
  );
  const evaluations = evaluationsRes.rows;

  for (const ev of evaluations) {
    const oldItemsRes = await dbClient.query(
      `SELECT pi.nilai, tk.nama_kriteria
       FROM penilaian_item pi
       JOIN template_kriteria tk ON tk.id = pi.kriteria_id
       WHERE pi.penilaian_id = $1`,
      [ev.id]
    );

    const oldScoresByName = new Map<string, number>();
    for (const row of oldItemsRes.rows) {
      if (row.nama_kriteria) {
        oldScoresByName.set(row.nama_kriteria.trim().toLowerCase(), Number(row.nilai));
      }
    }

    const existingScores = Array.from(oldScoresByName.values());
    const avgScore = existingScores.length > 0 ? Number((existingScores.reduce((a, b) => a + b, 0) / existingScores.length).toFixed(2)) : 80;

    await dbClient.query("DELETE FROM penilaian_item WHERE penilaian_id = $1", [ev.id]);

    const newScores: number[] = [];

    for (const tk of targetKriteria) {
      const nameKey = tk.nama_kriteria.trim().toLowerCase();
      const score = oldScoresByName.has(nameKey) ? oldScoresByName.get(nameKey)! : avgScore;
      newScores.push(score);

      await dbClient.query("INSERT INTO penilaian_item (penilaian_id, kriteria_id, nilai) VALUES ($1, $2, $3)", [ev.id, tk.id, score]);
    }

    const newNilaiAkhir = newScores.length > 0 ? Number((newScores.reduce((a, b) => a + b, 0) / newScores.length).toFixed(2)) : ev.nilai_akhir;

    await dbClient.query("UPDATE penilaian SET template_id = $1, nilai_akhir = $2, updated_at = NOW() WHERE id = $3", [templateId, newNilaiAkhir, ev.id]);
  }
};
