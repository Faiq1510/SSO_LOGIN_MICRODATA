@extends('layouts.app')

@section('title', 'Edit Arsip Surat')

@section('content')

<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h4 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-pen-to-square text-amber-400 text-xs sm:text-sm"></i>
                </span>
                Edit Arsip Surat
            </h4>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Perbarui data arsip surat.</p>
        </div>
        <a href="{{ route('arsip.show', $surat->id) }}"
           class="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all duration-200 w-full sm:w-auto">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            Kembali
        </a>
    </div>

    @if ($errors->any())
        <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
            <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
            <ul class="list-disc list-inside space-y-1 text-xs sm:text-sm">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div class="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-file-pen text-amber-400"></i>
            <h5 class="text-sm sm:text-base font-semibold text-slate-200">Form Edit Arsip</h5>
        </div>

        <div class="p-4 sm:p-6">
        <form action="{{ route('arsip.update', $surat->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">

                <div class="md:col-span-4">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Jenis Surat</label>
                    <select name="jenis"
                            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required>
                        <option value="">-- Pilih Jenis --</option>
                        <option value="masuk" @selected(old('jenis', $surat->jenis) == 'masuk')>Surat Masuk</option>
                        <option value="keluar" @selected(old('jenis', $surat->jenis) == 'keluar')>Surat Keluar</option>
                    </select>
                </div>

                <div class="md:col-span-4">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Nomor Surat</label>
                    <input type="text"
                           name="no_surat"
                           value="{{ old('no_surat', $surat->no_surat) }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                           required>
                </div>

                <div class="md:col-span-4">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
                    <select name="kategori"
                            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                        <option value="">-- Pilih Kategori --</option>
                        @foreach($kategoriList ?? [] as $kategori)
                            <option value="{{ $kategori }}" @selected(old('kategori', $surat->kategori ?? null) == $kategori)>{{ $kategori }}</option>
                        @endforeach
                    </select>
                </div>

                <div class="md:col-span-12">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Judul Surat</label>
                    <input type="text"
                           name="judul"
                           value="{{ old('judul', $surat->judul) }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                           required>
                </div>

                <div class="md:col-span-6">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Pengirim / Penerima</label>
                    <input type="text"
                           name="pengirim_penerima"
                           value="{{ old('pengirim_penerima', $surat->pengirim_penerima) }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                           required>
                </div>

                <div class="md:col-span-3">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Tanggal Surat</label>
                    <input type="date"
                           name="tanggal_surat"
                           value="{{ old('tanggal_surat', \Carbon\Carbon::parse($surat->tanggal_surat)->format('Y-m-d')) }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                           required>
                </div>

                <div class="md:col-span-3">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Tahun</label>
                    <input type="number"
                           name="tahun"
                           value="{{ old('tahun', $surat->tahun) }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                           required>
                </div>

                <div class="md:col-span-6">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Status</label>
                    <select name="status"
                            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required>
                        <option value="">-- Pilih Status --</option>
                        <option value="Draft" @selected(old('status', $surat->status) == 'Draft')>Draft</option>
                        <option value="Diproses" @selected(old('status', $surat->status) == 'Diproses')>Diproses</option>
                        <option value="Selesai" @selected(old('status', $surat->status) == 'Selesai')>Selesai</option>
                    </select>
                </div>

                <div class="md:col-span-6">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Arsip Oleh</label>
                    <input type="text"
                           value="{{ $surat->arsip_oleh }}"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                           readonly>
                </div>

                <div class="md:col-span-12">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Upload File Baru (PDF)</label>
                    @if($surat->file_surat ?? null)
                        <p class="text-xs text-slate-500 mb-2">
                            File saat ini:
                            <a href="{{ asset('storage/arsip/' . $surat->file_surat) }}" target="_blank" class="text-indigo-400 hover:underline">
                                {{ $surat->file_surat }}
                            </a>
                            — biarkan kosong kalau tidak ingin mengganti file.
                        </p>
                    @endif
                    <input type="file"
                           name="file_surat"
                           accept=".pdf"
                           class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                </div>

                <div class="md:col-span-12">
                    <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Keterangan</label>
                    <textarea name="keterangan"
                              rows="4"
                              class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">{{ old('keterangan', $surat->keterangan ?? '') }}</textarea>
                </div>

            </div>

            <div class="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button type="submit"
                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 w-full sm:w-auto">
                    <i class="fa-solid fa-floppy-disk text-xs"></i>
                    Simpan Perubahan
                </button>
                <a href="{{ route('arsip.show', $surat->id) }}"
                   class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-700 transition-all duration-200 w-full sm:w-auto">
                    Batal
                </a>
            </div>

        </form>
        </div>
    </div>

</div>

@endsection