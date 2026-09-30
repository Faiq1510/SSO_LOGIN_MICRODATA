DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_presensi') THEN
        CREATE TYPE status_presensi AS ENUM (
            'hadir',
            'izin',
            'alpha'     -- Tidak hadir tanpa keterangan (dihitung sistem)
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS presensi (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_presensi_user_id ON presensi(user_id);
CREATE INDEX IF NOT EXISTS idx_presensi_tanggal ON presensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_user_tanggal ON presensi(user_id, tanggal);

CREATE TRIGGER trg_presensi_updated_at
BEFORE UPDATE ON presensi
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
