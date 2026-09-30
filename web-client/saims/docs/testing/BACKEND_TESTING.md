# Backend Testing Suite (`docs/testing/BACKEND_TESTING.md`)

Dokumen ini menjelaskan struktur, jenis pengujian, dan cara eksekusi tes otomatis pada **Backend Golang** SAIMS.

---

## 1. Unit & Integration Testing

- **Lokasi**: `backend/tests/unit/` dan `backend/tests/integration/`
- **Menjalankan Seluruh Unit & Integration Test**:
 ```bash
 cd backend
 go test ./... -v -cover
 ```

---

## 2. Performance & Load Testing (K6 via Docker)

Pengujian kapasitas API server dengan K6 Load Tester:

- **A. Uji Stabilitas Harian (50 VUs selama 30d)**:
 ```bash
 docker run --rm -v %cd%/backend/tests/performance:/scripts grafana/k6 run /scripts/load_test.js
 ```
- **B. Uji Kapasitas Puncak (Spike to 200 VUs)**:
 ```bash
 docker run --rm -v %cd%/backend/tests/performance:/scripts grafana/k6 run /scripts/stress_test.js
 ```
