@extends('layouts.app')

@section('title', 'Detail Arsip Surat')

@section('content')

<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">

        <div>

            <h4 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-box-archive text-emerald-400 text-xs sm:text-sm"></i>
                </span>
                Detail Arsip Surat
            </h4>

            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">
                Informasi lengkap arsip surat PT Microdata Indonesia.
            </p>

        </div>

        <a href="{{ route('arsip.index') }}"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all duration-200 w-full sm:w-auto">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            Kembali ke Arsip
        </a>

    </div>

    {{-- Card --}}
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">

        {{-- Header Card --}}
        <div class="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-circle-info text-emerald-400"></i>
            <h5 class="text-sm sm:text-base font-semibold text-slate-200">Informasi Surat</h5>
        </div>

        {{-- Isi --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">

            {{-- Nomor Surat --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Nomor Surat

                </label>

                <div class="text-lg font-semibold text-white">

                    {{ $surat->nomor_surat }}

                </div>

            </div>

            {{-- Jenis --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Jenis Surat

                </label>

                @if($surat->jenis == 'Surat Masuk')

                    <span class="inline-flex px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">

                        Surat Masuk

                    </span>

                @else

                    <span class="inline-flex px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">

                        Surat Keluar

                    </span>

                @endif

            </div>

            {{-- Jenis Surat --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Kategori Surat

                </label>

                <div class="text-white">

                    {{ $surat->jenis_surat }}

                </div>

            </div>

            {{-- Perihal --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Perihal

                </label>

                <div class="text-white">

                    {{ $surat->perihal }}

                </div>

            </div>
            {{-- Pengirim / Penerima --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Pengirim / Penerima

                </label>

                <div class="text-white">

                    {{ $surat->pengirim_penerima }}

                </div>

            </div>

            {{-- Tanggal Surat --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Tanggal Surat

                </label>

                <div class="text-white">

                    {{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d F Y') }}

                </div>

            </div>

            {{-- Lampiran --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Lampiran

                </label>

                <div class="text-white">

                    {{ $surat->lampiran ?: '-' }}

                </div>

            </div>

            {{-- Status --}}
            <div>

                <label class="block text-sm text-slate-400 mb-2">

                    Status

                </label>

                @php

                    $warna = match($surat->status){

                        'Baru' => 'bg-sky-500/20 text-sky-400',

                        'Diproses' => 'bg-yellow-500/20 text-yellow-400',

                        'Draft' => 'bg-gray-500/20 text-gray-300',

                        'Dikirim' => 'bg-indigo-500/20 text-indigo-400',

                        'Selesai' => 'bg-emerald-500/20 text-emerald-400',

                        default => 'bg-slate-500/20 text-slate-300'

                    };

                @endphp

                <span class="inline-flex px-3 py-1 rounded-full text-sm {{ $warna }}">

                    {{ $surat->status }}

                </span>

            </div>

        </div>

        {{-- File Surat --}}
        <div class="border-t border-slate-800 p-6">

            <label class="block text-sm text-slate-400 mb-4">

                File Surat

            </label>
            @if($surat->jenis == 'Surat Masuk')

                @if($surat->file_surat)

                    <div class="flex flex-wrap gap-3">

                        <a href="{{ asset('storage/'.$surat->file_surat) }}"
                            target="_blank"
                            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">

                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">

                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/>

                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>

                            </svg>

                            Lihat File

                        </a>

                        <a href="{{ asset('storage/'.$surat->file_surat) }}"
                            download
                            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">

                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">

                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>

                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 10l5 5 5-5"/>

                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 15V3"/>

                            </svg>

                            Download File

                        </a>

                    </div>

                @else

                    <div class="text-slate-400 italic">

                        File surat belum tersedia.

                    </div>

                @endif

            @else

                <div class="flex flex-wrap gap-3">

                    <a href="{{ route('surat_keluar.preview', $surat->surat_keluar_id) }}"
                        target="_blank"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">

                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">

                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/>

                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>

                        </svg>

                        Preview Surat

                    </a>

                    <a href="{{ route('surat_keluar.pdf', $surat->surat_keluar_id) }}"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">

                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">

                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>

                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M7 10l5 5 5-5"/>

                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 15V3"/>

                        </svg>

                        Download PDF

                    </a>

                </div>

            @endif

        </div>

    </div>

</div>

@endsection
