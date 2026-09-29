@extends('layouts.app')

@section('title', 'Detail Surat Masuk')

@section('content')

<div class="max-w-7xl mx-auto">

    {{-- Header --}}
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

            <h1 class="text-3xl font-bold text-white">
                Detail Surat Masuk
            </h1>

            <p class="text-slate-400 mt-1">
                Informasi lengkap surat masuk.
            </p>

        </div>

        <div class="flex gap-3">

            <a href="{{ route('surat_masuk.edit', $surat->id) }}"
               class="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-xl font-semibold transition">

                <i class="fa-solid fa-pen"></i>

                Edit

            </a>

            <a href="{{ route('surat_masuk.index') }}"
               class="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl font-semibold transition">

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

                Data Surat Masuk

            </h2>

        </div>

        <div class="p-6">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                {{-- Nomor Agenda --}}
                <div>

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Nomor Agenda
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

                        {{ $surat->nomor_agenda }}

                    </div>

                </div>

                {{-- Nomor Surat --}}
                <div>

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Nomor Surat
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

                        {{ $surat->nomor_surat }}

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

                {{-- Tanggal Diterima --}}
                <div>

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Tanggal Diterima
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

                        {{ \Carbon\Carbon::parse($surat->tanggal_terima)->format('d-m-Y') }}

                    </div>

                </div>

                {{-- Asal Surat --}}
                <div>

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Asal Surat
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

                        {{ $surat->asal_surat }}

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

                {{-- Perihal --}}
                <div class="md:col-span-2">

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Perihal
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">

                        {{ $surat->perihal }}

                    </div>

                </div>

                {{-- Isi Ringkas --}}
                <div class="md:col-span-2">

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Isi Ringkas
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white whitespace-pre-line">

                        {{ $surat->isi_ringkas }}

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

                        @if($surat->status == 'Baru')

                            <span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">

                                Baru

                            </span>

                        @elseif($surat->status == 'Diproses')

                            <span class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">

                                Diproses

                            </span>

                        @else

                            <span class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">

                                Selesai

                            </span>

                        @endif

                    </div>

                </div>

                {{-- Keterangan --}}
                <div class="md:col-span-2">

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        Keterangan
                    </label>

                    <div class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white whitespace-pre-line">

                        {{ $surat->keterangan ?: '-' }}

                    </div>

                </div>

                {{-- File PDF --}}
                <div class="md:col-span-2">

                    <label class="block text-sm font-medium text-slate-400 mb-2">
                        File Surat
                    </label>

                    @if($surat->file_surat)

                        <a
                            href="{{ asset('storage/surat_masuk/'.$surat->file_surat) }}"
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

            {{-- Tombol Aksi --}}
            {{--
                flex-wrap   : tombol wrap ke baris baru jika layar tidak cukup lebar
                gap-3       : jarak antar tombol
                min-h-[44px]: touch target minimum (Apple HIG: 44pt)
            --}}
            <div class="mt-8 flex flex-wrap gap-3">

                <a
    href="{{ asset('storage/surat_masuk/'.$surat->file_surat) }}"
    target="_blank"
    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold transition duration-200 shadow min-h-[44px]">

    <i class="fa-solid fa-file-lines"></i>

    Lihat PDF

</a>

                <a
                    href="{{ route('surat_masuk.edit', $surat->id) }}"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-white font-semibold transition duration-200 shadow min-h-[44px]">

                    <i class="fa-solid fa-pen-to-square"></i>

                    Edit Surat

                </a>

                <a
                    href="{{ route('surat_masuk.index') }}"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition duration-200 min-h-[44px]">

                    <i class="fa-solid fa-arrow-left"></i>

                    Kembali

                </a>

                <a href="{{ route('surat_keluar.create', ['surat_masuk' => $surat->id]) }}"
   class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-semibold min-h-[44px]">

    <i class="fa-solid fa-reply"></i>

    Buat Surat Balasan

</a>

            </div>

        </div>

    </div>

</div>

@endsection
