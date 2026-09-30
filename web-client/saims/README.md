# Smart Asset & Inventory Management System (SAIMS)

## Deskripsi

**Smart Asset & Inventory Management System (SAIMS)** adalah aplikasi berbasis web yang dirancang untuk membantu perusahaan dalam mengelola inventaris dan aset kantor secara terpusat. Sistem ini memungkinkan pengelolaan barang, peminjaman aset, maintenance, persetujuan (approval), notifikasi WhatsApp, serta monitoring melalui dashboard analitik.

---

## Quick Onboarding Checklist (< 3 Menit)

1. **Jalankan Database & Storage (PostgreSQL & MinIO)**:
 ```bash
 docker-compose up -d
 ```
2. **Jalankan Backend API (Golang)**:
 ```bash
 cd backend && go run cmd/server/main.go
 ```
3. **Jalankan Frontend App (Next.js)**:
 ```bash
 cd frontend && npm run dev
 ```
 > **Shortcut Otomatis**: Jalankan `scripts/start.bat` (Windows) / `scripts/start.sh` (Linux) untuk menyalakan seluruh layanan sekaligus dalam 1 klik.

---

## Tujuan Proyek

- Mengelola data inventaris dan aset perusahaan secara terpusat.
- Mempermudah proses peminjaman dan pengembalian aset.
- Memonitor kondisi dan jadwal maintenance aset.
- Meningkatkan transparansi melalui workflow persetujuan (approval).
- Menyediakan dashboard analitik untuk pengambilan keputusan.
- Mengirim notifikasi otomatis melalui WhatsApp.

---

## Fitur Utama (12 Modul)

### 1. Autentikasi & Manajemen Pengguna
- Login & Register berbasis JWT (HttpOnly Cookie).
- Manajemen Profil & Role Base Access Control (RBAC).
- Manajemen User (CRUD) khusus Administrator.

### 2. Manajemen Aset / Inventory
- Manajemen data barang dan aset secara lengkap.
- Kategorisasi, lokasi penyimpanan, dan auto-generate Asset ID.
- Monitoring ketersediaan dan kondisi fisik aset.

### 3. Tracking & QR Code
- Generate QR Code untuk setiap aset terdaftar.
- Scan QR Code untuk melihat detail aset (Mobile/Web).

### 4. Peminjaman Barang (Borrowing)
- Pengajuan peminjaman aset oleh Staff.
- Persetujuan (Approval) multi-level oleh Supervisor/Manager.
- Pelacakan riwayat dan status pengembalian.

### 5. Manajemen Pemeliharaan (Maintenance)
- Pembuatan jadwal maintenance berkala/insidentil oleh Teknisi.
- Riwayat dan tracking biaya perbaikan aset.
- Otomatisasi perubahan status aset (contoh: sedang diservis).

### 6. Dashboard Analytics
- Ringkasan statistik (total aset, dipinjam, maintenance).
- Visualisasi data (kondisi, kategori) dalam bentuk grafik interaktif.

### 7. Notifikasi WhatsApp Gateway
- Pengiriman notifikasi proaktif pada setiap alur kerja (Peminjaman & Maintenance).
- Terintegrasi secara seamless menggunakan Fonnte API.

### 8. ⏱ Otomatisasi / Cron Job Scheduler
- Reminder harian otomatis untuk batas waktu pengembalian aset.
- Reminder jadwal perbaikan aset kepada teknisi bertugas.

### 9. Invoice & Pembayaran
- Generate dokumen tagihan berformat PDF.
- Konfirmasi pembayaran massal (Bulk Payment) oleh Administrator.

### 10. Audit Trail & Logging
- Pencatatan riwayat perubahan data krusial secara permanen (Immutable).
- Monitoring log aktivitas berdasarkan pengguna dan rentang waktu.

### 11. Persetujuan Penghapusan Aset (Deletion Request)
- Alur kerja khusus (Approval Workflow) untuk mencegah penghapusan aset tanpa otorisasi.
- Hak eksklusif Supervisor untuk mengizinkan (Approve) penghapusan.

### 12. Garbage Collector (GC)
- Latar belakang (Background Service) pembersihan file yatim (*orphan files*) di penyimpanan MinIO.
- Penghapusan data sampah (Soft Delete) dari *database* secara permanen setelah tenggat retensi 30 hari.

---

## Role Pengguna

### Administrator
- Mengelola seluruh data sistem.
- Mengelola user dan role.
- Melihat seluruh laporan.

### Staff
- Mengajukan peminjaman aset.
- Melihat aset yang tersedia.
- Melihat riwayat peminjaman.

### Supervisor / Manager
- Melakukan approval pengajuan.
- Monitoring aset departemen.

### Teknisi
- Mengelola maintenance aset.
- Memperbarui status maintenance.

---

## Arsitektur Sistem & Tech Stack

```text
 User (Web Browser)
 │
 ▼
+-------------------------------------------------+
| Frontend (Web Application) |
| - Framework: Next.js 16 (App Router) |
| - Styling: Tailwind CSS |
| - State/Fetch: Axios (withCredentials: true) |
+-------------------------------------------------+
 │ (REST API & HttpOnly Cookies)
 ▼
+-------------------------------------------------+
| Backend API (Golang) |
| - Language: Go 1.26.4 |
| - Framework: Gin Web Framework |
| - Security: JWT, 2FA (OTP via WA) |
| - Cron Jobs: robfig/cron (Background Tasks) |
| |
| [ Modules ] |
| ├── 1. Auth & User Module |
| ├── 2. Inventory & Asset Module |
| ├── 3. QR Tracking Module |
| ├── 4. Borrowing Module |
| ├── 5. Maintenance Module |
| ├── 6. Analytics Module |
| ├── 7. Notification Module (WhatsApp) |
| ├── 8. Scheduler (Cron) Module |
| ├── 9. Invoice Module |
| ├── 10. Audit Trail Module |
| ├── 11. Asset Deletion Approval Module |
| └── 12. Garbage Collector (GC) Module |
+-------------------------------------------------+
 │
 +--------+--------+
 │ │
 ▼ ▼
+-----------+ +-------------+
| Database | | Storage |
| PostgreSQL| | MinIO (S3) |
| (GORM) | | (Images) |
+-----------+ +-------------+

 │ (HTTP Request)
 ▼
+-------------------------------------------------+
| External Service |
| - WhatsApp Gateway (Fonnte API) |
+-------------------------------------------------+
```

---

## Pusat Dokumentasi Terpusat (`/docs`)

Seluruh dokumentasi teknis sistem SAIMS telah dikonsolidasi 100% secara terstruktur di folder **[docs/](docs/README.md)**:

- **[Pusat Indeks Dokumentasi (docs/README.md)](docs/README.md)** — Hub navigasi utama seluruh dokumen.
- **[Spesifikasi REST API (docs/api/)](docs/api/README.md)**: Daftar lengkap REST API endpoints (10 domain), HTTP codes & OpenAPI spec.
- **[Autentikasi & SSO (docs/auth/)](docs/auth/README.md)**: Arsitektur Auth JWT Cookie, 2FA OTP WA & SSO.
- **[Dokumentasi Backend API (docs/backend/)](docs/backend/README.md)**: Arsitektur Go, Gin, GORM, RBAC & Worker.
- **[Dokumentasi Frontend Web (docs/frontend/)](docs/frontend/README.md)**: Arsitektur Next.js 16, React 19, Tailwind CSS v4.
- **[Dokumentasi Database & ERD (docs/database/)](docs/database/README.md)**: ERD, Skema 9 Tabel, DDL & Query SQL.
- **[Dokumentasi Testing (docs/testing/)](docs/testing/README.md)**: Unit Test & K6 Benchmark (Backend) + Jest & Playwright (Frontend).
- **[Skrip & Otomatisasi (docs/scripts/)](docs/scripts/README.md)**: Cheat-sheet skrip & utilitas.
- **Diagram User Flow (`docs/user-flows/`)**:
 - [Administrator User Flow](docs/user-flows/admin_user_flow.png) ([Draw.io](docs/user-flows/admin_user_flow.drawio))
 - [Supervisor User Flow](docs/user-flows/supervisor_user_flow.png) ([Draw.io](docs/user-flows/supervisor_user_flow.drawio))
 - [Staff User Flow](docs/user-flows/staff_user_flow.png) ([Draw.io](docs/user-flows/staff_user_flow.drawio))
 - [Teknisi User Flow](docs/user-flows/teknisi_user_flow.png) ([Draw.io](docs/user-flows/teknisi_user_flow.drawio))
