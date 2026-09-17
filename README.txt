Dokumentasi Integrasi Frontend — SSO Login Page
Dokumen ini untuk tim frontend yang mengerjakan halaman login/consent (Next.js) yang terhubung ke backend SSO/Identity Provider (IdP).
---
1. Yang Perlu Kalian Tahu Dulu
Backend SSO sudah berjalan dan bisa diakses lewat internet — kalian tidak perlu install Podman, PostgreSQL, ngrok, atau menjalankan apapun di sisi backend.
Kalian tidak akan pernah mengakses database secara langsung. Semua data (nama aplikasi, verifikasi login, dst) diambil lewat API yang sudah disediakan.
Backend saat ini di-host sementara lewat ngrok, jadi URL-nya bisa berubah kalau backend di-restart. Kalau itu terjadi, kalian akan dikabari URL baru.
URL backend saat ini:
```
https://procurer-uncouth-animate.ngrok-free.dev
```
---
2. Setup Awal
2.1 Buat file `.env.local`
Di root folder proyek Next.js kalian (sejajar dengan `package.json`), buat file baru bernama `.env.local`:
```env
NEXT_PUBLIC_IDP_URL=https://procurer-uncouth-animate.ngrok-free.dev
```
> Prefix `NEXT_PUBLIC_` **wajib** ada karena variabel ini dipakai di kode yang jalan di browser (client-side fetch). Tanpa prefix ini, Next.js akan menyembunyikan nilainya dan fetch akan gagal karena URL-nya `undefined`.
2.2 Tambahkan ke `.gitignore`
Pastikan `.env.local` ada di `.gitignore` kalian (biasanya sudah otomatis kalau proyek dibuat dengan `create-next-app`). Ini supaya URL ngrok yang sering berubah tidak ikut ter-commit dan membingungkan anggota tim lain.
2.3 Restart server dev
Setelah membuat/mengubah `.env.local`:
```
Ctrl+C
npm run dev
```
Next.js hanya membaca environment variable saat server baru dimulai, tidak otomatis reload.
---
3. Header Wajib: `ngrok-skip-browser-warning`
Backend saat ini di-host lewat ngrok versi gratis, yang menampilkan halaman peringatan HTML sekali sebelum meneruskan request. Untuk melewatinya secara otomatis, setiap fetch ke backend wajib menyertakan header ini:
```javascript
headers: {
  'ngrok-skip-browser-warning': 'true',
}
```
Tanpa header ini, fetch akan menerima halaman HTML warning, bukan JSON yang diharapkan, dan `res.json()` akan error saat parsing.
> Catatan: header ini hanya diperlukan selama backend masih di-host lewat ngrok gratis. Kalau nanti pindah ke domain permanen (VPS/staging), header ini tidak diperlukan lagi.
---
4. Alur Login (Authorization Code Flow + PKCE)
Berikut urutan yang terjadi dari awal sampai akhir:
User klik tombol "Login" di aplikasi kalian
Aplikasi kalian generate `code_verifier` dan `code_challenge` (PKCE), simpan `code_verifier` di session/cookie
Redirect user ke `{NEXT_PUBLIC_IDP_URL}/oidc/auth?...` dengan parameter yang sesuai (lihat bagian 5)
Backend redirect ke halaman login kalian dengan sebuah `uid` di URL
Kalian `GET` ke `/interaction/:uid` untuk ambil info client (nama aplikasi, dst) untuk ditampilkan
User isi form login, kalian `POST` ke `/interaction/:uid/login`
Kalau berhasil, response berisi `redirectTo` — arahkan browser ke situ
Backend redirect balik ke `redirect_uri` aplikasi kalian dengan `code=...`
Aplikasi kalian tukar `code` + `code_verifier` jadi token (token exchange) — biasanya dilakukan di backend/API route Next.js kalian, bukan di browser
---
5. Parameter untuk Memulai Flow (`/oidc/auth`)
Sebelum bisa dipakai, `client_id` dan `redirect_uri` aplikasi kalian harus didaftarkan dulu oleh backend team. Kabari `redirect_uri` yang kalian pakai (contoh: `http://localhost:3001/callback`) supaya bisa didaftarkan.
Contoh URL redirect untuk memulai login:
```
{NEXT_PUBLIC_IDP_URL}/oidc/auth?client_id=CLIENT_ID_KALIAN&redirect_uri=REDIRECT_URI_KALIAN&response_type=code&scope=openid%20profile&state=RANDOM_STRING&code_challenge=HASIL_PKCE&code_challenge_method=S256
```
Parameter	Keterangan
`client_id`	Diberikan oleh backend team setelah didaftarkan
`redirect_uri`	URL di aplikasi kalian tempat `code` akan dikirim balik, harus sama persis dengan yang didaftarkan
`response_type`	Selalu `code`
`scope`	`openid profile`
`state`	String acak untuk mencegah CSRF, simpan untuk dicocokkan saat callback
`code_challenge`	Hasil SHA-256 dari `code_verifier`, di-encode base64url

`code_challenge_method`	Selalu `S256`
Contoh generate PKCE di JavaScript (browser)
```javascript
function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64url(array);

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64url(digest);

  return { verifier, challenge };
}
```
Simpan `verifier` (misal di cookie httpOnly atau session) — akan dibutuhkan lagi saat token exchange.
---
6. Contoh Kode Fetch
6.1 Ambil data interaction (GET)
```javascript
async function getInteractionDetails(uid) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_IDP_URL}/interaction/${uid}`, {
    credentials: 'include',
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!res.ok) throw new Error('Gagal ambil data interaction');
  return res.json();
}
```
Contoh response:
```json
{
  "uid": "Xy8f9J2kLp...",
  "interaction": { "name": "login" },
  "client": {
    "clientId": "client-dummy",
    "clientName": "Sistem PKL",
    "logoUri": "https://cdn.domain.com/logos/pkl.png"
  },
  "params": {
    "scope": "openid profile",
    "state": "xyz123"
  }
}
```
6.2 Submit form login (POST)
```javascript
async function submitLogin(uid, username, password) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_IDP_URL}/interaction/${uid}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.redirectTo) {
    window.location.href = data.redirectTo;
  }
  return data;
}
```
Kalau kredensial salah, response akan berisi:
```json
{ "error": "invalid_credentials" }
```
Tampilkan pesan error yang sesuai di form, jangan redirect.
---
7. Poin Penting yang Sering Terlewat
`credentials: 'include'` wajib di setiap fetch — tanpa ini, cookie session tidak ikut terkirim dan backend tidak bisa mengenali sesi login kalian.
`uid` diambil dari URL halaman kalian sendiri setelah backend redirect ke situ (misal `/login/xyz123abc` → `uid = 'xyz123abc'`), ambil lewat `useRouter().query.uid` di Next.js.
Jangan simpan `client_secret` di kode frontend mana pun — kalau ada proses yang butuh `client_secret` (seperti token exchange), itu harus dilakukan lewat API route Next.js (server-side), bukan langsung di browser.
URL ngrok bisa berubah — kalau tiba-tiba semua fetch gagal/error CORS, kemungkinan besar URL backend sudah berubah karena restart. Konfirmasi ke backend team dulu sebelum debug lebih jauh.
---
8. Kredensial untuk Testing
Username	Password
`dev`	`password123`
---
9. Troubleshooting
Gejala	Kemungkinan Penyebab
`res.json()` error / dapat HTML bukan JSON	Lupa header `ngrok-skip-browser-warning`
Error CORS di console	URL backend berubah, atau origin kalian belum terdaftar di backend — kabari backend team
`interactionDetails not found` / uid tidak valid	Cookie tidak terkirim — cek `credentials: 'include'` sudah ada di semua fetch
Fetch gagal total / `ERR_CONNECTION_REFUSED`	Backend sedang tidak jalan, atau tunnel ngrok mati — konfirmasi ke backend team
`invalid_credentials` saat login	Username/password salah, gunakan kredensial testing di atas
Kalau menemui error yang tidak ada di tabel ini, screenshot Console dan Network tab (F12) lalu kirim ke backend team — jangan cuma screenshot tampilan halamannya saja.
---
10. Kontak
Untuk pendaftaran `client_id`/`redirect_uri` baru, perubahan URL backend, atau pertanyaan lain seputar API ini, hubungi backend team (Faiq).