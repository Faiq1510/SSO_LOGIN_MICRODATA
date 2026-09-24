<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Surat - {{ $surat->nomor_surat }}</title>

    {{-- Tailwind --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Font Awesome --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

    <style>
        @page {
            size: A4;
            margin: 20mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0f172a;
            font-family: "Times New Roman", serif;
            color: #000;
        }

        .toolbar {
            width: 210mm;
            margin: 20px auto 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

       .paper {
    width: 210mm;
    min-height: 297mm;
    background: white;
    margin: 0 auto 50px auto;
    padding: 20mm 20mm 5mm 20mm;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    line-height: 1.5;
    font-size: 12pt;
    display: flex;
    flex-direction: column;
}

        table {
            width: 100%;
            border-collapse: collapse;
        }

        td {
            vertical-align: top;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 6px 10px;
            text-align: left;
            font-size: 11pt;
        }

        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }

        @media print {
    body {
        background: white;
    }

    .toolbar {
        display: none;
    }

    .paper {
        width: 100%;
        height: 257mm;
        min-height: 257mm;

        margin: 0;
        padding: 0;

        box-sizing: border-box;

        box-shadow: none;

        display: flex;
        flex-direction: column;
    }

    .paper > div:last-child {
        margin-top: auto !important;
    }
}
    </style>
</head>

<body>

    {{-- TOOLBAR --}}
    <div class="toolbar">
        <a href="{{ route('surat_keluar.index') }}" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition flex items-center gap-2 border border-slate-700">
            <i class="fa-solid fa-arrow-left"></i> Kembali
        </a>

        <div class="flex items-center gap-3">
            <button onclick="window.print()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                <i class="fa-solid fa-print"></i> Cetak Surat
            </button>

            <a href="{{ route('surat_keluar.download', $surat->id) }}" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-rose-600/30">
                <i class="fa-solid fa-file-pdf"></i> Download PDF
            </a>
        </div>
    </div>

    {{-- KERTAS A4 PREVIEW --}}
   <div class="paper" style="display:flex; flex-direction:column;">
        {{-- Kop Surat --}}
        <div style="margin-bottom: 20px;">
            <img src="{{ asset('image/kop-surat.png') }}" alt="Kop Surat" style="width:100%; height:auto; display:block;"
                 onerror="this.style.display='none'; document.getElementById('kop-fallback').style.display='block';">
            <div id="kop-fallback" style="display:none;" class="text-center font-bold text-lg border-b-2 border-black pb-2">
                PT MICRODATA INDONESIA<br>
                <span class="text-xs font-normal">Jl. Utama No. 123, Bandar Lampung | Telp: (0721) 123456</span>
            </div>
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

            {{-- SURAT KUASA HEADER --}}
            <div style="text-align:center; margin: 15px 0 20px 0;">
                <h2 style="font-size:16pt; font-weight:bold;text-transform:uppercase; margin:0;">
                    SURAT KUASA
                </h2>
                <p style="margin:4px 0 0 0; font-size:12pt;">No : {{ $surat->nomor_surat }}</p>
            </div>

            <p style="margin-top:20px; margin-bottom:8px;">Yang bertanda tangan di bawah ini :</p>
            <table style="margin-left:15px; margin-bottom:15px;">
                <tr><td style="width:110px; padding:3px 0;">Nama</td><td style="width:15px; padding:3px 0;">:</td><td style="padding:3px 0;"><strong>{{ $pemberi['nama'] ?? '-' }}</strong></td></tr>
                <tr><td style="padding:3px 0;">Jabatan</td><td style="padding:3px 0;">:</td><td style="padding:3px 0;">{{ $pemberi['jabatan'] ?? '-' }}</td></tr>
                <tr><td style="padding:3px 0;">Alamat</td><td style="padding:3px 0;">:</td><td style="padding:3px 0;">{{ $pemberi['alamat'] ?? '-' }}</td></tr>
            </table>

            <p style="margin-top:15px; margin-bottom:8px;">Dengan ini memberikan kuasa kepada :</p>
            <table style="margin-left:15px; margin-bottom:15px;">
                <tr><td style="width:110px; padding:3px 0;">Nama</td><td style="width:15px; padding:3px 0;">:</td><td style="padding:3px 0;"><strong>{{ $penerima['nama'] ?? '-' }}</strong></td></tr>
                <tr><td style="padding:3px 0;">Jabatan</td><td style="padding:3px 0;">:</td><td style="padding:3px 0;">{{ $penerima['jabatan'] ?? '-' }}</td></tr>
                @if(!empty($penerima['alamat']))
                    <tr><td style="padding:3px 0;">Alamat</td><td style="padding:3px 0;">:</td><td style="padding:3px 0;">{{ $penerima['alamat'] }}</td></tr>
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

            {{-- DUAL SIGNATORY --}}
            <table style="width:100%; margin-top:35px; text-align:center;">
                <tr>
                    <td style="width:50%; vertical-align:top; padding-bottom:8px;"></td>
                    <td style="width:50%; vertical-align:top; padding-bottom:8px;">
                        {{ $kotaTanggal ?: ('Bandar Lampung, ' . \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y')) }}
                    </td>
                </tr>
                <tr>
                    <td style="width:50%; vertical-align:top; padding-bottom:60px;">Penerima Kuasa,</td>
                    <td style="width:50%; vertical-align:top; padding-bottom:60px;">Pemberi Kuasa,</td>
                </tr>
                <tr>
                    <td style="width:50%; vertical-align:top;">
                        <p style="margin:0; font-weight:bold;"><u>{{ $penerima['nama'] ?? '-' }}</u></p>
                        <p style="margin:0; font-size:11pt;">{{ $penerima['jabatan'] ?? 'Staff' }}</p>
                    </td>
                    <td style="width:50%; vertical-align:top;">
                        <p style="margin:0; font-weight:bold;"><u>{{ $pemberi['nama'] ?? ($surat->penandatangan ?: '-') }}</u></p>
                        <p style="margin:0; font-size:11pt;">{{ $pemberi['jabatan'] ?? ($surat->jabatan_penandatangan ?: 'Direktur Utama') }}</p>
                    </td>
                </tr>
            </table>
        @else
            {{-- SURAT UMUM HEADER --}}
            <div style="text-align:center; margin-bottom:20px;">
                <h2 style="font-size:16pt; font-weight:bold; text-transform:uppercase;margin:0;">
                    {{ strtoupper($surat->jenis_surat ?: 'SURAT KELUAR') }}
                </h2>
            </div>

            <div style="text-align:right; margin-bottom:20px;">
                Bandar Lampung, {{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y') }}
            </div>

            <table style="margin-bottom:20px;">
                <tr><td style="width:120px; padding:2px 0;">Nomor</td><td style="width:15px; padding:2px 0;">:</td><td style="padding:2px 0;">{{ $surat->nomor_surat }}</td></tr>
                <tr><td style="padding:2px 0;">Lampiran</td><td style="padding:2px 0;">:</td><td style="padding:2px 0;">{{ $surat->lampiran ?: '-' }}</td></tr>
                <tr><td style="padding:2px 0;">Hal / Perihal</td><td style="padding:2px 0;">:</td><td style="padding:2px 0;"><strong>{{ $surat->perihal }}</strong></td></tr>
            </table>

            <div style="margin-bottom:20px; line-height:1.5;">
                <p style="margin:0;">Kepada Yth.</p>
                <p style="margin:2px 0; font-weight:bold;">{{ $surat->tujuan }}</p>
                <p style="margin:0;">Di Tempat</p>
            </div>

            <p style="margin-bottom:12px;">Dengan hormat,</p>

            <div style="text-align:justify; line-height:1.6; white-space:pre-line;">
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
                <div style="text-align:justify; line-height:1.6; white-space:pre-line; margin-top:10px;">
                    {{ $dk['isi_setelah_tabel'] }}
                </div>
            @endif

            <p style="margin-top:20px; text-align:justify;">
                Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.
            </p>

            <div style="width:45%; margin-left:auto; margin-top:40px; text-align:center;">
                <p style="margin:0;">Hormat kami,</p>
                <p style="margin:3px 0 0 0; font-weight:bold;">PT Microdata Indonesia</p>

                <div style="height:70px;"></div>

                <p style="margin:0; font-weight:bold; text-decoration:underline;">{{ strtoupper($surat->penandatangan) }}</p>
                <p style="margin:2px 0 0 0; font-size:11pt;">{{ $surat->jabatan_penandatangan }}</p>
            </div>
        @endif

       {{-- FOOTER --}}
<div style="margin-top:auto; border-top:1px solid #ccc; padding-top:8px; text-align:center; color:#666; font-size:9pt;">
    Dokumen ini dibuat melalui <strong>Sistem Arsip Surat PT Microdata Indonesia</strong>
</div>
    </div>

</body>

</html>
