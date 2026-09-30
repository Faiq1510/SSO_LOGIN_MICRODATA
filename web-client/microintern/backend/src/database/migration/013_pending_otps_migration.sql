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
