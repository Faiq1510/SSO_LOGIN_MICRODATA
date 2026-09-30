export const mockUserPeserta = {
  id: "uuid-peserta-1",
  email: "budi@test.com",
  role: "peserta",
  email_verified: true,
  password_hash: "$2b$10$xyz",
  google_id: null,
};

export const mockUserAdmin = {
  id: "uuid-admin-1",
  email: "admin@hrd.com",
  role: "admin",
  email_verified: true,
  password_hash: "$2b$10$abc",
  google_id: null,
};

export const mockProfilPeserta = {
  user_id: "uuid-peserta-1",
  nama_lengkap: "Budi Santoso",
  jenjang_pendidikan: "kuliah",
  nim_nisn: "123456",
  institusi: "Universitas Indonesia",
  program_studi: "Teknik Informatika",
  cv_url: "https://mock-s3.com/cv.pdf",
  onboarding_status: "selesai",
};

export const mockKelompok = {
  id: "uuid-kelompok-1",
  ketua_id: "uuid-peserta-1",
  jenis: "individu",
};

export const mockPengajuan = {
  id: "uuid-pengajuan-1",
  kelompok_id: "uuid-kelompok-1",
  surat_pengantar_url: "https://mock-s3.com/surat.pdf",
  nama_penerbit_surat: "Dekan Fasilkom UI",
  nomor_surat_pengantar: "001/UI/2026",
  tanggal_surat_pengantar: "2026-07-15",
  perihal_surat: "Permohonan PKL Budi",
  status: "menunggu",
  alasan_tolak: null,
  surat_balasan_url: null,
  catatan: null,
  diproses_oleh: null,
  diproses_pada: null,
  created_at: new Date("2026-07-16T12:00:00Z"),
  updated_at: new Date("2026-07-16T12:00:00Z"),
};

export const mockJadwal = {
  id: "uuid-jadwal-1",
  pengajuan_id: "uuid-pengajuan-1",
  tanggal_mulai: "2026-08-01",
  tanggal_selesai: "2026-08-31",
  created_at: new Date("2026-07-16T12:00:00Z"),
};

export const mockSettings = {
  kapasitas_maksimal: 10,
  email_notification: true,
  batas_waktu_bolos: "23:59:00",
  updated_oleh: null,
};
