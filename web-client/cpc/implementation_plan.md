# Plan: Multi-Standar Progress (Berdasarkan Tipe/Blok Unit)

## 1. Review Ide Anda
Ide Anda **sangat bagus dan sangat realistis** untuk aplikasi sistem kontrol perumahan. Pada praktiknya, perumahan selalu memiliki berbagai tipe rumah (misal: Tipe 36, Tipe 45, Ruko) atau blok yang berbeda yang membutuhkan:
- Jumlah dan nama tahapan yang berbeda.
- Kebutuhan material standar (RAB) yang berbeda.

Jika kita hanya menggunakan 1 standar global, sistem akan sangat kaku dan tidak bisa beradaptasi jika developer membangun klaster/tipe baru. Oleh karena itu, mengubah arsitektur menjadi *Multi-Standar Progress* adalah langkah yang tepat.

## 2. Arsitektur Database Baru
Saat ini: `matrix_progress` bersifat global.
Nantinya, kita perlu "mengelompokkan" `matrix_progress` ke dalam sebuah payung yang kita sebut `MasterStandar` (atau `TipeStandar`). Setiap unit juga harus di-link ke `MasterStandar` ini.

**Perubahan Skema (Migration):**
1. **Tabel Baru `master_standar_progress`**:
   - `id` (PK)
   - `nama_standar` (string, misal: "Standar Tipe 36")
   - `deskripsi` (text, nullable)
2. **Ubah Tabel `matrix_progress`**:
   - Tambah kolom `master_standar_id` (Foreign Key ke `master_standar_progress`).
3. **Ubah Tabel `units`**:
   - Tambah kolom `master_standar_id` (Foreign Key ke `master_standar_progress`, nullable agar fleksibel jika unit belum diset).

## 3. Strategi Migrasi Data Lama (Penting!)
Karena sistem sudah berjalan dan memiliki data, saat menjalankan migration kita tidak boleh membiarkan data rusak.
- Migration akan secara otomatis membuat 1 record di `master_standar_progress` bernama **"Standar Default (Lama)"**.
- Semua data di `matrix_progress` yang ada saat ini akan di-update agar memiliki `master_standar_id` yang mengarah ke "Standar Default" tersebut.
- Semua data `units` yang ada saat ini akan di-update `master_standar_id`-nya ke "Standar Default".

## 4. Perubahan Query View (`v_monitoring_progress`)
View monitoring saat ini melakukan `JOIN` untuk mencari tahap standar dengan `batas_atas >= progress_percent` secara global. Kita harus memperbarui query ini agar mencari standar di dalam `master_standar_id` milik unit tersebut.
```sql
JOIN matrix_progress mp
    ON mp.master_standar_id = u.master_standar_id
    AND mp.batas_atas = (
        SELECT MIN(batas_atas)
        FROM matrix_progress
        WHERE batas_atas >= pu.progress_percent
          AND master_standar_id = u.master_standar_id
    )
```

## 5. Perubahan Controller dan Frontend (Inertia/React)
- **Menu Baru / Struktur UI**:
  Halaman **Standar Progress** yang sebelumnya langsung menampilkan tahapan (matrix), sekarang akan menampilkan **Daftar Master Standar** (seperti daftar tipe rumah). Ketika salah satu diklik, barulah masuk ke detail tahapan (seperti UI saat ini, tapi difilter berdasarkan ID master).
- **Form Unit**:
  Pada saat *Create* atau *Edit* Unit, perlu ditambahkan dropdown **Pilih Standar Progress** agar unit terikat dengan standar yang benar.
- **StandarProgressController**:
  Perlu di-refactor. `index()` akan menampilkan daftar Master Standar. Akan ada method baru `show($id)` untuk menampilkan matriks tahapannya.

## User Review Required

> [!WARNING]
> Perubahan ini adalah perubahan arsitektur yang cukup besar (Major Change) karena melibatkan perubahan struktur relasi antara Unit dan Standar.
> 
> **Mohon konfirmasi:**
> 1. Apakah Anda setuju dengan nama tabel **`master_standar_progress`** (atau Anda punya preferensi nama lain seperti `tipe_rumah_standar`)?
> 2. Apakah alur UI yang disarankan sudah sesuai dengan bayangan Anda (Masuk menu Standar Progress -> Pilih "Standar Tipe A" -> Baru kelola tahapannya)?

## Verifikasi
- Unit lama tidak error karena sudah otomatis diikat ke "Standar Default (Lama)".
- View monitoring tetap berjalan normal.
- Bisa menambah standar baru dengan tahapan (matrix) yang 100% berbeda.
- Bisa menghubungkan unit baru ke standar yang baru.
