@extends('layouts.app')

@section('title', 'Tambah Instansi')

@section('content')
<div class="space-y-6">

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-building-circle-arrow-right text-indigo-400 text-xs sm:text-sm"></i>
                </span>
                Tambah Instansi
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Tambahkan data instansi baru ke sistem.</p>
        </div>
        <a href="{{ route('instansi.index') }}" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all duration-200 w-full sm:w-auto">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            <span>Kembali</span>
        </a>
    </div>

    <!-- Form Section -->
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <form action="{{ route('instansi.store') }}" method="POST" class="space-y-6">
            @csrf

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Kode Instansi -->
                <div>
                    <label for="kode_instansi" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Kode Instansi <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="kode_instansi" id="kode_instansi" value="{{ old('kode_instansi') }}" required placeholder="Contoh: INS-001"
                           class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border @error('kode_instansi') border-rose-500 @else border-slate-800 @enderror text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition">
                    @error('kode_instansi')
                        <p class="text-rose-400 text-xs mt-1.5">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Nama Instansi -->
                <div>
                    <label for="nama_instansi" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Nama Instansi <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="nama_instansi" id="nama_instansi" value="{{ old('nama_instansi') }}" required placeholder="Contoh: PT Microdata Indonesia"
                           class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border @error('nama_instansi') border-rose-500 @else border-slate-800 @enderror text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition">
                    @error('nama_instansi')
                        <p class="text-rose-400 text-xs mt-1.5">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Telepon -->
                <div class="md:col-span-2">
                    <label for="telepon" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Telepon / WhatsApp</label>
                    <input type="text" name="telepon" id="telepon" value="{{ old('telepon') }}" placeholder="Contoh: 08123456789"
                           class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition">
                </div>

                <!-- Alamat -->
                <div class="md:col-span-2">
                    <label for="alamat" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Alamat Lengkap</label>
                    <textarea name="alamat" id="alamat" rows="3" placeholder="Masukkan alamat lengkap instansi..."
                              class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition">{{ old('alamat') }}</textarea>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition duration-200">
                    Simpan Instansi
                </button>
            </div>
        </form>
    </div>

</div>
@endsection