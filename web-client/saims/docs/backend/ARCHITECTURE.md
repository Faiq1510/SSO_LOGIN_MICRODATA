# Backend Architecture & Design Principles (`docs/backend/ARCHITECTURE.md`)

Backend SAIMS menggunakan **Clean Architecture** (Domain-Driven Design) 4-layer untuk menjamin pemisahan tanggung jawab (*Separation of Concerns*), kemudahan pengujian (*Testability*), dan fleksibilitas kode.

---

## 4-Layer Architecture Structure

```text
backend/
├── cmd/
│ ├── seeder/ # Skrip seeder data awal
│ └── server/main.go # Entrypoint server API
├── internal/
│ ├── config/ # Load .env vars & database connection
│ ├── domain/ # Core entities, structs, & interfaces
│ ├── handlers/ # HTTP Controllers (Menerima gin.Context)
│ ├── middleware/ # Auth JWT, RBAC, CORS, & Rate Limiter
│ ├── repositories/ # Database access layer (GORM queries)
│ ├── routes/ # Registrasi Gin URL routes
│ └── services/ # Pure Business logic & external API integrations
└── pkg/
 └── utils/ # General helpers & formatters
```

### Data Flow Rules
Request Masuk `Router` `Middleware` `Handler` `Service` `Repository` `Database`

1. **Handlers (Controllers)**:
 - Bertanggung jawab membaca HTTP request payload (`*gin.Context`) dan mengembalikan HTTP status code.
 - **HARAM** melakukan query database GORM secara langsung.
2. **Services (Business Logic)**:
 - Memproses kalkulasi, otorisasi transaksi, dan integrasi WhatsApp.
 - Bersifat murni (*pure Go logic*) tanpa ketergantungan pada objek HTTP `*gin.Context`.
3. **Repositories (Data Access)**:
 - Eksekusi query GORM / SQL ke PostgreSQL.

---

## Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | Admin | Supervisor | Teknisi | Staff |
|---|:---:|:---:|:---:|:---:|
| User Management (`/users`) | | | | |
| Audit Trail (`/audit-logs`) | | | | |
| Asset Create/Update (`/assets`) | | | | |
| Asset Delete Request | | Direct Delete | | |
| Asset Deletion Approval (`/asset-deletions`) | | | | |
| Borrowing Request (`/borrowings`) | | | | |
| Maintenance Work Status (`/maintenance/:id/status`) | | | | |
| Maintenance Payment Confirm (`/maintenance/payment/confirm`) | | | | |
