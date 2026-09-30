import { db, DbClient } from "../config/database";
import { getLocalDateString } from "../utils/date";

export interface Presensi {
  id: string;
  user_id: string;
  tanggal: Date | string;
  jam_masuk: Date | string | null;
  jam_keluar: Date | string | null;
  status: "hadir" | "izin" | "alpha";
  created_at: Date;
  updated_at: Date;
}

export interface RekapPresensi {
  user_id: string;
  nama_lengkap: string;
  institusi: string;
  program_studi: string;
  tanggal_masuk: Date | string;
  tanggal_keluar: Date | string;
  total_hadir: number;
  total_izin: number;
  total_alpha: number;
  total_tercatat: number;
}

export const recordMasuk = async (
  userId: string,
  tanggal: string | Date = getLocalDateString(),
  status: "hadir" | "izin" | "alpha" = "hadir",
  dbClient: DbClient = db
): Promise<Presensi> => {
  const normalizedStatus = status.toLowerCase() as "hadir" | "izin" | "alpha";
  const jamMasuk = normalizedStatus === "hadir" ? "NOW()" : "NULL";

  const query = `
    INSERT INTO presensi (user_id, tanggal, jam_masuk, status)
    VALUES ($1, $2, ${jamMasuk === "NOW()" ? "NOW()" : "NULL"}, $3)
    ON CONFLICT (user_id, tanggal) DO UPDATE
    SET status = EXCLUDED.status,
        jam_masuk = COALESCE(presensi.jam_masuk, EXCLUDED.jam_masuk),
        updated_at = NOW()
    RETURNING *
  `;
  const result = await dbClient.query(query, [userId, tanggal, normalizedStatus]);
  return result.rows[0];
};

export const recordKeluar = async (userId: string, tanggal: string | Date = getLocalDateString(), dbClient: DbClient = db): Promise<Presensi | null> => {
  const result = await dbClient.query(
    `UPDATE presensi
     SET jam_keluar = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND tanggal = $2 AND jam_masuk IS NOT NULL
     RETURNING *`,
    [userId, tanggal]
  );
  return result.rows[0] || null;
};

export const findPresensiByUserIdAndDate = async (userId: string, tanggal: string | Date, dbClient: DbClient = db): Promise<Presensi | null> => {
  const result = await dbClient.query("SELECT * FROM presensi WHERE user_id = $1 AND tanggal = $2", [userId, tanggal]);
  return result.rows[0] || null;
};

export const findPresensiByUserId = async (userId: string, dbClient: DbClient = db): Promise<any[]> => {
  const query = `
    SELECT 
      p.id,
      $1 AS user_id,
      t.day::date AS tanggal,
      p.jam_masuk,
      p.jam_keluar,
      CASE 
        WHEN p.status IS NOT NULL THEN p.status::text
        WHEN EXTRACT(ISODOW FROM t.day) >= 6 THEN 'belum'
        WHEN t.day::date < CURRENT_DATE THEN 'alpha'
        WHEN t.day::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings LIMIT 1) THEN 'alpha'
        ELSE 'belum'
      END AS status,
      p.created_at,
      p.updated_at,
      i.kategori AS kategori_izin
    FROM (
      SELECT jp.tanggal_mulai, jp.tanggal_selesai
      FROM jadwal_pkl jp
      JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
      JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
      WHERE ka.user_id = $1
      ORDER BY
        CASE
          WHEN pp.status = 'aktif' AND jp.tanggal_selesai > CURRENT_DATE THEN 1
          WHEN pp.status = 'menunggu' THEN 2
          WHEN pp.status = 'ditolak' THEN 3
          WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 4
          ELSE 5
        END,
        pp.created_at DESC
      LIMIT 1
    ) current_jp
    CROSS JOIN generate_series(current_jp.tanggal_mulai::timestamp, current_jp.tanggal_selesai::timestamp, '1 day'::interval) AS t(day)
    LEFT JOIN presensi p ON p.user_id = $1 AND p.tanggal = t.day::date
    LEFT JOIN izin i ON i.user_id = $1 AND i.tanggal = t.day::date
    WHERE (EXTRACT(ISODOW FROM t.day) < 6 OR p.id IS NOT NULL)
    ORDER BY t.day DESC
  `;
  const result = await dbClient.query(query, [userId]);
  return result.rows;
};

export const getRekapPresensi = async (dbClient: DbClient = db): Promise<RekapPresensi[]> => {
  const result = await dbClient.query("SELECT * FROM v_rekap_presensi");
  return result.rows.map((row) => ({
    user_id: row.user_id,
    nama_lengkap: row.nama_lengkap,
    institusi: row.institusi,
    program_studi: row.program_studi,
    tanggal_masuk: row.tanggal_masuk,
    tanggal_keluar: row.tanggal_keluar,
    total_hadir: parseInt(row.total_hadir || "0", 10),
    total_izin: parseInt(row.total_izin || "0", 10),
    total_alpha: parseInt(row.total_alpha || "0", 10),
    total_tercatat: parseInt(row.total_tercatat || "0", 10),
  }));
};

export const getRekapPresensiByUserId = async (userId: string, dbClient: DbClient = db): Promise<RekapPresensi | null> => {
  const result = await dbClient.query("SELECT * FROM v_rekap_presensi WHERE user_id = $1 ORDER BY tanggal_masuk DESC", [userId]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    user_id: row.user_id,
    nama_lengkap: row.nama_lengkap,
    institusi: row.institusi,
    program_studi: row.program_studi,
    tanggal_masuk: row.tanggal_masuk,
    tanggal_keluar: row.tanggal_keluar,
    total_hadir: parseInt(row.total_hadir || "0", 10),
    total_izin: parseInt(row.total_izin || "0", 10),
    total_alpha: parseInt(row.total_alpha || "0", 10),
    total_tercatat: parseInt(row.total_tercatat || "0", 10),
  };
};

export const getPresensiHarian = async (tanggal: string | Date, dbClient: DbClient = db): Promise<any[]> => {
  const result = await dbClient.query(
    `SELECT * FROM (
       SELECT DISTINCT ON (u.id)
         u.id AS user_id,
         pr.nama_lengkap,
         pr.institusi,
         pr.program_studi,
         p.id AS id,
         p.tanggal,
         p.jam_masuk,
         p.jam_keluar,
         i.kategori AS kategori_izin,
         CASE 
           WHEN p.status IS NOT NULL THEN p.status::text
           WHEN EXTRACT(ISODOW FROM $1::date) >= 6 THEN 'belum'
           WHEN $1::date < CURRENT_DATE THEN 'alpha'
           WHEN $1::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings WHERE id = 1 LIMIT 1) THEN 'alpha'
           ELSE 'belum'
         END AS status
       FROM users u
       JOIN profil_peserta pr ON pr.user_id = u.id
       JOIN kelompok_anggota ka ON ka.user_id = u.id
       JOIN kelompok k ON k.id = ka.kelompok_id
       JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
       JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
       LEFT JOIN presensi p ON p.user_id = u.id AND p.tanggal = $1::date
       LEFT JOIN izin i ON i.user_id = u.id AND i.tanggal = $1::date
       WHERE pp.status = 'aktif'
         AND $1::date >= jp.tanggal_mulai
         AND $1::date <= jp.tanggal_selesai
       ORDER BY u.id, pp.created_at DESC
     ) sub
     ORDER BY nama_lengkap ASC`,
    [tanggal]
  );
  return result.rows;
};

export const deletePresensiByUserAndDate = async (userId: string, date: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM presensi WHERE user_id = $1 AND tanggal = $2", [userId, date]);
};

export const findPresensiByUserIdAdmin = async (userId: string, dbClient: DbClient = db): Promise<any[]> => {
  const query = `
    SELECT 
      p.id,
      $1 AS user_id,
      t.day::date AS tanggal,
      p.jam_masuk,
      p.jam_keluar,
      CASE 
        WHEN p.status IS NOT NULL THEN p.status::text
        WHEN EXTRACT(ISODOW FROM t.day) >= 6 THEN 'belum'
        WHEN t.day::date < CURRENT_DATE THEN 'alpha'
        WHEN t.day::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings LIMIT 1) THEN 'alpha'
        ELSE 'belum'
      END AS status,
      p.created_at,
      p.updated_at,
      i.kategori AS kategori_izin
    FROM (
      SELECT jp.tanggal_mulai, jp.tanggal_selesai
      FROM jadwal_pkl jp
      JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
      JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
      WHERE ka.user_id = $1
      ORDER BY
        CASE
          WHEN pp.status = 'aktif' AND jp.tanggal_selesai > CURRENT_DATE THEN 1
          WHEN pp.status = 'menunggu' THEN 2
          WHEN pp.status = 'ditolak' THEN 3
          WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 4
          ELSE 5
        END,
        pp.created_at DESC
      LIMIT 1
    ) current_jp
    CROSS JOIN generate_series(current_jp.tanggal_mulai::timestamp, current_jp.tanggal_selesai::timestamp, '1 day'::interval) AS t(day)
    LEFT JOIN presensi p ON p.user_id = $1 AND p.tanggal = t.day::date
    LEFT JOIN izin i ON i.user_id = $1 AND i.tanggal = t.day::date
    WHERE (EXTRACT(ISODOW FROM t.day) < 6 OR p.id IS NOT NULL)
    ORDER BY t.day ASC
  `;
  const result = await dbClient.query(query, [userId]);
  return result.rows;
};
