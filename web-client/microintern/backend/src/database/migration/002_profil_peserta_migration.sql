DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_status') THEN
        CREATE TYPE onboarding_status AS ENUM (
            'belum_mulai',      -- Akun baru dibuat, belum isi data diri
            'step_1_selesai',   -- Data diri sudah diisi
            'selesai'           -- Pengajuan PKL sudah disubmit
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS profil_peserta (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_profil_peserta_user_id ON profil_peserta(user_id);
CREATE INDEX IF NOT EXISTS idx_profil_peserta_nim_nisn ON profil_peserta(nim_nisn);
CREATE INDEX IF NOT EXISTS idx_profil_peserta_institusi ON profil_peserta(institusi);
CREATE INDEX IF NOT EXISTS idx_profil_peserta_program_studi ON profil_peserta(program_studi);

CREATE TRIGGER trg_profil_peserta_updated_at
BEFORE UPDATE ON profil_peserta
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
