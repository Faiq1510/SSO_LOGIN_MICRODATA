# Panduan Integrasi SSO (Single Sign-On) SAIMS & Portal Login Microdata

Dokumen ini berisi spesifikasi teknis, panduan arsitektur, dan referensi implementasi integrasi **Stateless Single Sign-On (SSO)** antara **Portal Login Microdata** (Portal Pusat) dan **SAIMS** (Website Target).

---

## 1. Arsitektur & Prinsip Otentikasi

Integrasi ini menerapkan arsitektur **Zero-Fetch Stateless Authentication**:
- **Stateless & Offline (0ms Latency):** Backend SAIMS memverifikasi keabsahan token JWT SSO secara mandiri di memori lokal menggunakan *Cryptographic HMAC-SHA256 Signature* tanpa melakukan HTTP callback kembali ke Portal SSO.
- **Enkapsulasi Issuer (`iss`):** Issuer (`portal-login-microdata`) terenkapsulasi langsung di dalam payload JWT.
- **Anti-Replay Attack:** Mengandalkan timestamp kadaluarsa (`exp`) berdurasi **5 menit**.

```
┌─────────────────┐ 1. Klik "Buka Website" ┌─────────────────────────┐
│ │ ───────────────────────────────▶ │ │
│ Portal SSO UI │ │ Portal SSO API Server │
│ (localhost:5173)│ ◀─────────────────────────────── │ /api/auth/generate-tok │
└─────────────────┘ 2. Token JWT SSO Generated └─────────────────────────┘
 │ (TTL 5 Menit, Signed)
 │
 │ 3. Alihan URL Redirect:
 │ http://localhost:3000/sso/callback?sso_token=eyJhbGciOiJIUzI1...
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sistem SAIMS │
│ │
│ ┌─────────────────────────────┐ 4. HTTP GET /api/auth/sso/callback │
│ │ Next.js Frontend │ ─────────────────────────────────────────┐ │
│ │ (localhost:3000) │ ◀──────────────────────────────────────┐ │ │
│ └─────────────────────────────┘ 5. Return User Profile & Set Cookie │ │ │
│ │ │ │ │
│ │ 6. Simpan saims_user ke localStorage │ │ │
│ ▼ │ │ │
│ ┌─────────────────────────────┐ │ │ │
│ │ SAIMS Dashboard │ │ │ │
│ │ (/dashboard) │ │ │ │
│ └─────────────────────────────┘ │ │ │
│ │ │ │
│ ┌───────────────────────────────────────────────────────────────────┐ │ │ │
│ │ Go Gin Backend (localhost:8080) │ ◀│─┘ │
│ │ - Verifikasi Signature Token (HS256) via SSO_SHARED_SECRET │ │ │
│ │ - Sanitasi Identifier & Lookup Email/UUID User SAIMS │ │ │
│ │ - Buat Session Native SAIMS & Audit Log SSO_LOGIN │ ─┴────┘
│ └───────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kontrak Payload JWT SSO (`sso_token`)

Token SSO yang dikirim dari Portal SSO melalui parameter URL query (`?sso_token=...`) membawa klaim berikut:

```json
{
 "iss": "portal-login-microdata",
 "user_id_external": "admin@example.com",
 "role_external": "Administrator",
 "user_id_internal": "3bd537d5-7615-45a3-a5a5-0cbd284d2092",
 "website_id": "3604c756-c29a-445b-b620-8c171ed82628",
 "iat": 1774153800,
 "exp": 1774154100
}
```

| Klaim | Tipe | Deskripsi |
|-------|------|-----------|
| `iss` | string | Identitas Issuer sah: `"portal-login-microdata"` |
| `user_id_external` | string | Identitas pengguna di SAIMS (Email / UUID) |
| `role_external` | string | Peran/Hak akses di SAIMS (`Administrator`, `Supervisor`, `Staff`, `Teknisi`) |
| `user_id_internal` | string | ID Pengguna internal di Portal SSO |
| `website_id` | string | ID entitas SAIMS di database Portal SSO |
| `exp` | number | Timestamp kadaluarsa (TTL 300 detik / 5 menit) |

---

## 3. Konfigurasi Environment Variables

### A. Sisi Portal SSO (`c:\Users\Arcel\portal-login-microdata\.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=123140054
DB_NAME=portal_login_microdata
APP_PORT=5000

# Shared Secret (WAJIB sama dengan SAIMS)
SSO_SHARED_SECRET=microdata_sso_shared_key_2026_saims
SSO_ISSUER=portal-login-microdata
```

### B. Sisi SAIMS Backend (`c:\saims\backend\.env`)
```env
PORT=8080
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=123140054
DB_NAME=saims

# Shared Secret (WAJIB sama dengan Portal SSO)
SSO_SHARED_SECRET=microdata_sso_shared_key_2026_saims
```

---

## 4. Detail Implementasi Kode SAIMS

### A. Backend Go Gin (`backend`)

#### 1. Verifikasi JWT (`pkg/utils/jwt.go`)
```go
func ValidateSSOToken(tokenString string) (jwt.MapClaims, error) {
	secretKey := []byte(getEnv("SSO_SHARED_SECRET", "microdata_sso_shared_key_2026_saims"))

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidClaims
}
```

#### 2. Service Autentikasi SSO (`internal/services/auth_service.go`)
```go
func (s *authService) SSOLogin(ssoToken string) (string, string, *domain.User, error) {
	claims, err := utils.ValidateSSOToken(ssoToken)
	if err != nil {
		return "", "", nil, fmt.Errorf("invalid SSO token: %w", err)
	}

	// 1. Validasi Issuer
	if iss, _ := claims["iss"].(string); iss != "portal-login-microdata" {
		return "", "", nil, errors.New("invalid SSO token issuer")
	}

	// 2. Sanitasi identifier external user
	extUserID, _ := claims["user_id_external"].(string)
	extUserID = strings.TrimSpace(extUserID)
	extUserID = strings.TrimRight(extUserID, "()[]{}")
	
	// 3. Smart User Lookup (Email / UUID)
	var user *domain.User
	if strings.Contains(extUserID, "@") {
		user, _ = s.userRepo.FindByEmail(extUserID)
	} else if isValidUUID(extUserID) {
		user, _ = s.userRepo.FindByID(extUserID)
	}

	if user == nil {
		return "", "", nil, fmt.Errorf("user '%s' not found in SAIMS system", extUserID)
	}

	// 4. Generate Sesi Token Native SAIMS
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Role, user.Name)
	_ = s.userRepo.UpdateLastLogin(user.ID)

	// 5. Catat Audit Log
	if s.auditRepo != nil {
		_ = s.auditRepo.Create(&domain.AuditLog{
			Action: "SSO_LOGIN",
			EntityName: "User",
			EntityID: user.ID,
			NewPayload: `{"email":"` + user.Email + `","provider":"portal-login-microdata"}`,
			ChangedBy: user.Name,
		})
	}

	return accessToken, refreshToken, user, nil
}
```

#### 3. Endpoint Rute (`internal/routes/routes.go`)
```go
auth.GET("/sso/callback", authHandler.SSOCallback)
auth.POST("/sso/callback", authHandler.SSOCallback)
```

---

### B. Frontend Next.js (`frontend`)

#### 1. Halaman Callback SSO (`frontend/src/app/sso/callback/page.tsx`)
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';

export default function SSOCallbackPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 const ssoToken = searchParams.get('sso_token');
 if (!ssoToken) {
 setError('Parameter SSO Token tidak ditemukan.');
 return;
 }

 async function processSSO(token: string) {
 try {
 const response = await authService.ssoCallback(token);
 if (response && response.user) {
 // WAJIB: Simpan ke localStorage agar DashboardLayout mengenali sesi login
 localStorage.setItem('saims_user', JSON.stringify(response.user));
 if (response.token || response.access_token) {
 localStorage.setItem('saims_token', response.token || response.access_token);
 }
 router.replace('/dashboard');
 }
 } catch (err: any) {
 setError(err.response?.data?.error || 'Terjadi kesalahan saat verifikasi SSO.');
 }
 }

 processSSO(ssoToken);
 }, [searchParams, router]);

 if (error) {
 return <ErrorView message={error} onRetry={() => router.replace('/login')} />;
 }

 return <LoadingSpinner message="Memproses Autentikasi Single Sign-On..." />;
}
```

---

## 5. Verifikasi & Pengujian Integrasi

### A. Pengujian Otomatis (Integration Tests)
Jalankan pengujian integrasi backend Go:
```bash
cd backend
go test ./tests/integration/... -v
```

### B. Uji Coba Manual (End-to-End Flow)
1. Jalankan seluruh layanan SAIMS:
 ```cmd
 c:\saims\scripts\start.bat
 ```
2. Jalankan Portal Login Microdata:
 ```cmd
 cd c:\Users\Arcel\portal-login-microdata
 npm run dev
 ```
3. Buka browser ke `http://localhost:5174/` dan login sebagai admin portal.
4. Klik tombol **"Buka Website"** pada kartu SAIMS.
5. Browser akan mengalihkan ke `http://localhost:3000/sso/callback?sso_token=...` dan langsung membawa pengguna masuk ke **Dashboard SAIMS** dengan akses penuh sesuai rolenya.

---

## 6. Security Invariants
- **Algoritma Terkunci (`HS256`):** Menolak token tanpa algoritma atau manipulasi `none`.
- **Validasi Issuer Sah:** Memastikan `iss === 'portal-login-microdata'`.
- **Expirasi Ketat:** Token kadaluarsa otomatis setelah 5 menit (`exp`).
- **Audit Traceability:** Seluruh aktivitas masuk SSO tercatat secara *immutable* di log audit SAIMS.
