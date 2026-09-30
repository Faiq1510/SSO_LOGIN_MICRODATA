# Frontend Testing Suite (`docs/testing/FRONTEND_TESTING.md`)

Dokumen ini menjelaskan struktur, jenis pengujian, dan cara eksekusi tes otomatis pada **Frontend Next.js** SAIMS.

---

## 1. Unit Testing Komponen (Jest & React Testing Library)

- **Lokasi**: `frontend/tests/unit/`
- **Menjalankan Unit Test**:
 ```bash
 cd frontend
 npm run test
 ```

---

## 2. End-to-End & Visual Testing (Playwright)

- **Lokasi**: `frontend/tests/e2e/`
- **Prasyarat**: Frontend (`npm run dev` di port 3000) dan Backend (port 8080) dalam kondisi aktif.

```bash
cd frontend

# A. Menjalankan E2E Headless
npx playwright test

# B. Menjalankan Uji Responsif & Snapshot Visual
npx playwright test tests/e2e/ui-responsive.spec.ts tests/e2e/ui-visual.spec.ts

# C. Menjalankan dengan UI Interaktif Playwright
npx playwright test --ui

# D. Update Baseline Snapshot Gambar
npx playwright test tests/e2e/ui-visual.spec.ts --update-snapshots
```
