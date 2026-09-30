# Frontend Security & HttpOnly Cookie Architecture (`docs/frontend/SECURITY.md`)

Frontend SAIMS dirancang dengan standar keamanan tinggi untuk mencegah kerentanan **XSS (Cross-Site Scripting)** dan **CSRF (Cross-Site Request Forgery)**.

---

## 1. HttpOnly Cookies Management

- JWT Token (**Access Token** & **Refresh Token**) **TIDAK PERNAH** disimpan di `localStorage` atau `sessionStorage`.
- Token dikelola secara otomatis oleh peramban (*browser*) melalui header `Set-Cookie` beratribut `HttpOnly`, `Secure`, dan `SameSite=Lax` dari backend Golang.

---

## 2. Axios Client Configuration (`src/lib/api.ts`)

Setiap request HTTP *client-side* menggunakan instance Axios yang secara otomatis menyertakan kredensial cookie:

```typescript
import axios from 'axios';

export const api = axios.create({
 baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
 withCredentials: true, // Wajib diset true agar HttpOnly cookie ikut terkirim
});
```

---

## 3. Next.js Middleware Protection (`src/middleware.ts`)

Middleware Next.js berjalan di sisi server (*Server-Side*) untuk memverifikasi keberadaan cookie sebelum merender rute halaman terlindungi:

- Rute Publik: `/login`, `/register`
- Rute Terlindungi: `/dashboard`, `/inventory`, `/borrowings`, `/maintenance`, `/users`, `/audit-logs`
- Jika cookie tidak valid/ditemukan Redirect otomatis ke `/login`.
