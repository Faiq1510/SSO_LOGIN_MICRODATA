-- Create table jadwal_pkl (clean, final form)
CREATE TABLE IF NOT EXISTS jadwal_pkl (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id    UUID NOT NULL UNIQUE REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    tanggal_mulai   DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tanggal CHECK (tanggal_selesai > tanggal_mulai)
);
CREATE INDEX IF NOT EXISTS idx_jadwal_pkl_tanggal ON jadwal_pkl(tanggal_mulai, tanggal_selesai);

CREATE TRIGGER trg_jadwal_pkl_updated_at
BEFORE UPDATE ON jadwal_pkl
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Drop trigger & trigger function if they exist (clean up from previous development/trigger implementation)
DROP TRIGGER IF EXISTS trg_sync_jadwal_pkl ON pengajuan_pkl;
DROP FUNCTION IF EXISTS trigger_sync_jadwal_pkl();

-- FUNCTION: cek_kuota_pkl (updated to use pengajuan_pkl.status)
CREATE OR REPLACE FUNCTION cek_kuota_pkl(
    p_tanggal_masuk  DATE,
    p_tanggal_keluar DATE,
    p_exclude_id     UUID DEFAULT NULL
)
RETURNS TABLE (
    peserta_aktif   BIGINT,
    kapasitas_maks  INT,
    tersedia        BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(ka.user_id)           AS peserta_aktif,
        kk.kapasitas_maksimal       AS kapasitas_maks,
        COUNT(ka.user_id) < kk.kapasitas_maksimal AS tersedia
    FROM settings kk
    LEFT JOIN jadwal_pkl jp ON
        jp.tanggal_mulai <= p_tanggal_keluar
        AND jp.tanggal_selesai >= p_tanggal_masuk
        AND (p_exclude_id IS NULL OR jp.pengajuan_id != p_exclude_id)
    LEFT JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
    LEFT JOIN kelompok_anggota ka ON ka.kelompok_id = pp.kelompok_id
    WHERE kk.id = 1 AND pp.status = 'aktif' AND jp.tanggal_selesai >= CURRENT_DATE
    GROUP BY kk.kapasitas_maksimal;
END;
$$ LANGUAGE plpgsql;

-- VIEW: v_jadwal_pkl_publik (updated to use pengajuan_pkl.status)
CREATE OR REPLACE VIEW v_jadwal_pkl_publik AS
SELECT
    jp.pengajuan_id,
    jp.tanggal_mulai                AS tanggal_masuk,
    jp.tanggal_selesai               AS tanggal_keluar,
    k.jenis                         AS jenis_kelompok,
    COUNT(ka.user_id)               AS jumlah_peserta,
    MIN(pr.institusi)               AS institusi,
    MIN(pr.program_studi)           AS program_studi,
    CASE
        WHEN NOW()::DATE BETWEEN jp.tanggal_mulai AND jp.tanggal_selesai THEN 'berjalan'
        WHEN jp.tanggal_mulai > NOW()::DATE THEN 'mendatang'
    END                             AS periode_status
FROM jadwal_pkl jp
JOIN pengajuan_pkl pp ON pp.id = jp.pengajuan_id
JOIN kelompok k ON k.id = pp.kelompok_id
JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
JOIN profil_peserta pr ON pr.user_id = ka.user_id
WHERE pp.status = 'aktif' AND jp.tanggal_selesai >= CURRENT_DATE
GROUP BY jp.pengajuan_id, jp.tanggal_mulai, jp.tanggal_selesai, k.jenis;



-- VIEW: v_dashboard_admin
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT
    COUNT(*) FILTER (WHERE pp.status = 'menunggu')  AS total_menunggu,
    COUNT(*) FILTER (WHERE pp.status = 'aktif' AND jp.tanggal_selesai > CURRENT_DATE) AS total_aktif,
    COUNT(*) FILTER (WHERE pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE)  AS total_selesai,
    COUNT(*) FILTER (WHERE pp.status = 'ditolak')   AS total_ditolak,
    COUNT(*)                                         AS total_semua
FROM pengajuan_pkl pp
LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id;
