-- =============================================================
-- DATABASE SCHEMA: Sistem Informasi Manajemen Peserta PKL
-- Database: PostgreSQL
-- =============================================================

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUM TYPES
-- =============================================================

CREATE TYPE user_role AS ENUM ('peserta', 'admin');

CREATE TYPE onboarding_status AS ENUM (
    'belum_mulai',      -- Akun baru dibuat, belum isi data diri
    'step_1_selesai',   -- Data diri sudah diisi
    'selesai'           -- Pengajuan PKL sudah disubmit
);

CREATE TYPE jenis_kelompok AS ENUM ('individu', 'kelompok');

CREATE TYPE status_pengajuan AS ENUM (
    'menunggu',
    'aktif',
    'ditolak'
);

CREATE TYPE jenis_surat_balasan AS ENUM ('diterima', 'ditolak');

CREATE TYPE status_presensi AS ENUM (
    'hadir',
    'izin',
    'alpha'     -- Tidak hadir tanpa keterangan (dihitung sistem)
);

-- =============================================================
-- TABEL: users
-- Menyimpan akun peserta dan admin
-- =============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),               -- NULL jika login via Google
    google_id       VARCHAR(255) UNIQUE,        -- NULL jika login via email
    role            user_role NOT NULL DEFAULT 'peserta',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- =============================================================
-- TABEL: profil_peserta
-- Data diri lengkap peserta (Onboarding Tahap 1)
-- Relasi 1-to-1 dengan users
-- =============================================================

CREATE TABLE profil_peserta (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap        VARCHAR(255) NOT NULL,
    jenjang_pendidikan  VARCHAR(20) NOT NULL DEFAULT 'kuliah',
    nim_nisn            VARCHAR(50) NOT NULL,
    institusi           VARCHAR(255) NOT NULL,
    program_studi       VARCHAR(255) NOT NULL,
    cv_url              VARCHAR(500),           -- Path file CV yang diupload
    onboarding_status   onboarding_status NOT NULL DEFAULT 'belum_mulai',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profil_peserta_user_id ON profil_peserta(user_id);
CREATE INDEX idx_profil_peserta_nim_nisn ON profil_peserta(nim_nisn);
CREATE INDEX idx_profil_peserta_institusi ON profil_peserta(institusi);
CREATE INDEX idx_profil_peserta_program_studi ON profil_peserta(program_studi);

-- =============================================================
-- TABEL: kelompok
-- Satu kelompok bisa berisi 1 orang (individu) atau lebih
-- =============================================================

CREATE TABLE kelompok (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ketua_id        UUID NOT NULL REFERENCES users(id),
    jenis           jenis_kelompok NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kelompok_ketua_id ON kelompok(ketua_id);

-- =============================================================
-- TABEL: kelompok_anggota
-- Relasi many-to-many: users ↔ kelompok
-- =============================================================

CREATE TABLE kelompok_anggota (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id     UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_kelompok_anggota UNIQUE (kelompok_id, user_id)
);

CREATE INDEX idx_kelompok_anggota_kelompok_id ON kelompok_anggota(kelompok_id);
CREATE INDEX idx_kelompok_anggota_user_id ON kelompok_anggota(user_id);

-- =============================================================
-- TABEL: pengajuan_pkl
-- Satu kelompok = satu pengajuan PKL
-- =============================================================

CREATE TABLE pengajuan_pkl (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id             UUID NOT NULL UNIQUE REFERENCES kelompok(id) ON DELETE CASCADE,
    surat_pengantar_url     VARCHAR(500) NOT NULL,
    nama_penerbit_surat     VARCHAR(255),
    nomor_surat_pengantar   VARCHAR(255),
    tanggal_surat_pengantar DATE,
    perihal_surat           VARCHAR(500),
    status                  status_pengajuan NOT NULL DEFAULT 'menunggu',
    alasan_tolak            TEXT,               -- Diisi admin jika status = 'ditolak'
    catatan                 TEXT,               -- Catatan tambahan dari admin saat menerima
    diproses_oleh           UUID REFERENCES users(id),  -- Admin yang memproses
    diproses_pada           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_alasan_tolak CHECK (
        (status = 'ditolak' AND alasan_tolak IS NOT NULL) OR
        (status != 'ditolak')
    )
);

CREATE INDEX idx_pengajuan_pkl_kelompok_id ON pengajuan_pkl(kelompok_id);
CREATE INDEX idx_pengajuan_pkl_status ON pengajuan_pkl(status);

-- =============================================================
-- TABEL: surat_balasan
-- Tracking surat balasan yang sudah di-generate
-- =============================================================

CREATE TABLE surat_balasan (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengajuan_id    UUID NOT NULL REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    jenis           jenis_surat_balasan NOT NULL,
    nomor_surat     VARCHAR(100) NOT NULL UNIQUE,
    file_url        VARCHAR(500),
    generated_oleh  UUID REFERENCES users(id),
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surat_balasan_pengajuan_id ON surat_balasan(pengajuan_id);

-- =============================================================
-- TABEL: jadwal_pkl
-- =============================================================

CREATE TABLE jadwal_pkl (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengajuan_id    UUID NOT NULL UNIQUE REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    tanggal_mulai   DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tanggal CHECK (tanggal_selesai > tanggal_mulai)
);
CREATE INDEX idx_jadwal_pkl_tanggal ON jadwal_pkl(tanggal_mulai, tanggal_selesai);

-- =============================================================
-- TABEL: presensi
-- Catatan kehadiran harian per peserta
-- =============================================================

CREATE TABLE presensi (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal         DATE NOT NULL,
    jam_masuk       TIMESTAMPTZ,
    jam_keluar      TIMESTAMPTZ,
    status          status_presensi NOT NULL DEFAULT 'hadir',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_presensi_per_hari UNIQUE (user_id, tanggal),
    CONSTRAINT chk_jam_keluar CHECK (
        jam_keluar IS NULL OR jam_keluar > jam_masuk
    )
);

CREATE INDEX idx_presensi_user_id ON presensi(user_id);
CREATE INDEX idx_presensi_tanggal ON presensi(tanggal);
CREATE INDEX idx_presensi_user_tanggal ON presensi(user_id, tanggal);

-- =============================================================
-- TABEL: izin
-- Pengajuan izin / cuti oleh peserta
-- Tidak ada approve/reject — hanya dicatat
-- =============================================================

CREATE TABLE izin (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal     DATE NOT NULL,
    kategori    VARCHAR(50) NOT NULL,
    alasan      TEXT NOT NULL,
    bukti_url   VARCHAR(500),       -- Opsional
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_izin_user_id ON izin(user_id);
CREATE INDEX idx_izin_tanggal ON izin(tanggal);

CREATE TABLE template_penilaian (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_template   VARCHAR(255) NOT NULL,
    institusi       VARCHAR(255),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_template_institusi UNIQUE (institusi)
);

CREATE TABLE template_kriteria (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id     UUID NOT NULL REFERENCES template_penilaian(id) ON DELETE CASCADE,
    nama_kriteria   VARCHAR(100) NOT NULL,
    urutan          INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE penilaian (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pengajuan_id    UUID NOT NULL REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    dinilai_oleh    UUID NOT NULL REFERENCES users(id),
    template_id     UUID NOT NULL REFERENCES template_penilaian(id),
    nilai_akhir     NUMERIC(5,2),
    catatan         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_penilaian_user_pengajuan UNIQUE (user_id, pengajuan_id)
);

CREATE TABLE penilaian_item (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penilaian_id    UUID NOT NULL REFERENCES penilaian(id) ON DELETE CASCADE,
    kriteria_id     UUID NOT NULL REFERENCES template_kriteria(id) ON DELETE CASCADE,
    nilai           NUMERIC(5,2) NOT NULL CHECK (nilai BETWEEN 0 AND 100),
    CONSTRAINT uq_penilaian_kriteria UNIQUE (penilaian_id, kriteria_id)
);

CREATE INDEX idx_penilaian_user_id ON penilaian(user_id);
CREATE INDEX idx_penilaian_pengajuan_id ON penilaian(pengajuan_id);

INSERT INTO template_penilaian (nama_template, institusi, is_default) VALUES ('Template Standar', NULL, TRUE);

INSERT INTO template_kriteria (template_id, nama_kriteria, urutan)
SELECT id, unnested.nama, unnested.urutan
FROM template_penilaian,
     (VALUES
        ('Disiplin', 1), ('Kehadiran', 2), ('Komunikasi', 3),
        ('Kerja Sama', 4), ('Tanggung Jawab', 5), ('Inisiatif', 6)
     ) AS unnested(nama, urutan)
WHERE is_default = TRUE;

-- =============================================================
-- TABEL: sertifikat
-- Tracking sertifikat per peserta
-- =============================================================

CREATE TABLE sertifikat (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pengajuan_id        UUID NOT NULL REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    nomor_sertifikat    VARCHAR(100) NOT NULL UNIQUE,
    file_url            VARCHAR(500),
    generated_oleh      UUID REFERENCES users(id),
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sertifikat_user_pengajuan UNIQUE (user_id, pengajuan_id)
);

CREATE INDEX idx_sertifikat_user_id ON sertifikat(user_id);
CREATE INDEX idx_sertifikat_pengajuan_id ON sertifikat(pengajuan_id);



-- =============================================================
-- TABEL: settings
-- Pengaturan global sistem
-- =============================================================

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

-- Seed data default settings
INSERT INTO settings (id, kapasitas_maksimal, email_notification, batas_waktu_bolos, mail_user, mail_pass, template_nomor_surat, template_nomor_sertifikat, nomor_awal_surat, nomor_awal_sertifikat, counter_surat, counter_sertifikat)
VALUES (1, 10, true, '23:59:00', NULL, NULL, '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}', 'CERT/MDI/{tahun}/{no}', 1, 1, 0, 0);

-- =============================================================
-- FUNCTION & TRIGGER: auto-update updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Terapkan trigger ke semua tabel yang punya updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users', 'profil_peserta', 'kelompok',
        'pengajuan_pkl', 'presensi', 'izin', 'penilaian', 'settings',
        'surat_balasan', 'sertifikat', 'template_penilaian'
    ]
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
        ', t, t);
    END LOOP;
END;
$$;

-- =============================================================
-- FUNCTION: cek_kuota_pkl
-- Menghitung jumlah peserta aktif yang overlap dengan periode yang diminta
-- Digunakan sebelum menyimpan pengajuan baru
-- =============================================================

CREATE OR REPLACE FUNCTION cek_kuota_pkl(
    p_tanggal_masuk  DATE,
    p_tanggal_keluar DATE,
    p_exclude_id     UUID DEFAULT NULL  -- Untuk exclude pengajuan tertentu (saat edit)
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

-- =============================================================
-- VIEW: v_jadwal_pkl_publik
-- Untuk endpoint publik (tanpa data pribadi peserta)
-- =============================================================

CREATE OR REPLACE VIEW v_jadwal_pkl_publik AS
SELECT
    jp.pengajuan_id,
    jp.tanggal_mulai                AS tanggal_masuk,
    jp.tanggal_selesai               AS tanggal_keluar,
    k.jenis                         AS jenis_kelompok,
    COUNT(ka.user_id)               AS jumlah_peserta,
    -- Ambil institusi & prodi dari anggota pertama (semua anggota 1 institusi)
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

-- =============================================================
-- VIEW: v_rekap_presensi
-- Untuk admin: rekapitulasi kehadiran per peserta
-- =============================================================

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

-- =============================================================
-- VIEW: v_dashboard_admin
-- Statistik ringkas untuk dashboard admin
-- =============================================================

CREATE VIEW v_dashboard_admin AS
SELECT
    COUNT(*) FILTER (WHERE pp.status = 'menunggu')  AS total_menunggu,
    COUNT(*) FILTER (WHERE pp.status = 'aktif' AND jp.tanggal_selesai > CURRENT_DATE) AS total_aktif,
    COUNT(*) FILTER (WHERE pp.status = 'aktif' AND jp.tanggal_selesai <= CURRENT_DATE)  AS total_selesai,
    COUNT(*) FILTER (WHERE pp.status = 'ditolak')   AS total_ditolak,
    COUNT(*)                                         AS total_semua
FROM pengajuan_pkl pp
LEFT JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id;

-- =============================================================
-- VIEW: v_histori_pkl_peserta
-- Untuk histori peserta PKL
-- =============================================================

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
    pp.alasan_tolak,
    pp.catatan,
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
         pp.status, pp.alasan_tolak, pp.catatan, sb.file_url,
         s.file_url, s.nomor_sertifikat, pn.nilai_akhir, pp.created_at;

-- =============================================================
-- TABEL: pending_otps
-- Menyimpan OTP untuk konfirmasi email dan lupa password
-- =============================================================

CREATE TABLE pending_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_otps_email_type ON pending_otps(email, type);

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    related_id  UUID,
    target_date DATE,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);