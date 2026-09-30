DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_pengajuan') THEN
        CREATE TYPE status_pengajuan AS ENUM (
            'menunggu',
            'aktif',
            'ditolak'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS pengajuan_pkl (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelompok_id             UUID NOT NULL UNIQUE REFERENCES kelompok(id) ON DELETE CASCADE,
    surat_pengantar_url     VARCHAR(500) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_pengajuan_pkl_kelompok_id ON pengajuan_pkl(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_pkl_status ON pengajuan_pkl(status);

CREATE TRIGGER trg_pengajuan_pkl_updated_at
BEFORE UPDATE ON pengajuan_pkl
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


