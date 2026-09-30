# ⏱ Backend Background Workers, WhatsApp Queue & Cron Scheduler (`docs/backend/WORKERS_AND_CRON.md`)

Dokumen ini menjelaskan layanan latar belakang (*background asynchronous services*) yang berjalan di backend SAIMS.

---

## 1. In-Memory WhatsApp Queue (Fonnte Gateway)

Untuk mencegah pembatasan kecepatan (*rate-limit blocking*) dari Fonnte API saat mengirim notifikasi masal, backend mengimplementasikan **In-Memory Channel Queue** berbasis Goroutines.

### Alur kerja:
1. Notifikasi peminjaman/maintenance dibuat dipush ke Go Channel.
2. Background Worker Goroutine mengonsumsi antrean 1 per 1.
3. Terintegrasi jeda aman `time.Sleep(1 * time.Second)` antar pengiriman.

---

## 2. ⏱ Cron Job Scheduler (`robfig/cron/v3`)

Penjadwalan otomatis berjalan secara mandiri di background tanpa memblokir thread HTTP server.

| Waktu Eksekusi | Tugas Cron Job | Deskripsi |
|---|---|---|
| **08:00 & 16:00** | Borrowing Due Reminder | Mengecek peminjaman yang memasuki H-1 & Hari-H tenggat pengembalian, lalu mengirim WA reminder. |
| **07:00** | Maintenance Daily Task | Mengirim daftar tugas perbaikan harian ke WhatsApp masing-masing Teknisi bertugas. |
| **02:00** | MinIO Garbage Collector | Pembersihan file/objek yatim (*orphan storage objects*) di MinIO S3 bucket. |

---

## Garbage Collector (GC) Rules
1. **Aturan 24 Jam**: Membersihkan JWT token blacklist yang kedaluwarsa.
2. **Aturan 30 Hari**: Soft delete data log audit lama dan file yatim setelah tenggat retensi 30 hari secara permanen.
