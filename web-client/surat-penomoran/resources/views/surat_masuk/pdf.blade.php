<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Lembar Agenda Surat Masuk</title>
<style>
@page { size: A4; margin: 20mm 20mm; }
body { font-family: "Times New Roman", serif; font-size: 11pt; color: #000; line-height: 1.5; }
.kop img { width: 100%; display: block; }
.header-title { text-align: center; margin: 15px 0 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
.header-title h2 { margin: 0; text-transform: uppercase; font-size: 16pt; font-weight: bold; }
.header-title p { margin: 3px 0 0; font-size: 11pt; color: #333; }
.badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; border: 1px solid #000; }
table.grid { width: 100%; border-collapse: collapse; margin-top: 15px; }
table.grid th, table.grid td { border: 1px solid #000; padding: 8px 10px; vertical-align: top; }
table.grid th { background-color: #f2f2f2; text-align: left; font-size: 10pt; text-transform: uppercase; }
.content-box { border: 1px solid #000; padding: 12px; margin-top: 15px; background: #fafafa; min-height: 80px; }
.signature { margin-top: 40px; width: 100%; }
.signature td { width: 50%; text-align: center; vertical-align: top; }
.sig-space { height: 70px; }
.footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-size: 9pt; color: #555; }
</style>
</head>
<body>

<div class="kop">
    <img src="{{ public_path('image/kop-surat.png') }}" alt="Kop Surat">
</div>

<div class="header-title">
    <h2>LEMBAR AGENDA SURAT MASUK</h2>
    <p>PT MICRODATA INDONESIA</p>
</div>

<table class="grid">
    <tr>
        <th width="30%">Nomor Agenda</th>
        <td width="70%"><strong>{{ $surat->nomor_agenda }}</strong></td>
    </tr>
    <tr>
        <th>Nomor Surat</th>
        <td>{{ $surat->nomor_surat }}</td>
    </tr>
    <tr>
        <th>Tanggal Surat</th>
        <td>{{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y') }}</td>
    </tr>
    <tr>
        <th>Tanggal Diterima</th>
        <td>{{ \Carbon\Carbon::parse($surat->tanggal_terima)->translatedFormat('d F Y') }}</td>
    </tr>
    <tr>
        <th>Asal Surat / Instansi</th>
        <td><strong>{{ $surat->asal_surat }}</strong></td>
    </tr>
    <tr>
        <th>Jenis Surat</th>
        <td>{{ $surat->jenis_surat }}</td>
    </tr>
    <tr>
        <th>Perihal</th>
        <td><strong>{{ $surat->perihal }}</strong></td>
    </tr>
    <tr>
        <th>Lampiran</th>
        <td>{{ $surat->lampiran ?: '-' }}</td>
    </tr>
    <tr>
        <th>Status Dokumen</th>
        <td>{{ $surat->status }}</td>
    </tr>
</table>

<div style="margin-top: 15px;">
    <strong>Ringkasan Isi Surat:</strong>
    <div class="content-box">
        {!! nl2br(e($surat->isi_ringkas ?: 'Tidak ada ringkasan isi.')) !!}
    </div>
</div>

@if($surat->keterangan)
<div style="margin-top: 15px;">
    <strong>Keterangan / Catatan Disposisi:</strong>
    <div class="content-box" style="min-height: 50px;">
        {!! nl2br(e($surat->keterangan)) !!}
    </div>
</div>
@endif

<table class="signature">
    <tr>
        <td>
            <p>Diterima & Dicatat Oleh,</p>
            <div class="sig-space"></div>
            <p><strong>( Petugas Agenda )</strong></p>
        </td>
        <td>
            <p>Bandar Lampung, {{ \Carbon\Carbon::parse($surat->tanggal_terima)->translatedFormat('d F Y') }}</p>
            <p>Disetujui / Mengetahui,</p>
            <div class="sig-space"></div>
            <p><strong>( Pimpinan / Kepala Divisi )</strong></p>
        </td>
    </tr>
</table>

<div class="footer">
    Dokumen dicetak melalui <strong>Sistem Arsip Surat PT Microdata Indonesia</strong> pada {{ now()->translatedFormat('d F Y H:i') }}
</div>

</body>
</html>
