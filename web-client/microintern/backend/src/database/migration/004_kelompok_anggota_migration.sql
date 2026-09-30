CREATE TABLE IF NOT EXISTS kelompok_anggota (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelompok_id     UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_kelompok_anggota UNIQUE (kelompok_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kelompok_anggota_kelompok_id ON kelompok_anggota(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_kelompok_anggota_user_id ON kelompok_anggota(user_id);

CREATE TRIGGER trg_kelompok_anggota_updated_at
BEFORE UPDATE ON kelompok_anggota
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
