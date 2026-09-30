# SAIMS REST API Specification (`docs/api/README.md`)

Dokumen ini merupakan spesifikasi antarmuka pemrograman aplikasi (**REST API Reference**) untuk **Smart Asset & Inventory Management System (SAIMS)**.

---

## Informasi Umum & Base URL

- **Base URL**: `http://localhost:8080/api`
- **Format Payload**: `JSON (application/json)`
- **Swagger Interactive UI**: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)
- **OpenAPI Spec Files**: 
  - JSON Spec: [`backend/docs/swagger.json`](../../backend/docs/swagger.json)
  - YAML Spec: [`backend/docs/swagger.yaml`](../../backend/docs/swagger.yaml)

---

## Autentikasi & Keamanan Header

Aplikasi menggunakan **JWT (HS256)** dengan skema 2FA OTP via WhatsApp. Untuk keamanan tinggi (mencegah XSS), JWT token dikirim via **HttpOnly Cookie** (`access_token`) atau header berikut:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Daftar Endpoint API Menurut Domain

### 1. Autentikasi (`/auth`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `POST` | `/auth/login` | Login email & password (memicu pengiriman 6-digit OTP WA) | Public |
| `POST` | `/auth/verify-otp` | Verifikasi OTP WA -> Set HttpOnly Cookies (`access_token`) | Public |
| `POST` | `/auth/resend-otp` | Pengiriman ulang kode OTP WA | Public |
| `POST` | `/auth/logout` | Clear cookie & masukan JWT token ke blacklist | Authenticated |
| `POST` | `/auth/register` | Registrasi akun pengguna baru | Public |

---

### 2. Manajemen Aset (`/assets`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/assets` | Daftar aset (Filter: `search`, `category`, `status`, `condition`, `location`, `page`, `limit`) | Semua Role |
| `GET` | `/assets/:id` | Detail aset lengkap & riwayat servis/peminjaman | Semua Role |
| `POST` | `/assets` | Tambah aset baru | Administrator |
| `POST` | `/assets/bulk` | Tambah aset secara massal (`asset_ids` / array JSON) | Administrator |
| `PUT` | `/assets/:id` | Edit/update data aset | Administrator |
| `DELETE` | `/assets/:id` | Hapus aset (Admin: Pengajuan Hapus, Supervisor: Direct Soft Delete) | Admin / Supervisor |
| `GET` | `/assets/trash` | Lihat daftar aset di Recycle Bin (Soft Deleted) | Administrator |
| `POST` | `/assets/:id/restore` | Pulihkan aset dari Recycle Bin | Administrator |
| `POST` | `/assets/:id/images` | Upload gambar aset ke MinIO Storage | Administrator |
| `DELETE` | `/assets/images/:image_id` | Hapus gambar aset dari MinIO | Administrator |
| `PUT` | `/assets/:id/images/:image_id/primary` | Set gambar sebagai gambar utama (*Primary*) | Administrator |

---

### 3. Approval Penghapusan Aset (`/asset-deletions`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/asset-deletions` | Daftar pengajuan penghapusan aset status `Pending` | Supervisor Only |
| `POST` | `/asset-deletions/:id/approve` | Setujui pengajuan hapus -> Aset di-soft delete permanen | Supervisor Only |
| `POST` | `/asset-deletions/:id/reject` | Tolak pengajuan hapus aset | Supervisor Only |

---

### 4. Peminjaman Barang (`/borrowings`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/borrowings` | Daftar peminjaman (Admin/Supervisor: semua, Staff: milik sendiri) | Admin, Supervisor, Staff |
| `POST` | `/borrowings` | Pengajuan peminjaman aset baru | Admin, Supervisor, Staff |
| `PUT` | `/borrowings/:id/status` | Approval status (`Approved`/`Rejected`) & Pengembalian (`Menunggu_Kembali`/`Selesai`) | Admin, Supervisor, Staff (Return) |
| `DELETE` | `/borrowings/:id` | Hapus data pengajuan peminjaman (hanya status `Rejected`) | Admin, Supervisor, Staff |

---

### 5. Pemeliharaan / Maintenance (`/maintenance`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/maintenance` | Daftar tiket maintenance (Admin: semua, Teknisi: tugas sendiri) | Admin, Teknisi |
| `POST` | `/maintenance` | Buat jadwal perbaikan/maintenance baru | Admin, Teknisi |
| `PUT` | `/maintenance/:id/status` | Update status pengerjaan (`Dijadwalkan` -> `Sedang Berjalan` -> `Selesai`) & kondisi aset | Teknisi Only |
| `PUT` | `/maintenance/:id/details` | Edit detail jadwal, tipe servis & estimasi biaya | Administrator Only |
| `POST` | `/maintenance/payment/confirm` | Bulk payment confirmation, update status `Lunas` & generate PDF Invoice | Administrator Only |

---

### 6. Manajemen Pengguna (`/users`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/users` | Daftar seluruh pengguna terdaftar | Administrator Only |
| `GET` | `/users/:id` | Detail pengguna | Administrator Only |
| `PUT` | `/users/profile` | Update profil diri (Nama, Telepon) | Semua Role |
| `PUT` | `/users/change-password` | Ganti kata sandi akun | Semua Role |
| `PUT` | `/users/:id/role` | Ubah role pengguna (Admin, Supervisor, Staff, Teknisi) | Administrator Only |
| `DELETE` | `/users/:id` | Nonaktifkan / hapus akun pengguna | Administrator Only |

---

### 7. Audit Trail (`/audit-logs`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/audit-logs` | Lihat log riwayat perubahan sistem yang bersifat immutable | Administrator Only |

---

### 8. Notifikasi (`/notifications`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/notifications` | Lihat daftar notifikasi pengguna terautentikasi | Semua Role |
| `PUT` | `/notifications/:id/read` | Tandai notifikasi tertentu sebagai sudah dibaca | Semua Role |
| `PUT` | `/notifications/read-all` | Tandai seluruh notifikasi sebagai sudah dibaca | Semua Role |

---

### 9. Dashboard Analytics (`/dashboard`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Ringkasan statistik (Total aset, dipinjam, maintenance, user) & chart data | Semua Role |

---

### 10. System Health (`/health`)

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `GET` | `/health` | Pengecekan status server API & koneksi database | Public |

---

## Kode Status HTTP Standar

| Kode HTTP | Makna Status |
|---|---|
| `200 OK` | Permintaan berhasil diproses. |
| `201 Created` | Sumber daya baru berhasil dibuat. |
| `400 Bad Request` | Data masukan tidak valid atau melanggar aturan logika bisnis. |
| `401 Unauthorized` | Autentikasi gagal atau JWT token expired/tidak dikirim. |
| `403 Forbidden` | Peran pengguna tidak memiliki hak akses untuk endpoint ini. |
| `404 Not Found` | Data atau entitas yang diminta tidak ditemukan. |
| `500 Server Error` | Kesalahan internal pada server backend. |
