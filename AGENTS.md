# Panduan Utama Agen AI (AGENTS.md) - Microdata SSO Platform

File ini adalah instruksi wajib bagi setiap AI Agent yang bekerja di repositori ini. Seluruh panduan di bawah ini mengikat dan memiliki prioritas tertinggi.

---

## 1. Prinsip Inti (Core Mandates)

### A. Anti-Halusinasi & Grounding (Dilarang Menebak / Mengarang)
1. **Verifikasi Sebelum Bertindak**: Selalu baca file kode, skema database, atau konfigurasi riil menggunakan tools pembaca file sebelum merancang atau mengubah kode. Jangan pernah berasumsi tentang nama fungsi, route, struktur tabel, atau konfigurasi yang ada.
2. **Jangan Mengarang Library / Dependensi**: Selalu periksa `package.json`, `composer.json`, atau `go.mod` di folder sub-proyek terkait. Jangan mengimpor modul, pustaka, atau helper eksternal yang belum terpasang tanpa persetujuan eksplisit dari pengguna.
3. **Cari Fakta, Bukan Spekulasi**: Jika terjadi error atau informasi dari pengguna terasa ambigu, investigasi log dan file yang relevan terlebih dahulu. Jika tetap tidak jelas, tanyakan klarifikasi kepada pengguna daripada menebak alur bisnis.

### B. Bekerja Sesuai Panduan & Strict Scope (Dilarang Menambah Hal yang Tidak Perlu)
1. **Patuhi Batas Tugas (Zero Feature Creep)**: Kerjakan hanya apa yang diminta oleh pengguna. Dilarang menambahkan fitur "bonus", "future-proofing", atau perbaikan di luar scope tugas saat ini.
2. **Jangan Lakukan Over-Engineering**: Pilih pendekatan yang paling langsung, sederhana, dan sudah lazim digunakan dalam proyek ini. Jangan membuat layer abstraksi, design pattern kompleks, atau wrapper baru kecuali secara tegas diminta.
3. **Jangan Melakukan Refactoring Liar**: Jangan menyentuh, merombak, atau memformat ulang file-file di luar cakupan pekerjaan yang diminta. Perubahan harus spesifik dan terisolasi pada file yang relevan saja.
4. **Hormati Aturan Lokal Sub-Proyek**: Jika di dalam sub-folder terdapat file instruksi lokal (misalnya `web-client/cpc/AGENTS.md` atau `web-client/microintern/AGENTS.md`), aturan lokal tersebut juga harus dipatuhi.

### C. Bekerja Secara Clean (Clean Code & Minimal Footprint)
1. **Bersih Tanpa Sisa (No Dead Code / Leftovers)**:
   - Tidak boleh ada fungsi, variabel, atau import yang tidak terpakai (*unused*).
   - Jangan tinggalkan `console.log`, `dd()`, `fmt.Println`, atau log debug sementara setelah selesai melakukan troubleshooting.
   - Segera hapus file scratch / temporary scripts yang dibuat saat proses debugging.
2. **Konsistensi Gaya Kode**: Ikuti pola dan konvensi penamaan yang sudah eksis di file/modul tersebut.
3. **Integritas Dokumentasi & Komentar**:
   - Pertahankan komentar fungsional atau docstrings penting yang sudah ada sebelumnya.
   - Jangan menambahkan komentar bertele-tele atau menjelaskan hal yang sudah jelas (*self-explanatory code*).
4. **Atomic & Targeted Edits**: Saat mengedit file, ganti hanya baris atau fungsi yang relevan. Hindari penulisan ulang seluruh file jika hanya memerlukan perubahan kecil.

### D. Keamanan Lingkungan & Data (Safety Guardrails)
1. **Jangan Menyentuh Secrets**: Dilarang meng-commit, mencetak token, password, private key, atau client secret ke log maupun file publik.
2. **Lindungi File `.env`**: Jangan pernah menimpa file `.env` produksi/lokal dengan nilai dummy tanpa konfirmasi. Selalu rujuk ke `.env.example`.
3. **Peringatan Git Sub-Aplikasi**: Repositori ini berisi multi-service. Jangan pernah menghapus folder `.git` internal di dalam folder sub-aplikasi sebelum history diamankan sesuai catatan README.

---

## 2. Peta Sub-Proyek & Konvensi

Repositori ini terdiri dari beberapa service independen yang terhubung melalui SSO OIDC:

| Folder | Komponen | Stack / Runtime | Catatan Khusus |
| :--- | :--- | :--- | :--- |
| `backend/` | SSO Identity Provider (OIDC) | Node.js (Express, oidc-provider, pg) | Inti sistem SSO. Skema di `migrations/` & `scripts/`. Hati-hati saat mengubah flow auth / token. |
| `frontend/` | UI IdP & Admin Dashboard | HTML/CSS/JS (PWA) | Halaman login, consent, logout, dan dashboard IdP. |
| `web-client/portal-launcher/` | Portal Akses SSO | Node.js + PWA | Launcher daftar aplikasi SSO. |
| `web-client/cpc/` | Kontrol Perumahan | Laravel 13 + Inertia (React) + Tailwind | Ikuti `web-client/cpc/AGENTS.md`. Gunakan alur route -> controller -> request -> model. |
| `web-client/microintern/` | Portal Magang | Node.js (API) + React/Vite (Frontend) | Ikuti `web-client/microintern/AGENTS.md`. Skema di `database/schema.sql`. Verifikasi frontend dengan `npm run build` (jangan `npm run dev`). |
| `web-client/saims/` | Sistem Aset / SAIMS | Go (Backend) + Next.js (Frontend) | Pastikan Go build & TypeScript check lulus jika mengubah SAIMS. |
| `web-client/surat-penomoran/` | Penomoran Surat | Laravel (PHP 8.2+) | Model MVC Laravel standar. |

---

## 3. Checklist Alur Kerja Agen (Standard Operating Procedure)

Setiap menangani tiket/permintaan pengguna, ikuti 4 langkah ini secara disiplin:

```
[1. INSPECT & VERIFY] ──> [2. MINIMAL TARGETED WORK] ──> [3. VALIDATE/CHECK] ──> [4. CLEANUP]
```

1. **Step 1: Inspect & Verify (Cek Sumber Fakta)**
   - Baca file yang bersangkutan langsung dari disk.
   - Pahami struktur data dan tipe input/output sebelum menulis baris kode pertama.
2. **Step 2: Minimal Targeted Work (Kerjakan Sesuai Scope)**
   - Ubah hanya bagian kode yang benar-benar dibutuhkan.
   - Jangan menambah dependency baru kecuali diminta.
3. **Step 3: Validate / Check (Validasi Hasil)**
   - Jalankan linter, typecheck, atau build check yang sesuai dengan sub-proyek terkait (misalnya `npm run build`, `composer test`, `go build`, atau `npx tsc --noEmit`).
   - Pastikan tidak ada syntax error atau regression.
4. **Step 4: Cleanup (Pembersihan)**
   - Hapus scratch scripts, file log uji coba, atau console logs debug sementara.
   - Pastikan diff bersih dan siap di-review oleh pengguna.
