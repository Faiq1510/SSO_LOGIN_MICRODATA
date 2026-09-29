# 🐳 Panduan Lengkap Docker: Surat Penomoran + WhatsApp Baileys

Dokumentasi ini menjelaskan cara menjalankan, mengelola, dan memecahkan masalah (troubleshooting) project **Surat Penomoran** (Laravel 12) beserta server WhatsApp (**wa-baileys-server**) menggunakan Docker & Docker Compose.

---

## 📑 Daftar Isi
1. [Struktur Layanan & Port](#-struktur-layanan--port)
2. [Persiapan Awal](#-persiapan-awal)
3. [Cara Menjalankan (Otomatis & Manual)](#-cara-menjalankan)
4. [Menghubungkan WhatsApp (Scan QR Code)](#-menghubungkan-whatsapp-scan-qr-code)
5. [Perintah Sehari-hari (Daily Commands)](#-perintah-sehari-hari-daily-commands)
6. [Troubleshooting & Solusi](#-troubleshooting--solusi)

---

## 🏛 Struktur Layanan & Port

| Layanan | Nama Container | Port Host | Deskripsi |
|---|---|---|---|
| **Web Server** | `surat_penomoran_nginx` | `http://localhost:8000` | Nginx web server melayani aplikasi Laravel |
| **Laravel App** | `surat_penomoran_app` | *Internal (9000)* | PHP 8.2-FPM dengan ekstensi lengkap (GD, DomPDF, Excel, Redis, pgsql, pdo_pgsql) |
| **Database** | `surat_penomoran_db` | `localhost:5432` | PostgreSQL 16 Alpine Database (data persisten di volume `postgres_data`) |
| **WhatsApp API** | `surat_penomoran_wa` | `http://localhost:3000` | Node.js 20 Baileys WA Server (sesi login tersimpan di `wa_auth_data`) |
| **Adminer GUI** | `surat_penomoran_adminer` | `http://localhost:8081` | Web UI Database Adminer (User: `postgres`, Password: `secret`) |
| **Redis** | `surat_penomoran_redis` | `localhost:6379` | In-memory cache & queue session |

---

## 🚀 Persiapan Awal

1. Pastikan **Docker Desktop** sudah terinstall dan sedang aktif di komputer Anda.
2. Siapkan file `.env`. Anda dapat menyalin konfigurasi docker siap pakai:
   ```bash
   cp .env.docker.example .env
   ```

---

## ⚡ Cara Menjalankan

### Cara 1: Menggunakan Helper Script (Paling Cepat)
- **Windows**: Cukup klik dua kali `docker-setup.bat` atau jalankan di CMD/PowerShell:
  ```cmd
  .\docker-setup.bat
  ```
- **Linux / macOS / WSL / Git Bash**:
  ```bash
  chmod +x docker-setup.sh
  ./docker-setup.sh
  ```

---

### Cara 2: Menjalankan Langkah Manual

1. **Build & Jalankan Container:**
   ```bash
   docker compose up -d --build
   ```

2. **Generate Application Key (jika belum ada):**
   ```bash
   docker compose exec app php artisan key:generate
   ```

3. **Buat Storage Link:**
   ```bash
   docker compose exec app php artisan storage:link
   ```

4. **Jalankan Database Migration & Seeder:**
   ```bash
   docker compose exec app php artisan migrate
   ```
   *(Opsional jika ingin memasukkan data dummy / seeder)*:
   ```bash
   docker compose exec app php artisan db:seed
   ```

5. **Migrasi Data dari MySQL Lama (Jika ada data lama):**
   ```bash
   docker compose exec app php artisan db:migrate-from-mysql
   ```

---

## 📱 Menghubungkan WhatsApp (Scan QR Code)

Agar fitur kirim surat via WhatsApp dapat digunakan:

1. Buka terminal dan pantau log dari container `wa-server`:
   ```bash
   docker compose logs -f wa-server
   ```
2. QR Code akan muncul di terminal.
3. Buka WhatsApp di smartphone Anda: **Perangkat Tertaut (Linked Devices) > Tautkan Perangkat (Link a Device)**.
4. Scan QR Code tersebut.
5. Setelah berhasil, akan muncul pesan `WhatsApp berhasil terhubung dan siap digunakan!`.
6. Sesi WhatsApp disimpan di volume Docker `wa_auth_data`, sehingga **tidak perlu scan ulang** meskipun container di-restart.

---

## 🛠 Perintah Sehari-hari (Daily Commands)

### 1. Menjalankan & Menghentikan
```bash
# Menjalankan di background
docker compose up -d

# Menghentikan semua container
docker compose down

# Menghentikan dan menghapus semua volume data (HATI-HATI: Data database & session WA akan terhapus)
docker compose down -v
```

### 2. Melihat Log
```bash
# Log seluruh container
docker compose logs -f

# Log container spesifik
docker compose logs -f app
docker compose logs -f wa-server
docker compose logs -f nginx
docker compose logs -f db
```

### 3. Menjalankan Perintah Artisan / Composer
```bash
# Artisan command
docker compose exec app php artisan route:list
docker compose exec app php artisan optimize:clear

# Sinkronisasi sequence PostgreSQL ID
docker compose exec app php artisan db:sync-sequences

# Composer command
docker compose exec app composer require <package-name>
```

### 4. Masuk ke Dalam Shell Container
```bash
# Masuk ke container Laravel App
docker compose exec app bash

# Masuk ke container WhatsApp Server
docker compose exec wa-server sh

# Masuk ke PostgreSQL CLI (psql)
docker compose exec db psql -U postgres -d surat_penomoran
```

---

## 🔍 Troubleshooting & Solusi

### 1. Port Conflict (Port 8000, 5432, 8081, atau 3000 sudah dipakai)
Jika port lokal sudah dipakai oleh aplikasi lain (misal PostgreSQL lokal):
Buka file `.env`, ubah port yang diinginkan:
```env
APP_PORT=8080
DB_PORT=5433
WA_PORT=3001
DB_GUI_PORT=8082
```
Lalu restart: `docker compose up -d`

### 2. Permission Denied pada Folder Storage
Jalankan perintah ini:
```bash
docker compose exec app chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
```

### 3. Re-scan WhatsApp (Ingin ganti nomor WA)
Hapus auth info yang tersimpan:
```bash
docker compose exec wa-server rm -rf /app/auth_info/*
docker compose restart wa-server
docker compose logs -f wa-server
```
Lalu scan QR Code baru yang muncul.
