# Data Model

## Enum Types

| Enum                  | Nilai                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| `user_role`           | `peserta`, `admin`                                                       |
| `onboarding_status`   | `belum_mulai`, `step_1_selesai`, `selesai`                               |
| `jenis_kelompok`      | `individu`, `kelompok`                                                   |
| `status_pengajuan`    | `menunggu`, `aktif`, `ditolak`                                           |
| `status_presensi`     | `hadir`, `izin`, `alpha` (tidak hadir tanpa keterangan, dihitung sistem) |
| `jenis_surat_balasan` | `diterima`, `ditolak`                                                    |

> Status `selesai` **tidak disimpan** di DB. Di-derive secara real-time: jika `jadwal_pkl.tanggal_selesai <= CURRENT_DATE` dan status pengajuan adalah `aktif`.

---

## Entitas Utama

### users

| Kolom                      | Tipe        | Keterangan                 |
| -------------------------- | ----------- | -------------------------- |
| `id`                       | UUID PK     |                            |
| `email`                    | VARCHAR     | Unik                       |
| `password_hash`            | VARCHAR     | NULL jika login via Google |
| `google_id`                | VARCHAR     | NULL jika login via email  |
| `role`                     | user_role   | Default: `peserta`         |
| `email_verified`           | BOOLEAN     | Default: false             |
| `created_at`, `updated_at` | TIMESTAMPTZ |                            |

### profil_peserta

Relasi 1-to-1 dengan `users`. Diisi saat Onboarding Tahap 1.

| Kolom                | Tipe              | Keterangan                                          |
| -------------------- | ----------------- | --------------------------------------------------- |
| `id`                 | UUID PK           |                                                     |
| `user_id`            | UUID FK           | → `users.id`, unik                                  |
| `nama_lengkap`       | VARCHAR           |                                                     |
| `jenjang_pendidikan` | VARCHAR           | 'sekolah' / 'kuliah'                                |
| `nim_nisn`           | VARCHAR           |                                                     |
| `institusi`          | VARCHAR           |                                                     |
| `program_studi`      | VARCHAR           |                                                     |
| `cv_url`             | VARCHAR           | Object path file CV di MinIO (contoh: `cv/123.pdf`) |
| `onboarding_status`  | onboarding_status | Default: `belum_mulai`                              |

### kelompok

| Kolom        | Tipe           | Keterangan                 |
| ------------ | -------------- | -------------------------- |
| `id`         | UUID PK        |                            |
| `ketua_id`   | UUID FK        | → `users.id`               |
| `jenis`      | jenis_kelompok | `individu` atau `kelompok` |
| `created_at` | TIMESTAMPTZ    |                            |
| `updated_at` | TIMESTAMPTZ    |                            |

### kelompok_anggota

Relasi many-to-many antara `users` dan `kelompok`.

| Kolom         | Tipe        | Keterangan      |
| ------------- | ----------- | --------------- |
| `id`          | UUID PK     |                 |
| `kelompok_id` | UUID FK     | → `kelompok.id` |
| `user_id`     | UUID FK     | → `users.id`    |
| `created_at`  | TIMESTAMPTZ |                 |

Constraint: `(kelompok_id, user_id)` unik.

### pengajuan_pkl

Satu kelompok = satu pengajuan PKL.

| Kolom                     | Tipe             | Keterangan                                |
| ------------------------- | ---------------- | ----------------------------------------- |
| `id`                      | UUID PK          |                                           |
| `kelompok_id`             | UUID FK          | → `kelompok.id`, unik                     |
| `surat_pengantar_url`     | VARCHAR          | Object path file surat pengantar di MinIO |
| `nama_penerbit_surat`     | VARCHAR          | Jabatan penerbit surat pengantar          |
| `nomor_surat_pengantar`   | VARCHAR          | Nomor surat dari institusi asal           |
| `tanggal_surat_pengantar` | DATE             | Tanggal surat pengantar                   |
| `perihal_surat`           | VARCHAR          | Perihal surat pengantar                   |
| `status`                  | status_pengajuan | Default: `menunggu`                       |
| `alasan_tolak`            | TEXT             | Wajib diisi jika status = `ditolak`       |
| `catatan`                 | TEXT             | Catatan admin saat menerima               |
| `diproses_oleh`           | UUID FK          | → `users.id` (admin)                      |
| `diproses_pada`           | TIMESTAMPTZ      |                                           |
| `created_at`              | TIMESTAMPTZ      |                                           |
| `updated_at`              | TIMESTAMPTZ      |                                           |

### surat_balasan

Tracking surat balasan yang sudah di-generate oleh sistem.

| Kolom            | Tipe                | Keterangan                              |
| ---------------- | ------------------- | --------------------------------------- |
| `id`             | UUID PK             |                                         |
| `pengajuan_id`   | UUID FK             | → `pengajuan_pkl.id`                    |
| `jenis`          | jenis_surat_balasan | `diterima` atau `ditolak`               |
| `nomor_surat`    | VARCHAR             | Unik, format: 068/SDM/PT-MDI/VII/2026   |
| `file_url`       | VARCHAR             | Object path file surat balasan di MinIO |
| `generated_oleh` | UUID FK             | → `users.id` (admin)                    |
| `generated_at`   | TIMESTAMPTZ         |                                         |
| `created_at`     | TIMESTAMPTZ         |                                         |
| `updated_at`     | TIMESTAMPTZ         |                                         |

### jadwal_pkl

Dibuat otomatis saat pengajuan diterima (`status → 'aktif'`). Relasi 1-to-1 dengan `pengajuan_pkl`.

| Kolom             | Tipe        | Keterangan                 |
| ----------------- | ----------- | -------------------------- |
| `id`              | UUID PK     |                            |
| `pengajuan_id`    | UUID FK     | → `pengajuan_pkl.id`, unik |
| `tanggal_mulai`   | DATE        |                            |
| `tanggal_selesai` | DATE        | Harus > `tanggal_mulai`    |
| `created_at`      | TIMESTAMPTZ |                            |

### presensi

Catatan kehadiran harian per peserta. Satu baris per user per hari.

| Kolom        | Tipe            | Keterangan          |
| ------------ | --------------- | ------------------- |
| `id`         | UUID PK         |                     |
| `user_id`    | UUID FK         | → `users.id`        |
| `tanggal`    | DATE            |                     |
| `jam_masuk`  | TIMESTAMPTZ     |                     |
| `jam_keluar` | TIMESTAMPTZ     | Harus > `jam_masuk` |
| `status`     | status_presensi | Default: `hadir`    |
| `created_at` | TIMESTAMPTZ     |                     |
| `updated_at` | TIMESTAMPTZ     |                     |

Constraint: `(user_id, tanggal)` unik.

### izin

Pengajuan izin/cuti oleh peserta. Tidak ada approve/reject — hanya dicatat.

| Kolom        | Tipe        | Keterangan                                     |
| ------------ | ----------- | ---------------------------------------------- |
| `id`         | UUID PK     |                                                |
| `user_id`    | UUID FK     | → `users.id`                                   |
| `tanggal`    | DATE        |                                                |
| `kategori`   | VARCHAR     | Wajib                                          |
| `alasan`     | TEXT        | Wajib                                          |
| `bukti_url`  | VARCHAR     | Opsional. Object path file bukti izin di MinIO |
| `created_at` | TIMESTAMPTZ |                                                |
| `updated_at` | TIMESTAMPTZ |                                                |

### template_penilaian

Menyimpan data template penilaian yang terhubung dengan nama institusi.

| Kolom           | Tipe        | Keterangan               |
| --------------- | ----------- | ------------------------ |
| `id`            | UUID PK     |                          |
| `nama_template` | VARCHAR     | Nama template kriteria   |
| `institusi`     | VARCHAR     | Nama institusi (unik)    |
| `is_default`    | BOOLEAN     | Penanda template default |
| `created_at`    | TIMESTAMPTZ |                          |
| `updated_at`    | TIMESTAMPTZ |                          |

### template_kriteria

Menyimpan daftar kriteria penilaian per template.

| Kolom           | Tipe        | Keterangan                |
| --------------- | ----------- | ------------------------- |
| `id`            | UUID PK     |                           |
| `template_id`   | UUID FK     | → `template_penilaian.id` |
| `nama_kriteria` | VARCHAR     | Nama kriteria penilaian   |
| `urutan`        | INT         | Urutan tampilan kriteria  |
| `created_at`    | TIMESTAMPTZ |                           |

### penilaian

Nilai akhir dan metadata penilaian peserta.

| Kolom          | Tipe        | Keterangan                            |
| -------------- | ----------- | ------------------------------------- |
| `id`           | UUID PK     |                                       |
| `user_id`      | UUID FK     | → `users.id`                          |
| `pengajuan_id` | UUID FK     | → `pengajuan_pkl.id`                  |
| `dinilai_oleh` | UUID FK     | → `users.id` (admin)                  |
| `template_id`  | UUID FK     | → `template_penilaian.id`             |
| `nilai_akhir`  | NUMERIC     | Nilai rata-rata dari seluruh kriteria |
| `catatan`      | TEXT        | Catatan pembimbing                    |
| `created_at`   | TIMESTAMPTZ |                                       |
| `updated_at`   | TIMESTAMPTZ |                                       |

Constraint: `(user_id, pengajuan_id)` unik.

### penilaian_item

Nilai per kriteria dari penilaian peserta.

| Kolom          | Tipe    | Keterangan               |
| -------------- | ------- | ------------------------ |
| `id`           | UUID PK |                          |
| `penilaian_id` | UUID FK | → `penilaian.id`         |
| `kriteria_id`  | UUID FK | → `template_kriteria.id` |
| `nilai`        | NUMERIC | Nilai kriteria (0-100)   |

### sertifikat

Tracking sertifikat yang sudah di-generate untuk peserta (setelah penilaian).

| Kolom              | Tipe        | Keterangan                           |
| ------------------ | ----------- | ------------------------------------ |
| `id`               | UUID PK     |                                      |
| `user_id`          | UUID FK     | → `users.id`                         |
| `pengajuan_id`     | UUID FK     | → `pengajuan_pkl.id`                 |
| `nomor_sertifikat` | VARCHAR     | Unik, format: CERT/MDI/2026/001      |
| `file_url`         | VARCHAR     | Object path file sertifikat di MinIO |
| `generated_oleh`   | UUID FK     | → `users.id` (admin)                 |
| `generated_at`     | TIMESTAMPTZ |                                      |
| `created_at`       | TIMESTAMPTZ |                                      |
| `updated_at`       | TIMESTAMPTZ |                                      |

Constraint: `(user_id, pengajuan_id)` unik.

### settings

Singleton — hanya ada 1 baris (`id = 1`). Menyimpan pengaturan sistem.

| Kolom                       | Tipe        | Keterangan                                           |
| --------------------------- | ----------- | ---------------------------------------------------- |
| `id`                        | INT PK      | Selalu = 1                                           |
| `kapasitas_maksimal`        | INT         | Default: 10                                          |
| `email_notification`        | BOOLEAN     | Default: true                                        |
| `batas_waktu_bolos`         | TIME        | Default: '23:59:00'                                  |
| `mail_user`                 | VARCHAR     | Email Gmail pengirim notifikasi                      |
| `mail_pass`                 | VARCHAR     | App Password Gmail                                   |
| `template_nomor_surat`      | VARCHAR     | Default: '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}'    |
| `template_nomor_sertifikat` | VARCHAR     | Default: 'CERT/MDI/{tahun}/{no}'                     |
| `nomor_awal_surat`          | INT         | Default: 1                                           |
| `nomor_awal_sertifikat`     | INT         | Default: 1                                           |
| `counter_surat`             | INT         | Default: 0 (counter permanen untuk nomor surat)      |
| `counter_sertifikat`        | INT         | Default: 0 (counter permanen untuk nomor sertifikat) |
| `created_at`                | TIMESTAMPTZ |                                                      |
| `updated_at`                | TIMESTAMPTZ |                                                      |
| `updated_oleh`              | UUID FK     | → `users.id` (admin terakhir)                        |

### pending_otps

Menyimpan OTP sementara untuk konfirmasi email dan reset password.

| Kolom        | Tipe        | Keterangan                            |
| ------------ | ----------- | ------------------------------------- |
| `id`         | UUID PK     |                                       |
| `email`      | VARCHAR     |                                       |
| `otp_code`   | VARCHAR     |                                       |
| `type`       | VARCHAR     | Jenis OTP (mis. `email_confirmation`) |
| `expires_at` | TIMESTAMPTZ |                                       |
| `created_at` | TIMESTAMPTZ |                                       |

### notifications

Menyimpan notifikasi sistem untuk dibaca oleh admin.

| Kolom         | Tipe        | Keterangan                     |
| ------------- | ----------- | ------------------------------ |
| `id`          | UUID PK     |                                |
| `type`        | VARCHAR     | Jenis notifikasi (mis. `izin`) |
| `title`       | VARCHAR     | Judul notifikasi               |
| `body`        | TEXT        | Konten/detail notifikasi       |
| `related_id`  | UUID FK     | Nullable, link ke data terkait |
| `target_date` | DATE        | Target tanggal notifikasi      |
| `is_read`     | BOOLEAN     | Status sudah dibaca            |
| `created_at`  | TIMESTAMPTZ |                                |

---

## Relasi Antar Entitas

```
users ──────────────┬── profil_peserta            (1-to-1)
                    ├── kelompok_anggota ── kelompok ── pengajuan_pkl ── jadwal_pkl (1-to-1)
                    │                                         └── surat_balasan
                    ├── presensi
                    ├── izin
                    ├── penilaian
                    └── sertifikat
```

---

## Views

| View                    | Kegunaan                                                                        |
| ----------------------- | ------------------------------------------------------------------------------- |
| `v_jadwal_pkl_publik`   | Endpoint publik — daftar jadwal PKL aktif dari `jadwal_pkl` tanpa data pribadi  |
| `v_rekap_presensi`      | Admin — rekap hadir/izin/alpha per peserta berdasarkan `jadwal_pkl`             |
| `v_dashboard_admin`     | Admin — statistik total per status pengajuan                                    |
| `v_histori_pkl_peserta` | Peserta — riwayat seluruh PKL per user (termasuk status selesai yang di-derive) |

## Functions

| Function                                                    | Kegunaan                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `cek_kuota_pkl(tanggal_masuk, tanggal_keluar, exclude_id?)` | Menghitung peserta aktif yang overlap dengan periode yang diminta; mengembalikan `peserta_aktif`, `kapasitas_maks`, dan `tersedia` (boolean) |
| `trigger_set_updated_at()`                                  | Trigger untuk auto-update kolom `updated_at` pada semua tabel                                                                                |
