# Fitur Peserta PKL

## 1. Melihat Jadwal PKL (Publik / Sebelum Login)

Menggunakan view `v_jadwal_pkl_publik`. Menampilkan pengajuan dengan status `aktif` (pada tampilan tabel, diurutkan berdasarkan tanggal masuk terbaru dahulu):

- **Sedang berjalan** — tanggal hari ini berada di antara `tanggal_masuk` dan `tanggal_keluar`
- **Mendatang** — `tanggal_masuk` > hari ini

Informasi yang ditampilkan: periode PKL, institusi, program studi, jumlah peserta per kelompok. Data pribadi peserta lain **tidak** ditampilkan.

---

## 2. Registrasi & Login

- Daftar via email + password (minimal 6 digit/karakter) → `password_hash` disimpan, `google_id` = NULL
- Daftar via Google OAuth → `google_id` disimpan, `password_hash` = NULL
- Daftar via SSO (stateless zero-fetch JWT) → Login otomatis dengan token SSO yang valid
- Kolom `email_verified` wajib `true` sebelum akun aktif (untuk email+password)
- Fitur Lupa Password dengan OTP ke email.
- Profil bisa dihubungkan (connect) atau diputuskan (disconnect) dari akun Google. Pengguna tidak dapat memutuskan akun Google jika belum menyambungkan (memverifikasi) email ke akun dan membuat kata sandi.
- User ID (UUID) pengguna ditampilkan pada Halaman Pengaturan (Settings) dan dapat disalin langsung ke clipboard.

---

## 3. Onboarding Tahap 1 — Data Diri

Mengisi tabel `profil_peserta`. `onboarding_status` berubah dari `belum_mulai` → `step_1_selesai`.

| Field              | Kolom DB             | Keterangan                |
| ------------------ | -------------------- | ------------------------- |
| Nama Lengkap       | `nama_lengkap`       | Wajib                     |
| Jenjang Pendidikan | `jenjang_pendidikan` | Pilihan: Sekolah / Kuliah |
| NIM / NISN         | `nim_nisn`           | Wajib                     |
| Asal Institusi     | `institusi`          | Wajib                     |
| Program Studi      | `program_studi`      | Wajib                     |
| CV                 | `cv_url`             | Upload PDF, maks. 5 MB    |

Data dapat diedit kembali sebelum pendaftaran disubmit melalui halaman Profil.

---

## 4. Onboarding Tahap 2 — Pengajuan PKL

`onboarding_status` berubah → `selesai` setelah submit.

### Pilihan A: Individu

`jenis = 'individu'`. Satu baris di `kelompok`, satu baris di `kelompok_anggota`.

### Pilihan B: Kelompok

`jenis = 'kelompok'`. Peserta yang menginisiasi = ketua (`ketua_id`). Setiap anggota ditambahkan ke `kelompok_anggota`. Anggota **harus sudah punya akun aktif** di sistem dan **tidak sedang memiliki status PKL aktif** (`status = 'aktif'` dan `tanggal_selesai >= CURRENT_DATE`). Pencarian anggota kelompok secara otomatis mengeksklusi peserta yang berstatus aktif PKL. Saat memilih tipe "Kelompok", nama pengguna yang sedang login otomatis ditambahkan sebagai anggota pertama. Jika pengguna menghapus dirinya sendiri dari daftar anggota, tipe pendaftaran otomatis berubah kembali menjadi "Individu".

### Form yang diisi:

| Field           | Keterangan                                                    |
| --------------- | ------------------------------------------------------------- |
| Surat Pengantar | Upload PDF/JPG/JPEG/PNG, maks. 10 MB                          |
| Tanggal Masuk   | Awal periode PKL (minimal hari ini, tidak boleh di masa lalu) |
| Tanggal Keluar  | Akhir periode PKL (> tanggal masuk)                           |

Sebelum menyimpan, sistem memanggil `cek_kuota_pkl()` untuk validasi ketersediaan slot.

---

## 5. Submit Pendaftaran

- Record `pengajuan_pkl` dibuat dengan `status = 'menunggu'`
- Peserta dapat melihat status di dashboard
- Peserta dapat membatalkan/menarik pengajuan pendaftaran yang masih berstatus `menunggu` (melalui dashboard)
- Notifikasi email dikirim saat status berubah

---

## 6. Presensi Harian

Aktif otomatis pada tanggal mulai PKL, nonaktif setelah tanggal selesai. Presensi datang (clock-in) hanya dapat dilakukan sebelum melewati batas waktu presensi harian (ditentukan oleh setelan `batas_waktu_bolos` di settings). Jika batas waktu tersebut telah terlewati dan peserta belum melakukan presensi datang, maka tombol Datang akan dinonaktifkan dan peserta tidak bisa mencatat kehadiran lagi hari itu (dianggap Alpha).

| Aksi              | Kolom DB     | Keterangan                                                         |
| ----------------- | ------------ | ------------------------------------------------------------------ |
| Tombol **Datang** | `jam_masuk`  | Timestamp saat ditekan; hanya bisa 1x per hari sebelum batas waktu |
| Tombol **Pulang** | `jam_keluar` | Timestamp saat ditekan; hanya bisa setelah Datang                  |

Unique constraint `(user_id, tanggal)` memastikan satu baris per hari.

---

## 7. Pengajuan Izin / Cuti

Menyimpan ke tabel `izin`. Tidak ada approve/reject — hanya dicatat dan terlihat di rekap presensi admin. Daftar riwayat pengajuan izin diurutkan berdasarkan tanggal terbaru dahulu. Pengajuan izin hanya diperbolehkan untuk tanggal hari ini dan masa depan (tidak boleh di masa lalu).

- **Proses Tanggal**: Input berupa Tanggal Mulai dan Tanggal Selesai. Sistem secara otomatis melakukan iterasi harian dan menyimpannya sebagai baris tunggal per tanggal di database. Hari Sabtu dan Minggu otomatis dikecualikan karena PKL tidak berjalan pada akhir pekan.
- **Pembatalan Izin**: Peserta dapat membatalkan pengajuan izin hari ini atau hari mendatang yang akan otomatis menghapus entri izin dan mengembalikan status presensi.

| Field           | Kolom DB    | Keterangan                                   |
| --------------- | ----------- | -------------------------------------------- |
| Tanggal         | `tanggal`   | Tanggal izin (disimpan per tanggal)          |
| Alasan          | `alasan`    | Wajib                                        |
| Bukti Pendukung | `bukti_url` | Upload PDF/JPG/JPEG/PNG, maks. 5MB, opsional |

---

## 8. Selesai PKL

- Setelah `tanggal_keluar` terlewati, status di dashboard peserta terlihat sebagai `selesai` (derived).
- Fitur presensi tidak dapat diakses lagi.

---

## 9. Nilai & Sertifikat

- Peserta melihat data dari tabel `penilaian` (tersedia setelah admin mengisi)
- `nilai_akhir` dihitung otomatis oleh DB (rata-rata 6 kriteria)
- Sertifikat PDF digenerate otomatis oleh sistem dan dapat diunduh (tabel `sertifikat`).

---

## 10. Riwayat PKL & Pendaftaran Baru (Histori)

Setelah masa PKL selesai (`tanggal_selesai < CURRENT_DATE`), peserta dapat mendaftar PKL baru.

- Peserta hanya bisa daftar ulang jika tidak ada PKL yang sedang `aktif`.
- Jika masih ada pengajuan `menunggu` atau `ditolak`, pengajuan lama beserta kelompoknya **otomatis dihapus** saat submit pengajuan baru.
  - File surat pengantar lama ikut dihapus dari storage.
  - `onboarding_status` semua anggota kelompok lama di-reset ke `step_1_selesai` agar tidak stuck.
- Jika PKL sebelumnya sudah `selesai`, data profil (`profil_peserta`) tetap utuh dan tidak perlu diisi ulang.
- Riwayat PKL sebelumnya tetap tersimpan dan dapat dilihat di halaman Riwayat.
- Sertifikat & Surat Balasan dari periode lama tetap dapat diunduh dari riwayat.

---

## 11. Halaman Panduan Peserta PKL (Publik)

Tersedia halaman panduan komprehensif di rute `/panduan` yang dapat diakses secara publik (tanpa login).

- Berisi 10 topik panduan langkah demi langkah dari pendaftaran hingga penilaian & sertifikat serta Riwayat PKL.
- Dilengkapi dengan tombol CTA Hero interaktif (Mulai Panduan, Lihat Jadwal PKL, Daftar PKL) dan desain tombol modern.
- Dilengkapi dengan tangkapan layar (screenshot) asli aplikasi untuk setiap langkah.
- Memiliki navigasi sidebar sticky (desktop) dan bilah navigasi tab horizontal sticky (mobile) dengan pemantauan otomatis (scroll observer) dan desain serba responsif di berbagai perangkat ponsel.
