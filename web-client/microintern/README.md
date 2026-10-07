# Sistem Informasi Manajemen Peserta PKL (Microintern)

Sistem digital berbasis web untuk mengelola seluruh siklus Praktik Kerja Lapangan (PKL) — mulai dari pendaftaran, verifikasi, presensi, penilaian, hingga penerbitan sertifikat. Proyek ini dikembangkan dengan membagi repositori menjadi dua bagian utama: `frontend` (React + TypeScript) dan `backend` (Express + TypeScript).

---

## 📌 Daftar Dokumen Detail (`docs/`)

Untuk memahami logika bisnis, model data, dan alur sistem secara mendalam, silakan merujuk ke dokumen berikut:

- **[Dokumentasi Index (README.md)](./docs/README.md)**
- **[Peran & Alur Bisnis (roles-and-flows.md)](./docs/roles-and-flows.md)**
- **[Fitur Peserta PKL (features-peserta.md)](./docs/features-peserta.md)**
- **[Fitur Admin HRD (features-admin.md)](./docs/features-admin.md)**
- **[Aturan Bisnis (business-rules.md)](./docs/business-rules.md)**
- **[Data Model (data-model.md)](./docs/data-model.md)**
- **[Skema Database (schema.sql)](./database/schema.sql)**
- **[Dokumentasi API (api-reference.md)](./docs/api-reference.md)**
- **[Kebutuhan Non-Fungsional (non-functional.md)](./docs/non-functional.md)**
- **[Timeline Pengerjaan (timeline.md)](./docs/timeline.md)**

---

## 🏗️ Arsitektur & Teknologi

Sistem ini dirancang menggunakan arsitektur modern Client-Server dengan teknologi berikut:

### 1. Frontend

- **Core**: React 19 (dengan React Compiler diaktifkan)
- **Build Tool**: Vite & TypeScript
- **Styling**: Tailwind CSS (v4)
- **Library Utama**:
  - [React Router DOM](https://reactrouter.com/) (Routing)
  - [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (Validasi Form)

### 2. Backend

- **Runtime**: Node.js dengan TypeScript
- **Framework**: Express.js (v5)
- **Database**: PostgreSQL (dengan dukungan transaksi di layer repository)
- **Library Utama**:
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (Autentikasi JWT)
  - [bcrypt](https://github.com/kelektiv/node.bcrypt.js) (Hashing Password)
  - [pg](https://node-postgres.com/) (PostgreSQL client)
  - [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) (Dokumentasi API)

---

## 👥 Peran & Alur Pengguna

### 1. Peserta PKL

- **Registrasi & Login**: Menggunakan email + password, Google OAuth, atau SSO (stateless zero-fetch JWT).
- **Onboarding**:
  - **Tahap 1**: Pengisian profil diri (Nama, NIM/NISN, Institusi, Program Studi) & upload CV.
  - **Tahap 2**: Pengajuan PKL (Individu atau Kelompok), upload surat pengantar dari sekolah/universitas, dan memilih tanggal masuk & keluar.
  - **Status Aktif**: Setelah disetujui, peserta dapat mengunduh **Surat Balasan PKL** resmi yang diunggah oleh admin dan melihat **Catatan Tambahan** dari admin di dashboard.
- **Presensi Harian**: Melakukan presensi masuk (Datang) dan keluar (Pulang) setiap hari kerja selama periode PKL yang tercatat di jadwal pelaksanaan (`jadwal_pkl`).
- **Pengajuan Izin/Cuti**: Mengajukan izin dengan alasan dan bukti pendukung dalam rentang periode `jadwal_pkl` yang berjalan.
- **Nilai & Sertifikat**: Melihat rekapitulasi nilai akhir dan mengunduh sertifikat PDF jika status PKL telah `selesai`.

### 2. Admin HRD

- **Manajemen Pendaftaran**:
  - Memverifikasi pengajuan PKL baru (diterima atau ditolak).
  - **Menerima Pengajuan**: Mengunggah dokumen **Surat Balasan PKL** (wajib) dan mengisi **Catatan Tambahan** (opsional) untuk peserta.
  - **Membatalkan Keputusan**: Mengembalikan status pengajuan yang telah diproses (aktif/ditolak) kembali menjadi `menunggu`, yang otomatis menghapus entri jadwal (`jadwal_pkl`) terkait.
- **Monitoring Kehadiran**: Melihat rekap absensi harian dan daftar pengajuan izin peserta berdasarkan periode di `jadwal_pkl`.
- **Penilaian**: Memberikan penilaian berdasarkan kriteria dinamis menggunakan sistem template yang terhubung dengan institusi peserta. Admin dapat mengelola template penilaian (tambah, edit, hapus) dan langsung memodifikasi kriteria penilaian dari halaman Form Penilaian.
- **Konfigurasi Kuota**: Mengatur kuota kapasitas maksimum peserta PKL yang overlap dalam satu periode. Pengecekan overlap kuota dihitung dari data jadwal aktif (`jadwal_pkl`).
- **Laporan**: Mengekspor data rekapitulasi peserta, presensi, dan nilai dalam format CSV, XLSX, atau PDF.
- **Manajemen Template Penilaian**: Membuat, mengedit, dan menghapus template penilaian yang terhubung dengan institusi peserta untuk mendukung kriteria penilaian dinamis.
- **Notifikasi Admin**: Menerima notifikasi real-time (via polling) untuk aktivitas peserta seperti pengajuan izin baru, dengan fitur mark as read dan delete notifikasi.

---

## 🛠️ Panduan Memulai (Setup & Run)

### Prasyarat

- Node.js versi 18 atau lebih baru.
- PostgreSQL server.
- MinIO server (sudah dikonfigurasi — tersedia via `npm run dev`).

### Langkah Instalasi

1. **Clone Repository & Instal Dependensi:**

   ```bash
   # Di root project
   npm install

   # Di folder frontend
   cd frontend && npm install

   # Di folder backend
   cd ../backend && npm install
   ```

2. **Konfigurasi Environment Backend (`backend/.env`):**

   Salin file contoh lalu isi nilainya:

   ```bash
   cp backend/.env.example backend/.env
   ```

   | Variabel              | Keterangan                                                                                 |
   | --------------------- | ------------------------------------------------------------------------------------------ |
   | `DB_HOST`             | Host PostgreSQL (default: `localhost`)                                                     |
   | `DB_PORT`             | Port PostgreSQL (default: `5432`)                                                          |
   | `DB_USER`             | Username PostgreSQL                                                                        |
   | `DB_PASS`             | Password PostgreSQL                                                                        |
   | `DB_NAME`             | Nama database (default: `microintern`)                                                     |
   | `APP_PORT`            | Port server backend (default: `3000`)                                                      |
   | `CORS_ORIGIN`         | Daftar origin yang diizinkan, pisahkan dengan koma (opsional)                              |
   | `GOOGLE_CLIENT_ID`    | Client ID dari Google Cloud Console (untuk OAuth)                                          |
   | `JWT_ACCESS_SECRET`   | Secret key untuk access token JWT                                                          |
   | `JWT_REFRESH_SECRET`  | Secret key untuk refresh token JWT                                                         |
   | `JWT_EXPIRATION_TIME` | Masa berlaku access token (contoh: `1d`, `2h`)                                             |
   | `MINIO_ENDPOINT`      | Host MinIO server (default: `localhost`)                                                   |
   | `MINIO_PORT`          | Port MinIO (default: `9002`, karena port `9000` digunakan portal launcher)                  |
   | `MINIO_USE_SSL`       | Gunakan SSL? (`true`/`false`)                                                              |
   | `MINIO_ACCESS_KEY`    | Root user / access key MinIO                                                               |
   | `MINIO_SECRET_KEY`    | Root password / secret key MinIO                                                           |
   | `MINIO_BUCKET`        | Nama bucket MinIO (default: `microintern`)                                                 |
   | `MINIO_PUBLIC_URL`    | URL publik MinIO — digunakan backend untuk mengakses file. Contoh: `http://localhost:9002` |
   | `MAIL_USER`           | Email Gmail pengirim notifikasi                                                            |
   | `MAIL_PASS`           | App Password Gmail (bukan password akun biasa)                                             |
   | `SSO_SHARED_SECRET`   | Secret bersama untuk integrasi SSO                                                         |
   | `SSO_ISSUER`          | Nama issuer SSO                                                                            |

3. **Konfigurasi Environment Frontend (`frontend/.env`):**

   Salin file contoh lalu isi nilainya:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

   | Variabel                | Keterangan                                                                                              |
   | ----------------------- | ------------------------------------------------------------------------------------------------------- |
   | `VITE_API_URL`          | URL base API backend. Contoh: `http://localhost:5001/api`                                               |
   | `VITE_MINIO_PUBLIC_URL` | URL publik MinIO — **harus sama** dengan `MINIO_PUBLIC_URL` di backend. Contoh: `http://localhost:9000` |
   | `VITE_MINIO_BUCKET`     | Nama bucket MinIO — **harus sama** dengan `MINIO_BUCKET` di backend. Contoh: `microintern`              |

   > **Catatan:** `VITE_MINIO_PUBLIC_URL` dan `VITE_MINIO_BUCKET` digunakan oleh frontend untuk membangun URL lengkap file (misal CV, surat pengantar, sertifikat) dari object path yang disimpan di database. Pastikan nilainya konsisten dengan konfigurasi backend.

4. **Setup Bucket MinIO:**

   Pastikan bucket dengan nama yang sesuai `MINIO_BUCKET` sudah dibuat di MinIO dan aksesnya bersifat publik (public read). Bucket dibuat otomatis oleh backend saat pertama kali dijalankan jika belum ada.

5. **Migrasi & Seeding Database:**

   Eksekusi skema SQL dari [database/schema.sql](./database/schema.sql) di PostgreSQL Anda, lalu jalankan seeder:

   ```bash
   npm run seed
   ```

### Menjalankan Aplikasi

```bash
# Menjalankan frontend, backend, dan MinIO bersamaan (Mode Developer)
npm run dev
```

Atau jalankan secara terpisah:

- **Frontend saja**: `npm run dev:frontend`
- **Backend saja**: `npm run dev:backend`

---

## 🚀 Perintah Tambahan (Formatting, Linting, & Testing)

Sebelum melakukan commit, pastikan kode mematuhi standar format dan bebas error dengan menjalankan:

```bash
# Format seluruh kode menggunakan Prettier
npm run format

# Linting frontend
cd frontend && npm run lint

# Type Checking frontend & backend
cd frontend && npx tsc --noEmit
cd ../backend && npx tsc --noEmit

# Menjalankan unit & integration testing
npm run test
# Menjalankan unit testing saja
npm run test:unit
# Menjalankan integration testing saja
npm run test:integration
# Menjalankan testing dengan watch mode
npm run test:watch
```

---

## 📂 Struktur Folder Proyek

```text
microintern/
├── backend/            # Aplikasi Express.js (REST API)
│   ├── src/
│   │   ├── config/     # Konfigurasi Database, MinIO, & Auth
│   │   ├── controllers/# Logika Handler Request
│   │   ├── database/   # Seeder & Skrip Seeding
│   │   │   └── seeder/
│   │   ├── middlewares/# Auth & Rate Limiter
│   │   ├── repositories/# Query Database & Transaksi DB
│   │   ├── routes/     # Definisi Endpoint API
│   │   ├── services/   # Business Logic & Integrasi Eksternal
│   │   ├── template_surat/ # Template Surat Balasan & Sertifikat
│   │   ├── utils/      # Scheduler, Helper Response, Date, Mail, dll.
│   │   ├── app.ts      # Inisialisasi Express Application & Mounting Routes
│   │   └── server.ts   # Entrypoint Server
│   └── package.json
├── frontend/           # Aplikasi React.js (Vite)
│   ├── src/
│   │   ├── components/ # Komponen Reusable
│   │   ├── layouts/    # Komponen Layout untuk Peserta & Admin
│   │   ├── pages/      # Halaman Peserta & Admin
│   │   ├── services/   # Integrasi API
│   │   ├── utils/      # Helper & Utility Frontend
│   │   └── App.tsx     # Main Component & Router
│   └── package.json
├── database/           # Skema SQL utama (schema.sql)
├── docs/               # Dokumentasi Proyek
├── tests/              # Unit & Integration Tests (Vitest)
└── package.json        # Dependensi & script global
```
