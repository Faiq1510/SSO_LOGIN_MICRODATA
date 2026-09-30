# Database Schemas & Table Definitions (`docs/database/SCHEMAS.md`)

Dokumen ini memuat spesifikasi rincian skema 9 tabel utama pada database PostgreSQL `saims`.

---

## 1. Tabel `users`
Menyimpan data pengguna dan hak akses peran (RBAC).

```sql
CREATE TABLE users (
 id VARCHAR(36) PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Supervisor', 'Staff', 'Teknisi')),
 phone VARCHAR(50),
 otp_code VARCHAR(6),
 otp_expires_at TIMESTAMP,
 is_verified BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 deleted_at TIMESTAMP
);
```

---

## 2. Tabel `assets`
Menyimpan inventaris aset fisik kantor.

```sql
CREATE TABLE assets (
 id VARCHAR(36) PRIMARY KEY,
 asset_code VARCHAR(100) UNIQUE NOT NULL, -- Contoh: JKT-IT-26-0001
 name VARCHAR(255) NOT NULL,
 category VARCHAR(100) NOT NULL,
 location VARCHAR(255) NOT NULL,
 quantity INT NOT NULL DEFAULT 1,
 status VARCHAR(50) NOT NULL CHECK (status IN ('Tersedia', 'Dipinjam', 'Maintenance', 'Tidak Tersedia')),
 condition VARCHAR(50) NOT NULL CHECK (condition IN ('Baik', 'Rusak Ringan', 'Rusak Berat')),
 description TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 deleted_at TIMESTAMP
);
```

---

## 3. Tabel `borrowings`
Menyimpan transaksi pengajuan & pengembalian peminjaman.

```sql
CREATE TABLE borrowings (
 id VARCHAR(36) PRIMARY KEY,
 borrow_code VARCHAR(100) UNIQUE NOT NULL,
 user_id VARCHAR(36) REFERENCES users(id),
 asset_id VARCHAR(36) REFERENCES assets(id),
 borrow_date TIMESTAMP NOT NULL,
 expected_return_date TIMESTAMP NOT NULL,
 actual_return_date TIMESTAMP,
 status VARCHAR(50) NOT NULL CHECK (status IN ('Pending_Supervisor', 'Approved', 'Rejected', 'Menunggu_Kembali', 'Selesai')),
 notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Tabel `maintenances`
Menyimpan tiket pemeliharaan, servis, & pembayaran invoice.

```sql
CREATE TABLE maintenances (
 id VARCHAR(36) PRIMARY KEY,
 maintenance_code VARCHAR(100) UNIQUE NOT NULL,
 asset_id VARCHAR(36) REFERENCES assets(id),
 technician_id VARCHAR(36) REFERENCES users(id),
 type VARCHAR(50) NOT NULL CHECK (type IN ('Rutin', 'Perbaikan', 'Kalibrasi')),
 scheduled_date TIMESTAMP NOT NULL,
 completion_date TIMESTAMP,
 cost DECIMAL(15,2) DEFAULT 0.00,
 status VARCHAR(50) NOT NULL CHECK (status IN ('Dijadwalkan', 'Sedang Berjalan', 'Selesai')),
 payment_status VARCHAR(50) DEFAULT 'Belum Lunas' CHECK (payment_status IN ('Belum Lunas', 'Lunas')),
 invoice_url VARCHAR(500),
 notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Tabel `asset_deletion_requests`
Form approval pengajuan hapus aset oleh Supervisor.

```sql
CREATE TABLE asset_deletion_requests (
 id VARCHAR(36) PRIMARY KEY,
 asset_id VARCHAR(36) REFERENCES assets(id),
 requested_by VARCHAR(36) REFERENCES users(id),
 reason TEXT NOT NULL,
 status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
 approved_by VARCHAR(36) REFERENCES users(id),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
