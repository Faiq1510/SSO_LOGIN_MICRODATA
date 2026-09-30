# Panduan Deployment & Penyelesaian Masalah (Troubleshooting) Docker

Dokumen ini merangkum seluruh kendala yang terjadi selama proses *deployment* Sistem Kontrol Perumahan ke server produksi (Ubuntu + Docker + Nginx), solusi yang diterapkan, serta panduan standar (*SOP*) untuk melakukan *update* kode di masa mendatang.

## ⚠️ Daftar Kendala & Solusi

### 1. Error `MissingAppKeyException` (Kunci Keamanan Kosong) walau sudah di-generate
- **Kendala**: Laravel terus memunculkan error 500 karena tidak menemukan `APP_KEY`, padahal perintah `php artisan key:generate` sudah dijalankan dari dalam container.
- **Penyebab**: Docker Compose menggunakan fitur `env_file: .env` yang menyedot variabel dari *host* (server Ubuntu). Karena `APP_KEY` di server kosong, Docker memaksa variabel tersebut tetap kosong di memori *container*, sehingga perubahan dari dalam *container* ditolak.
- **Solusi**: Memasukkan `APP_KEY` secara manual ke dalam file `.env` di *host* (Ubuntu), lalu membangun ulang *container* menggunakan `docker-compose down` dan `docker-compose up -d`.

### 2. Error `View path not found` & Session `Failed to open stream`
- **Kendala**: Muncul error 500 karena Laravel tidak bisa memproses tampilan UI (*views*) maupun menyimpan *session* (saat mencoba login).
- **Penyebab**: Di dalam `Dockerfile`, terdapat sintaks `mkdir -p storage/framework/{sessions,views,cache}`. Fitur kurung kurawal `{}` ini hanya didukung oleh `bash`, namun instruksi eksekusi *container* menggunakan `sh`. Akibatnya, alih-alih membuat 3 folder terpisah, sistem malah membuat satu folder yang namanya secara literal adalah `"{sessions,views,cache}"`.
- **Solusi**: Sintaks pada `Dockerfile` telah diperbaiki secara permanen menjadi penulisan eksplisit dan dipisahkan spasi: `mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache`.

### 3. Error *Mixed Content* (Gagal Login karena koneksi tidak aman / HTTP)
- **Kendala**: Halaman login berhasil dimuat, tetapi saat mengklik tombol login, browser memblokirnya dengan alasan "Mixed Content" (Aplikasi memaksa jalur HTTP biasa di atas protokol HTTPS).
- **Penyebab**: Fungsi pemaksa HTTPS (`URL::forceScheme('https')`) di `AppServiceProvider.php` hanya aktif jika `APP_ENV=production`. Saat proses *debugging*, status diubah menjadi `local` sehingga fitur keamanan HTTPS otomatis ini non-aktif.
- **Solusi**: Mengembalikan `APP_ENV=production` dan memastikan `APP_URL=https://cpc.microdataindonesia.co.id` di file `.env` server Ubuntu.

---

## 🚀 Panduan Update Source Code & Menjalankan Docker

Setiap kali ada pembaruan kode (dari Git atau dipindahkan manual ke server), ikuti urutan perintah ini agar aplikasi berhasil ter-deploy dengan sempurna:

### Langkah 1: Tarik Kode Terbaru
Masuk ke folder project di server Ubuntu Anda dan perbarui kode sumbernya.
```bash
# Contoh jika menggunakan Git:
cd /path/ke/folder/sistem_kontrol_perumahan
git pull origin main
```

### Langkah 2: Build Ulang Image Docker
Sistem perlu membuat ulang *image* agar menyerap kode baru dan menginstall library/package terbaru.
```bash
sudo docker-compose -f docker-compose.prod.yml build
```

### Langkah 3: Matikan dan Nyalakan Container (Recreate)
Hancurkan *container* lama dan jalankan *container* baru. Perintah ini juga memastikan Docker memuat/menarik konfigurasi `.env` terbaru dari server Ubuntu ke dalam container.
```bash
sudo docker-compose -f docker-compose.prod.yml down
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Langkah 4: Bersihkan Sisa Cache Laravel (Opsional tapi Wajib jika Error)
Agar Laravel tidak membaca konfigurasi memori lama (yang bisa menyebabkan error 500 seperti sebelumnya), bersihkan semua *cache*.
```bash
sudo docker exec -it skp_production php artisan config:clear
sudo docker exec -it skp_production php artisan cache:clear
sudo docker exec -it skp_production php artisan view:clear
sudo docker exec -it skp_production php artisan route:clear
```

### Langkah 5: Jalankan Migrasi Database (Jika ada perubahan struktur tabel)
Jalankan migrasi agar tabel database Anda menyesuaikan dengan kode terbaru.
```bash
sudo docker exec -it skp_production php artisan migrate --force
```

### Langkah 6: Validasi di Browser
Buka `https://cpc.microdataindonesia.co.id` di browser Anda. Aplikasi seharusnya sudah berjalan dengan kode terbaru tanpa error!
