# SAIMS Backend API

> **Smart Asset & Inventory Management System (SAIMS)** — Backend API
> Dokumentasi teknis utama untuk Backend API SAIMS (Golang, Gin, GORM, RBAC Matrix, In-Memory WA Queue, Cron Job Scheduler & Garbage Collector) telah dipusatkan dan dikonsolidasi di folder **`docs/`**.

---

## Dokumentasi Utama

Seluruh panduan teknis, arsitektur, dan referensi API backend dapat dibaca pada berkas berikut:

- **[Dokumentasi Lengkap Backend API (`docs/backend/`)](../docs/backend/README.md)**
- **[Dokumentasi Database & ERD (`docs/database/`)](../docs/database/README.md)**
- **[Dokumentasi Testing Backend (`docs/testing/BACKEND_TESTING.md`)](../docs/testing/BACKEND_TESTING.md)**
- **[Pusat Indeks Dokumentasi SAIMS (`docs/README.md`)](../docs/README.md)**

---

## Quick Start (Backend)

```bash
# 1. Jalankan PostgreSQL & MinIO (Docker)
docker-compose up -d

# 2. Jalankan Backend Server API
cd backend
go run cmd/server/main.go
```
