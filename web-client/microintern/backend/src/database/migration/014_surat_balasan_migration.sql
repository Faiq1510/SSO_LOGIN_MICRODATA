-- =============================================================
-- MIGRATION SCRIPT: Surat Balasan
-- =============================================================

-- 1. Buat ENUM baru
CREATE TYPE jenis_surat_balasan AS ENUM ('diterima', 'ditolak');

-- 2. Tambah kolom baru di tabel pengajuan_pkl
ALTER TABLE pengajuan_pkl
ADD COLUMN nama_penerbit_surat VARCHAR(255),
ADD COLUMN nomor_surat_pengantar VARCHAR(255),
ADD COLUMN tanggal_surat_pengantar DATE,
ADD COLUMN perihal_surat VARCHAR(500);

-- 3. Buat tabel surat_balasan
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

-- 4. Terapkan trigger auto-update updated_at pada tabel surat_balasan
DO $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER trg_surat_balasan_updated_at
        BEFORE UPDATE ON surat_balasan
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ');
END;
$$;
