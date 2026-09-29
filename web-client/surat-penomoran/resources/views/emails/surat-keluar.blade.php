<x-mail::message>
# Surat Keluar

Nomor Surat: **{{ $surat->nomor_surat }}**
Tanggal: **{{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d M Y') }}**
Tujuan: **{{ $surat->tujuan }}**
Perihal: **{{ $surat->perihal }}**

File surat terlampir di email ini.

Terima kasih,<br>
Sistem Arsip Surat — PT Microdata Indonesia
</x-mail::message>
