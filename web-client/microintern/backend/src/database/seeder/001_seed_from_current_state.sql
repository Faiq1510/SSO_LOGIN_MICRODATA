TRUNCATE TABLE pending_otps CASCADE;
TRUNCATE TABLE settings CASCADE;
TRUNCATE TABLE sertifikat CASCADE;
TRUNCATE TABLE penilaian CASCADE;
TRUNCATE TABLE izin CASCADE;
TRUNCATE TABLE presensi CASCADE;
TRUNCATE TABLE jadwal_pkl CASCADE;
TRUNCATE TABLE surat_balasan CASCADE;
TRUNCATE TABLE pengajuan_pkl CASCADE;
TRUNCATE TABLE kelompok_anggota CASCADE;
TRUNCATE TABLE kelompok CASCADE;
TRUNCATE TABLE profil_peserta CASCADE;
TRUNCATE TABLE users CASCADE;

INSERT INTO users (id, email, password_hash, google_id, role, email_verified, created_at, updated_at) VALUES ('02995786-c0b9-4268-a64e-b4e34c6938cd', 'andika.123140096@student.itera.ac.id', '$2b$10$rp05JRY3nLR5MNkVA28l4ulXn2DOBc6OpbqEVddf1V.r4E.IJlglC', '116266200043642466571', 'admin', TRUE, '2026-07-10T07:00:24.764Z', '2026-07-10T07:01:47.782Z');

INSERT INTO profil_peserta (id, user_id, nama_lengkap, jenjang_pendidikan, nim_nisn, institusi, program_studi, cv_url, onboarding_status, created_at, updated_at) VALUES ('02995786-c0b9-4268-a64e-b4e34c6938ce', '02995786-c0b9-4268-a64e-b4e34c6938cd', 'Admin HRD', 'kuliah', '-', '-', '-', NULL, 'selesai', '2026-07-10T07:00:24.764Z', '2026-07-10T07:01:47.782Z');

INSERT INTO settings (id, kapasitas_maksimal, email_notification, batas_waktu_bolos, mail_user, mail_pass, template_nomor_surat, template_nomor_sertifikat, nomor_awal_surat, nomor_awal_sertifikat, counter_surat, counter_sertifikat, created_at, updated_at, updated_oleh) VALUES (1, 15, TRUE, '10:00:00', NULL, NULL, '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}', 'CERT/MDI/{tahun}/{no}', 1, 1, 0, 0, '2026-07-10T07:00:22.826Z', '2026-07-10T07:00:22.826Z', NULL);
