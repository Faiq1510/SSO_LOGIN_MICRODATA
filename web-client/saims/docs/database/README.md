# SAIMS Database Documentation (`docs/database/`)

Dokumentasi terperinci mengenai arsitektur database **PostgreSQL 15**, ORM **GORM v1.31.1** (driver `pgx/v5`), skema 9 tabel utama, DDL SQL, indeks, dan query analitik aplikasi SAIMS.

---

## Sub-Dokumen Database

| Dokumen | Deskripsi Utama |
|---|---|
| **[SCHEMAS.md](SCHEMAS.md)** | Rincian Struktur 9 Tabel Utama, Foreign Keys, Enums, & Data Types. |
| **[QUERIES_AND_INDEXES.md](QUERIES_AND_INDEXES.md)** | Skrip DDL manual, Indeks Performa, Constraints, & Query Analitik Laporan. |
| **[MIGRATIONS.md](MIGRATIONS.md)** | Workflow Migrasi Schema CLI (`golang-migrate`), Seeding, & Backup/Restore. |
| **[../graph_viewer.html](../graph_viewer.html)** | Interactive Web ERD Graph Viewer. |

---

## Overview 9 Tabel Utama

| Tabel | Keterangan |
|---|---|
| `users` | Account & Role Data (Administrator, Supervisor, Staff, Teknisi) |
| `assets` | Inventaris Aset Perusahaan & Auto-Generated Asset ID |
| `asset_images` | URL Gambar MinIO Object Storage (1:N) |
| `borrowings` | Transaksi Pengajuan & Pengembalian Peminjaman |
| `maintenances` | Tiket Perbaikan, Servis, & Konfirmasi Pembayaran Invoice |
| `asset_deletion_requests` | Form Pengajuan Hapus Aset (Approval Supervisor) |
| `notifications` | Notifikasi In-App Pengguna (1:N) |
| `jwt_blacklists` | Token Blacklist Setelah Logout |
| `audit_logs` | Log Mutasi Sistem Immutable (PostgreSQL RULE) |
