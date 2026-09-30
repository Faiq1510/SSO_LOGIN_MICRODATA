CREATE TABLE IF NOT EXISTS izin (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal     DATE NOT NULL,
    kategori    VARCHAR(50) NOT NULL,
    alasan      TEXT NOT NULL,
    bukti_url   VARCHAR(500),       -- Opsional
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_izin_user_id ON izin(user_id);
CREATE INDEX IF NOT EXISTS idx_izin_tanggal ON izin(tanggal);

CREATE TRIGGER trg_izin_updated_at
BEFORE UPDATE ON izin
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
