<x-guest-layout>
    <!-- Main Card Container -->
    <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40 relative z-10 my-4">
        
        <!-- Left Side: Branding & Information -->
        <section class="lg:col-span-5 p-8 lg:p-12 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
            <!-- Background Accent Glow -->
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

            <!-- Top Header Logo (Diubah menjadi Logo Microdata) -->
            <div class="relative z-10 flex items-center gap-3">
                <a href="{{ url('/') }}" class="inline-block transition-transform hover:scale-105">
                    <img src="{{ asset('images/microdata-logo.webp') }}" 
                         alt="Logo PT Microdata Indonesia" 
                         class="h-16 w-auto object-contain logo-blend">
                </a>
            </div>

            <!-- Hero Text Content -->
            <div class="my-8 lg:my-12 relative z-10 space-y-4">
                <div>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
                        <i class="fa-solid fa-sparkles"></i>
                        <span>Bergabung Bersama Kami</span>
                    </span>
                </div>

                <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                    Mulai Perjalanan <br class="hidden sm:inline">Anda Disini
                </h1>

                <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Buat akun baru untuk mengakses portal manajemen arsip digital PT Microdata Indonesia secara terintegrasi.
                </p>
            </div>

            <!-- Footer Info -->
            <div class="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div class="flex items-center gap-2">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span class="font-medium text-slate-300">Pendaftaran Terbuka</span>
                </div>
                <span>&copy; {{ date('Y') }} PT Microdata Indonesia</span>
            </div>
        </section>

        <!-- Right Side: Registration Form -->
        <section class="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center" x-data="{ showPassword: false, showConfirmPassword: false }">
            <div class="max-w-md w-full mx-auto space-y-6">
                
                <!-- Form Title Header -->
                <div>
                    <h2 class="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">Buat Akun Baru</h2>
                    <p class="text-slate-400 text-sm mt-1">Silakan isi data diri Anda di bawah ini untuk mendaftar.</p>
                </div>

                <!-- Registration Form -->
                <form method="POST" action="{{ route('register') }}" class="space-y-4">
                    @csrf

                    <!-- Full Name Field -->
                    <div class="space-y-1.5">
                        <label for="name" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Nama Lengkap
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <i class="fa-regular fa-user text-sm"></i>
                            </div>
                            <input 
                                id="name" 
                                type="text" 
                                name="name" 
                                value="{{ old('name') }}" 
                                required 
                                autofocus 
                                autocomplete="name"
                                placeholder="Nama lengkap Anda"
                                class="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                            >
                        </div>
                        <x-input-error :messages="$errors->get('name')" class="mt-1 text-xs text-rose-400" />
                    </div>

                    <!-- Email Field -->
                    <div class="space-y-1.5">
                        <label for="email" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Alamat Email
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <i class="fa-regular fa-envelope text-sm"></i>
                            </div>
                            <input 
                                id="email" 
                                type="email" 
                                name="email" 
                                value="{{ old('email') }}" 
                                required 
                                autocomplete="username"
                                placeholder="nama@email.com"
                                class="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                            >
                        </div>
                        <x-input-error :messages="$errors->get('email')" class="mt-1 text-xs text-rose-400" />
                    </div>

                    <!-- Password Field with Toggle -->
                    <div class="space-y-1.5">
                        <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Kata Sandi
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <i class="fa-solid fa-lock text-sm"></i>
                            </div>
                            <input 
                                id="password" 
                                :type="showPassword ? 'text' : 'password'" 
                                name="password" 
                                required 
                                autocomplete="new-password"
                                placeholder="••••••••"
                                class="w-full pl-10 pr-12 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                            >
                            <button 
                                type="button" 
                                @click="showPassword = !showPassword" 
                                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                                title="Tampilkan/Sembunyikan Kata Sandi"
                                aria-label="Toggle kata sandi"
                            >
                                <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                            </button>
                        </div>
                        <x-input-error :messages="$errors->get('password')" class="mt-1 text-xs text-rose-400" />
                    </div>

                    <!-- Confirm Password Field with Toggle -->
                    <div class="space-y-1.5">
                        <label for="password_confirmation" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Konfirmasi Kata Sandi
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <i class="fa-solid fa-shield-halved text-sm"></i>
                            </div>
                            <input 
                                id="password_confirmation" 
                                :type="showConfirmPassword ? 'text' : 'password'" 
                                name="password_confirmation" 
                                required 
                                autocomplete="new-password"
                                placeholder="••••••••"
                                class="w-full pl-10 pr-12 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                            >
                            <button 
                                type="button" 
                                @click="showConfirmPassword = !showConfirmPassword" 
                                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                                title="Tampilkan/Sembunyikan Konfirmasi Kata Sandi"
                                aria-label="Toggle konfirmasi kata sandi"
                            >
                                <i class="fa-solid" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                            </button>
                        </div>
                        <x-input-error :messages="$errors->get('password_confirmation')" class="mt-1 text-xs text-rose-400" />
                    </div>

                    <!-- Submit Button -->
                    <div class="pt-2">
                        <button 
                            type="submit" 
                            class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            <span>Daftar Sekarang</span>
                            <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition duration-200"></i>
                        </button>
                    </div>
                </form>

                <!-- Already Registered Link -->
                <p class="text-center text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    Sudah memiliki akun? 
                    <a href="{{ route('login') }}" class="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition">
                        Masuk disini
                    </a>
                </p>

            </div>
        </section>

    </div>
</x-guest-layout>