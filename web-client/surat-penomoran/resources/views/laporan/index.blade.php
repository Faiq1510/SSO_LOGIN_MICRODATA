@extends('layouts.app')

@section('title', 'Laporan')

@section('content')
<div class="space-y-6">

    {{-- ======================= BREADCRUMB ======================= --}}
    <nav class="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <a href="{{ route('laporan.index') }}" class="hover:text-slate-300 transition">Laporan</a>
        <span>/</span>
        <span class="text-slate-300 font-medium">Dashboard</span>
    </nav>

    {{-- ======================= HEADER + AKSI ======================= --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Laporan Persuratan</h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">Ringkasan dan laporan aktivitas persuratan digital.</p>
        </div>

        <div class="flex items-center gap-3">
            {{-- ============ DROPDOWN EKSPOR (Email / WhatsApp) ============ --}}
            <div class="relative w-full sm:w-auto" x-data="{ open: false }" @click.outside="open = false">
                <button type="button" @click="open = !open"
                    class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-500 focus:outline-none transition shadow-lg shadow-indigo-600/25">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span>Ekspor Laporan</span>
                    <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                <div x-show="open" x-cloak
                    class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1">

                    <p class="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Unduh</p>

                    <a href="{{ route('laporan.export.pdf', request()->query()) }}"
                        class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                        <svg class="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Unduh PDF
                    </a>
                    <a href="{{ route('laporan.export.excel', request()->query()) }}"
                        class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Unduh Excel
                    </a>

                    <div class="my-1 border-t border-slate-800"></div>

                    <p class="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Kirim</p>

                    <button type="button" @click="$dispatch('open-modal-email'); open = false"
                        class="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                        <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        Kirim ke Email
                    </button>
                    <button type="button" @click="$dispatch('open-modal-wa'); open = false"
                        class="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        Kirim ke WhatsApp
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- ======================= FILTER FORM ======================= --}}
    <form id="formFilterLaporan" method="GET" action="{{ route('laporan.index') }}" class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        
        <div class="flex items-center gap-2 flex-1 min-w-0">
            {{-- Tanggal Dari --}}
            <div class="relative flex-1 min-w-0">
                <input type="date" name="dari" value="{{ request('dari', request('start_date', now()->startOfMonth()->format('Y-m-d'))) }}"
                    class="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer">
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 2v2M18 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                </div>
            </div>

            <span class="text-xs sm:text-sm text-slate-500 font-medium shrink-0">s/d</span>

            {{-- Tanggal Sampai --}}
            <div class="relative flex-1 min-w-0">
                <input type="date" name="sampai" value="{{ request('sampai', request('end_date', now()->endOfMonth()->format('Y-m-d'))) }}"
                    class="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer">
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 2v2M18 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                </div>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {{-- Select Jenis (Auto submit saat opsi dipilih) --}}
            <select name="jenis" onchange="document.getElementById('formFilterLaporan').submit()" class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer w-full sm:w-auto">
                <option value="">Semua Jenis</option>
                <option value="Surat Masuk" @selected(in_array(strtolower((string)request('jenis')), ['surat masuk', 'masuk']))>Surat Masuk</option>
                <option value="Surat Keluar" @selected(in_array(strtolower((string)request('jenis')), ['surat keluar', 'keluar']))>Surat Keluar</option>
            </select>

            {{-- Select Status (Auto submit saat opsi dipilih) --}}
            <select name="status" onchange="document.getElementById('formFilterLaporan').submit()" class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer w-full sm:w-auto">
                <option value="">Semua Status</option>
                <option value="Selesai" @selected(in_array(strtolower((string)request('status')), ['selesai']))>Selesai</option>
                <option value="Dikirim" @selected(in_array(strtolower((string)request('status')), ['dikirim', 'proses']))>Dalam Proses (Dikirim)</option>
                <option value="Draft" @selected(in_array(strtolower((string)request('status')), ['draft', 'menunggu']))>Menunggu (Draft)</option>
            </select>

            {{-- Tombol Filter --}}
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-500 transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-filter text-xs"></i>
                <span>Filter</span>
            </button>
        </div>
    </form>

    {{-- ======================= STAT CARDS ======================= --}}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        @php
            $stats = [
                ['label' => 'Total Surat', 'value' => $totalSurat, 'color' => 'text-indigo-400'],
                ['label' => 'Surat Masuk', 'value' => $suratMasuk, 'color' => 'text-blue-400'],
                ['label' => 'Surat Keluar', 'value' => $suratKeluar, 'color' => 'text-emerald-400'],
                ['label' => 'Arsip', 'value' => $arsip, 'color' => 'text-purple-400'],
                ['label' => 'Disposisi', 'value' => $disposisi, 'color' => 'text-amber-400'],
            ];
        @endphp

        @foreach ($stats as $stat)
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p class="text-sm text-slate-400 mb-2">{{ $stat['label'] }}</p>
                <p class="text-2xl font-semibold text-white">{{ $stat['value'] }}</p>
            </div>
        @endforeach
    </div>

    {{-- ======================= CHARTS ======================= --}}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:col-span-1">
            <p class="text-sm font-medium text-slate-300 mb-3">Tren Surat</p>
            <canvas id="chartTren" height="180"></canvas>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p class="text-sm font-medium text-slate-300 mb-3">Surat Berdasarkan Jenis</p>
            <canvas id="chartJenis" height="180"></canvas>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p class="text-sm font-medium text-slate-300 mb-3">Surat Berdasarkan Status</p>
            <canvas id="chartStatus" height="180"></canvas>
        </div>
    </div>

    {{-- ======================= FOOTER INFO ======================= --}}
    <p class="text-xs text-slate-500 flex items-center gap-1 mb-4">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Data diperbarui pada {{ $updatedAt }}
    </p>

    {{-- ======================= MODAL: KIRIM KE EMAIL ======================= --}}
    <div x-data="{ show: false }"
        @open-modal-email.window="show = true"
        x-show="show" x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center p-4">

        <div class="absolute inset-0 bg-black/60" @click="show = false"></div>

        <div class="relative bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-6">
            <h3 class="text-base font-semibold text-white mb-1">Kirim Laporan ke Email</h3>
            <p class="text-sm text-slate-400 mb-4">
                Pilih file laporan yang sudah kamu unduh (PDF/Excel) untuk dilampirkan.
            </p>

            <form action="{{ route('laporan.send.email', request()->query()) }}" method="POST" enctype="multipart/form-data">
                @csrf

                <label class="block text-sm font-medium text-slate-300 mb-1">Alamat Email</label>
                <input type="email" name="email" required placeholder="nama@contoh.com"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4">

                <label class="block text-sm font-medium text-slate-300 mb-1">File Lampiran</label>
                <input type="file" name="lampiran[]" multiple required accept=".pdf,.xlsx,.xls"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1">
                <p class="text-xs text-slate-500 mb-4">
                    Bisa pilih lebih dari 1 file sekaligus (tahan Ctrl saat memilih di jendela file explorer).
                </p>

                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" @click="show = false"
                        class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition">
                        Batal
                    </button>
                    <button type="submit"
                        class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
                        Kirim
                    </button>
                </div>
            </form>
        </div>
    </div>

    {{-- ======================= MODAL: KIRIM KE WHATSAPP ======================= --}}
    <div x-data="{
            show: false,
            nomor: '',
            pdfLink: '{{ URL::temporarySignedRoute('laporan.export.pdf.public', now()->addHours(24), request()->query()) }}',
            kirim() {
                let no = this.nomor.replace(/\D/g, '');
                if (no.startsWith('0')) { no = '62' + no.slice(1); }
                if (!no.startsWith('62')) { no = '62' + no; }
                const teks = encodeURIComponent('Berikut laporan surat PT Microdata Indonesia:\n' + this.pdfLink);
                window.open('https://wa.me/' + no + '?text=' + teks, '_blank');
                this.show = false;
            }
        }"
        @open-modal-wa.window="show = true"
        x-show="show" x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center p-4">

        <div class="absolute inset-0 bg-black/60" @click="show = false"></div>

        <div class="relative bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-6">
            <h3 class="text-base font-semibold text-white mb-1">Kirim Laporan ke WhatsApp</h3>
            <p class="text-sm text-slate-400 mb-4">
                WhatsApp akan terbuka dengan pesan berisi link download laporan (berlaku 24 jam).
            </p>

            <label class="block text-sm font-medium text-slate-300 mb-1">Nomor WhatsApp</label>
            <input type="text" x-model="nomor" placeholder="08xxxxxxxxxx"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4">

            <div class="flex justify-end gap-2">
                <button type="button" @click="show = false"
                    class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition">
                    Batal
                </button>
                <button type="button" @click="kirim()"
                    class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition">
                    Buka WhatsApp
                </button>
            </div>
        </div>
    </div>

</div>
@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#1e293b';

        const chartAnimationOptions = {
            duration: 400,
            easing: 'easeOutQuart'
        };

        // Chart Tren Surat
        const ctxTren = document.getElementById('chartTren');
        if (ctxTren) {
            new Chart(ctxTren, {
                type: 'line',
                data: {
                    labels: @json($labelTrenChart),
                    datasets: [
                        {
                            label: 'Surat Masuk',
                            data: @json($dataTrenMasuk),
                            borderColor: '#60a5fa',
                            backgroundColor: '#60a5fa',
                            tension: 0.35,
                            pointRadius: 3,
                        },
                        {
                            label: 'Surat Keluar',
                            data: @json($dataTrenKeluar),
                            borderColor: '#34d399',
                            backgroundColor: '#34d399',
                            tension: 0.35,
                            pointRadius: 3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    animation: chartAnimationOptions,
                    plugins: { legend: { position: 'top', align: 'start', labels: { boxWidth: 8, usePointStyle: true } } },
                    scales: { y: { beginAtZero: true } },
                },
            });
        }

        // Chart Jenis Surat
        const ctxJenis = document.getElementById('chartJenis');
        if (ctxJenis) {
            new Chart(ctxJenis, {
                type: 'doughnut',
                data: {
                    labels: ['Surat Masuk', 'Surat Keluar', 'Disposisi'],
                    datasets: [{
                        data: [{{ $suratMasuk }}, {{ $suratKeluar }}, {{ $disposisi }}],
                        backgroundColor: ['#60a5fa', '#34d399', '#a78bfa'],
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    cutout: '65%',
                    animation: chartAnimationOptions,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 8, usePointStyle: true } } },
                },
            });
        }

        // Chart Status Surat
        const ctxStatus = document.getElementById('chartStatus');
        if (ctxStatus) {
            new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Selesai', 'Dalam Proses', 'Menunggu'],
                    datasets: [{
                        data: [{{ $selesai }}, {{ $dalamProses }}, {{ $menunggu }}],
                        backgroundColor: ['#34d399', '#fbbf24', '#f87171'],
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    cutout: '65%',
                    animation: chartAnimationOptions,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 8, usePointStyle: true } } },
                },
            });
        }
    });
</script>
@endpush