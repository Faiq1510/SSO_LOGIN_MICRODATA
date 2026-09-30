import { db, DbClient } from "../config/database";
import { PaginatedResult } from "./admin-peserta.repository";

export interface PengajuanPkl {
  id: string;
  kelompok_id: string;
  tanggal_masuk: Date | string;
  tanggal_keluar: Date | string;
  surat_pengantar_url: string;
  nama_penerbit_surat: string | null;
  nomor_surat_pengantar: string | null;
  tanggal_surat_pengantar: Date | string | null;
  perihal_surat: string | null;
  status: "menunggu" | "aktif" | "selesai" | "ditolak";
  alasan_tolak: string | null;
  surat_balasan_url: string | null;
  catatan: string | null;
  diproses_oleh: string | null;
  diproses_pada: Date | null;
  jenis_kelompok?: "individu" | "kelompok";
  anggota?: any[];
  created_at: Date;
  updated_at: Date;
}

export interface JadwalPkl {
  id: string;
  pengajuan_id: string;
  kelompok_id: string;
  tanggal_mulai: Date | string;
  tanggal_selesai: Date | string;
  status: "menunggu" | "aktif" | "selesai" | "ditolak";
  created_at: Date;
}

export interface KuotaCheckResult {
  peserta_aktif: number;
  kapasitas_maks: number;
  tersedia: boolean;
}

export interface JadwalPublik {
  pengajuan_id: string;
  tanggal_masuk: Date | string;
  tanggal_keluar: Date | string;
  jenis_kelompok: "individu" | "kelompok";
  jumlah_peserta: number;
  institusi: string;
  program_studi: string;
  periode_status: "berjalan" | "mendatang" | null;
}

export const createPengajuan = async (
  data: {
    kelompok_id: string;
    surat_pengantar_url: string;
    nama_penerbit_surat: string;
    nomor_surat_pengantar: string;
    tanggal_surat_pengantar: string | Date;
    perihal_surat: string;
  },
  dbClient: DbClient = db
): Promise<Omit<PengajuanPkl, "tanggal_masuk" | "tanggal_keluar">> => {
  const result = await dbClient.query(
    `INSERT INTO pengajuan_pkl (
      kelompok_id, surat_pengantar_url, nama_penerbit_surat, nomor_surat_pengantar, tanggal_surat_pengantar, perihal_surat
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.kelompok_id, data.surat_pengantar_url, data.nama_penerbit_surat, data.nomor_surat_pengantar, data.tanggal_surat_pengantar, data.perihal_surat]
  );
  return result.rows[0];
};

export const findPengajuanById = async (id: string, dbClient: DbClient = db): Promise<PengajuanPkl | null> => {
  const result = await dbClient.query(
    `SELECT pp.*, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, sb.file_url AS surat_balasan_url,
            CASE
              WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
              ELSE pp.status::text
            END AS status
     FROM pengajuan_pkl pp
     LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
     LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
     WHERE pp.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findPengajuanByKelompokId = async (kelompokId: string, dbClient: DbClient = db): Promise<PengajuanPkl | null> => {
  const result = await dbClient.query(
    `SELECT pp.*, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, sb.file_url AS surat_balasan_url,
            CASE
              WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
              ELSE pp.status::text
            END AS status
     FROM pengajuan_pkl pp
     LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
     LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
     WHERE pp.kelompok_id = $1`,
    [kelompokId]
  );
  return result.rows[0] || null;
};

export const findPengajuanByUserId = async (userId: string, dbClient: DbClient = db): Promise<PengajuanPkl | null> => {
  const result = await dbClient.query(
    `SELECT pp.*, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, sb.file_url AS surat_balasan_url,
            k.jenis AS jenis_kelompok,
            CASE
              WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
              ELSE pp.status::text
            END AS status
     FROM pengajuan_pkl pp
     JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
     JOIN kelompok k ON k.id = pp.kelompok_id
     LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
     LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
     WHERE ka.user_id = $1
     ORDER BY
       CASE
         WHEN pp.status = 'aktif' AND (jp.tanggal_selesai IS NULL OR jp.tanggal_selesai > CURRENT_DATE) THEN 1
         WHEN pp.status = 'menunggu' THEN 2
         WHEN pp.status = 'ditolak' THEN 3
         WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 4
         ELSE 5
       END,
       pp.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const findAllPengajuanByUserId = async (userId: string, dbClient: DbClient = db): Promise<any[]> => {
  const result = await dbClient.query(
    `SELECT pp.*, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar, k.jenis AS jenis_kelompok,
            s.file_url AS sertifikat_url, s.nomor_sertifikat,
            CASE
              WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
              ELSE pp.status::text
            END AS status
     FROM pengajuan_pkl pp
     JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
     JOIN kelompok k ON k.id = pp.kelompok_id
     LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
     LEFT JOIN sertifikat s ON s.pengajuan_id = pp.id AND s.user_id = ka.user_id
     WHERE ka.user_id = $1
     ORDER BY pp.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export interface PengajuanFilters {
  status?: "menunggu" | "aktif" | "selesai" | "ditolak";
  page?: number;
  limit?: number;
}

export const findAllPengajuan = async (filters?: PengajuanFilters, dbClient: DbClient = db): Promise<PaginatedResult<any>> => {
  let countQuery = `
    SELECT COUNT(DISTINCT pp.id)::int AS count
    FROM pengajuan_pkl pp
    JOIN kelompok k ON k.id = pp.kelompok_id
    JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
    JOIN profil_peserta pr ON pr.user_id = ka.user_id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
  `;

  let query = `
    SELECT pp.*, jp.tanggal_mulai AS tanggal_masuk, jp.tanggal_selesai AS tanggal_keluar,
           k.jenis AS jenis_kelompok, k.ketua_id,
           sb.file_url AS surat_balasan_url,
           CASE
             WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
             ELSE pp.status::text
           END AS status,
           json_agg(
             json_build_object(
               'user_id', ka.user_id,
               'nama_lengkap', pr.nama_lengkap,
               'jenjang_pendidikan', pr.jenjang_pendidikan,
               'nim_nisn', pr.nim_nisn,
               'institusi', pr.institusi,
               'program_studi', pr.program_studi,
               'cv_url', pr.cv_url
             )
           ) AS anggota
    FROM pengajuan_pkl pp
    JOIN kelompok k ON k.id = pp.kelompok_id
    JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
    JOIN profil_peserta pr ON pr.user_id = ka.user_id
    LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
    LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
  `;

  const values: any[] = [];
  if (filters?.status) {
    if (filters.status === "selesai") {
      const condition = " WHERE pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE";
      countQuery += condition;
      query += condition;
    } else if (filters.status === "aktif") {
      const condition = " WHERE pp.status = 'aktif' AND jp.tanggal_selesai > CURRENT_DATE";
      countQuery += condition;
      query += condition;
    } else {
      const condition = " WHERE pp.status = $1";
      countQuery += condition;
      query += condition;
      values.push(filters.status);
    }
  }

  const countResult = await dbClient.query(countQuery, values);
  const total = countResult.rows[0]?.count || 0;

  query += `
    GROUP BY pp.id, k.id, jp.tanggal_mulai, jp.tanggal_selesai, sb.file_url
    ORDER BY pp.created_at DESC
  `;

  const page = filters?.page;
  const limit = filters?.limit;

  if (limit !== undefined && page !== undefined) {
    const offset = (page - 1) * limit;
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await dbClient.query(query, [...values, limit, offset]);
    return { data: result.rows, total };
  } else if (limit !== undefined) {
    query += ` LIMIT $${values.length + 1}`;
    const result = await dbClient.query(query, [...values, limit]);
    return { data: result.rows, total };
  } else {
    const result = await dbClient.query(query, values);
    return { data: result.rows, total };
  }
};

export const updatePengajuanStatus = async (
  id: string,
  data: {
    status: "menunggu" | "aktif" | "ditolak";
    alasan_tolak?: string | null;
    catatan?: string | null;
    diproses_oleh: string;
  },
  dbClient: DbClient = db
): Promise<PengajuanPkl | null> => {
  const alasanTolak = data.status === "ditolak" ? data.alasan_tolak || "" : null;
  const catatan = data.status === "aktif" ? data.catatan || null : null;

  const result = await dbClient.query(
    `UPDATE pengajuan_pkl
     SET status = $1, alasan_tolak = $2, diproses_oleh = $3, diproses_pada = NOW(), updated_at = NOW(),
         catatan = $4
     WHERE id = $5
     RETURNING *`,
    [data.status, alasanTolak, data.diproses_oleh, catatan, id]
  );

  const updated = result.rows[0];
  if (!updated) return null;

  return findPengajuanById(id, dbClient);
};

export const checkKuota = async (
  tanggalMasuk: string | Date,
  tanggalKeluar: string | Date,
  excludeId: string | null = null,
  dbClient: DbClient = db
): Promise<KuotaCheckResult> => {
  const result = await dbClient.query("SELECT peserta_aktif, kapasitas_maks, tersedia FROM cek_kuota_pkl($1, $2, $3)", [tanggalMasuk, tanggalKeluar, excludeId]);

  if (result.rows.length === 0) {
    return { peserta_aktif: 0, kapasitas_maks: 10, tersedia: true };
  }

  return {
    peserta_aktif: parseInt(result.rows[0].peserta_aktif, 10),
    kapasitas_maks: parseInt(result.rows[0].kapasitas_maks, 10),
    tersedia: result.rows[0].tersedia,
  };
};

export const getJadwalPublik = async (dbClient: DbClient = db): Promise<JadwalPublik[]> => {
  const result = await dbClient.query("SELECT * FROM v_jadwal_pkl_publik ORDER BY tanggal_masuk ASC");
  return result.rows;
};

export const findJadwalByUserId = async (userId: string, dbClient: DbClient = db): Promise<JadwalPkl | null> => {
  const result = await dbClient.query(
    `SELECT jp.id, jp.pengajuan_id, pp.kelompok_id, jp.tanggal_mulai, jp.tanggal_selesai, jp.created_at,
            CASE
              WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
              ELSE pp.status::text
            END AS status
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
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const insertJadwalPkl = async (data: { pengajuan_id: string; tanggal_mulai: string | Date; tanggal_selesai: string | Date }, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query(`INSERT INTO jadwal_pkl (pengajuan_id, tanggal_mulai, tanggal_selesai) VALUES ($1, $2, $3)`, [data.pengajuan_id, data.tanggal_mulai, data.tanggal_selesai]);
};

export const deleteJadwalByPengajuanId = async (pengajuanId: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM jadwal_pkl WHERE pengajuan_id = $1", [pengajuanId]);
};

export const deletePengajuanById = async (id: string, dbClient: DbClient = db): Promise<void> => {
  await dbClient.query("DELETE FROM pengajuan_pkl WHERE id = $1", [id]);
};
