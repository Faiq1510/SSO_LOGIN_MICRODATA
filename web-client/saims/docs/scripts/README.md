# SAIMS Comprehensive Testing & Scripts Guide

Dokumen ini merupakan referensi kilat (Cheat Sheet) bagi Developer untuk menjalankan seluruh skrip utilitas dan alur pengujian pada aplikasi **SAIMS** (Smart Asset & Inventory Management System).

---

## 1. Unit Testing (Level Bawah)
*Menguji blok kode kecil (fungsi) secara terisolasi.*

**Backend (Golang)**
Menguji algoritma pembuatan Token, Hashing, dll.
```bash
cd backend
go test ./tests/unit/... -v -cover
```

**Frontend (React/Jest)**
Menguji rendering komponen statis secara individu.
```bash
cd frontend
npm run test
```

---

## 2. Integration / API Testing (Level Tengah)
*Menguji titik masuk (endpoint) dan middleware (koneksi antar fungsi).*

**Backend API HTTP Routes**
Memastikan bahwa `POST /api/auth/login` dan route lainnya merespon dengan kode HTTP yang benar.
```bash
cd backend
go test ./tests/integration/... -v
```

---

## 3. UI, Responsive & E2E Testing (Level Atas)
*Menguji aplikasi secara nyata dengan mensimulasikan klik browser dari mata pengguna.*

**Frontend Playwright (Membutuhkan aplikasi sedang berjalan `npm run dev`)**
```bash
cd frontend

# Menjalankan uji Tata Letak Responsif & Regresi Visual
npx playwright test tests/e2e/ui-responsive.spec.ts tests/e2e/ui-visual.spec.ts

# Apabila tampilan antarmuka (CSS) diperbarui sengaja, update snapshot baseline:
npx playwright test tests/e2e/ui-visual.spec.ts --update-snapshots

# Menjalankan tes dengan UI interaktif
npx playwright test tests/e2e/ui-responsive.spec.ts tests/e2e/ui-visual.spec.ts --ui
```

---

## 4. Performance & Load Testing (Level Opsional / Skalabilitas)
*Menguji seberapa tangguh sistem dan database saat diakses oleh banyak user bersamaan.*

**K6 Load Tester (Via Docker)**
```bash
cd backend

# A. Uji Stabilitas Harian (50 User Konstan selama 30 detik)
docker run --rm -v c:/saims/backend/tests/performance:/scripts grafana/k6 run /scripts/load_test.js

# B. Uji Kapasitas Puncak (Lonjakan dari 0 hingga 200 User)
docker run --rm -v c:/saims/backend/tests/performance:/scripts grafana/k6 run /scripts/stress_test.js

# C. Uji Skenario Kompleks (Login -> Lihat Aset -> Pinjam Aset berturut-turut)
docker run --rm -v c:/saims/backend/tests/performance:/scripts grafana/k6 run /scripts/user_flow_test.js
```

---

## 5. Automated Security Scanner (SAST)
*Memindai kode sumber dari celah kerentanan statis.*

```bash
# Dari root direktori (c:\saims)
.\scripts\run_security.bat
```

---

## 6. Penjelasan Skrip Utilitas Proyek (`/scripts`)

### A. [`scripts/start.bat`](../../scripts/start.bat)
Menyalakan seluruh ekosistem SAIMS (Docker PostgreSQL & MinIO, Backend API, Frontend Next.js) dalam 1 klik.
- **Perintah:** `.\scripts\start.bat`

### B. [`scripts/stop.bat`](../../scripts/stop.bat)
Mematikan seluruh layanan SAIMS dan container Docker secara bersih.
- **Perintah:** `.\scripts\stop.bat`

### C. [`scripts/run_security.bat`](../../scripts/run_security.bat)
Mendeteksi kerentanan keamanan (SAST) backend (gosec) & frontend (`npm audit`).
- **Perintah:** `.\scripts\run_security.bat`

### D. [`scripts/backup_db.sh`](../../scripts/backup_db.sh)
Membackup database PostgreSQL ke format `.sql.gz` dan mengunggahnya ke MinIO Object Storage.
- **Perintah:** `bash ./scripts/backup_db.sh`
