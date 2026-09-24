<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>PT Microdata Indonesia - Masuk</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                        heading: ['Outfit', 'sans-serif'],
                    },
                }
            }
        }
    </script>

    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <style>
        /* Blend mode untuk memastikan logo berlatar gelap menyatu mulus */
        .logo-blend {
            mix-blend-mode: screen;
            filter: brightness(110%) contrast(125%);
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden antialiased selection:bg-pink-500 selection:text-white">

    <!-- Dynamic Background Ambient Glows -->
    <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px]"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-cyan-500/10 rounded-full blur-[140px]"></div>
    </div>

    <!-- Main Card Container -->
    <main class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40 relative z-10">
        
        <!-- Left Side: Branding & Visual Showcase -->
        <section class="lg:col-span-5 p-8 lg:p-12 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
            <!-- Background Radial Accent -->
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

            <!-- Top Header Logo -->
            <div class="relative z-10 flex items-center gap-3">
                <a href="{{ url('/') }}" class="inline-block transition-transform hover:scale-105">
                    <img src="{{ asset('images/microdata-logo.webp') }}" 
                         alt="Logo PT Microdata Indonesia" 
                         class="h-16 w-auto object-contain logo-blend">
                </a>
            </div>

            <!-- Hero Text Content -->
            <div class="my-10 lg:my-16 relative z-10 space-y-4">
                <div>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Sistem Portal Admin</span>
                    </span>
                </div>

                <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                    Selamat Datang <br class="hidden sm:inline">Kembali!
                </h1>

                <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Akses portal manajemen arsip digital PT Microdata Indonesia secara aman, cepat, dan terintegrasi.
                </p>
            </div>

            <!-- Footer Status -->
            <div class="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div class="flex items-center gap-2">
                    <span class="relative flex h-2 h-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span class="font-medium text-slate-300">Sistem Aktif</span>
                </div>
                <span>&copy; {{ date('Y') }} PT Microdata Indonesia</span>
            </div>
        </section>

        <!-- Right Side: Interactive Login Form -->
        <section class="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center" x-data="{ showPassword: false }">
            <div class="max-w-md w-full mx-auto space-y-6">
                
                <!-- Form Title Header -->
                <div>
                    <h2 class="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">Masuk ke Akun</h2>
                    <p class="text-slate-400 text-sm mt-1">Silakan masukkan email dan kata sandi Anda untuk melanjutkan.</p>
                </div>

                <!-- Session Alert -->
                @if (session('status'))
                    <div role="alert" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
                        <i class="fa-solid fa-circle-check text-base mt-0.5 shrink-0"></i>
                        <span>{{ session('status') }}</span>
                    </div>
                @endif

                <!-- Validation Errors List -->
                @if ($errors->any())
                    <div role="alert" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm space-y-2">
                        <div class="flex items-center gap-2 font-semibold">
                            <i class="fa-solid fa-triangle-exclamation shrink-0"></i>
                            <span>Terjadi kesalahan input:</span>
                        </div>
                        <ul class="list-disc list-inside space-y-1 text-xs text-rose-300">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <!-- Login Form -->
                <form method="POST" action="{{ route('login') }}" class="space-y-5">
                    @csrf

                    <!-- Email Field -->
                    <div class="space-y-2">
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
                                autofocus 
                                autocomplete="username"
                                placeholder="nama@microdata.co.id"
                                class="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                            >
                        </div>
                    </div>

                    <!-- Password Field with Toggle -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Kata Sandi
                            </label>
                            @if (Route::has('password.request'))
                                <a href="{{ route('password.request') }}" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition duration-150">
                                    Lupa Kata Sandi?
                                </a>
                            @endif
                        </div>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <i class="fa-solid fa-lock text-sm"></i>
                            </div>
                            <input 
                                id="password" 
                                :type="showPassword ? 'text' : 'password'" 
                                name="password" 
                                required 
                                autocomplete="current-password"
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
                    </div>

                    <!-- Remember Me Option -->
                    <div class="flex items-center justify-between pt-1">
                        <label class="inline-flex items-center gap-2.5 cursor-pointer group">
                            <input 
                                id="remember_me" 
                                type="checkbox" 
                                name="remember" 
                                class="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 transition"
                            >
                            <span class="text-xs text-slate-400 group-hover:text-slate-300 transition select-none">Ingat saya di perangkat ini</span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        type="submit" 
                        class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 group"
                    >
                        <span>Masuk ke Dashboard</span>
                        <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition duration-200"></i>
                    </button>
                </form>

                <!-- Footer Link -->
                @if (Route::has('register'))
                    <p class="text-center text-xs text-slate-400 pt-2">
                        Belum memiliki akun? 
                        <a href="{{ route('register') }}" class="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition">
                            Daftar Sekarang
                        </a>
                    </p>
                @endif

            </div>
        </section>

    </main>

</body>
</html>