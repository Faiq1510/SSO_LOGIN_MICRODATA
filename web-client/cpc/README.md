# 🏘️ Sistem Kontrol Perumahan

Aplikasi web internal untuk mengelola operasi proyek perumahan secara terpusat: unit, material, stok gudang, progress pembangunan, dan data keuangan.

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-Inertia.js-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

---

## Ringkasan Proyek

Proyek ini dibangun untuk menggantikan proses pencatatan manual yang sebelumnya banyak bergantung pada Excel. Tujuan utamanya adalah membuat alur kerja proyek menjadi lebih terstruktur, cepat, terdokumentasi, dan bisa diakses oleh banyak pengguna secara bersamaan.

Fokus aplikasi saat ini meliputi:
- manajemen unit
- master material
- log masuk/keluar gudang
- stok gudang
- progress pembangunan
- data keuangan
- autentikasi dan role-based access

---

## Stack Teknologi

- Backend: Laravel 13 (PHP 8.3)
- Frontend: React + Inertia.js
- Styling: Tailwind CSS
- Database: PostgreSQL 16
- Build Tool: Vite
- Auth & Role: Laravel Breeze + Spatie Permission
- Container: Docker Compose

---

## Modul Utama

### 1. Manajemen Unit
Mengelola data unit rumah, status pembangunan, serta atribut terkait unit.

### 2. Master Material
Menyimpan data material, satuan, dan harga acuan yang dipakai sebagai dasar transaksi gudang.

### 3. Gudang
- log masuk gudang
- log keluar harian
- stok gudang

### 4. Monitoring Progress
Mengolah data progres pembangunan dan membandingkan pemakaian material aktual dengan standar yang ditentukan.

### 5. Keuangan
- kas masuk
- kas keluar
- akun referensi
- SPJ / laporan keuangan

---

## Struktur Folder Utama

```text
app/
  Http/Controllers/
  Http/Requests/
  Models/
  Services/
config/
database/
  migrations/
  seeders/
resources/
  js/
routes/
tests/
```

Catatan penting:
- logika bisnis utama biasanya diletakkan di folder app/Services
- halaman frontend Inertia berada di resources/js
- perubahan database harus dicek di migration dan model terkait

---

## Persyaratan Sistem

Sebelum menjalankan project, pastikan sudah terinstall:
- Docker Desktop atau Docker Engine
- Docker Compose
- Git

---

## Cara Menjalankan di Lokal

Project ini disiapkan untuk dijalankan menggunakan Docker Compose.

### 1. Clone repository

```bash
git clone <repo-url>
cd sistem-kontrol-perumahan
```

### 2. Pastikan file environment tersedia

Jika file .env belum ada, buat dari environment yang sesuai dengan project Anda. Project ini sudah memiliki file .env yang dipakai lokal, jadi pastikan file tersebut tidak hilang atau rusak.

### 3. Build dan jalankan container

```bash
docker compose up -d --build
```

### 4. Install dependency PHP

```bash
docker compose exec app composer install
```

### 5. Generate application key

```bash
docker compose exec app php artisan key:generate
```

### 6. Jalankan migrasi dan seeder

```bash
docker compose exec app php artisan migrate --seed
```

### 7. Install dependency frontend

```bash
docker compose exec node npm install
```

### 8. Jalankan Vite dev server

```bash
docker compose exec node npm run dev
```

### 9. Akses aplikasi

- frontend: http://localhost:8000
- vite dev server: http://localhost:5173

> Semua perintah Artisan, Composer, dan NPM sebaiknya dijalankan lewat docker compose exec, bukan langsung dari host.

---


## Alur Pengembangan yang Disarankan

Untuk fitur baru, ikuti pola yang sudah dipakai di project:

1. tentukan route
2. buat/update controller
3. tambahkan request validation bila perlu
4. implementasikan logika bisnis di model/service
5. siapkan halaman Inertia/React
6. uji fitur secara manual dan lewat test

Biasanya alur yang paling aman adalah:

```text
route -> controller -> request -> model/service -> page
```

---


## Troubleshooting Singkat

### Error koneksi database
Pastikan container postgres sudah sehat dan service app menunggu database siap.

```bash
docker compose ps
docker compose logs postgres
```

### Dependency belum terinstall
Jalankan ulang:

```bash
docker compose exec app composer install
docker compose exec node npm install
```

### Port sudah dipakai
Cek apakah port 8000 atau 5173 sudah dipakai aplikasi lain, lalu ubah mapping port di docker-compose.yml bila perlu.

---

## Status Pengembangan

Proyek ini masih dalam tahap pengembangan aktif. Modul inti sudah mulai diimplementasikan dan disempurnakan, sementara modul dan fitur pendukung dapat terus dikembangkan sesuai kebutuhan bisnis.

---

## Catatan Akhir

README ini dibuat agar developer berikutnya bisa langsung memahami context proyek, cara setup, dan pola kerja yang disarankan. Jika ada perubahan arsitektur atau workflow yang signifikan, update dokumen ini agar tetap relevan.
