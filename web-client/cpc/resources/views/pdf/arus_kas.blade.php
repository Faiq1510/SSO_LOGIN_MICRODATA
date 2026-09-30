@extends('pdf.layout')

@section('content')
    <h2 style="text-align:center; margin-bottom:6px;">Laporan Arus Kas</h2>

    <table class="report-table avoid-break">
        <thead>
            <tr><th>Uraian</th><th class="text-right">Masuk</th><th class="text-right">Keluar</th></tr>
        </thead>
        <tbody>
            @foreach($items ?? [] as $it)
                <tr>
                    <td>{{ $it['uraian'] ?? '' }}</td>
                    <td class="text-right">{{ number_format($it['masuk'] ?? 0,0,',','.') }}</td>
                    <td class="text-right">{{ number_format($it['keluar'] ?? 0,0,',','.') }}</td>
                </tr>
            @endforeach
            <tr>
                <th>Total</th>
                <th class="text-right">{{ number_format($summary['totalMasuk'] ?? 0,0,',','.') }}</th>
                <th class="text-right">{{ number_format($summary['totalKeluar'] ?? 0,0,',','.') }}</th>
            </tr>
        </tbody>
    </table>

    <div style="margin-top:16px;">
        <strong>Arus Kas Bersih: </strong> {{ number_format($summary['arusBersih'] ?? 0, 0, ',', '.') }}
    </div>
@endsection

