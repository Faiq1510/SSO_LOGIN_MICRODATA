# SAIMS Centralized Documentation Hub

Selamat datang di pusat dokumentasi resmi **Smart Asset & Inventory Management System (SAIMS)**. Seluruh panduan arsitektur, basis data, pengujian, dan alur kerja aplikasi terkonsolidasi dan terorganisir 100% secara modular di dalam sub-folder spesifik di bawah folder ini.

---

## Indeks Dokumentasi Proyek Modular

| Kategori | Folder / Dokumen Utama | Deskripsi Utama |
|---|---|---|
| **REST API Specification** | **[api/](api/README.md)** | Spesifikasi lengkap 10 domain REST API endpoints, HTTP status code & OpenAPI spec. |
| **Autentikasi & SSO** | **[auth/](auth/README.md)** | [Panduan Integrasi SSO](auth/SSO_GUIDE.md), Auth JWT HttpOnly Cookie & 2FA OTP via WhatsApp. |
| **Arsitektur Backend** | **[backend/](backend/README.md)** | [Clean Architecture 4-Layer](backend/ARCHITECTURE.md), [Worker & Cron Scheduler](backend/WORKERS_AND_CRON.md). |
| **Arsitektur Frontend** | **[frontend/](frontend/README.md)** | [Next.js 16 App Router & Components](frontend/ARCHITECTURE.md), [HttpOnly Cookie Security](frontend/SECURITY.md). |
| **Basis Data & ERD** | **[database/](database/README.md)** | [Skema 9 Tabel](database/SCHEMAS.md), [DDL & Query Analitik](database/QUERIES_AND_INDEXES.md), [CLI Migrations](database/MIGRATIONS.md). |
| **Pengujian / Testing** | **[testing/](testing/README.md)** | [Backend Go Test & K6 Benchmark](testing/BACKEND_TESTING.md), [Frontend Jest & Playwright](testing/FRONTEND_TESTING.md). |
| **Otomatisasi Skrip** | **[scripts/](scripts/README.md)** | Cheat-sheet pengujian & skrip utilitas (`start.bat`, `stop.bat`, `run_security.bat`, `backup_db.sh`). |
| **User Flow Diagrams** | **[user-flows/](user-flows/)** | Diagram alur per peran pengguna (Administrator, Supervisor, Staff, Teknisi) dalam format `.drawio` dan `.png`. |

---

## Quick Navigation

- [Kembali ke Root README](../README.md)
- [Swagger OpenAPI Spec UI (Local)](http://localhost:8080/swagger/index.html) *(Memerlukan Backend berjalan)*
