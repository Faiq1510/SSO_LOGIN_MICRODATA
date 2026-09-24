<x-mail::message>
# Laporan Surat
 
Berikut laporan aktivitas persuratan PT Microdata Indonesia untuk periode
**{{ $dari->translatedFormat('d M Y') }} s/d {{ $sampai->translatedFormat('d M Y') }}**.
 
- Total Surat: **{{ $ringkasan['totalSurat'] }}**
- Surat Masuk: **{{ $ringkasan['suratMasuk'] }}**
- Surat Keluar: **{{ $ringkasan['suratKeluar'] }}**
- Arsip: **{{ $ringkasan['arsip'] }}**
- Disposisi: **{{ $ringkasan['disposisi'] }}**
 
File laporan terlampir di email ini sesuai format yang dipilih.
 
Terima kasih,<br>
Sistem Arsip Surat — PT Microdata Indonesia
</x-mail::message>