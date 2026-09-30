# Sistem Informasi Manajemen Peserta PKL

Sistem digital untuk mengelola seluruh siklus Praktik Kerja Lapangan (PKL) — mulai pendaftaran, verifikasi, presensi, penilaian, hingga penerbitan sertifikat.

---

## Daftar Dokumen

| File                                         | Isi                                    |
| -------------------------------------------- | -------------------------------------- |
| [roles-and-flows.md](./roles-and-flows.md)   | Peran pengguna & alur bisnis lengkap   |
| [features-peserta.md](./features-peserta.md) | Fitur untuk Peserta PKL                |
| [features-admin.md](./features-admin.md)     | Fitur untuk Admin HRD                  |
| [business-rules.md](./business-rules.md)     | Aturan bisnis: kuota, status, kelompok |
| [data-model.md](./data-model.md)             | Entitas data & atribut                 |
| [api-reference.md](./api-reference.md)       | Daftar endpoint API                    |
| [non-functional.md](./non-functional.md)     | Keamanan, browser, file, notifikasi    |
| [timeline.md](./timeline.md)                 | Timeline pengerjaan proyek             |

---

## Peran Pengguna

| Peran           | Deskripsi                                                 |
| --------------- | --------------------------------------------------------- |
| **Peserta PKL** | Mahasiswa/siswa yang mendaftar dan mengikuti PKL          |
| **Admin HRD**   | Staf perusahaan yang mengelola dan memverifikasi data PKL |

---

## Status Peserta (Ringkasan)

```
Menunggu → Aktif
Menunggu → Ditolak
```

> **Selesai** adalah status yang diturunkan (derived) secara otomatis ketika tanggal keluar/selesai PKL pada entri jadwal telah terlewati.

---

## Out of Scope

- Sistem pembayaran
- Chat / pesan antara peserta dan admin
- Approve/reject pengajuan izin
- Multi-perusahaan / multi-tenant
- Aplikasi mobile native
