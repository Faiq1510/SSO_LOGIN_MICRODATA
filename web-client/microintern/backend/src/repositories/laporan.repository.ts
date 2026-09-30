import { db } from "../config/database";

export const fetchPeserta = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const values: any[] = [];
  const conditions: string[] = ["u.role = 'peserta'"];

  if (startDate) {
    values.push(startDate);
    conditions.push(`u.created_at::date >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    conditions.push(`u.created_at::date <= $${values.length}`);
  }

  const query = `
    SELECT 
      p.nama_lengkap AS "Nama",
      p.nim_nisn AS "NIM/NISN",
      u.email AS "Email",
      p.institusi AS "Institusi",
      p.program_studi AS "Program Studi",
      CASE 
        WHEN pp.status = 'menunggu' THEN 'Menunggu'
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'Selesai'
        WHEN pp.status = 'aktif' THEN 'Aktif'
        WHEN pp.status = 'ditolak' THEN 'Ditolak'
        ELSE 'Belum Mengajukan'
      END AS "Status",
      TO_CHAR(u.created_at, 'DD Mon YYYY') AS "Tgl Daftar"
    FROM users u
    JOIN profil_peserta p ON p.user_id = u.id
    LEFT JOIN kelompok_anggota ka ON ka.user_id = u.id
    LEFT JOIN kelompok k ON k.id = ka.kelompok_id
    LEFT JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY u.created_at DESC
  `;
  const result = await db.query(query, values);
  return result.rows;
};

export const fetchPresensi = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const values: any[] = [];
  const dateConditions: string[] = [];

  if (startDate) {
    values.push(startDate);
    dateConditions.push(`t.day::date >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    dateConditions.push(`t.day::date <= $${values.length}`);
  }

  const dateWhereClause = dateConditions.length > 0 ? `AND ${dateConditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      pr.nama_lengkap AS "Nama",
      pr.institusi AS "Institusi",
      TO_CHAR(t.day::date, 'YYYY-MM-DD') AS "Tanggal",
      COALESCE(TO_CHAR(p.jam_masuk AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'), '-') AS "Jam Masuk",
      COALESCE(TO_CHAR(p.jam_keluar AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'), '-') AS "Jam Keluar",
      CASE 
        WHEN p.status IS NOT NULL THEN 
          CASE 
            WHEN p.status = 'hadir' THEN 'Hadir'
            WHEN p.status = 'izin' THEN 'Izin'
            ELSE p.status::text
          END
        WHEN EXTRACT(ISODOW FROM t.day) >= 6 THEN 'Belum'
        WHEN t.day::date < CURRENT_DATE THEN 'Alpha'
        WHEN t.day::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings WHERE id = 1 LIMIT 1) THEN 'Alpha'
        ELSE 'Belum'
      END AS "Status"
    FROM users u
    JOIN profil_peserta pr ON pr.user_id = u.id
    JOIN kelompok_anggota ka ON ka.user_id = u.id
    JOIN kelompok k ON k.id = ka.kelompok_id
    JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
    JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    CROSS JOIN generate_series(jp.tanggal_mulai::timestamp, jp.tanggal_selesai::timestamp, '1 day'::interval) AS t(day)
    LEFT JOIN presensi p ON p.user_id = u.id AND p.tanggal = t.day::date
    WHERE pp.status = 'aktif'
      AND (EXTRACT(ISODOW FROM t.day) < 6 OR p.id IS NOT NULL)
      ${dateWhereClause}
    ORDER BY t.day DESC, pr.nama_lengkap ASC
  `;
  const result = await db.query(query, values);
  return result.rows;
};

export const fetchNilai = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const values: any[] = [];
  const conditions: string[] = [];

  if (startDate) {
    values.push(startDate);
    conditions.push(`p.created_at::date >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    conditions.push(`p.created_at::date <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      pr.nama_lengkap AS "Nama",
      pr.nim_nisn AS "NIM/NISN",
      pr.institusi AS "Institusi",
      pr.program_studi AS "Program Studi",
      COALESCE(TO_CHAR(jp.tanggal_selesai, 'YYYY-MM-DD'), '-') AS "Tgl Selesai PKL",
      p.nilai_akhir AS "Nilai Akhir",
      COALESCE(p.catatan, '-') AS "Catatan"
    FROM penilaian p
    JOIN users u ON p.user_id = u.id
    JOIN profil_peserta pr ON pr.user_id = u.id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = p.pengajuan_id
    ${whereClause}
    ORDER BY p.created_at DESC
  `;
  const result = await db.query(query, values);
  return result.rows;
};
