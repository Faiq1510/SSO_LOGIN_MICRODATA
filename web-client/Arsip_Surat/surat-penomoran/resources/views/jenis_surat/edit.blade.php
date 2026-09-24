@extends('layouts.app')

@section('title', 'Edit Jenis Surat')

@section('content')
<div class="max-w-3xl mx-auto space-y-6">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-pen-to-square text-amber-400 text-xs sm:text-sm"></i>
                </span>
                Edit Jenis Surat
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Perbarui informasi pengkodean dan jenis surat.</p>
        </div>
        <a href="{{ route('jenis_surat.index') }}"
           class="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all duration-200 w-full sm:w-auto">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            <span>Kembali</span>
        </a>
    </div>

    {{-- Form Card --}}
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <form action="{{ route('jenis_surat.update', $jenisSurat->id) }}" method="POST" class="space-y-5">
            @csrf
            @method('PUT')

            {{-- Nama Jenis Surat --}}
            <div>
                <label for="nama" class="block text-sm font-medium text-slate-300 mb-2">
                    Nama Jenis Surat <span class="text-rose-500">*</span>
                </label>
                <input type="text"
                       name="nama"
                       id="nama"
                       value="{{ old('nama', $jenisSurat->nama) }}"
                       required
                       class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm @error('nama') border-rose-500 @enderror"
                       placeholder="Contoh: Surat Keputusan, Surat Tugas">
                @error('nama')
                    <p class="text-rose-400 text-xs mt-1.5">{{ $message }}</p>
                @enderror
            </div>

            {{-- Kode Surat --}}
            <div>
                <label for="kode_surat" class="block text-sm font-medium text-slate-300 mb-2">
                    Kode Surat <span class="text-rose-500">*</span>
                </label>
                <input type="text"
                       name="kode_surat"
                       id="kode_surat"
                       value="{{ old('kode_surat', $jenisSurat->kode_surat) }}"
                       required
                       class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm @error('kode_surat') border-rose-500 @enderror"
                       placeholder="Contoh: SK, ST, SKu">
                @error('kode_surat')
                    <p class="text-rose-400 text-xs mt-1.5">{{ $message }}</p>
                @enderror
            </div>

            {{-- Tipe Form --}}
            <div>
                <label for="form_type" class="block text-sm font-medium text-slate-300 mb-2">
                    Tipe Form <span class="text-rose-500">*</span>
                </label>
                <select name="form_type"
                        id="form_type"
                        required
                        class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm @error('form_type') border-rose-500 @enderror">
                    <option value="umum" {{ old('form_type', $jenisSurat->form_type) === 'umum' ? 'selected' : '' }}>Umum</option>
                    <option value="kuasa" {{ old('form_type', $jenisSurat->form_type) === 'kuasa' ? 'selected' : '' }}>Surat Kuasa</option>
                </select>
                @error('form_type')
                    <p class="text-rose-400 text-xs mt-1.5">{{ $message }}</p>
                @enderror
            </div>

            {{-- Action Buttons --}}
            <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <a href="{{ route('jenis_surat.index') }}"
                   class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all duration-200">
                    Batal
                </a>
                <button type="submit"
                        class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200">
                    Simpan Perubahan
                </button>
            </div>
        </form>
    </div>

</div>
@endsection
