@extends('layouts.app')

@section('title', 'Dashboard Utama')

@section('content')
<div class="space-y-8" x-data="{ activeTab: 'surat_masuk' }">

    <!-- Header & Welcome Banner -->
    <div class="relative overflow-hidden flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/50 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <!-- Glow Effects -->
        <div class="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="space-y-3 relative z-10">
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span>Ringkasan Sistem</span>
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Database Terhubung</span>
                </span>
            </div>

            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Dashboard Manajemen Surat & Arsip
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Selamat datang kembali, <strong class="text-indigo-400 font-semibold">{{ Auth::user()->name ?? 'Pengguna' }}</strong>! Berikut adalah ringkasan real-time untuk lalu lintas <span class="text-indigo-300 font-medium">Surat Masuk</span>, <span class="text-purple-300 font-medium">Surat Keluar</span>, dan <span class="text-amber-300 font-medium">Arsip Digital</span>.
            </p>
        </div>

        <!-- Quick Action Buttons Bar -->
        <div class="flex items-center flex-wrap gap-2 sm:gap-2.5 relative z-10 w-full xl:w-auto">
            <a href="{{ route('surat_masuk.create') }}" class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Surat Masuk</span>
            </a>
            <a href="{{ route('surat_keluar.create') }}" class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
                <i class="fa-solid fa-paper-plane text-xs"></i>
                <span>Surat Keluar</span>
            </a>
            <a href="{{ route('arsip.index') }}" class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
                <i class="fa-solid fa-box-archive text-xs"></i>
                <span>Cari Arsip</span>
            </a>
        </div>
    </div>

    <!-- Interactive Cards Grid (Terkoneksi ke Surat Masuk, Keluar, Arsip & Pengguna) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <!-- Card 1: Surat Masuk -->
        <a href="{{ route('surat_masuk.index') }}" class="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 block overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Modul Surat Masuk</span>
                    <h3 class="text-3xl font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {{ number_format($totalSuratMasuk ?? 0) }}
                    </h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-md">
                    <i class="fa-solid fa-inbox text-xl"></i>
                </div>
            </div>

            <!-- Status Breakdown -->
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">{{ $statusSuratMasuk['Baru'] ?? 0 }} Baru</span>
                    <span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">{{ $statusSuratMasuk['Diproses'] ?? 0 }} Diproses</span>
                </div>
                <span class="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Buka <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
            </div>
        </a>

        <!-- Card 2: Surat Keluar -->
        <a href="{{ route('surat_keluar.index') }}" class="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 block overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
            
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <span class="text-xs font-bold text-purple-400 uppercase tracking-wider">Modul Surat Keluar</span>
                    <h3 class="text-3xl font-extrabold text-white mt-1 group-hover:text-purple-300 transition-colors">
                        {{ number_format($totalSuratKeluar ?? 0) }}
                    </h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-md">
                    <i class="fa-solid fa-paper-plane text-xl"></i>
                </div>
            </div>

            <!-- Status Breakdown -->
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">{{ $statusSuratKeluar['Draft'] ?? 0 }} Draft</span>
                    <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">{{ $statusSuratKeluar['Dikirim'] ?? 0 }} Terkirim</span>
                </div>
                <span class="text-purple-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Buka <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
            </div>
        </a>

        <!-- Card 3: Arsip Surat -->
        <a href="{{ route('arsip.index') }}" class="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-amber-500/10 block overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
            
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Modul Arsip Surat</span>
                    <h3 class="text-3xl font-extrabold text-white mt-1 group-hover:text-amber-300 transition-colors">
                        {{ number_format($totalArsip ?? 0) }}
                    </h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-md">
                    <i class="fa-solid fa-box-archive text-xl"></i>
                </div>
            </div>

            <!-- Breakdown Arsip -->
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold">{{ $statusArsip['Surat Masuk'] ?? 0 }} Masuk</span>
                    <span class="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-semibold">{{ $statusArsip['Surat Keluar'] ?? 0 }} Keluar</span>
                </div>
                <span class="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Buka <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
            </div>
        </a>

        <!-- Card 4: Pengguna -->
        <a href="{{ route('akun.index') }}" class="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-rose-500/50 transition-all duration-300 shadow-xl hover:shadow-rose-500/10 block overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
            
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">Pengguna Sistem</span>
                    <h3 class="text-3xl font-extrabold text-white mt-1 group-hover:text-rose-300 transition-colors">
                        {{ number_format($totalPengguna ?? 0) }}
                    </h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-md">
                    <i class="fa-solid fa-users text-xl"></i>
                </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <span class="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active Session
                </span>
                <span class="text-rose-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Kelola <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
            </div>
        </a>

    </div>

    <!-- Grafik & Aktivitas Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Chart Komparasi (8 cols) -->
        <div class="lg:col-span-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800/80">
                <div>
                    <h2 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <i class="fa-solid fa-chart-line text-indigo-400"></i>
                        <span>Grafik Tren Lalu Lintas Surat</span>
                    </h2>
                    <p class="text-xs text-slate-400 mt-0.5">Perbandingan Surat Masuk, Surat Keluar & Arsip (6 Bulan Terakhir)</p>
                </div>
                <div class="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
                    <span class="flex items-center gap-1.5 text-indigo-400 font-semibold">
                        <span class="w-2.5 h-2.5 rounded bg-indigo-500"></span> Masuk
                    </span>
                    <span class="flex items-center gap-1.5 text-purple-400 font-semibold">
                        <span class="w-2.5 h-2.5 rounded bg-purple-500"></span> Keluar
                    </span>
                    <span class="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <span class="w-2.5 h-2.5 rounded bg-amber-500"></span> Arsip
                    </span>
                </div>
            </div>
            <div class="relative w-full h-[240px] sm:h-[300px]">
                <canvas id="suratChart"></canvas>
            </div>
        </div>

        <!-- Ringkasan Statistik & Status Modul (4 cols) -->
        <div class="lg:col-span-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-5 sm:space-y-6">
            <div>
                <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80">
                    <h2 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <i class="fa-solid fa-list-check text-amber-400"></i>
                        <span>Distribusi Status</span>
                    </h2>
                    <span class="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">Realtime</span>
                </div>

                <div class="space-y-3 sm:space-y-4 mt-4">
                    <!-- Surat Masuk Stats -->
                    <div class="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                        <div class="flex items-center justify-between text-xs font-bold">
                            <span class="text-indigo-400 flex items-center gap-2">
                                <i class="fa-solid fa-inbox"></i> Surat Masuk
                            </span>
                            <span class="text-slate-300">{{ $totalSuratMasuk }} Dokumen</span>
                        </div>
                        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            @php
                                $totalSM = max($totalSuratMasuk, 1);
                                $pBaru = (($statusSuratMasuk['Baru'] ?? 0) / $totalSM) * 100;
                                $pProses = (($statusSuratMasuk['Diproses'] ?? 0) / $totalSM) * 100;
                                $pSelesai = (($statusSuratMasuk['Selesai'] ?? 0) / $totalSM) * 100;
                            @endphp
                            <div style="width: {{ $pBaru }}%" class="bg-blue-500 h-full" title="Baru"></div>
                            <div style="width: {{ $pProses }}%" class="bg-amber-500 h-full" title="Diproses"></div>
                            <div style="width: {{ $pSelesai }}%" class="bg-emerald-500 h-full" title="Selesai"></div>
                        </div>
                        <div class="flex justify-between text-[11px] text-slate-400">
                            <span>Baru: {{ $statusSuratMasuk['Baru'] ?? 0 }}</span>
                            <span>Proses: {{ $statusSuratMasuk['Diproses'] ?? 0 }}</span>
                            <span>Selesai: {{ $statusSuratMasuk['Selesai'] ?? 0 }}</span>
                        </div>
                    </div>

                    <!-- Surat Keluar Stats -->
                    <div class="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                        <div class="flex items-center justify-between text-xs font-bold">
                            <span class="text-purple-400 flex items-center gap-2">
                                <i class="fa-solid fa-paper-plane"></i> Surat Keluar
                            </span>
                            <span class="text-slate-300">{{ $totalSuratKeluar }} Dokumen</span>
                        </div>
                        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            @php
                                $totalSK = max($totalSuratKeluar, 1);
                                $pDraft = (($statusSuratKeluar['Draft'] ?? 0) / $totalSK) * 100;
                                $pKirim = (($statusSuratKeluar['Dikirim'] ?? 0) / $totalSK) * 100;
                                $pSelesaiSK = (($statusSuratKeluar['Selesai'] ?? 0) / $totalSK) * 100;
                            @endphp
                            <div style="width: {{ $pDraft }}%" class="bg-slate-500 h-full" title="Draft"></div>
                            <div style="width: {{ $pKirim }}%" class="bg-purple-500 h-full" title="Dikirim"></div>
                            <div style="width: {{ $pSelesaiSK }}%" class="bg-emerald-500 h-full" title="Selesai"></div>
                        </div>
                        <div class="flex justify-between text-[11px] text-slate-400">
                            <span>Draft: {{ $statusSuratKeluar['Draft'] ?? 0 }}</span>
                            <span>Dikirim: {{ $statusSuratKeluar['Dikirim'] ?? 0 }}</span>
                            <span>Selesai: {{ $statusSuratKeluar['Selesai'] ?? 0 }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <a href="{{ route('laporan.index') }}" class="block w-full text-center py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition duration-200 shadow-md">
                <i class="fa-solid fa-file-export mr-1.5 text-indigo-400"></i> Lihat Laporan Lengkap
            </a>
        </div>

    </div>

    <!-- Data Terbaru Terintegrasi (Surat Masuk, Surat Keluar, & Arsip Tabs) -->
    <div class="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5 sm:space-y-6">
        
        <!-- Tab Navigation & Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
                <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Dokumen & Transaksi Terbaru</h2>
                <p class="text-xs text-slate-400">Data aktivitas terbaru yang telah dicatat dalam sistem</p>
            </div>

            <!-- Switcher Tabs -->
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 w-full sm:w-auto">
                <button @click="activeTab = 'surat_masuk'"
                        :class="activeTab === 'surat_masuk' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'"
                        class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-inbox text-[11px]"></i>
                    <span>Surat Masuk</span>
                </button>
                <button @click="activeTab = 'surat_keluar'"
                        :class="activeTab === 'surat_keluar' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'"
                        class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-paper-plane text-[11px]"></i>
                    <span>Surat Keluar</span>
                </button>
                <button @click="activeTab = 'arsip'"
                        :class="activeTab === 'arsip' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'"
                        class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-box-archive text-[11px]"></i>
                    <span>Arsip</span>
                </button>
            </div>
        </div>

        <!-- Tab 1: Surat Masuk Terbaru -->
        <div x-show="activeTab === 'surat_masuk'" x-cloak transition:enter="transition ease-out duration-200" transition:enter-start="opacity-0 translate-y-1" transition:enter-end="opacity-100 translate-y-0">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-300">
                    <thead class="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th class="px-4 py-3.5 font-bold rounded-l-xl">No</th>
                            <th class="px-4 py-3.5 font-bold">Agenda & Nomor Surat</th>
                            <th class="px-4 py-3.5 font-bold">Asal / Instansi</th>
                            <th class="px-4 py-3.5 font-bold">Perihal</th>
                            <th class="px-4 py-3.5 font-bold">Tanggal Surat</th>
                            <th class="px-4 py-3.5 font-bold">Status</th>
                            <th class="px-4 py-3.5 font-bold text-center rounded-r-xl">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        @forelse($suratMasukTerbaru ?? [] as $surat)
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-4 py-4 font-medium text-slate-500">{{ $loop->iteration }}</td>
                                <td class="px-4 py-4">
                                    <div class="font-bold text-indigo-400">{{ $surat->nomor_surat }}</div>
                                    <div class="text-[11px] text-slate-500 font-mono">{{ $surat->nomor_agenda }}</div>
                                </td>
                                <td class="px-4 py-4 text-slate-200 font-medium">
                                    {{ $surat->instansi->nama_instansi ?? $surat->asal_surat ?? '-' }}
                                </td>
                                <td class="px-4 py-4 text-slate-300 max-w-xs truncate" title="{{ $surat->perihal }}">
                                    {{ $surat->perihal }}
                                </td>
                                <td class="px-4 py-4 text-slate-400 text-xs">
                                    {{ $surat->tanggal_surat ? \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d M Y') : '-' }}
                                </td>
                                <td class="px-4 py-4">
                                    @if($surat->status == 'Baru')
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Baru
                                        </span>
                                    @elseif($surat->status == 'Diproses')
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Diproses
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Selesai
                                        </span>
                                    @endif
                                </td>
                                <td class="px-4 py-4 text-center">
                                    <a href="{{ route('surat_masuk.show', $surat->id) }}" class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition">
                                        <span>Detail</span>
                                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                                    <i class="fa-regular fa-folder-open text-2xl mb-2 block"></i>
                                    Belum ada data surat masuk terbaru.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-right">
                <a href="{{ route('surat_masuk.index') }}" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition">
                    <span>Lihat Semua Surat Masuk</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
            </div>
        </div>

        <!-- Tab 2: Surat Keluar Terbaru -->
        <div x-show="activeTab === 'surat_keluar'" x-cloak transition:enter="transition ease-out duration-200" transition:enter-start="opacity-0 translate-y-1" transition:enter-end="opacity-100 translate-y-0">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-300">
                    <thead class="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th class="px-4 py-3.5 font-bold rounded-l-xl">No</th>
                            <th class="px-4 py-3.5 font-bold">Nomor Surat</th>
                            <th class="px-4 py-3.5 font-bold">Tujuan / Instansi</th>
                            <th class="px-4 py-3.5 font-bold">Perihal</th>
                            <th class="px-4 py-3.5 font-bold">Tanggal Surat</th>
                            <th class="px-4 py-3.5 font-bold">Status</th>
                            <th class="px-4 py-3.5 font-bold text-center rounded-r-xl">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        @forelse($suratKeluarTerbaru ?? [] as $surat)
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-4 py-4 font-medium text-slate-500">{{ $loop->iteration }}</td>
                                <td class="px-4 py-4 font-bold text-purple-400">
                                    {{ $surat->nomor_surat }}
                                </td>
                                <td class="px-4 py-4 text-slate-200 font-medium">
                                    {{ $surat->tujuan ?? $surat->instansi->nama_instansi ?? '-' }}
                                </td>
                                <td class="px-4 py-4 text-slate-300 max-w-xs truncate" title="{{ $surat->perihal }}">
                                    {{ $surat->perihal }}
                                </td>
                                <td class="px-4 py-4 text-slate-400 text-xs">
                                    {{ $surat->tanggal_surat ? \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d M Y') : '-' }}
                                </td>
                                <td class="px-4 py-4">
                                    @if($surat->status == 'Draft')
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Draft
                                        </span>
                                    @elseif($surat->status == 'Dikirim')
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Dikirim
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Selesai
                                        </span>
                                    @endif
                                </td>
                                <td class="px-4 py-4 text-center">
                                    <a href="{{ route('surat_keluar.preview', $surat->id) }}" class="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition">
                                        <span>Preview</span>
                                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                                    <i class="fa-regular fa-folder-open text-2xl mb-2 block"></i>
                                    Belum ada data surat keluar terbaru.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-right">
                <a href="{{ route('surat_keluar.index') }}" class="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition">
                    <span>Lihat Semua Surat Keluar</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
            </div>
        </div>

        <!-- Tab 3: Arsip Terbaru -->
        <div x-show="activeTab === 'arsip'" x-cloak transition:enter="transition ease-out duration-200" transition:enter-start="opacity-0 translate-y-1" transition:enter-end="opacity-100 translate-y-0">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-300">
                    <thead class="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th class="px-4 py-3.5 font-bold rounded-l-xl">No</th>
                            <th class="px-4 py-3.5 font-bold">Kategori / Jenis</th>
                            <th class="px-4 py-3.5 font-bold">Nomor Surat</th>
                            <th class="px-4 py-3.5 font-bold">Pengirim / Penerima</th>
                            <th class="px-4 py-3.5 font-bold">Perihal</th>
                            <th class="px-4 py-3.5 font-bold">Tanggal Surat</th>
                            <th class="px-4 py-3.5 font-bold text-center rounded-r-xl">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        @forelse($arsipTerbaru ?? [] as $arsip)
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-4 py-4 font-medium text-slate-500">{{ $loop->iteration }}</td>
                                <td class="px-4 py-4">
                                    @if($arsip->jenis == 'Surat Masuk')
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                                            <i class="fa-solid fa-inbox text-[10px]"></i> Surat Masuk
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
                                            <i class="fa-solid fa-paper-plane text-[10px]"></i> Surat Keluar
                                        </span>
                                    @endif
                                </td>
                                <td class="px-4 py-4 font-bold text-amber-400">
                                    {{ $arsip->nomor_surat }}
                                </td>
                                <td class="px-4 py-4 text-slate-200 font-medium">
                                    {{ $arsip->pengirim_penerima ?? '-' }}
                                </td>
                                <td class="px-4 py-4 text-slate-300 max-w-xs truncate" title="{{ $arsip->perihal }}">
                                    {{ $arsip->perihal }}
                                </td>
                                <td class="px-4 py-4 text-slate-400 text-xs">
                                    {{ $arsip->tanggal_surat ? \Carbon\Carbon::parse($arsip->tanggal_surat)->translatedFormat('d M Y') : '-' }}
                                </td>
                                <td class="px-4 py-4 text-center">
                                    <a href="{{ route('arsip.show', $arsip->id) }}" class="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition">
                                        <span>Detail Arsip</span>
                                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                                    <i class="fa-regular fa-folder-open text-2xl mb-2 block"></i>
                                    Belum ada data arsip surat terbaru.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-right">
                <a href="{{ route('arsip.index') }}" class="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition">
                    <span>Lihat Semua Arsip Surat</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
            </div>
        </div>

    </div>

</div>
@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById('suratChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const chartLabels     = {{ Illuminate\Support\Js::from($chartLabels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']) }};
    const dataSuratMasuk  = {{ Illuminate\Support\Js::from($dataSuratMasuk ?? [0, 0, 0, 0, 0, 0]) }};
    const dataSuratKeluar = {{ Illuminate\Support\Js::from($dataSuratKeluar ?? [0, 0, 0, 0, 0, 0]) }};
    const dataArsip       = {{ Illuminate\Support\Js::from($dataArsip ?? [0, 0, 0, 0, 0, 0]) }};

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Surat Masuk',
                    data: dataSuratMasuk,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: '#6366f1',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Surat Keluar',
                    data: dataSuratKeluar,
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderColor: '#a855f7',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Arsip',
                    data: dataArsip,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: '#f59e0b',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif' } }
                },
                y: {
                    grid: { color: 'rgba(51, 65, 85, 0.4)', borderDash: [4, 4] },
                    ticks: { 
                        color: '#94a3b8', 
                        font: { family: 'Plus Jakarta Sans, sans-serif' },
                        precision: 0 
                    },
                    beginAtZero: true
                }
            }
        }
    });
});
</script>
@endpush