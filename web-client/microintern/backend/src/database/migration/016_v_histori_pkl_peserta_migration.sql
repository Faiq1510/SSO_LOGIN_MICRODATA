-- 016_v_histori_pkl_peserta_migration.sql
-- Migration untuk menambahkan view histori pkl peserta

-- 1. View Histori PKL Peserta
CREATE OR REPLACE VIEW v_histori_pkl_peserta AS
SELECT
    ka.user_id,
    pp.id                           AS pengajuan_id,
    jp.tanggal_mulai,
    jp.tanggal_selesai,
    k.jenis                         AS jenis_kelompok,
    COUNT(ka2.user_id)              AS jumlah_anggota,
    CASE
        WHEN pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE THEN 'selesai'
        ELSE pp.status::text
    END                             AS status,
    pp.catatan,
    pp.alasan_tolak,
    sb.file_url                     AS surat_balasan_url,
    s.file_url                      AS sertifikat_url,
    s.nomor_sertifikat,
    pn.nilai_akhir,
    pp.created_at
FROM kelompok_anggota ka
JOIN kelompok k ON k.id = ka.kelompok_id
JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
LEFT JOIN surat_balasan sb ON sb.pengajuan_id = pp.id
LEFT JOIN sertifikat s ON s.pengajuan_id = pp.id AND s.user_id = ka.user_id
LEFT JOIN penilaian pn ON pn.pengajuan_id = pp.id AND pn.user_id = ka.user_id
LEFT JOIN kelompok_anggota ka2 ON ka2.kelompok_id = k.id
GROUP BY ka.user_id, pp.id, jp.tanggal_mulai, jp.tanggal_selesai, k.jenis,
         pp.status, pp.catatan, pp.alasan_tolak, sb.file_url,
         s.file_url, s.nomor_sertifikat, pn.nilai_akhir, pp.created_at;
