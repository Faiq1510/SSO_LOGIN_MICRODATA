@extends('pdf.layout')

@section('content')
    <div class="text-center" style="margin-bottom: 24px;">
        <div class="company uppercase text-bold" style="font-size: 16px;">{{ config('app.name') }}</div>
        <div class="text-bold" style="font-size: 18px; margin-top: 4px;">Laporan Laba Rugi</div>
        <div class="text-bold" style="margin-top: 4px;">Periode {{ $periode ?? '' }}</div>
    </div>

    <table class="accounting-table avoid-break">
        <tbody>
            <!-- PENDAPATAN -->
            <tr class="row-category">
                <td colspan="2" class="col-name indent-0">PENDAPATAN</td>
            </tr>
            @forelse($pendapatan as $row)
                <tr class="row-account">
                    <td class="col-name indent-2">{{ $row['uraian'] ?? $row['akun'] ?? '-' }} {{ $row['keterangan'] ? '('.$row['keterangan'].')' : '' }}</td>
                    <td class="col-nominal">{{ number_format($row['nominal'] ?? 0, 2, ',', '.') }}</td>
                </tr>
            @empty
                <tr class="row-account">
                    <td class="col-name indent-2" style="color: #9ca3af; font-style: italic;">Tidak ada pendapatan</td>
                    <td class="col-nominal">{{ number_format(0, 2, ',', '.') }}</td>
                </tr>
            @endforelse
            <tr class="row-subtotal">
                <td class="col-name indent-1">Total Pendapatan</td>
                <td class="col-nominal">
                    <div class="border-single">{{ number_format($summary['totalPendapatan'] ?? 0, 2, ',', '.') }}</div>
                </td>
            </tr>

            <!-- BEBAN -->
            <tr class="row-category">
                <td colspan="2" class="col-name indent-0">BEBAN (PENGELUARAN)</td>
            </tr>
            @forelse($beban as $row)
                <tr class="row-account">
                    <td class="col-name indent-2">{{ $row['akun'] ?? '-' }} {{ $row['transaksi'] ? '('.$row['transaksi'].')' : '' }}</td>
                    <td class="col-nominal">{{ number_format($row['nominal'] ?? 0, 2, ',', '.') }}</td>
                </tr>
            @empty
                <tr class="row-account">
                    <td class="col-name indent-2" style="color: #9ca3af; font-style: italic;">Tidak ada beban</td>
                    <td class="col-nominal">{{ number_format(0, 2, ',', '.') }}</td>
                </tr>
            @endforelse
            <tr class="row-subtotal">
                <td class="col-name indent-1">Total Beban</td>
                <td class="col-nominal">
                    <div class="border-single">{{ number_format($summary['totalBeban'] ?? 0, 2, ',', '.') }}</div>
                </td>
            </tr>

            <!-- SPACER -->
            <tr><td colspan="2" style="height: 15px;"></td></tr>

            <!-- LABA/RUGI BERSIH (Atau Kotor Tergantung Kebutuhan) -->
            <tr class="row-final-total">
                <td class="col-name indent-0">LABA/RUGI KOTOR</td>
                <td class="col-nominal">
                    <div class="border-double">{{ number_format($summary['labaKotor'] ?? 0, 2, ',', '.') }}</div>
                </td>
            </tr>
        </tbody>
    </table>
@endsection
