# Timeline Pengerjaan Proyek — Sistem Informasi Manajemen Peserta PKL

**Proyek:** Microintern — Sistem Informasi Manajemen Peserta PKL  
**Durasi:** 29 Hari Kerja  
**Periode:** 15 Juni – 25 Juli 2026

---

## Ringkasan

| Minggu       | Periode        | Fokus                                                             |
| ------------ | -------------- | ----------------------------------------------------------------- |
| **Minggu 1** | 15–19 Juni     | Perencanaan, prototipe, database, migrasi                         |
| **Minggu 2** | 22–27 Juni     | Autentikasi, onboarding, pendaftaran PKL, presensi                |
| **Minggu 3** | 30 Juni–4 Juli | Izin peserta, halaman publik, dashboard, UI onboarding            |
| **Minggu 4** | 7–11 Juli      | Presensi, izin, nilai & sertifikat, integrasi, testing            |
| **Minggu 5** | 14–18 Juli     | Manajemen admin: pendaftaran, peserta, monitoring, nilai, laporan |
| **Minggu 6** | 21–25 Juli     | Testing akhir, bug fixing, dokumentasi, deployment                |

---

## Detail Per Minggu

### Minggu 1 — 15–19 Juni

| Hari   | Tanggal             | Kegiatan                                                                                                       |
| ------ | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **1**  | Senin, 15 Juni      | Inisiasi proyek yang akan dikerjakan selama sebulan. Proyeknya bernama Sistem Informasi Manajemen Peserta PKL. |
| ~~--~~ | ~~Selasa, 16 Juni~~ | ~~Libur Nasional (Idul Adha) — skip~~                                                                          |
| **2**  | Rabu, 17 Juni       | Membuat prototipe website project Microintern. (frontend)                                                      |
| **3**  | Kamis, 18 Juni      | Merancang database project Microintern.                                                                        |
| **4**  | Jumat, 19 Juni      | Melakukan migrasi database dan membuat repositories atau model di codebase.                                    |

### Minggu 2 — 22–27 Juni

| Hari  | Tanggal         | Kegiatan                                                                                                                    |
| ----- | --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **5** | Senin, 22 Juni  | Melanjutkan progress pembuatan web dengan membuat fitur autentikasi dan pendaftarannya.                                     |
| **6** | Selasa, 23 Juni | Membuat fitur registrasi peserta: email + password dan Google OAuth, termasuk verifikasi email.                             |
| **7** | Rabu, 24 Juni   | Membuat fitur onboarding tahap 1 — pengisian data diri peserta (nama, NIM/NISN, institusi, prodi, upload CV).               |
| **8** | Kamis, 25 Juni  | Membuat fitur onboarding tahap 2 — pengajuan PKL individu dan kelompok, termasuk upload surat pengantar dan validasi kuota. |
| **9** | Jumat, 26 Juni  | Membuat endpoint submit pendaftaran: menyimpan data pengajuan dengan status menunggu dan kirim notifikasi email awal.       |

### Minggu 3 — 30 Juni–4 Juli

| Hari   | Tanggal        | Kegiatan                                                                                                      |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| **10** | Senin, 30 Juni | Membuat fitur presensi harian peserta: tombol datang dan pulang, dengan validasi satu presensi per hari.      |
| **11** | Selasa, 1 Juli | Membuat fitur pengajuan izin/cuti peserta: form alasan, upload bukti, dan penyimpanan ke database.            |
| **12** | Rabu, 2 Juli   | Memperbagus halaman publik jadwal PKL — menampilkan daftar pengajuan yang sedang berjalan dan mendatang.      |
| **13** | Kamis, 3 Juli  | Memperbagus halaman dashboard peserta: status pengajuan, ringkasan presensi, dan notifikasi perubahan status. |
| **14** | Jumat, 4 Juli  | Memperbagus UI onboarding — form multi-step tahap 1 dan tahap 2 dengan validasi di sisi frontend.             |

### Minggu 4 — 7–11 Juli

| Hari   | Tanggal        | Kegiatan                                                                                                             |
| ------ | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **15** | Senin, 7 Juli  | Memperbagus halaman presensi harian peserta: tombol datang/pulang, riwayat presensi, dan status hari ini.            |
| **16** | Selasa, 8 Juli | Memperbagus halaman pengajuan izin peserta: form izin, riwayat izin, dan upload dokumen pendukung.                   |
| **17** | Rabu, 9 Juli   | Memperbagus halaman nilai dan sertifikat peserta: tampilan nilai per kriteria, nilai akhir, dan download sertifikat. |
| **18** | Kamis, 10 Juli | Menghubungkan semua halaman peserta dengan API yang sudah dibuat, termasuk handling state dan error.                 |
| **19** | Jumat, 11 Juli | Testing dan bug fixing fitur-fitur sisi peserta. Perbaikan UX berdasarkan hasil pengujian.                           |

### Minggu 5 — 14–18 Juli

| Hari   | Tanggal         | Kegiatan                                                                                                                       |
| ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **20** | Senin, 14 Juli  | Memperbagus halaman manajemen pendaftaran admin: daftar pengajuan PKL, aksi terima/tolak, dan notifikasi email ke peserta.     |
| **21** | Selasa, 15 Juli | Memperbagus halaman manajemen peserta admin: daftar peserta dengan filter status, institusi, periode, dan pencarian nama.      |
| **22** | Rabu, 16 Juli   | Memperbagus halaman monitoring presensi admin: rekap kehadiran, daftar izin masuk, dan filter berdasarkan tanggal dan peserta. |
| **23** | Kamis, 17 Juli  | Membuat fitur penilaian peserta admin: form input nilai 6 kriteria dan perhitungan nilai akhir otomatis.                       |
| **24** | Jumat, 18 Juli  | Memperbagus dashboard dan laporan admin: statistik keseluruhan dan fitur export CSV untuk rekap peserta, kehadiran, dan nilai. |

### Minggu 6 — 21–25 Juli

| Hari   | Tanggal         | Kegiatan                                                                                                          |
| ------ | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **25** | Senin, 21 Juli  | Membuat fitur konfigurasi kuota PKL oleh admin dan mengintegrasikannya dengan validasi kuota di alur pendaftaran. |
| **26** | Selasa, 22 Juli | End-to-end testing seluruh alur sistem: dari registrasi peserta sampai monitoring admin.                          |
| **27** | Rabu, 23 Juli   | Bug fixing hasil testing. Optimasi query dan review keamanan sistem.                                              |
| **28** | Kamis, 24 Juli  | Finalisasi dokumentasi teknis, update docs/, dan persiapan presentasi atau demo proyek.                           |
| **29** | Jumat, 25 Juli  | _(Buffer)_ — Penyelesaian hal yang belum selesai, persiapan deployment, atau presentasi akhir.                    |

---

> **Catatan:**
>
> - Hari ke-29 (25 Juli) adalah hari buffer cadangan.
> - Libur Nasional Idul Adha (16 Juni) sudah di-skip dari hitungan hari kerja.
> - Total hari kerja efektif: **29 hari** (15 Juni – 25 Juli 2026).
