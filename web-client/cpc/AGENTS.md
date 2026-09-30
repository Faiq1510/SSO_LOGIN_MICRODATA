# AGENTS.md

## Ringkasan project
Project ini adalah aplikasi Laravel 13 dengan Inertia + React + Tailwind untuk sistem kontrol perumahan.
Fitur utama yang ada saat ini:
- manajemen unit
- manajemen material
- log masuk/keluar gudang
- progress pembangunan
- fitur keuangan
- autentikasi dan role-based access menggunakan Spatie Permission

## Struktur penting
- app/Http/Controllers: controller utama aplikasi
- app/Http/Requests: validasi request input
- app/Models: model Eloquent
- routes/web.php dan routes/material.php: definisi route
- resources/js: halaman React/Inertia dan komponen frontend
- database/migrations: perubahan skema database
- tests: test feature dan unit

## Konvensi kerja yang disarankan
- Prefer gunakan pola yang sudah ada di project daripada menambah arsitektur baru.
- Untuk fitur baru, biasanya cocok mengikuti alur: route -> controller -> request -> model/service -> view/page.
- Jaga konsistensi dengan nama route, controller, dan label UI yang sudah dipakai.
- Untuk fitur yang terkait auth/role, pastikan middleware yang sesuai tetap terjaga.
- Hindari mengubah file vendor atau hasil build secara tidak perlu.
- Saat mengubah skema database, cek migration dan model terkait terlebih dahulu.

## Perintah umum
- composer install
- npm install
- php artisan migrate
- php artisan test
- npm run build
- php artisan serve

## Catatan untuk AI lain
- Fokus pada kebutuhan bisnis sistem kontrol perumahan, bukan hanya teknis.
- Jika ragu, lihat controller/model/route yang sudah ada terlebih dahulu agar pola tetap konsisten.
- Perubahan yang bersifat sensitif seperti database, auth, atau route harus dilakukan dengan hati-hati.
- Prioritaskan perubahan minimal dan aman.
