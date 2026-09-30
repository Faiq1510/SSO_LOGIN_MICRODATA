@extends('pdf.layout')

@section('content')
    @php
        function format_rupiah_pdf($angka) {
            if ($angka < 0) {
                return '(' . number_format(abs($angka), 2, ',', '.') . ')';
            }
            return number_format($angka, 2, ',', '.');
        }
        
        $start = \Carbon\Carbon::parse($startDate)->translatedFormat('d F Y');
        $end = \Carbon\Carbon::parse($endDate)->translatedFormat('d F Y');
    @endphp

    <div class="text-center" style="margin-bottom: 24px;">
        <div class="company uppercase text-bold" style="font-size: 16px;">{{ config('app.name') }}</div>
        <div class="text-bold" style="font-size: 18px; margin-top: 4px;">Neraca</div>
        <div class="text-bold" style="margin-top: 4px;">Periode {{ $start }} s.d {{ $end }}</div>
    </div>

    <!-- 1 Column Table -->
    <table class="accounting-table">
        <tbody>
            <!-- ASET -->
            <tr class="row-category">
                <td colspan="2" class="col-name indent-0">ASET</td>
            </tr>
            <tr class="row-subcategory">
                <td colspan="2" class="col-name indent-1">ASET LANCAR</td>
            </tr>
            <tr class="row-account">
                <td class="col-name indent-2">Kas & Setara Kas</td>
                <td class="col-nominal">{{ format_rupiah_pdf($neraca['aset']['kas_setara_kas'] ?? 0) }}</td>
            </tr>
            <tr class="row-account">
                <td class="col-name indent-2">Persediaan Material</td>
                <td class="col-nominal">{{ format_rupiah_pdf($neraca['aset']['persediaan_material'] ?? 0) }}</td>
            </tr>
            <tr class="row-subtotal">
                <td class="col-name indent-1">Total Aset</td>
                <td class="col-nominal">
                    <div class="border-single">{{ format_rupiah_pdf($neraca['aset']['total'] ?? 0) }}</div>
                </td>
            </tr>

            <!-- SPACER -->
            <tr><td colspan="2" style="height: 15px;"></td></tr>

            <!-- LIABILITAS -->
            <tr class="row-category">
                <td colspan="2" class="col-name indent-0">LIABILITAS</td>
            </tr>
            <tr class="row-subcategory">
                <td colspan="2" class="col-name indent-1">LIABILITAS LANCAR</td>
            </tr>
            @forelse($neraca['liabilitas']['details'] ?? [] as $item)
                <tr class="row-account">
                    <td class="col-name indent-2">{{ $item['nama_akun'] }}</td>
                    <td class="col-nominal">{{ format_rupiah_pdf($item['saldo'] ?? 0) }}</td>
                </tr>
            @empty
                <tr class="row-account">
                    <td class="col-name indent-2">-</td>
                    <td class="col-nominal">0</td>
                </tr>
            @endforelse
            <tr class="row-subtotal">
                <td class="col-name indent-1">Total Liabilitas</td>
                <td class="col-nominal">
                    <div class="border-single">{{ format_rupiah_pdf($neraca['liabilitas']['total'] ?? 0) }}</div>
                </td>
            </tr>

            <!-- SPACER -->
            <tr><td colspan="2" style="height: 15px;"></td></tr>

            <!-- EKUITAS -->
            <tr class="row-category">
                <td colspan="2" class="col-name indent-0">EKUITAS</td>
            </tr>
            <tr class="row-account">
                <td class="col-name indent-2">Modal Disetor Owner</td>
                <td class="col-nominal">{{ format_rupiah_pdf($neraca['modal']['modal_disetor'] ?? 0) }}</td>
            </tr>
            <tr class="row-account">
                <td class="col-name indent-2">Laba / Rugi Berjalan</td>
                <td class="col-nominal">{{ format_rupiah_pdf($neraca['modal']['laba_rugi_berjalan'] ?? 0) }}</td>
            </tr>
            <tr class="row-subtotal">
                <td class="col-name indent-1">Total Ekuitas</td>
                <td class="col-nominal">
                    <div class="border-single">{{ format_rupiah_pdf($neraca['modal']['total'] ?? 0) }}</div>
                </td>
            </tr>

            <!-- SPACER -->
            <tr><td colspan="2" style="height: 15px;"></td></tr>

            <!-- GRAND TOTAL (TOTAL LIABILITAS DAN EKUITAS) -->
            <tr class="row-final-total">
                <td class="col-name indent-0">TOTAL LIABILITAS & EKUITAS</td>
                <td class="col-nominal">
                    <div class="border-double">{{ format_rupiah_pdf($neraca['total_liabilitas_modal'] ?? 0) }}</div>
                </td>
            </tr>
        </tbody>
    </table>
@endsection
