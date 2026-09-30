# Fitur Admin HRD

## 1. Manajemen Pendaftaran

- Melihat seluruh pengajuan dari tabel `pengajuan_pkl`, dikelompokkan per `kelompok` (diurutkan berdasarkan pengajuan terbaru dahulu)
- Setiap kelompok menampilkan: nama anggota (dari `profil_peserta`), institusi, periode PKL, surat pengantar

**Aksi yang tersedia:**

| Aksi       | Perubahan DB                                                               | Efek                                                                                   |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Terima** | `status → 'aktif'`, isi `diproses_oleh`, `diproses_pada`                   | Otomatis buat `jadwal_pkl`. Kirim email notifikasi penerimaan dilampiri Surat Balasan. |
| **Tolak**  | `status → 'ditolak'`, isi `alasan_tolak`, `diproses_oleh`, `diproses_pada` | Kirim email notifikasi penolakan dilampiri Surat Balasan ke peserta.                   |
| **Batal**  | `status → 'menunggu'`, hapus `jadwal_pkl` jika ada                         | Mengembalikan status ke menunggu                                                       |

> Admin **tidak** menambahkan peserta secara manual.

---

## 2. Manajemen Peserta

- Melihat daftar peserta via join `users` + `profil_peserta` (diurutkan berdasarkan pendaftaran terbaru dahulu). Periode magang tetap ditampilkan pada tampilan mobile dan desktop.
- **Panel Statistik**: Ringkasan statistik demografi interaktif (distribusi per program studi, institusi, jenjang pendidikan, serta rata-rata durasi magang)
- Filter: status pengajuan, institusi, periode
- Cari: nama (`nama_lengkap`), NIM (`nim_nisn`), institusi
- Melihat detail profil peserta dan riwayat PKL (`v_histori_pkl_peserta`)
- **Update Profil**: Admin dapat mengubah data diri peserta (nama, nim, institusi, prodi).

---

## 3. Monitoring Presensi

- Rekap kehadiran via view `v_rekap_presensi` (total hadir, izin, alpha per peserta, diurutkan berdasarkan tanggal terbaru dahulu)
- Perhitungan izin dan alpha secara otomatis mengecualikan hari Sabtu dan Minggu karena PKL tidak berjalan pada akhir pekan
- Melihat pengajuan izin dari tabel `izin` — tanpa aksi approve/reject
- Filter berdasarkan tanggal dan nama peserta

---

## 4. Penilaian

Dilakukan per individu (`user_id`), hanya untuk peserta dengan status pengajuan aktif yang masa PKL-nya telah memasuki atau melewati tanggal selesai (`tanggal_selesai <= CURRENT_DATE`). Menyimpan ke tabel `penilaian` dan `penilaian_item`.

Kriteria penilaian dinamis menggunakan sistem template yang terhubung dengan nama institusi asal peserta:

- Jika institusi peserta memiliki template penilaian khusus, kriteria tersebut akan dimuat.
- Jika tidak ada, sistem akan memuat template standar default.
- Admin dapat langsung memodifikasi kriteria penilaian (tambah atau hapus kriteria) langsung dari halaman Form Penilaian. Perubahan tersebut otomatis tersimpan ke template institusi terkait (dan membuat template baru jika sebelumnya menggunakan template standar), serta secara otomatis menyelaraskan (sinkronisasi) kriteria dan template pada peserta lain dari institusi yang sama.

- `nilai_akhir` dihitung otomatis (rata-rata sederhana dari seluruh kriteria)
- Admin dapat menambahkan `catatan` (opsional)
- Admin dapat **membuat** penilaian baru atau **mengupdate** penilaian yang sudah ada.

---

## 5. Manajemen Template Penilaian

Admin dapat mengelola template penilaian untuk mendukung kriteria penilaian dinamis berdasarkan institusi:

- **Melihat Semua Template**: Daftar seluruh template penilaian yang tersedia
- **Detail Template**: Melihat kriteria penilaian dalam template tertentu
- **Membuat Template Baru**: Membuat template penilaian dengan nama template, institusi (opsional), dan daftar kriteria penilaian
- **Mengupdate Template**: Mengubah nama template, institusi, dan daftar kriteria penilaian
- **Menghapus Template**: Menghapus template penilaian (template default tidak dapat dihapus)

Template penilaian terhubung dengan institusi peserta untuk memastikan kriteria penilaian yang sesuai digunakan berdasarkan institusi asal peserta.

---

## 6. Dashboard & Laporan

**Statistik** dari view `v_dashboard_admin`:

- `total_menunggu`, `total_aktif`, `total_selesai`, `total_ditolak`, `total_semua`

**Pendaftaran Terbaru** — daftar pengajuan terakhir yang masuk.

**Export:** (CSV, XLSX, PDF)

- Rekap peserta (diurutkan berdasarkan pendaftaran terbaru)
- Rekap kehadiran (diurutkan berdasarkan tanggal presensi terbaru)
- Rekap nilai (diurutkan berdasarkan waktu penilaian terbaru, mencakup data peserta, Tanggal Selesai PKL, Nilai Akhir, dan Catatan)

---

## 7. Pengaturan & Kuota

- **Kuota**: Mengupdate kolom `kapasitas_maksimal` di tabel `settings` (singleton, `id = 1`). Perubahan dicatat di kolom `updated_oleh` (UUID admin).
- **Sistem**: Mengatur `email_notification` di tabel `settings`.
- **Format Nomor Dokumen**: Mengatur template format nomor surat balasan (`template_nomor_surat`) dan nomor sertifikat (`template_nomor_sertifikat`) di tabel `settings`. Template mendukung placeholder `{no}` (nomor urut auto-increment), `{tahun}`, `{bulan_romawi}`, dan `{bulan}`.
- **Nomor Awal Counter**: Mengatur `nomor_awal_surat` dan `nomor_awal_sertifikat` di tabel `settings` untuk menetapkan angka minimal penomoran otomatis.
- **Counter Permanen**: Sistem menggunakan `counter_surat` dan `counter_sertifikat` di tabel `settings` sebagai counter permanen yang tidak pernah mundur, mencegah duplikasi nomor dokumen meskipun ada penghapusan data.

---

## 8. Pengaturan Akun Admin

Admin dapat mengelola pengaturan akun mereka sendiri melalui halaman Pengaturan:

- **Profil Admin**: Menampilkan User ID (UUID) admin yang dapat disalin langsung ke clipboard, serta mengubah Nama Lengkap admin.
- **Ubah Email**: Mengubah alamat email admin dengan verifikasi kode OTP yang dikirimkan ke email baru (alur sama seperti peserta).
- **Keamanan**: Mengubah kata sandi (password) admin (minimal 6 digit/karakter).
- **Integrasi Google**: Menghubungkan atau memutuskan akun Google admin.
- **Preferensi Tampilan**: Mengaktifkan atau menonaktifkan Dark Mode.

---

## 9. Notifikasi Admin

Fitur untuk menampilkan pemberitahuan real-time (via polling) pada dashboard admin mengenai aktivitas peserta magang:

- **Notifikasi Izin**: Notifikasi otomatis dibuat ketika peserta magang mengajukan permohonan izin baru (`postIzin`).
- **Dropdown Header**: Menampilkan maksimal 50 notifikasi terbaru pada dropdown lonceng notifikasi di pojok kanan atas layout admin.
- **Aksi Notifikasi**:
  - Menandai satu notifikasi tertentu sebagai dibaca (`is_read = true`).
  - Menandai semua notifikasi unread sebagai dibaca secara massal.
  - Menghapus notifikasi secara permanen dari database.
- **Badge Unread**: Menampilkan jumlah notifikasi yang belum dibaca secara langsung pada lonceng notifikasi.

---

## 10. Dokumen Generated

Halaman read-only untuk melihat seluruh dokumen yang sudah digenerate oleh sistem:

- **Surat Balasan** (tab): Menampilkan daftar surat balasan (diterima/ditolak) dengan nomor surat, nama peserta/kelompok, tanggal generate, dan pratinjau file PDF.
- **Sertifikat** (tab): Menampilkan daftar sertifikat dengan nomor sertifikat, nama peserta, institusi, program studi, tanggal generate, dan pratinjau file PDF.
