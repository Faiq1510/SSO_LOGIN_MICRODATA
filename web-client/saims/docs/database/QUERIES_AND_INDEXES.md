# Database Indexes, DDL & Analytical Queries (`docs/database/QUERIES_AND_INDEXES.md`)

Dokumen ini memuat skrip indeks performa, DDL tambahan, dan contoh query analitik laporan pada PostgreSQL SAIMS.

---

## Performance Indexes

```sql
-- Indeks Pencarian Aset
CREATE INDEX idx_assets_category_status ON assets(category, status);
CREATE INDEX idx_assets_deleted_at ON assets(deleted_at) WHERE deleted_at IS NULL;

-- Indeks Peminjaman
CREATE INDEX idx_borrowings_user_status ON borrowings(user_id, status);
CREATE INDEX idx_borrowings_expected_return ON borrowings(expected_return_date) WHERE status = 'Approved';

-- Indeks Maintenance
CREATE INDEX idx_maintenances_tech_status ON maintenances(technician_id, status);
CREATE INDEX idx_maintenances_payment ON maintenances(payment_status);
```

---

## Analytical Queries for Dashboard

### 1. Rekapitulasi Kondisi & Status Aset
```sql
SELECT 
 status,
 condition,
 COUNT(id) AS total_assets,
 SUM(quantity) AS total_items
FROM assets
WHERE deleted_at IS NULL
GROUP BY status, condition;
```

### 2. Laporan Total Biaya Servis per Teknisi (Bulan Berjalan)
```sql
SELECT 
 u.name AS technician_name,
 COUNT(m.id) AS total_services,
 SUM(m.cost) AS total_cost
FROM maintenances m
JOIN users u ON m.technician_id = u.id
WHERE m.status = 'Selesai' 
 AND m.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.name;
```
