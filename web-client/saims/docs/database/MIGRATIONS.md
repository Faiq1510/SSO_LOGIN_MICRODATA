# Database Migrations, Seeding & Backup (`docs/database/MIGRATIONS.md`)

Dokumen ini memuat panduan pengelolaan skema database menggunakan `golang-migrate`, seeding data awal, serta skrip backup/restore.

---

## CLI Migration Workflow (`golang-migrate`)

Backend SAIMS tidak lagi menggunakan `GORM AutoMigrate` di lingkungan produksi. Semua migrasi dikelola menggunakan CLI `golang-migrate`.

### 1. Membuat Berkas Migrasi Baru
```bash
migrate create -ext sql -dir db/migrations -seq nama_fitur_baru
```

### 2. Eksekusi Migrasi Up
```bash
migrate -path db/migrations -database "postgres://postgres:password@localhost:5432/saims?sslmode=disable" up
```

### 3. Rollback Migrasi Down (1 Langkah)
```bash
migrate -path db/migrations -database "postgres://postgres:password@localhost:5432/saims?sslmode=disable" down 1
```

---

## Database Backup & Restore

- **Backup Command (ke MinIO / Local .sql.gz)**:
 ```bash
 bash ./scripts/backup_db.sh
 ```

- **Restore Command (Docker PostgreSQL)**:
 ```bash
 docker exec -i saims_db psql -U postgres -d saims < backup_file.sql
 ```
