# Aturan Bisnis

## 1. Sistem Kuota

- Admin HRD mengatur **kapasitas maksimal peserta per periode** (disimpan di tabel `settings`, default: 10)
- Kuota dihitung berdasarkan **overlap tanggal** pada tabel `jadwal_pkl` (untuk pengajuan dengan status `aktif`) — bukan per bulan/tahun
- Gunakan function `cek_kuota_pkl(tanggal_masuk, tanggal_keluar)` untuk mengecek ketersediaan sebelum menyimpan pengajuan baru
- Jika kapasitas penuh, tampilkan peringatan ke peserta dan cegah submit.

---

## 2. Status Peserta & Jadwal PKL

```
menunggu → aktif  (Jika diterima)
menunggu → ditolak (Jika ditolak)
```

| Status     | Keterangan                                                |
| ---------- | --------------------------------------------------------- |
| `menunggu` | Pendaftaran sudah disubmit, belum diproses admin          |
| `aktif`    | Diterima; sedang atau akan menjalani PKL                  |
| `ditolak`  | Pengajuan ditolak admin; kolom `alasan_tolak` wajib diisi |

> **Selesai (Derived Status)**: Masa PKL telah memasuki atau melewati tanggal selesai. Di-derive secara real-time jika `jadwal_pkl.tanggal_selesai <= CURRENT_DATE` dan status pengajuan adalah `'aktif'`. Tidak disimpan sebagai nilai enum di database.

**Constraint DB:** Jika `status = 'ditolak'`, kolom `alasan_tolak` tidak boleh NULL (`chk_alasan_tolak`).

**Otomasi Jadwal PKL:**

- Saat `pengajuan_pkl.status` diubah menjadi `'aktif'`, entri `jadwal_pkl` baru otomatis dibuat.
- Jika status dibatalkan (Batal) dari `'aktif'` ke `'menunggu'`, entri `jadwal_pkl` otomatis dihapus dari database.
- **Prioritas Jadwal PKL**: Jika peserta memiliki histori beberapa PKL (misal PKL sebelumnya sudah `selesai` dan mendaftar PKL baru), penentuan jadwal aktif untuk presensi dan pengajuan izin diprioritaskan pada entri PKL berstatus `aktif` yang periode berjalannya belum berakhir.

- **Aturan Pengajuan PKL**: Peserta hanya dapat mengajukan pendaftaran PKL dengan tanggal masuk hari ini dan setelahnya (tidak boleh di masa lalu).

---

## 3. Aktivasi Fitur Presensi

| Kondisi                                                                                                 | Perilaku                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Tanggal = `jadwal_pkl.tanggal_mulai` (status pengajuan `aktif`)                                         | Tombol presensi **otomatis aktif** (sebelum batas waktu presensi harian) |
| Melewati `jadwal_pkl.tanggal_selesai` (status pengajuan `selesai`)                                      | Tombol presensi **otomatis nonaktif**                                    |
| Melewati batas waktu presensi harian (`batas_waktu_bolos`) pada hari berjalan dan belum presensi datang | Tombol presensi Datang **otomatis nonaktif**                             |

**Status presensi:**

- `hadir` — peserta menekan tombol Datang
- `izin` — peserta mengajukan izin untuk hari tersebut
- `alpha` — tidak hadir tanpa keterangan (dihitung sistem)

Constraint DB: `(user_id, tanggal)` unik di tabel `presensi` — satu baris per orang per hari.

- **Aturan Pengajuan Izin**: Peserta hanya dapat mengajukan izin untuk tanggal hari ini dan setelahnya (tidak boleh di masa lalu).

---

## 4. Kelompok PKL

- Semua anggota kelompok berbagi **periode PKL yang sama**
- Penilaian dilakukan **per individu** (bukan per kelompok)
- Jika salah satu anggota kelompok ditolak, **seluruh kelompok ikut ditolak**
- Individu = kelompok dengan 1 orang (`jenis = 'individu'`)
- Peserta yang saat ini berstatus aktif PKL (`status = 'aktif'` dan `tanggal_selesai > CURRENT_DATE`) **tidak dapat dicari/ditambahkan** sebagai anggota kelompok baru.

---

## 5. Penilaian

- Bisa dilakukan mulai tanggal selesai PKL (`tanggal_selesai <= CURRENT_DATE`).
- `nilai_akhir` adalah **generated column** — rata-rata sederhana dari seluruh kriteria, dihitung otomatis oleh DB
- Setiap kriteria bernilai 0–100
- Admin dapat **mengupdate** penilaian yang sudah dibuat.
- Kriteria penilaian dinamis menggunakan sistem template yang terhubung dengan institusi peserta.
- Setiap kriteria penilaian dalam satu penilaian wajib memiliki nama yang unik (tidak boleh duplikat). Sistem memvalidasi duplikasi kriteria di frontend dan backend, serta menangani constraint database `uq_penilaian_kriteria` dengan pesan error yang jelas.
- Jika institusi peserta memiliki template penilaian khusus, kriteria tersebut akan dimuat. Jika tidak ada, sistem akan memuat template standar default.
- Admin dapat langsung memodifikasi kriteria penilaian (tambah atau hapus kriteria) langsung dari halaman Form Penilaian. Perubahan tersebut otomatis tersimpan ke template institusi terkait dan sinkron dengan peserta lain dari institusi yang sama.

---

## 6. Onboarding

Peserta tidak bisa skip tahap:

| `onboarding_status` | Artinya                                       |
| ------------------- | --------------------------------------------- |
| `belum_mulai`       | Akun baru dibuat, belum isi data diri         |
| `step_1_selesai`    | Data diri sudah diisi, belum submit pengajuan |
| `selesai`           | Pengajuan PKL sudah disubmit                  |
