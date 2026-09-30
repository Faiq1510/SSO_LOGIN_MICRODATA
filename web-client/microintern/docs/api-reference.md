# API Reference

Base URL: `/api`

## Auth

| Method       | Endpoint                           | Auth | Deskripsi                                          |
| ------------ | ---------------------------------- | ---- | -------------------------------------------------- |
| `GET`        | `/auth/google/client-id`           | —    | Ambil Google Client ID untuk frontend              |
| `POST`       | `/auth/register`                   | —    | Daftar akun baru (email+password)                  |
| `POST`       | `/auth/login`                      | —    | Login dengan email & password                      |
| `POST`       | `/auth/google`                     | —    | Login/daftar dengan Google ID Token                |
| `POST`       | `/auth/refresh`                    | —    | Refresh access token                               |
| `POST`       | `/auth/email/request-confirmation` | —    | Kirim ulang OTP konfirmasi email                   |
| `POST`       | `/auth/email/confirm`              | —    | Konfirmasi email dengan OTP                        |
| `POST`       | `/auth/password/forgot`            | —    | Kirim OTP reset password                           |
| `POST`       | `/auth/password/reset`             | —    | Reset password dengan OTP                          |
| `GET`/`POST` | `/auth/sso/callback`               | —    | Callback otentikasi SSO (stateless zero-fetch JWT) |
| `GET`/`POST` | `/sso/callback`                    | —    | Alias callback otentikasi SSO                      |

---

## Upload File

| Method   | Endpoint  | Auth | Deskripsi                                                                                                                                                                          |
| -------- | --------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/upload` | JWT  | Upload file. Query: `?type=cv \| surat \| bukti \| sertifikat \| general`. Format: PDF, JPG, JPEG, PNG. Maks 10MB. Response: `{ url: "folder/filename.ext" }` (object path MinIO). |
| `DELETE` | `/upload` | JWT  | Hapus file. Body: `{ url }` — menerima object path MinIO (contoh: `cv/123.pdf`) maupun full URL lama.                                                                              |

---

## Profil

| Method   | Endpoint                        | Auth | Deskripsi                                                  |
| -------- | ------------------------------- | ---- | ---------------------------------------------------------- |
| `GET`    | `/profil`                       | JWT  | Ambil profil user yang sedang login                        |
| `PUT`    | `/profil`                       | JWT  | Update profil (email, data diri, CV, onboarding_status)    |
| `PUT`    | `/profil/password`              | JWT  | Ganti password                                             |
| `POST`   | `/profil/google/connect`        | JWT  | Hubungkan akun Google                                      |
| `DELETE` | `/profil/google/disconnect`     | JWT  | Putuskan akun Google                                       |
| `GET`    | `/profil/pengajuan`             | JWT  | Ambil detail pengajuan PKL aktif (onboarding)              |
| `POST`   | `/profil/email/request-otp`     | JWT  | Request OTP untuk mengubah email peserta                   |
| `PUT`    | `/profil/email/confirm`         | JWT  | Konfirmasi perubahan email menggunakan OTP                 |
| `GET`    | `/profil/suggestions/institusi` | JWT  | Ambil saran autocomplete nama institusi (`?q=`)            |
| `GET`    | `/profil/suggestions/prodi`     | JWT  | Ambil saran autocomplete nama prodi (`?q=`, `?institusi=`) |

---

## Pendaftaran (Peserta)

| Method   | Endpoint                     | Auth | Deskripsi                                                                              |
| -------- | ---------------------------- | ---- | -------------------------------------------------------------------------------------- |
| `GET`    | `/pendaftaran/jadwal-publik` | —    | Daftar jadwal PKL aktif & mendatang (publik)                                           |
| `GET`    | `/pendaftaran/cek-kuota`     | JWT  | Cek ketersediaan kuota. Query: `tanggalMasuk`, `tanggalKeluar`                         |
| `POST`   | `/pendaftaran`               | JWT  | Submit pengajuan PKL                                                                   |
| `GET`    | `/pendaftaran/saya`          | JWT  | Status & detail pendaftaran milik sendiri                                              |
| `DELETE` | `/pendaftaran/saya`          | JWT  | Batalkan/withdraw pengajuan pendaftaran berstatus `menunggu`                           |
| `GET`    | `/pendaftaran/histori`       | JWT  | Riwayat seluruh PKL milik sendiri                                                      |
| `GET`    | `/users`                     | JWT  | Cari peserta lain untuk kelompok (mengeksklusi peserta aktif). Query: `?search=:query` |

---

## Presensi (Peserta)

| Method | Endpoint             | Auth | Deskripsi                        |
| ------ | -------------------- | ---- | -------------------------------- |
| `POST` | `/presensi/datang`   | JWT  | Catat jam masuk                  |
| `POST` | `/presensi/pulang`   | JWT  | Catat jam keluar                 |
| `GET`  | `/presensi/hari-ini` | JWT  | Status presensi hari ini         |
| `GET`  | `/presensi/riwayat`  | JWT  | Riwayat presensi seluruh periode |

---

## Izin (Peserta)

| Method   | Endpoint     | Auth | Deskripsi                                                                       |
| -------- | ------------ | ---- | ------------------------------------------------------------------------------- |
| `POST`   | `/izin`      | JWT  | Ajukan izin/cuti. Body: `tanggalMulai`, `tanggalSelesai`, `alasan`, `buktiUrl?` |
| `GET`    | `/izin/saya` | JWT  | Lihat semua data pengajuan izin milik sendiri                                   |
| `DELETE` | `/izin/:id`  | JWT  | Batalkan pengajuan izin (hanya untuk tanggal hari ini atau masa depan)          |

---

## Penilaian (Peserta)

| Method | Endpoint          | Auth | Deskripsi                     |
| ------ | ----------------- | ---- | ----------------------------- |
| `GET`  | `/penilaian/saya` | JWT  | Lihat nilai PKL milik sendiri |

---

## Admin — Pendaftaran

| Method | Endpoint                        | Auth  | Deskripsi                                                |
| ------ | ------------------------------- | ----- | -------------------------------------------------------- |
| `GET`  | `/pendaftaran/admin`            | Admin | Daftar semua pengajuan. Query: `status`, `page`, `limit` |
| `PUT`  | `/pendaftaran/admin/:id/terima` | Admin | Terima pengajuan                                         |
| `PUT`  | `/pendaftaran/admin/:id/tolak`  | Admin | Tolak pengajuan. Body: `alasan_tolak`                    |
| `PUT`  | `/pendaftaran/admin/:id/batal`  | Admin | Batalkan keputusan (kembalikan ke menunggu)              |

---

## Admin — Peserta

| Method | Endpoint                      | Auth  | Deskripsi                                                                                                  |
| ------ | ----------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `GET`  | `/admin/peserta`              | Admin | Daftar peserta. Query: `search`, `status`, `institusi`, `prodi`, `start_date`, `end_date`, `page`, `limit` |
| `GET`  | `/admin/peserta/statistik`    | Admin | Statistik demografi & rata-rata durasi magang                                                              |
| `GET`  | `/admin/peserta/:id`          | Admin | Detail profil satu peserta                                                                                 |
| `GET`  | `/admin/peserta/:id/histori`  | Admin | Riwayat PKL satu peserta                                                                                   |
| `GET`  | `/admin/peserta/:id/presensi` | Admin | Data presensi harian satu peserta                                                                          |
| `PUT`  | `/admin/peserta/:id`          | Admin | Update data profil peserta                                                                                 |

---

## Admin — Presensi & Izin

| Method | Endpoint          | Auth  | Deskripsi                                               |
| ------ | ----------------- | ----- | ------------------------------------------------------- |
| `GET`  | `/admin/presensi` | Admin | Rekap presensi harian. Query: `tanggal`                 |
| `GET`  | `/admin/izin`     | Admin | Daftar pengajuan izin. Query: `tanggal`, `nama_peserta` |

---

## Admin — Penilaian

| Method | Endpoint                   | Auth  | Deskripsi                                                         |
| ------ | -------------------------- | ----- | ----------------------------------------------------------------- |
| `GET`  | `/admin/penilaian`         | Admin | Daftar peserta selesai & status penilaian. Query: `page`, `limit` |
| `GET`  | `/admin/penilaian/:userId` | Admin | Detail penilaian satu peserta                                     |
| `POST` | `/admin/penilaian/:userId` | Admin | Buat penilaian baru                                               |
| `PUT`  | `/admin/penilaian/:userId` | Admin | Update penilaian yang sudah ada                                   |

---

## Admin — Dashboard & Laporan

| Method | Endpoint                | Auth  | Deskripsi                                                                                                                                                   |
| ------ | ----------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/admin/dashboard`      | Admin | Statistik & pendaftaran terbaru                                                                                                                             |
| `GET`  | `/admin/laporan/export` | Admin | Export laporan. Query: `type=peserta \| presensi \| nilai`, `format=csv \| xlsx \| pdf`, `startDate=YYYY-MM-DD` (opsional), `endDate=YYYY-MM-DD` (opsional) |

---

## Admin — Template Penilaian

|          | Method                          | Endpoint | Auth                               | Deskripsi |
| -------- | ------------------------------- | -------- | ---------------------------------- | --------- |
| `GET`    | `/admin/template-penilaian`     | Admin    | Daftar seluruh template penilaian  |
| `GET`    | `/admin/template-penilaian/:id` | Admin    | Detail template penilaian tertentu |
| `POST`   | `/admin/template-penilaian`     | Admin    | Buat template penilaian baru       |
| `PUT`    | `/admin/template-penilaian/:id` | Admin    | Update template penilaian          |
| `DELETE` | `/admin/template-penilaian/:id` | Admin    | Hapus template penilaian           |

---

## Admin — Kuota & Settings

| Method | Endpoint                       | Auth  | Deskripsi                                                                                                                                                               |
| ------ | ------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/admin/website-settings`      | Admin | Lihat kapasitas, waktu bolos, pengaturan email, template & nomor awal dokumen, counter permanen, & peserta aktif                                                        |
| `PUT`  | `/admin/website-settings`      | Admin | Update `kapasitas_maksimal`, `batas_waktu_bolos`, `emailNotification`, `template_nomor_surat`, `template_nomor_sertifikat`, `nomor_awal_surat`, `nomor_awal_sertifikat` |
| `GET`  | `/admin/dokumen/surat-balasan` | Admin | Daftar surat balasan yang telah digenerate. Query: `page`, `limit`                                                                                                      |
| `GET`  | `/admin/dokumen/sertifikat`    | Admin | Daftar sertifikat yang telah digenerate. Query: `page`, `limit`                                                                                                         |

---

## Admin — Notifikasi

| Method   | Endpoint                        | Auth  | Deskripsi                                  |
| -------- | ------------------------------- | ----- | ------------------------------------------ |
| `GET`    | `/admin/notifications`          | Admin | Mendapatkan daftar 50 notifikasi terbaru   |
| `GET`    | `/admin/notifications/count`    | Admin | Mendapatkan jumlah notifikasi belum dibaca |
| `PATCH`  | `/admin/notifications/:id/read` | Admin | Menandai satu notifikasi sebagai dibaca    |
| `PATCH`  | `/admin/notifications/read-all` | Admin | Menandai semua notifikasi sebagai dibaca   |
| `DELETE` | `/admin/notifications/:id`      | Admin | Menghapus satu notifikasi                  |
