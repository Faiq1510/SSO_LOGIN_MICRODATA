# SAIMS Backend Documentation (`docs/backend/`)

Selamat datang di modul dokumentasi teknis Backend API SAIMS berbasis **Go (Golang)** dengan framework **Gin**, database **PostgreSQL**, dan ORM **GORM**.

---

## Sub-Dokumen Backend

| Dokumen | Deskripsi Utama |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Adaptasi Clean Architecture 4-Layer, Struktur Direktori, Data Flow Rules, & RBAC Authorization Matrix. |
| **[WORKERS_AND_CRON.md](WORKERS_AND_CRON.md)** | Layanan Asinkron: In-Memory WA Queue (Fonnte API), Cron Job Scheduler, & MinIO Garbage Collector (GC). |
| **[../api/README.md](../api/README.md)** | Daftar Lengkap REST API Endpoints (10 Domain), Headers, & OpenAPI Spec. |
| **[../testing/BACKEND_TESTING.md](../testing/BACKEND_TESTING.md)** | Panduan Unit Testing (`go test`), Integration Testing, & K6 Load Testing. |

---

## Quick Start Server API

```bash
# 1. Jalankan Container Docker (PostgreSQL & MinIO)
docker-compose up -d

# 2. Jalankan Backend Server (Port 8080)
cd backend
go run cmd/server/main.go
```
