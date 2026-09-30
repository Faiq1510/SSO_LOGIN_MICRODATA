<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 4px; }
        .header h1 { font-size: 15px; margin: 0; text-transform: uppercase; }
        .header p { font-size: 11px; margin: 2px 0 0; color: #555; }
        .garis { border-top: 2px solid #1a1a1a; margin: 8px 0 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #999; padding: 5px 6px; }
        th { background: #eee; text-transform: uppercase; font-size: 9px; }
        td { font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .saldo-awal td { background: #f6f6f6; font-style: italic; }
        tfoot td { font-weight: bold; background: #f0f0f0; }
        .ttd { width: 100%; margin-top: 40px; }
        .ttd td { border: none; text-align: center; padding-top: 50px; font-size: 10px; }
        .ttd .nama { border-top: 1px solid #333; padding-top: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Kas Flow</h1>
        <p>Periode: {{ $periode }}</p>
    </div>
    <div class="garis"></div>

    <table>
        <thead>
            <tr>
                <th>No SPJ/BPT</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Akun / Termin</th>
                <th>Unit</th>
                <th>Penerima</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Kredit</th>
                <th>Metode</th>
                <th class="text-right">Saldo</th>
            </tr>
        </thead>
        <tbody>
            <tr class="saldo-awal">
                <td colspan="9">Saldo Awal Periode</td>
                <td class="text-right">Rp {{ number_format($saldoAwal, 0, ',', '.') }}</td>
            </tr>
            @forelse ($dokumen as $item)
                <tr>
                    <td>{{ $item['no_dokumen'] }}</td>
                    <td>{{ \Carbon\Carbon::parse($item['tanggal'])->translatedFormat('d M Y') }}</td>
                    <td>{{ $item['jenis'] }}</td>
                    <td>{{ $item['akun'] }}</td>
                    <td>{{ $item['unit'] ?? '-' }}</td>
                    <td>{{ $item['penerima'] ?? '-' }}</td>
                    <td class="text-right">{{ $item['debit'] > 0 ? number_format($item['debit'], 0, ',', '.') : '-' }}</td>
                    <td class="text-right">{{ $item['kredit'] > 0 ? number_format($item['kredit'], 0, ',', '.') : '-' }}</td>
                    <td>{{ $item['metode'] }}</td>
                    <td class="text-right">Rp {{ number_format($item['saldo'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" class="text-center">Tidak ada transaksi pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="6" class="text-right">Total Periode Ini</td>
                <td class="text-right">Rp {{ number_format($summary['total_nilai_penerimaan'], 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($summary['total_nilai_pengeluaran'], 0, ',', '.') }}</td>
                <td></td>
                <td class="text-right">Rp {{ number_format($summary['saldo_akhir'], 0, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>

    <table class="ttd">
        <tr>
            <td>
                <span class="nama">Admin Keuangan</span>
            </td>
            <td>
                <span class="nama">Mengetahui</span>
            </td>
        </tr>
    </table>

    <p style="margin-top: 20px; font-size: 9px; color: #777;">
        Dicetak otomatis oleh sistem pada {{ now()->translatedFormat('d M Y, H:i') }}.
    </p>
</body>
</html>
