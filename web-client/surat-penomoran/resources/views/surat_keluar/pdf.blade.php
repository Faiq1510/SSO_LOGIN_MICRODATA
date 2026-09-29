<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>{{ $surat->jenis_surat }} - {{ $surat->nomor_surat }}</title>
<style>
@page {
    size: A4;
    margin: 20mm 20mm;
}

body {
    font-family: "Times New Roman", serif;
    font-size: 12pt;
    color: #000;
    line-height: 1.5;
    margin: 0;
}

.kop img {
    width: 100%;
    height: auto;
    display: block;
}

.judul {
    text-align: center;
    margin: 15px 0;
}

.judul h2 {
    margin: 0;
    font-size: 16pt;
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
}

.judul p {
    margin: 4px 0 0 0;
    font-size: 12pt;
}

.tanggal {
    text-align: right;
    margin: 15px 0;
}

table {
    width: 100%;
    border-collapse: collapse;
}

.info td {
    padding: 3px 0;
    vertical-align: top;
}

.isi {
    margin-top: 15px;
    text-align: justify;
    line-height: 1.6;
    white-space: pre-line;
}

.ttd-table {
    width: 100%;
    margin-top: 35px;
    text-align: center;
}

.ttd-space {
    height: 70px;
}

.footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    margin: 0 20mm;

    border-top: 1px solid #ccc;
    padding-top: 8px;

    font-size: 9pt;
    text-align: center;
    color: #666;
}

/* Custom Table in Surat Umum */
.data-table{width:100%;border-collapse:collapse;margin:15px 0;}
.data-table th, .data-table td{border:1px solid #000;padding:6px 10px;text-align:left;font-size:11pt;}
.data-table th{background-color:#f2f2f2;font-weight:bold;text-align:center;}
</style>
</head>
<body>

<div class="kop">
    <img src="{{ public_path('image/kop-surat.png') }}" alt="Kop Surat">
</div>

@php
    $dk = $surat->data_khusus ?? [];
    $isKuasa = (isset($surat->jenisSurat) && $surat->jenisSurat->form_type === 'kuasa')
        || Str::contains(strtolower($surat->jenis_surat), 'kuasa')
        || !empty($dk['pemberi']);
@endphp

@if($isKuasa)
    @php
        $pemberi = $dk['pemberi'] ?? [];
        $penerima = $dk['penerima'] ?? [];
        $pembukaMaksud = $dk['pembuka_maksud'] ?? ($dk['maksud'] ?? 'mewakili Direktur untuk melaksanakan Pembuktian Kualifikasi');
        $kegiatanItems = is_array($dk['kegiatan_items'] ?? null)
            ? array_values(array_filter($dk['kegiatan_items']))
            : (is_array($dk['kegiatan'] ?? null) ? $dk['kegiatan'] : []);
        $lokasiInstansi = $dk['lokasi_instansi'] ?? '';
        $penutupText = $dk['penutup'] ?? 'Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.';
        $kotaTanggal = $dk['kota_tanggal'] ?? '';
    @endphp

    <div class="judul">
        <h2>SURAT KUASA</h2>
        <p>No : {{ $surat->nomor_surat }}</p>
    </div>

    <p style="margin-top:20px; margin-bottom:8px;">Yang bertanda tangan di bawah ini :</p>
    <table class="info" style="margin-left:15px; margin-bottom:15px;">
        <tr><td width="110">Nama</td><td width="15">:</td><td><strong>{{ $pemberi['nama'] ?? '-' }}</strong></td></tr>
        <tr><td>Jabatan</td><td>:</td><td>{{ $pemberi['jabatan'] ?? '-' }}</td></tr>
        <tr><td>Alamat</td><td>:</td><td>{{ $pemberi['alamat'] ?? '-' }}</td></tr>
    </table>

    <p style="margin-top:15px; margin-bottom:8px;">Dengan ini memberikan kuasa kepada :</p>
    <table class="info" style="margin-left:15px; margin-bottom:15px;">
        <tr><td width="110">Nama</td><td width="15">:</td><td><strong>{{ $penerima['nama'] ?? '-' }}</strong></td></tr>
        <tr><td>Jabatan</td><td>:</td><td>{{ $penerima['jabatan'] ?? '-' }}</td></tr>
        @if(!empty($penerima['alamat']))
            <tr><td>Alamat</td><td>:</td><td>{{ $penerima['alamat'] }}</td></tr>
        @endif
    </table>

    <div style="margin-top:15px; text-align:justify; line-height:1.6;">
        <p style="margin-bottom:6px;">
            Dengan ini {{ $pembukaMaksud }} dengan Kegiatan sebagai berikut :
        </p>

        @if(count($kegiatanItems) > 0)
            <ol style="margin-top:4px; margin-bottom:10px; padding-left:30px;">
                @foreach($kegiatanItems as $item)
                    <li style="margin-bottom:4px; font-weight:bold;">{{ $item }}</li>
                @endforeach
            </ol>
        @else
            <p style="margin-left:20px; font-style:italic; color:#666;">(Belum ada poin kegiatan yang dimasukkan)</p>
        @endif

        @if(!empty($lokasiInstansi))
            <p style="margin-top:8px;">pada {{ $lokasiInstansi }}.</p>
        @endif
    </div>

    <p style="margin-top:20px; text-align:justify;">
        {{ $penutupText }}
    </p>

    <table class="ttd-table" style="margin-top:35px;">
        <tr>
            <td width="50%" style="vertical-align:top; text-align:center; padding-bottom:8px;"></td>
            <td width="50%" style="vertical-align:top; text-align:center; padding-bottom:8px;">
                {{ $kotaTanggal ?: ('Bandar Lampung, ' . \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y')) }}
            </td>
        </tr>
        <tr>
            <td width="50%" style="vertical-align:top; text-align:center; padding-bottom:60px;">Penerima Kuasa,</td>
            <td width="50%" style="vertical-align:top; text-align:center; padding-bottom:60px;">Pemberi Kuasa,</td>
        </tr>
        <tr>
            <td width="50%" style="vertical-align:top; text-align:center;">
                <p style="margin:0; font-weight:bold;"><u>{{ $penerima['nama'] ?? '-' }}</u></p>
                <p style="margin:0; font-size:11pt;">{{ $penerima['jabatan'] ?? 'Staff' }}</p>
            </td>
            <td width="50%" style="vertical-align:top; text-align:center;">
                <p style="margin:0; font-weight:bold;"><u>{{ $pemberi['nama'] ?? ($surat->penandatangan ?: '-') }}</u></p>
                <p style="margin:0; font-size:11pt;">{{ $pemberi['jabatan'] ?? ($surat->jabatan_penandatangan ?: 'Direktur Utama') }}</p>
            </td>
        </tr>
    </table>
@else
    {{-- SURAT UMUM STANDARD FORMAT --}}
    <div class="judul">
        <h2>{{ strtoupper($surat->jenis_surat ?: 'SURAT KELUAR') }}</h2>
    </div>

    <div class="tanggal">
        Bandar Lampung, {{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y') }}
    </div>

    <table class="info" style="margin-bottom:20px;">
        <tr><td width="120">Nomor</td><td width="15">:</td><td>{{ $surat->nomor_surat }}</td></tr>
        <tr><td>Lampiran</td><td>:</td><td>{{ $surat->lampiran ?: '-' }}</td></tr>
        <tr><td>Hal / Perihal</td><td>:</td><td><strong>{{ $surat->perihal }}</strong></td></tr>
    </table>

    <div style="margin-bottom:20px; line-height:1.5;">
        <p style="margin:0;">Kepada Yth.</p>
        <p style="margin:2px 0; font-weight:bold;">{{ $surat->tujuan }}</p>
        <p style="margin:0;">Di Tempat</p>
    </div>

    <p style="margin-bottom:12px;">Dengan hormat,</p>

    <div class="isi">
        {{ $surat->isi_surat }}
    </div>

    {{-- Render Flexible Data Table if Enabled --}}
    @if(!empty($dk['has_table']) && !empty($dk['table_headers']) && !empty($dk['table_rows']))
        @if(!empty($dk['table_title']))
            <p style="margin-top:15px; margin-bottom:5px; font-weight:bold;">{{ $dk['table_title'] }}</p>
        @endif

        <table class="data-table">
            <thead>
                <tr>
                    @foreach($dk['table_headers'] as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($dk['table_rows'] as $row)
                    <tr>
                        @foreach($row as $cell)
                            <td>{{ $cell }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(!empty($dk['isi_setelah_tabel']))
        <div class="isi" style="margin-top:10px;">
            {{ $dk['isi_setelah_tabel'] }}
        </div>
    @endif

    <p style="margin-top:20px; text-align:justify;">
        Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.
    </p>

    <div style="width:45%; margin-left:auto; margin-top:40px; text-align:center;">
        <p style="margin:0;">Hormat kami,</p>
        <p style="margin:3px 0 0 0; font-weight:bold;">PT Microdata Indonesia</p>

        <div class="ttd-space"></div>

        <p style="margin:0; font-weight:bold; text-decoration:underline;">{{ strtoupper($surat->penandatangan) }}</p>
        <p style="margin:2px 0 0 0; font-size:11pt;">{{ $surat->jabatan_penandatangan }}</p>
    </div>
@endif

<div class="footer">
    Dokumen ini dibuat melalui <strong>Sistem Arsip Surat PT Microdata Indonesia</strong>
</div>

</body>
</html>
