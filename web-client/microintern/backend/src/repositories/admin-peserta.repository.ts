import { db, DbClient } from "../config/database";

export interface ParticipantFilters {
  search?: string;
  status?: string;
  institusi?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  prodi?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export const findParticipants = async (filters: ParticipantFilters): Promise<PaginatedResult<any>> => {
  // Inner query: pick ONLY the latest pengajuan_pkl (and its latest jadwal_pkl)
  // per user via DISTINCT ON, so a participant with multiple submissions
  // (e.g. one "selesai" + one "menunggu") doesn't fan out into multiple rows.
  const baseQuery = `
    SELECT DISTINCT ON (u.id)
      u.id, 
      u.email, 
      u.email_verified,
      p.nama_lengkap AS nama, 
      p.jenjang_pendidikan,
      p.nim_nisn AS nim, 
      p.institusi, 
      p.program_studi AS prodi,
      p.cv_url,
      p.onboarding_status,
      CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
      END AS status_pengajuan,
      jp.tanggal_mulai AS tanggal_masuk,
      jp.tanggal_selesai AS tanggal_keluar,
      u.created_at AS created_at
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    LEFT JOIN kelompok_anggota ka ON ka.user_id = u.id
    LEFT JOIN kelompok k ON k.id = ka.kelompok_id
    LEFT JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE u.role = 'peserta'
    ORDER BY u.id, pp.created_at DESC NULLS LAST, jp.tanggal_mulai DESC NULLS LAST
  `;

  // Filters are applied AFTER dedup, against the single latest-submission
  // row per user, so counts/pagination stay consistent with what's rendered.
  let queryText = `SELECT * FROM (${baseQuery}) AS sub WHERE 1=1`;

  const queryParams: any[] = [];
  let paramCount = 1;

  if (filters.search && filters.search.trim() !== "") {
    queryText += ` AND (sub.nama ILIKE $${paramCount} OR sub.nim ILIKE $${paramCount} OR sub.institusi ILIKE $${paramCount})`;
    queryParams.push(`%${filters.search.trim()}%`);
    paramCount++;
  }

  if (filters.status && filters.status !== "Semua" && filters.status.trim() !== "") {
    const parsedStatus = filters.status.toLowerCase().trim();
    queryText += ` AND sub.status_pengajuan = $${paramCount}`;
    queryParams.push(parsedStatus);
    paramCount++;
  }

  if (filters.institusi && filters.institusi !== "Semua" && filters.institusi.trim() !== "") {
    queryText += ` AND sub.institusi ILIKE $${paramCount}`;
    queryParams.push(filters.institusi.trim());
    paramCount++;
  }

  if (filters.prodi && filters.prodi !== "Semua" && filters.prodi.trim() !== "") {
    queryText += ` AND sub.prodi ILIKE $${paramCount}`;
    queryParams.push(filters.prodi.trim());
    paramCount++;
  }

  if (filters.startDate && filters.startDate.trim() !== "") {
    queryText += ` AND sub.tanggal_keluar >= $${paramCount}`;
    queryParams.push(filters.startDate);
    paramCount++;
  }

  if (filters.endDate && filters.endDate.trim() !== "") {
    queryText += ` AND sub.tanggal_masuk <= $${paramCount}`;
    queryParams.push(filters.endDate);
    paramCount++;
  }

  const countResult = await db.query(`SELECT COUNT(*)::int AS count FROM (${queryText}) AS counted`, queryParams);
  const total = countResult.rows[0]?.count || 0;

  queryText += ` ORDER BY sub.created_at DESC`;

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(limit, offset);

  const result = await db.query(queryText, queryParams);
  return {
    data: result.rows,
    total,
  };
};

export const findParticipantDetail = async (id: string): Promise<any | null> => {
  const queryText = `
    SELECT 
      u.id, 
      u.email, 
      u.email_verified,
      p.nama_lengkap AS nama, 
      p.jenjang_pendidikan,
      p.nim_nisn AS nim, 
      p.institusi, 
      p.program_studi AS prodi,
      p.cv_url,
      p.onboarding_status,
      CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
      END AS status_pengajuan,
      jp.tanggal_mulai AS tanggal_masuk,
      jp.tanggal_selesai AS tanggal_keluar,
      pp.surat_pengantar_url,
      pp.nama_penerbit_surat,
      pp.nomor_surat_pengantar,
      pp.tanggal_surat_pengantar,
      pp.perihal_surat,
      sb.file_url AS surat_balasan_url,
      sert.file_url AS sertifikat_url,
      u.created_at AS tgl_daftar
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    LEFT JOIN kelompok_anggota ka ON ka.user_id = u.id
    LEFT JOIN kelompok k ON k.id = ka.kelompok_id
    LEFT JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
    LEFT JOIN sertifikat sert ON sert.pengajuan_id = pp.id
    WHERE u.role = 'peserta' AND u.id = $1
    ORDER BY pp.created_at DESC NULLS LAST
    LIMIT 1
  `;
  const result = await db.query(queryText, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findParticipantAttendanceStats = async (id: string): Promise<any> => {
  const attendanceRes = await db.query(
    `SELECT 
       total_hadir::int,
       total_izin::int,
       total_alpha::int
     FROM v_rekap_presensi
     WHERE user_id = $1
     ORDER BY tanggal_masuk DESC`,
    [id]
  );
  return attendanceRes.rows[0] || { total_hadir: 0, total_izin: 0, total_alpha: 0 };
};

export const checkEmailExistsOtherThanUser = async (email: string, id: string, dbClient: DbClient = db): Promise<boolean> => {
  const emailCheck = await dbClient.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [email, id]);
  return emailCheck.rows.length > 0;
};

export const updateUserEmailAndPassword = async (id: string, email: string, passwordHash?: string, dbClient: DbClient = db): Promise<void> => {
  if (passwordHash) {
    await dbClient.query(`UPDATE users SET email = $1, password_hash = $2, updated_at = NOW() WHERE id = $3`, [email, passwordHash, id]);
  } else {
    await dbClient.query(`UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`, [email, id]);
  }
};

export const updateProfilPeserta = async (id: string, data: { nama: string; nim: string; institusi: string; prodi: string }, dbClient: DbClient = db): Promise<any | null> => {
  const result = await dbClient.query(
    `UPDATE profil_peserta
     SET nama_lengkap = $1, nim_nisn = $2, institusi = $3, program_studi = $4, updated_at = NOW()
     WHERE user_id = $5
     RETURNING *`,
    [data.nama, data.nim, data.institusi, data.prodi, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findParticipantHistori = async (id: string): Promise<any[]> => {
  const result = await db.query(`SELECT * FROM v_histori_pkl_peserta WHERE user_id = $1 ORDER BY created_at DESC`, [id]);
  return result.rows;
};

export interface StatItem {
  label: string;
  count: number;
}

export interface ParticipantStats {
  by_prodi: StatItem[];
  by_institusi: StatItem[];
  by_jenjang: StatItem[];
  by_tipe: StatItem[];
  durasi: {
    min: number | null;
    avg: number | null;
    max: number | null;
  };
}

export const getParticipantStats = async (): Promise<ParticipantStats> => {
  const byProdi = await db.query(`
    SELECT p.program_studi AS label, COUNT(*)::int AS count
    FROM profil_peserta p
    JOIN users u ON u.id = p.user_id
    WHERE u.role = 'peserta' AND p.program_studi IS NOT NULL
    GROUP BY p.program_studi
    ORDER BY count DESC
    LIMIT 10
  `);

  const byInstitusi = await db.query(`
    SELECT p.institusi AS label, COUNT(*)::int AS count
    FROM profil_peserta p
    JOIN users u ON u.id = p.user_id
    WHERE u.role = 'peserta' AND p.institusi IS NOT NULL
    GROUP BY p.institusi
    ORDER BY count DESC
    LIMIT 10
  `);

  const byJenjang = await db.query(`
    SELECT p.jenjang_pendidikan AS label, COUNT(*)::int AS count
    FROM profil_peserta p
    JOIN users u ON u.id = p.user_id
    WHERE u.role = 'peserta' AND p.jenjang_pendidikan IS NOT NULL
    GROUP BY p.jenjang_pendidikan
    ORDER BY count DESC
  `);

  const byTipe = await db.query(`
    SELECT k.jenis AS label, COUNT(*)::int AS count
    FROM kelompok_anggota ka
    JOIN kelompok k ON k.id = ka.kelompok_id
    JOIN users u ON u.id = ka.user_id
    WHERE u.role = 'peserta'
    GROUP BY k.jenis
  `);

  const durasiRes = await db.query(`
    SELECT 
      MIN(jp.tanggal_selesai - jp.tanggal_mulai)::int AS min_days,
      ROUND(AVG(jp.tanggal_selesai - jp.tanggal_mulai))::int AS avg_days,
      MAX(jp.tanggal_selesai - jp.tanggal_mulai)::int AS max_days
    FROM jadwal_pkl jp
  `);

  return {
    by_prodi: byProdi.rows,
    by_institusi: byInstitusi.rows,
    by_jenjang: byJenjang.rows,
    by_tipe: byTipe.rows,
    durasi: {
      min: durasiRes.rows[0]?.min_days ?? null,
      avg: durasiRes.rows[0]?.avg_days ?? null,
      max: durasiRes.rows[0]?.max_days ?? null,
    },
  };
};

export { findPresensiByUserIdAdmin } from "./presensi.repository";
