DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_kelompok') THEN
        CREATE TYPE jenis_kelompok AS ENUM ('individu', 'kelompok');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS kelompok (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ketua_id        UUID NOT NULL REFERENCES users(id),
    jenis           jenis_kelompok NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kelompok_ketua_id ON kelompok(ketua_id);

CREATE TRIGGER trg_kelompok_updated_at
BEFORE UPDATE ON kelompok
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
