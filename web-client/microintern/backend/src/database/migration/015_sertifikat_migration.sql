-- =============================================================
-- MIGRATION SCRIPT: Sertifikat
-- =============================================================

ALTER TABLE penilaian
DROP COLUMN IF EXISTS sertifikat_url;

-- 2. Buat tabel sertifikat
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

-- 3. Terapkan trigger auto-update updated_at pada tabel sertifikat
DO $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER trg_sertifikat_updated_at
        BEFORE UPDATE ON sertifikat
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ');
END;
$$;
