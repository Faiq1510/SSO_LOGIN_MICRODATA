@extends('layouts.app')

@section('title', 'Detail Surat Keluar')

@section('content')

<div class="max-w-7xl mx-auto">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

        <div class="min-w-0">

            <h1 class="text-2xl sm:text-3xl font-bold text-white">
                Detail Surat Keluar
            </h1>

            <p class="text-slate-400 mt-1 text-sm sm:text-base">
                Informasi lengkap surat keluar.
            </p>

        </div>

        <div class="flex flex-wrap gap-3 shrink-0">

            <a href="{{ route('surat_keluar.edit', $surat->id) }}"
               class="inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-xl font-semibold transition min-h-[44px]">

                <i class="fa-solid fa-pen"></i>

                Edit

            </a>

            <a href="{{ route('surat_keluar.index') }}"
               class="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl font-semibold transition min-h-[44px]">

                <i class="fa-solid fa-arrow-left"></i>

                Kembali

            </a>

        </div>

    </div>

    {{-- Card --}}
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">

        <div class="border-b border-slate-800 px-6 py-5">

            <h2 class="text-xl font-bold text-white flex items-center gap-2">

                <i class="fa-solid fa-file-lines text-indigo-400"></i>

                Data Surat Keluar

            </h2>

        </div>

            @php
                $dk = $surat->data_khusus ?? [];
                $isKuasa = ($dk['tipe_form'] ?? '') === 'kuasa' 
                    || (isset($surat->jenisSurat) && $surat->jenisSurat->form_type === 'kuasa')
                    || Str::contains(strtolower($surat->jenis_surat), 'kuasa')
                    || !empty($dk['pemberi']['nama']);
            @endphp

            @if($isKuasa)
                <div class="md:col-span-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                            <i class="fa-solid fa-file-signature"></i>
                        </div>
                        <div>
                            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Tipe Surat</span>
                            <h3 class="text-base font-bold text-white">Surat Kuasa (Dual Penandatangan)</h3>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                        <div class="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                            <h4 class="font-bold text-amber-300 text-xs uppercase mb-2 border-b border-slate-800 pb-1">1. Pemberi Kuasa</h4>
                            <p class="text-white font-semibold">{{ $dk['pemberi']['nama'] ?? '-' }}</p>
                            <p class="text-xs text-slate-400">Jabatan: {{ $dk['pemberi']['jabatan'] ?? '-' }}</p>
                            <p class="text-xs text-slate-400">Alamat: {{ $dk['pemberi']['alamat'] ?? '-' }}</p>
                        </div>
                        <div class="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                            <h4 class="font-bold text-amber-300 text-xs uppercase mb-2 border-b border-slate-800 pb-1">2. Penerima Kuasa</h4>
                            <p class="text-white font-semibold">{{ $dk['penerima']['nama'] ?? '-' }}</p>
                            <p class="text-xs text-slate-400">Jabatan: {{ $dk['penerima']['jabatan'] ?? '-' }}</p>
                            <p class="text-xs text-slate-400">Alamat: {{ $dk['penerima']['alamat'] ?? '-' }}</p>
                        </div>
                    </div>
                </div>
            @endif

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

 {{-- Nomor Surat --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Nomor Surat
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->nomor_surat }}

    </div>

</div>

{{-- Jenis Surat --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Jenis Surat
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->jenis_surat }}

    </div>

</div>

{{-- Tanggal Surat --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Tanggal Surat
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ \Carbon\Carbon::parse($surat->tanggal_surat)->format('d-m-Y') }}

    </div>

</div>

{{-- Tujuan --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Tujuan
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->tujuan }}

    </div>

</div>

{{-- Perihal --}}
<div class="md:col-span-2">

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Perihal
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->perihal }}

    </div>

</div>

{{-- Isi Surat --}}
<div class="md:col-span-2">

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Isi Surat
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white whitespace-pre-line">

        {{ $surat->isi_surat }}

    </div>

</div>

{{-- Lampiran --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Lampiran
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->lampiran ?: '-' }}

    </div>

</div>

{{-- Status --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Status
    </label>

    <div>

        @if($surat->status == 'Draft')

            <span class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">

                Draft

            </span>

        @elseif($surat->status == 'Dikirim')

            <span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">

                Dikirim

            </span>

        @else

            <span class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">

                Selesai

            </span>

        @endif

    </div>

</div>

{{-- Penandatangan --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Penandatangan
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->penandatangan }}

    </div>

</div>

{{-- Jabatan Penandatangan --}}
<div>

    <label class="block text-sm font-medium text-slate-400 mb-2">
        Jabatan Penandatangan
    </label>

    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

        {{ $surat->jabatan_penandatangan }}

    </div>

</div>

{{-- File PDF --}}
<div class="md:col-span-2">

    <label class="block text-sm font-medium text-slate-400 mb-2">
        File Surat
    </label>

    @if($surat->file_surat)

        <a
            href="{{ asset('storage/surat_keluar/'.$surat->file_surat) }}"
            target="_blank"
            class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl transition">

            <i class="fa-solid fa-file-pdf"></i>

            Lihat File PDF

        </a>

    @else

        <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-400">

            Tidak ada file yang diupload.

        </div>

    @endif

</div>
            </div>

            {{-- Tombol --}}
            <div class="mt-8 flex flex-wrap gap-3">

                <a
                    href="{{ route('surat_keluar.preview', $surat->id) }}"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold transition duration-200 shadow min-h-[44px]">

                    <i class="fa-solid fa-file-lines"></i>

                    Preview Surat

                </a>

                <a
                    href="{{ route('surat_keluar.edit', $surat->id) }}"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-white font-semibold transition duration-200 shadow min-h-[44px]">

                    <i class="fa-solid fa-pen-to-square"></i>

                    Edit Surat

                </a>

                <a
                    href="{{ route('surat_keluar.index') }}"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition duration-200 min-h-[44px]">

                    <i class="fa-solid fa-arrow-left"></i>

                    Kembali

                </a>

            </div>

        </div>

    </div>

</div>

@endsection
