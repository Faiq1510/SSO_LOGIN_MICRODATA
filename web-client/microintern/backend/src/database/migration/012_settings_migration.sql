CREATE TABLE settings (
    id                  INT PRIMARY KEY DEFAULT 1,
    kapasitas_maksimal  INT NOT NULL DEFAULT 10 CHECK (kapasitas_maksimal > 0),
    email_notification  BOOLEAN NOT NULL DEFAULT TRUE,
    batas_waktu_bolos   TIME NOT NULL DEFAULT '23:59:00',
    mail_user           VARCHAR(255),
    mail_pass           VARCHAR(255),
    template_nomor_surat      VARCHAR(255) NOT NULL DEFAULT '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}',
    template_nomor_sertifikat VARCHAR(255) NOT NULL DEFAULT 'CERT/MDI/{tahun}/{no}',
    nomor_awal_surat          INT NOT NULL DEFAULT 1 CHECK (nomor_awal_surat >= 1),
    nomor_awal_sertifikat     INT NOT NULL DEFAULT 1 CHECK (nomor_awal_sertifikat >= 1),
    counter_surat             INT NOT NULL DEFAULT 0 CHECK (counter_surat >= 0),
    counter_sertifikat        INT NOT NULL DEFAULT 0 CHECK (counter_sertifikat >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_oleh        UUID REFERENCES users(id),

    CONSTRAINT hanya_satu_baris_settings CHECK (id = 1)
);
INSERT INTO settings (id, kapasitas_maksimal, email_notification, batas_waktu_bolos, template_nomor_surat, template_nomor_sertifikat, nomor_awal_surat, nomor_awal_sertifikat, counter_surat, counter_sertifikat)
VALUES (1, 10, true, '23:59:00', '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}', 'CERT/MDI/{tahun}/{no}', 1, 1, 0, 0);
CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- VIEW: v_rekap_presensi (updated to use dynamic alpha calculation)
CREATE OR REPLACE VIEW v_rekap_presensi AS
SELECT
    u.id                            AS user_id,
    pr.nama_lengkap,
    pr.institusi,
    pr.program_studi,
    jp.tanggal_mulai                AS tanggal_masuk,
    jp.tanggal_selesai               AS tanggal_keluar,
    COUNT(p.id) FILTER (WHERE p.status = 'hadir')   AS total_hadir,
    COUNT(p.id) FILTER (WHERE p.status = 'izin' AND EXTRACT(ISODOW FROM p.tanggal) < 6)    AS total_izin,
    (
        SELECT COUNT(*)
        FROM generate_series(jp.tanggal_mulai::timestamp, LEAST(jp.tanggal_selesai::date, CURRENT_DATE)::timestamp, '1 day'::interval) AS t(day)
        WHERE EXTRACT(ISODOW FROM t.day) < 6
        AND NOT EXISTS (
            SELECT 1 FROM presensi p2 
            WHERE p2.user_id = u.id AND p2.tanggal = t.day::date AND p2.status IN ('hadir', 'izin')
        )
        AND (
            t.day::date < CURRENT_DATE 
            OR 
            (t.day::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings WHERE id = 1 LIMIT 1))
        )
    )::bigint AS total_alpha,
    (
        COUNT(p.id) FILTER (WHERE p.status IN ('hadir', 'izin')) + 
        (
            SELECT COUNT(*)
            FROM generate_series(jp.tanggal_mulai::timestamp, LEAST(jp.tanggal_selesai::date, CURRENT_DATE)::timestamp, '1 day'::interval) AS t(day)
            WHERE EXTRACT(ISODOW FROM t.day) < 6
            AND NOT EXISTS (
                SELECT 1 FROM presensi p2 
                WHERE p2.user_id = u.id AND p2.tanggal = t.day::date AND p2.status IN ('hadir', 'izin')
            )
            AND (
                t.day::date < CURRENT_DATE 
                OR 
                (t.day::date = CURRENT_DATE AND CURRENT_TIME > (SELECT batas_waktu_bolos FROM settings WHERE id = 1 LIMIT 1))
            )
        )
    )::bigint AS total_tercatat
FROM users u
JOIN profil_peserta pr ON pr.user_id = u.id
JOIN kelompok_anggota ka ON ka.user_id = u.id
JOIN kelompok k ON k.id = ka.kelompok_id
JOIN pengajuan_pkl pp ON pp.kelompok_id = k.id
JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
LEFT JOIN presensi p ON p.user_id = u.id AND p.tanggal BETWEEN jp.tanggal_mulai AND jp.tanggal_selesai
WHERE pp.status = 'aktif'
GROUP BY u.id, pr.nama_lengkap, pr.institusi, pr.program_studi, jp.tanggal_mulai, jp.tanggal_selesai;
