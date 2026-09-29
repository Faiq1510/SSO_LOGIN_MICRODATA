# Microdata SSO Platform

Repository ini berisi Identity Provider (IdP) berbasis OpenID Connect (OIDC), portal aplikasi, demo client, dan empat aplikasi yang terintegrasi dengan SSO Microdata.

## 1. Struktur Repository

```text
LOGIN_SSO/
├─ backend/                    # SSO Identity Provider + PostgreSQL compose
│  ├─ src/                     # OIDC provider, login, consent, admin API
│  ├─ docker-compose.yml
│  └─ docker-compose.sso.yml
├─ frontend/                   # Template halaman login, consent, dan logout IdP
├─ client-demo/                # Demo client SSO pertama
├─ client-demo2/               # Demo client SSO kedua
└─ web-client/
   ├─ portal-launcher/         # Portal daftar aplikasi
   ├─ cpc/                     # Aplikasi CPC (Laravel)
   ├─ microintern/             # Backend + frontend Microintern
   ├─ saims/                   # Backend Go + frontend Next.js SAIMS
   └─ surat-penomoran/         # Aplikasi Surat Penomoran (Laravel)
```

Root repository adalah repository Git utama. Beberapa aplikasi masih memiliki repository Git internal karena dikembangkan terpisah. Jangan menghapus folder `.git` internal sebelum history aplikasi tersebut diamankan.

## 2. Prasyarat

Install tools berikut di Windows:

- Git
- Node.js 20 atau lebih baru
- npm
- Podman Desktop dan `podman-compose`
- PHP 8.2+, Composer, dan ekstensi database untuk aplikasi Laravel
- Go 1.26+ jika menjalankan backend SAIMS tanpa container

Cek instalasi:

```powershell
node --version
npm --version
podman --version
podman-compose --version
php --version
composer --version
```

## 3. Konfigurasi Environment

Jangan commit file `.env`, `.env.local`, password, private key, client secret, atau token.

Gunakan file contoh jika tersedia, kemudian isi nilainya secara lokal. File utama yang digunakan:

```text
.env                                      # konfigurasi IdP root
backend/.env                             # konfigurasi backend SSO saat compose dijalankan dari backend
web-client/microintern/backend/.env      # API Microintern
web-client/microintern/frontend/.env.local
web-client/saims/backend/.env            # API SAIMS
web-client/saims/frontend/.env.local
web-client/cpc/.env                      # CPC
web-client/surat-penomoran/.env          # Surat Penomoran
web-client/portal-launcher/.env
```

Minimal konfigurasi frontend Microintern:

```env
VITE_API_URL=http://localhost:5000/api
VITE_MINIO_PUBLIC_URL=http://localhost:9000
VITE_MINIO_BUCKET=microintern
```

Variabel `VITE_*` harus berada di `web-client/microintern/frontend/.env.local`, bukan di environment backend SSO. Vite membaca variabel tersebut saat proses dev server atau build dimulai.

## 4. Menjalankan Identity Provider

Dari folder `backend`:

```powershell
cd D:\LOGIN_SSO\backend
npm install
podman-compose up -d
```

Service utama:

| Service                          | URL                     |
| -------------------------------- | ----------------------- |
| Identity Provider                | `http://localhost:3000` |
| PostgreSQL SSO                   | `localhost:5432`        |
| Portal launcher, jika dijalankan | `http://localhost:9000` |

Health check:

```powershell
Invoke-WebRequest http://localhost:3000/health/db
```

Untuk mode development tanpa container app, pastikan PostgreSQL tetap berjalan, lalu jalankan:

```powershell
cd D:\LOGIN_SSO\backend
npm run dev
```

Jalankan portal launcher pada terminal terpisah jika diperlukan:

```powershell
cd D:\LOGIN_SSO\web-client\portal-launcher
npm install
npm run dev
```

## 5. Client SSO yang Terdaftar

`client_id` dan `redirect_uri` harus sama persis antara aplikasi, database IdP, dan URL authorization.

| Aplikasi        | Client ID            | Redirect URI                               | Port aplikasi |
| --------------- | -------------------- | ------------------------------------------ | ------------: |
| SAIMS           | `client-saims`       | `http://localhost:3002/sso/callback`       |          3002 |
| Microintern     | `client-microintern` | `http://localhost:5173/sso/callback`       |          5173 |
| CPC             | `cpc`                | `http://localhost:8001/login/sso/callback` |          8001 |
| Surat Penomoran | `client-arsip-surat` | `http://localhost:8000/sso/callback`       |          8000 |

Issuer development saat ini:

```text
https://procurer-uncouth-animate.ngrok-free.dev
```

URL issuer dapat berubah ketika tunnel ngrok dibuat ulang. Perbarui environment aplikasi jika URL berubah.

## 6. Menjalankan Aplikasi Terintegrasi

### Microintern

Backend API berjalan pada port `5000`, frontend Vite pada port `5173`.

```powershell
cd D:\LOGIN_SSO\web-client\microintern\backend
npm install
npm run dev
```

Terminal kedua:

```powershell
cd D:\LOGIN_SSO\web-client\microintern\frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Buka `http://localhost:5173`.

### SAIMS

Frontend berjalan pada port `3002`, API pada port `8080`.

```powershell
cd D:\LOGIN_SSO\web-client\saims\frontend
npm install
npm run dev
```

Backend SAIMS membutuhkan PostgreSQL. Jika memakai container yang sudah disiapkan:

```powershell
cd D:\LOGIN_SSO\web-client\saims\backend
podman-compose up -d
```

Buka `http://localhost:3002` dan cek API melalui `http://localhost:8080/api/health`.

### CPC

CPC menggunakan Laravel. Jalankan dari folder `web-client/cpc`:

```powershell
cd D:\LOGIN_SSO\web-client\cpc
composer install
npm install
php artisan key:generate
php artisan migrate
npm run dev
```

Gunakan konfigurasi `SSO_ISSUER`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, dan `SSO_REDIRECT_URI` dari `.env`. Aplikasi harus melayani callback pada port `8001`.

### Surat Penomoran

Jalankan dependency Laravel dan service sesuai `docker-compose.yml` atau konfigurasi lokalnya:

```powershell
cd D:\LOGIN_SSO\web-client\surat-penomoran
composer install
npm install
php artisan key:generate
php artisan migrate
npm run dev
```

Callback SSO harus tersedia di `http://localhost:8000/sso/callback`.

## 7. Alur Login SSO

1. Aplikasi membuat `state`, `code_verifier`, dan `code_challenge` PKCE.
2. Browser diarahkan ke `/oidc/auth` pada issuer SSO.
3. User login pada halaman IdP.
4. IdP menampilkan halaman consent dan user memilih **Izinkan dan lanjutkan**.
5. IdP mengarahkan browser kembali ke `redirect_uri` dengan authorization `code`.
6. Backend aplikasi menukar `code` ke `/oidc/token` menggunakan `client_secret`.
7. Aplikasi membuat session lokal dan mengarahkan user ke dashboard.

`client_secret` hanya boleh digunakan di backend. Jangan menaruhnya di kode frontend atau variabel `NEXT_PUBLIC_*`/`VITE_*`.

## 8. Header dan Cookie

Jika issuer masih menggunakan ngrok gratis, request API dari browser perlu menyertakan:

```http
ngrok-skip-browser-warning: true
```

Untuk endpoint yang memakai session cookie, gunakan:

```javascript
fetch(url, {
  credentials: "include",
});
```

Jangan menghapus `state` atau `code_verifier` sebelum proses token exchange selesai.

## 9. Verifikasi Cepat

Cek semua halaman aplikasi:

```powershell
$urls = @(
  'http://localhost:3002/login',
  'http://localhost:5173/login',
  'http://localhost:8001/login',
  'http://localhost:8000/login'
)

foreach ($url in $urls) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing $url
    Write-Host "$url -> $($response.StatusCode)"
  } catch {
    Write-Host "$url -> DOWN"
  }
}
```

Cek authorization client secara manual hanya setelah client terdaftar. Redirect URI harus URL-encoded dan sama persis dengan database IdP.

## 10. Troubleshooting

### `Network Error` atau `ERR_CONNECTION_REFUSED`

Service tujuan belum berjalan, port salah, atau container berhenti. Cek:

```powershell
podman ps
netstat -ano | Select-String ':3000|:5000|:5173|:8000|:8001|:8080'
```

### `invalid_client` atau `redirect_uri mismatch`

Periksa tiga hal:

- `client_id` benar.
- `client_secret` cocok dengan database IdP.
- `redirect_uri` sama persis, termasuk port, path, dan trailing slash.

### SSO berhasil lalu kembali ke login

Biasanya session cookie tidak tersimpan, token tidak dikirim ke API, atau endpoint refresh memakai host berbeda. Periksa Application/Storage browser dan Network tab, lalu pastikan `credentials: include` atau header `Authorization` digunakan sesuai implementasi aplikasi.

### User SSO belum terdaftar

SAIMS melakukan provisioning otomatis sebagai `Staff`. Aplikasi Laravel CPC dan Surat Penomoran juga membuat user lokal saat callback pertama, sesuai kebijakan aplikasi masing-masing.

### Response berupa HTML dari ngrok

Tambahkan header `ngrok-skip-browser-warning: true`. Pastikan request tidak diarahkan ke URL ngrok yang sudah lama.

## 11. Aturan Git untuk Team

Sebelum push:

```powershell
git status
git diff --check
git add <file-yang-diubah>
git diff --cached --stat
git commit -m "jelaskan perubahan"
git push origin main
```

Jangan melakukan `git add .` sebelum memeriksa file `.env`, credential, dump database, `node_modules`, `vendor`, `.next`, dan file build.

Jika perubahan berasal dari subproject yang memiliki repository Git sendiri, commit pada repository subproject tersebut atau sepakati terlebih dahulu apakah project akan menjadi bagian dari monorepo root. Jangan menghapus nested `.git` tanpa backup history.

## 12. Kontak dan Dokumentasi

Dokumentasi integrasi yang lebih spesifik tersedia pada README masing-masing aplikasi. Untuk menambah client SSO baru, siapkan:

- nama aplikasi
- `client_id`
- redirect URI development dan production
- post-logout redirect URI
- owner aplikasi
- issuer/environment yang digunakan
