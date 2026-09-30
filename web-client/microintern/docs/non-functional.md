# Kebutuhan Non-Fungsional

## Browser yang Didukung

Chrome, Firefox, Edge, Safari (versi terbaru).

## Responsivitas

Desktop, Tablet, dan Mobile.

## Keamanan

- Autentikasi menggunakan JWT
- Proteksi route berdasarkan peran (Peserta / Admin HRD)
- Rate limiting API: Maksimal 1.000 request per 15 menit per IP

## Upload File

| Jenis File      | Format              | Batas Ukuran |
| --------------- | ------------------- | ------------ |
| CV              | PDF                 | 5 MB         |
| Surat Pengantar | PDF, JPG, JPEG, PNG | 10 MB        |
| Bukti Izin      | PDF, JPG, JPEG, PNG | 5 MB         |

## Notifikasi

Email notifikasi dikirim otomatis ke email masing-masing peserta (apabila email_notification diaktifkan secara global di pengaturan) saat:

- Status pendaftaran berubah (diterima / ditolak), dengan melampirkan file PDF Surat Balasan resmi.
- Nilai akhir peserta dimasukkan atau diperbarui oleh admin, dengan melampirkan file PDF Sertifikat PKL yang digenerate otomatis oleh sistem.

## Sertifikat

Sertifikat PKL digenerate otomatis dalam format PDF berdasarkan template, setelah admin memberikan penilaian. Transkrip nilai sertifikat menggunakan pagination dinamis: maksimal 7 baris kriteria per halaman transkrip jika tanpa catatan pembimbing, dan maksimal 5 baris kriteria jika pada halaman tersebut terdapat catatan pembimbing (catatan dan baris selebihnya dipindahkan ke halaman transkrip berikutnya jika melebihi 5 baris).

## Template Penilaian Dinamis

Sistem mendukung kriteria penilaian dinamis berdasarkan institusi peserta:

- Template penilaian terhubung dengan nama institusi untuk memastikan kriteria penilaian yang sesuai
- Jika institusi peserta memiliki template penilaian khusus, kriteria tersebut akan dimuat secara otomatis
- Jika tidak ada template khusus, sistem menggunakan template standar default
- Admin dapat memodifikasi kriteria penilaian langsung dari halaman Form Penilaian
- Perubahan kriteria otomatis disinkronisasi ke semua peserta dari institusi yang sama

## Keandalan & Kinerja Database

- Database menggunakan Connection Pooling (`pg.Pool`) untuk mendukung request konkuren secara efisien dan aman.
- Seluruh operasi mutasi data multi-step dibungkus transaksi atomik (`withTransaction`) dengan pelepasan koneksi otomatis, mencegah kepoposan koneksi dan inkonsistensi data.
