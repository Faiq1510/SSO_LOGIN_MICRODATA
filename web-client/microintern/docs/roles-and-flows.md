# Peran & Alur Bisnis

## Peran Pengguna

| Peran           | Deskripsi                                                 |
| --------------- | --------------------------------------------------------- |
| **Peserta PKL** | Mahasiswa/siswa yang mendaftar dan mengikuti PKL          |
| **Admin HRD**   | Staf perusahaan yang mengelola dan memverifikasi data PKL |

---

## Alur Bisnis Lengkap

### 1. Pendaftaran & Onboarding

```
[Peserta]
  → Registrasi (email/Google/SSO)
  → Onboarding 1: Isi data diri & CV
  → Onboarding 2: Pilih individu/kelompok, upload surat, pilih periode
  → Submit Pendaftaran
  → Status: Menunggu
```

### 2. Verifikasi Admin

```
[Admin HRD]
  → Melihat daftar pendaftaran (dikelompokkan per kelompok)
  → Terima → Kirim surat balasan → Status: Aktif
     atau
  → Tolak  → Isi alasan         → Status: Ditolak
```

### 3. Pelaksanaan PKL

```
[Pada Tanggal Masuk PKL]
  → Fitur presensi aktif otomatis

[Peserta — Setiap Hari]
  → Tekan tombol Datang (jam masuk tercatat)
  → Tekan tombol Pulang (jam keluar tercatat)
  → Opsional: Ajukan izin/cuti dengan alasan & bukti
```

### 4. Selesai & Penilaian

```
[Pada Tanggal Keluar PKL]
  → Status otomatis → Selesai
  → Presensi nonaktif

[Admin HRD]
  → Memberikan penilaian per individu

[Peserta]
  → Melihat nilai
  → Download sertifikat PDF
```
