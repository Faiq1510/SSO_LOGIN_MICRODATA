@extends('layouts.app')

@section('title', 'Pengaturan Akun')

@section('content')

<div class="max-w-3xl mx-auto space-y-6">

    <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h1 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 sm:gap-3">
            <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-user-gear text-indigo-400 text-xs sm:text-sm"></i>
            </span>
            Pengaturan Akun
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1 ml-10 sm:ml-12">Kelola informasi profil dan password akun kamu</p>
    </div>

    @if (session('success'))
        <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-xs sm:text-sm flex items-center gap-2">
            <i class="fa-solid fa-circle-check"></i>
            <span>{{ session('success') }}</span>
        </div>
    @endif

    @if ($errors->any())
        <div class="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3">
            <ul class="list-disc list-inside space-y-1 text-xs sm:text-sm">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- ================= INFORMASI PROFIL ================= --}}
    <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">

        <h2 class="text-base sm:text-lg font-semibold text-white mb-1">Informasi Profil</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-4">Ubah nama dan email akun kamu</p>

        <form action="{{ route('akun.update') }}" method="POST">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Nama</label>
                    <input type="text"
                           name="name"
                           value="{{ old('name', auth()->user()->name) }}"
                           class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           required>
                </div>

                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Email</label>
                    <input type="email"
                           name="email"
                           value="{{ old('email', auth()->user()->email) }}"
                           class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           required>
                </div>

            </div>

            <div class="mt-5">
                <button type="submit"
                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all w-full sm:w-auto">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Perubahan
                </button>
            </div>

        </form>
    </div>

    {{-- ================= GANTI PASSWORD ================= --}}
    <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">

        <h2 class="text-base sm:text-lg font-semibold text-white mb-1">Ganti Password</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-4">
            Masukkan password lama untuk konfirmasi, lalu tentukan password baru
        </p>

        <form action="{{ route('akun.password') }}" method="POST">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-1 gap-4">

                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Password Lama</label>
                    <input type="password"
                           name="current_password"
                           class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           required>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Password Baru</label>
                        <input type="password"
                               name="password"
                               class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                               required>
                        <p class="text-[11px] text-slate-500 mt-1">Minimal 8 karakter</p>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                        <input type="password"
                               name="password_confirmation"
                               class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                               required>
                    </div>

                </div>

            </div>

            <div class="mt-5">
                <button type="submit"
                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all w-full sm:w-auto">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Ubah Password
                </button>
            </div>

        </form>
    </div>

</div>

@endsection