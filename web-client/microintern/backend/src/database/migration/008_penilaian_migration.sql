CREATE TABLE IF NOT EXISTS template_penilaian (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_template   VARCHAR(255) NOT NULL,
    institusi       VARCHAR(255),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_template_institusi UNIQUE (institusi)
);

CREATE TABLE IF NOT EXISTS template_kriteria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES template_penilaian(id) ON DELETE CASCADE,
    nama_kriteria   VARCHAR(100) NOT NULL,
    urutan          INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penilaian (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pengajuan_id    UUID NOT NULL REFERENCES pengajuan_pkl(id) ON DELETE CASCADE,
    dinilai_oleh    UUID NOT NULL REFERENCES users(id),
    template_id     UUID NOT NULL REFERENCES template_penilaian(id),
    nilai_akhir     NUMERIC(5,2),
    catatan         TEXT,
    sertifikat_url  VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_penilaian_user_pengajuan UNIQUE (user_id, pengajuan_id)
);

CREATE TABLE IF NOT EXISTS penilaian_item (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penilaian_id    UUID NOT NULL REFERENCES penilaian(id) ON DELETE CASCADE,
    kriteria_id     UUID NOT NULL REFERENCES template_kriteria(id) ON DELETE CASCADE,
    nilai           NUMERIC(5,2) NOT NULL CHECK (nilai BETWEEN 0 AND 100),
    CONSTRAINT uq_penilaian_kriteria UNIQUE (penilaian_id, kriteria_id)
);

CREATE INDEX IF NOT EXISTS idx_penilaian_user_id ON penilaian(user_id);
CREATE INDEX IF NOT EXISTS idx_penilaian_pengajuan_id ON penilaian(pengajuan_id);

CREATE TRIGGER trg_penilaian_updated_at
BEFORE UPDATE ON penilaian
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_template_penilaian_updated_at
BEFORE UPDATE ON template_penilaian
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

INSERT INTO template_penilaian (nama_template, institusi, is_default) VALUES ('Template Standar', NULL, TRUE);

INSERT INTO template_kriteria (template_id, nama_kriteria, urutan)
SELECT id, unnested.nama, unnested.urutan
FROM template_penilaian,
     (VALUES
        ('Disiplin', 1), ('Kehadiran', 2), ('Komunikasi', 3),
        ('Kerja Sama', 4), ('Tanggung Jawab', 5), ('Inisiatif', 6)
     ) AS unnested(nama, urutan)
WHERE is_default = TRUE;
