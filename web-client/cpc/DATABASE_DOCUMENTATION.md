# Dokumentasi Database - Sistem Kontrol Perumahan

## Daftar Isi
1. [Tabel Utama & Deskripsi](#tabel-utama--deskripsi)
2. [Alur Data & Relasi](#alur-data--relasi)
3. [Narasi Lengkap](#narasi-lengkap--bagaimana-sistem-bekerja)

---

## Tabel Utama & Deskripsi

### 1. **USERS** (Pengguna Sistem)
**Fungsi**: Menyimpan data pengguna yang dapat mengakses sistem

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas unik pengguna |
| `nama` | string | Nama lengkap pengguna |
| `email` | string | Email untuk login |
| `email_verified_at` | timestamp | Waktu verifikasi email |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**: User adalah pusat dari sistem - menciptakan, mengupdate, dan melacak semua aktivitas
- Membuat: log_masuk_gudang, log_keluar_harian, kas_masuks, kas_keluars
- Update: progress_unit
- Melakukan: activity_logs
- Melacak: log_gudang_histories
- Memiliki: user_menu_overrides

---

### 2. **UNITS** (Unit Perumahan)
**Fungsi**: Menyimpan data unit rumah yang sedang dibangun/dikelola

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas unit |
| `nama_unit` | string | Nama/nomor unit (contoh: "A1", "B5") |
| `zona` | string | Lokasi zona perumahan |
| `status` | string | Status pembangunan (planning, ongoing, selesai, dll) |
| `tukang` | string | Nama pekerja/tukang yang bertanggung jawab |
| `tanggal_mulai` | date | Tanggal mulai pembangunan |
| `keterangan` | text | Catatan tambahan |
| `master_standar_id` | bigint | **FK** Mengacu ke standar progress yang digunakan |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Menggunakan: **master_standar_progress** (standar mana yang dipakai)
- Memiliki: **progress_unit** (tracking progress harian/mingguan)
- Terkait dengan: **log_keluar_harian** (material yang dikeluarkan untuk unit)

---

### 3. **MATERIALS** (Daftar Material)
**Fungsi**: Master list semua material/bahan yang tersedia

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas material |
| `kode_material` | string | Kode unik material (contoh: "MAT001") |
| `nama_material` | string | Nama lengkap (contoh: "Semen Putih 50kg") |
| `satuan` | string | Unit pengukuran (kg, liter, biji, dll) |
| `kategori` | string | Kategori material (structural, finishing, electrical, dll) |
| `harga` | decimal | Harga per satuan |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Tercatat pada: **log_masuk_gudang** (masuk gudang)
- Digunakan pada: **log_keluar_harian** (keluar untuk unit)
- Menjadi standar pada: **matrix_progress_detail** (standar pemakaian per tahap)

---

### 4. **MASTER_STANDAR_PROGRESS** (Standar Progress Template)
**Fungsi**: Template/blueprint progress pembangunan yang dapat digunakan ulang untuk beberapa unit

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas standar |
| `nama_standar` | string | Nama standar (contoh: "Rumah Type A - 36m²") |
| `deskripsi` | text | Deskripsi detail standar |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Digunakan oleh: **units** (unit A, B, C bisa menggunakan standar yang sama)
- Digunakan oleh: **matrix_progress** (matrix memetakan tahapan dalam standar ini)

---

### 5. **MATRIX_PROGRESS** (Tahapan Progress)
**Fungsi**: Mendefinisikan tahapan pembangunan dalam setiap standar progress

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas matrix |
| `batas_atas` | integer | Batas persentase atas (contoh: 100 untuk tahap terakhir) |
| `range_progress` | string | Range progress (contoh: "80-100%") |
| `tahap_pekerjaan` | string | Nama tahap (contoh: "Finishing Interior", "Struktur Beton") |
| `master_standar_id` | bigint | **FK** Mengacu ke standar mana tahapan ini bagian dari |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Merupakan bagian dari: **master_standar_progress**
- Memiliki: **matrix_progress_detail** (detail material untuk tahap ini)

---

### 6. **MATRIX_PROGRESS_DETAIL** (Standar Material per Tahap)
**Fungsi**: Mendefinisikan berapa banyak material yang "seharusnya" digunakan di setiap tahap

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas detail |
| `matrix_id` | bigint | **FK** Mengacu ke tahapan mana |
| `material_id` | bigint | **FK** Material apa yang digunakan |
| `qty_standar` | decimal | Jumlah standar yang seharusnya digunakan |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Contoh**: Pada tahap "Struktur Beton", standar semen yang digunakan adalah 50 sak

**Relasi**:
- Menghubungkan: **matrix_progress** ↔ **materials**
- Menjadi acuan untuk: tracking konsumsi material aktual

---

### 7. **PROGRESS_UNIT** (Progress Tracking Per Unit)
**Fungsi**: Melacak progress pembangunan setiap unit secara real-time

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas record |
| `unit_id` | bigint | **FK** Unit mana yang di-track |
| `progress_percent` | integer | Persentase progress (0-100%) |
| `tanggal_update` | date | Kapan progress di-update |
| `status` | enum | Status progress (on_track, behind, ahead, dll) |
| `status_material` | string | Kondisi ketersediaan material (available, shortage, excess, dll) |
| `detail_material` | json | Detail material consumption tracking |
| `updated_by` | bigint | **FK** User mana yang mengupdate |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Mengacu ke: **units** (unit mana yang diprogres)
- Mengacu ke: **users** (siapa yang melakukan update)

---

### 8. **LOG_MASUK_GUDANG** (Material Masuk Gudang)
**Fungsi**: Mencatat setiap transaksi material yang masuk ke gudang dari supplier

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas log |
| `tanggal` | date | Tanggal masuk |
| `supplier` | string | Dari supplier mana |
| `material_id` | bigint | **FK** Material apa yang masuk |
| `qty` | decimal | Jumlah yang masuk |
| `harga_satuan` | decimal | Harga per satuan saat pembelian |
| `total_harga` | decimal | Total nilai pembelian |
| `keterangan` | text | Catatan tambahan |
| `created_by` | bigint | **FK** User mana yang mencatat |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Mencatat transaksi: **materials**
- Dibuat oleh: **users**
- Diaudit pada: **log_gudang_histories**

---

### 9. **LOG_KELUAR_HARIAN** (Material Keluar Harian)
**Fungsi**: Mencatat material yang dikeluarkan dari gudang untuk digunakan di unit

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas log |
| `tanggal` | date | Tanggal pengeluaran |
| `unit_id` | bigint | **FK** Unit mana yang menggunakan |
| `material_id` | bigint | **FK** Material apa yang keluar |
| `qty` | decimal | Jumlah yang dikeluarkan |
| `harga` | decimal | Harga saat pengeluaran |
| `total` | decimal | Total nilai |
| `satuan` | string | Unit satuan |
| `keterangan` | text | Catatan |
| `created_by` | bigint | **FK** User yang mencatat |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Menghubungkan: **units** (kemana material keluar) ↔ **materials** (material apa)
- Dibuat oleh: **users**
- Diaudit pada: **log_gudang_histories**

---

### 10. **LOG_GUDANG_HISTORIES** (Audit Trail Gudang)
**Fungsi**: Mencatat setiap perubahan/aksi pada log gudang untuk keperluan audit dan compliance

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas history |
| `user_id` | bigint | **FK** User mana yang melakukan aksi |
| `tipe_log` | string | Tipe log apa yang diaudit (masuk/keluar) |
| `log_id` | bigint | ID log yang direferensikan |
| `action` | string | Aksi apa (create, update, delete) |
| `data_lama` | json | JSON nilai sebelum perubahan |
| `data_baru` | json | JSON nilai setelah perubahan |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Melacak aksi dari: **users**

---

### 11. **AKUN_REFERENSIS** (Chart of Accounts / Daftar Akun Keuangan)
**Fungsi**: Mendefinisikan struktur akun untuk pencatatan keuangan/akuntansi sistem

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas akun |
| `kode_akun` | string | Kode unik akun (contoh: "1010", "2010") |
| `nama_akun` | string | Nama akun (contoh: "Kas Masuk", "Kas Keluar") |
| `kategori` | string | Kategori (Assets, Liabilities, Equity, Revenue, Expense) |
| `parent_id` | bigint | **FK** Akun parent (untuk struktur hirarki) |
| `tipe_neraca` | string | Tipe neraca (Debet/Kredit) |
| `tipe_akun` | string | Tipe akun (Real/Nominal) |
| `jenis` | string | Jenis akun (Cash, Bank, Expense, Income, dll) |
| `created_by` | bigint | **FK** User yang membuat |
| `updated_by` | bigint | **FK** User yang edit terakhir |
| `deleted_by` | bigint | **FK** User yang menghapus (soft delete) |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |
| `deleted_at` | timestamp | Waktu record dihapus (soft delete) |

**Relasi**:
- Self-referential: akun bisa memiliki parent akun (struktur hierarki)
- Digunakan pada: **kas_masuks** dan **kas_keluars** untuk kategorisasi keuangan

---

### 12. **KAS_MASUKS** (Kas/Uang Masuk)
**Fungsi**: Mencatat setiap transaksi uang/kas yang masuk ke perusahaan

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas transaksi |
| `tanggal` | date | Tanggal masuk |
| `akun_referensi_id` | bigint | **FK** Ke akun keuangan mana ini diposkan |
| `keterangan` | text | Deskripsi kas masuk |
| `nominal` | decimal | Jumlah uang |
| `dari` | string | Dari mana uang berasal (customer, investor, dll) |
| `untuk` | string | Untuk keperluan apa |
| `minggu_ke` | integer | Minggu ke berapa (untuk tracking mingguan) |
| `created_by` | bigint | **FK** User yang mencatat |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Diposkan pada: **akun_referensis** (untuk double-entry accounting)
- Dibuat oleh: **users**

---

### 13. **KAS_KELUARS** (Kas/Uang Keluar)
**Fungsi**: Mencatat setiap transaksi uang/kas yang keluar dari perusahaan

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas transaksi |
| `tanggal` | date | Tanggal keluar |
| `akun_referensi_id` | bigint | **FK** Ke akun keuangan mana ini diposkan |
| `unit` | string | Unit mana (jika untuk unit tertentu) |
| `keterangan` | text | Deskripsi pembayaran |
| `qty` | decimal | Kuantitas (jika berbasis volume) |
| `satuan` | string | Satuan pengukuran |
| `nominal_per_unit` | decimal | Harga per satuan |
| `total` | decimal | Total pembayaran |
| `metode_bayar` | enum | Metode pembayaran (cash, transfer, cek, dll) |
| `penerima` | string | Nama penerima dana |
| `lampiran_path` | string | Path file bukti (kuitansi, invoice, dll) |
| `created_by` | bigint | **FK** User yang mencatat |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Diposkan pada: **akun_referensis**
- Dibuat oleh: **users**

---

### 14. **JOURNAL_ENTRIES** (Entri Jurnal Akuntansi)
**Fungsi**: Mencatat double-entry bookkeeping untuk laporan keuangan

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas jurnal |
| `account_id` | bigint | Akun yang diposting |
| `debit` | decimal | Nilai debit (jika ada) |
| `credit` | decimal | Nilai kredit (jika ada) |
| `tanggal` | date | Tanggal posting |
| `keterangan` | string | Deskripsi jurnal |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Mereferensikan: **akun_referensis** (melalui account_id)

---

### 15. **ACTIVITY_LOGS** (Log Aktivitas Pengguna)
**Fungsi**: Melacak semua aksi pengguna di dalam sistem untuk audit dan monitoring

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas log |
| `user_id` | bigint | **FK** User mana yang melakukan aksi |
| `module` | string | Module mana (units, materials, keuangan, dll) |
| `action` | string | Aksi apa (view, create, update, delete, download, dll) |
| `description` | string | Deskripsi detail |
| `subject_type` | string | Tipe data yang diakses (Unit, Material, KasMasuk, dll) |
| `subject_id` | bigint | ID data yang diakses |
| `read_at` | timestamp | Waktu log dibaca |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Mencatat aksi dari: **users**

---

### 16. **USER_MENU_OVERRIDES** (Pengaturan Menu Pengguna)
**Fungsi**: Menyimpan customization menu per pengguna (hide/show menu tertentu)

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | bigint | Identitas override |
| `user_id` | bigint | **FK** User mana |
| `menu_key` | string | Kunci menu mana yang di-override |
| `is_override` | boolean | Apakah menu ter-hide atau ter-show |
| `created_at` | timestamp | Waktu record dibuat |
| `updated_at` | timestamp | Waktu record ter-update |

**Relasi**:
- Milik: **users**

---

## Alur Data & Relasi

### Alur 1: Pembangunan Unit
```
master_standar_progress (Template)
  ↓ (digunakan oleh)
units (Unit yang sedang dibangun)
  ↓
matrix_progress (Tahapan dalam template)
  ↓
matrix_progress_detail (Material standar per tahap)
  ↓
materials (Daftar material)
  ↓
progress_unit (Tracking real-time per unit)
  ↓
log_keluar_harian (Material yang aktual dipakai)
```

### Alur 2: Gudang/Inventory
```
Supplier
  ↓
log_masuk_gudang (Material masuk)
  ↓
materials (Tersimpan di gudang)
  ↓
log_keluar_harian (Material dikeluarkan untuk unit)
  ↓
log_gudang_histories (Audit setiap perubahan)
```

### Alur 3: Keuangan
```
kas_masuks (Uang masuk)
  ↓
akun_referensis (Kategori akun)
  ↓
journal_entries (Double-entry bookkeeping)
  ↓
kas_keluars (Uang keluar)
  ↓
(Laporan Keuangan: Neraca, P&L, dll)
```

### Alur 4: Audit & Keamanan
```
users (Pengguna sistem)
  ├→ activity_logs (Semua aksi di sistem)
  ├→ log_gudang_histories (Aksi gudang)
  └→ user_menu_overrides (Preferensi UI)
```

---

## Narasi Lengkap - Bagaimana Sistem Bekerja

### Fase 1: Persiapan & Setup
1. **Admin membuat Master Standar Progress**
   - Membuat template "Rumah Type A - 36m²"
   - Mendefinisikan tahapan-tahapan pembangunan

2. **Admin membuat Matrix Progress (Tahapan)**
   - Tahap 1: "Persiapan & Pengurusan" (0-10%)
   - Tahap 2: "Galian & Pondasi" (10-30%)
   - Tahap 3: "Struktur Beton" (30-60%)
   - Tahap 4: "Dinding & Plafon" (60-80%)
   - Tahap 5: "Finishing Interior" (80-100%)

3. **Admin set Material Standar per Tahap (Matrix Detail)**
   - Tahap "Struktur Beton" membutuhkan:
     - 50 sak Semen
     - 100 m³ Pasir
     - 50 m³ Batu Koral
   - Sistem otomatis tahu berapa material yang "seharusnya" dipakai

### Fase 2: Pelaksanaan Proyek
4. **Pembukaan Unit Baru**
   - Admin buat unit "A1" dengan status "Planning"
   - Assign standar progress "Rumah Type A - 36m²"
   - Sistem auto-create matrix progress untuk unit A1

5. **Pembelian Material dari Supplier**
   - Supplier kirim: 50 sak Semen @Rp50.000/sak
   - Dicatat di `log_masuk_gudang`
   - Gudang sekarang memiliki stok semen

6. **Update Progress Unit**
   - Supervisor mengecek unit A1
   - Update `progress_unit`: progress_percent = 35% (sedang tahap "Struktur Beton")
   - Status material: "available" (semua material ada)

7. **Pengeluaran Material dari Gudang**
   - Tukang meminta 40 sak Semen untuk unit A1
   - Dicatat di `log_keluar_harian`
   - Stok gudang berkurang dari 50 menjadi 10 sak
   - System bisa membandingkan:
     - Standar yang seharusnya: 50 sak
     - Aktual yang dipakai: 40 sak
     - Status: "On Track" / "Lebih Efisien"

### Fase 3: Keuangan
8. **Pembayaran ke Supplier**
   - Supplier mengirim invoice: Rp2.500.000 (50 sak × Rp50.000)
   - Dicatat di `kas_keluars`:
     - Akun: "Pembelian Material" (dari `akun_referensis`)
     - Nominal: Rp2.500.000
     - Metode: Transfer Bank
     - Bukti: File invoice.pdf

9. **Penerimaan Uang dari Customer/Investor**
   - Customer bayar cicilan untuk unit A1: Rp100.000.000
   - Dicatat di `kas_masuks`:
     - Akun: "Penerimaan dari Customer"
     - Nominal: Rp100.000.000
     - Dari: "PT ABC - Pembeli Unit A1"

10. **Pencatatan Jurnal Accounting**
    - Sistem auto-post ke `journal_entries`:
      ```
      Debit: Kas (Rp100.000.000)
      Credit: Pendapatan (Rp100.000.000)
      ```
    - Data untuk laporan Neraca/P&L

### Fase 4: Audit & Monitoring
11. **Audit Trail Lengkap**
    - Setiap perubahan di gudang tercatat di `log_gudang_histories`
    - Siapa yang input? Kapan? Data lama & baru apa?
    - Contoh: Supervisor A mengubah qty di log_keluar_harian dari 40 menjadi 45 sak

12. **Activity Log Pengguna**
    - Supervisor A: view unit A1 @09:30
    - Supervisor A: update progress_unit untuk A1 @09:45
    - Admin B: download laporan material @10:15
    - Setiap aksi tercatat di `activity_logs`

### Hasil Akhir: Laporan & KPI
- **Progress Tracking**: Unit A1 sudah 35%, material standar vs aktual
- **Inventory Report**: Gudang masih ada 10 sak semen, 80 m³ pasir, dll
- **Financial Report**: Total kas masuk Rp100M, kas keluar Rp2.5M, keuntungan ~Rp97.5M
- **Audit Report**: Semua transaksi tercatat lengkap dengan tanggung jawab siapa

---

## Foreign Key Mappings

| Tabel Sumber | Field FK | → | Tabel Tujuan | Field PK | Relasi |
|---|---|---|---|---|---|
| units | master_standar_id | → | master_standar_progress | id | Many-to-One |
| matrix_progress | master_standar_id | → | master_standar_progress | id | Many-to-One |
| matrix_progress_detail | matrix_id | → | matrix_progress | id | Many-to-One |
| matrix_progress_detail | material_id | → | materials | id | Many-to-One |
| progress_unit | unit_id | → | units | id | Many-to-One |
| progress_unit | updated_by | → | users | id | Many-to-One |
| log_masuk_gudang | material_id | → | materials | id | Many-to-One |
| log_masuk_gudang | created_by | → | users | id | Many-to-One |
| log_keluar_harian | unit_id | → | units | id | Many-to-One |
| log_keluar_harian | material_id | → | materials | id | Many-to-One |
| log_keluar_harian | created_by | → | users | id | Many-to-One |
| log_gudang_histories | user_id | → | users | id | Many-to-One |
| akun_referensis | parent_id | → | akun_referensis | id | Self-referential |
| akun_referensis | created_by | → | users | id | Many-to-One |
| akun_referensis | updated_by | → | users | id | Many-to-One |
| akun_referensis | deleted_by | → | users | id | Many-to-One |
| kas_masuks | akun_referensi_id | → | akun_referensis | id | Many-to-One |
| kas_masuks | created_by | → | users | id | Many-to-One |
| kas_keluars | akun_referensi_id | → | akun_referensis | id | Many-to-One |
| kas_keluars | created_by | → | users | id | Many-to-One |
| activity_logs | user_id | → | users | id | Many-to-One |
| user_menu_overrides | user_id | → | users | id | Many-to-One |

---

## Tips Penggunaan

### Untuk Developer
- Selalu gunakan foreign keys saat query data terkait
- Gunakan `with()` eager loading di Eloquent untuk menghindari N+1 queries
- Respek soft deletes pada akun_referensis (filter `deleted_at`)

### Untuk Analyst/Reporting
- Join `log_keluar_harian` + `matrix_progress_detail` untuk bandingkan standar vs aktual
- Join `kas_masuks` + `kas_keluars` untuk cash flow analysis
- Query `activity_logs` dengan date range untuk monitoring aktivitas user

### Untuk Audit
- Selalu lihat `log_gudang_histories` untuk trail perubahan
- Cek `created_by`, `updated_by`, `deleted_by` di setiap tabel
- Verifikasi matching antara log_keluar_harian dengan progress_unit

---

**Terakhir Updated**: 2026-08-06
