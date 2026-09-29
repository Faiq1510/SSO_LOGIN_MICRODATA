<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Administrasi Digital | PT Microdata Indonesia</title>

    <!-- Google Fonts & Bootstrap Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <!-- CDN Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- CDN Three.js untuk Efek DNA 3D -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                        heading: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        tech: {
                            bg: '#04050e',
                            card: 'rgba(11, 19, 43, 0.65)',
                            purple: '#A855F7',
                            magenta: '#D946EF',
                            slate: '#64748B',
                            lightSlate: '#94A3B8',
                        }
                    },
                    animation: {
                        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'spin-slow': 'spin 30s linear infinite',
                        'spin-reverse': 'spin-reverse 25s linear infinite',
                    },
                    keyframes: {
                        'spin-reverse': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(-360deg)' },
                        }
                    }
                }
            }
        }
    </script>

    <style>
        body {
            background-color: #04050e;
        }

        /* Grid Pattern Background */
        .bg-tech-grid {
            background-size: 40px 40px;
            background-image:
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }

        /* Glassmorphism Effect */
        .glass-panel {
            background: rgba(15, 12, 29, 0.5);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Default Header Style (Penuh / Top 0) */
        .glass-nav-default {
            background: rgba(4, 5, 14, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            width: 100%;
            top: 0;
            border-radius: 0px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Floating Navbar Style Saat Di-Scroll Ke Bawah */
        .glass-nav-scrolled {
            background: rgba(10, 10, 26, 0.82);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.15);
            width: 90%;
            max-width: 1200px;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 9999px; /* Rounded pill mengambang */
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Solusi Teks Gradient Super Rapi & Anti-Terpotong */
        .text-clean-gradient {
            background: linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #e879f9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
            padding-bottom: 0.15em;
            margin-bottom: -0.15em;
            filter: drop-shadow(0px 0px 18px rgba(192, 132, 252, 0.35));
        }

        /* Glowing Neon Button */
        .btn-purple-magenta-glow {
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.45);
        }
        .btn-purple-magenta-glow:hover {
            box-shadow: 0 0 40px rgba(236, 72, 153, 0.65);
        }

        /* Outline Button */
        .btn-outline-custom {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .btn-outline-custom:hover {
            border-color: rgba(168, 85, 247, 0.5);
            background: rgba(168, 85, 247, 0.05);
        }
    </style>
</head>
<body class="bg-[#04050e] text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white relative min-h-screen overflow-x-hidden bg-tech-grid">

    <!-- Ambient Glow BG -->
    <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute top-[10%] right-[15%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[180px] animate-pulse-slow"></div>
        <div class="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-pink-900/15 rounded-full blur-[160px]"></div>
    </div>

    <!-- Header Navigation (Berubah Dinamis via JS) -->
    <header id="main-navbar" class="fixed z-50 glass-nav-default">
        <div id="navbar-container" class="max-w-7xl mx-auto px-6 lg:px-12 transition-all duration-300">
            <div id="navbar-inner" class="flex items-center justify-between h-20 transition-all duration-300">
                <!-- Brand Logo -->
                <a href="#" class="flex items-center gap-3 group">
                    <img src="{{ asset('images/microdata-logo.webp') }}"
                         alt="Logo PT Microdata Indonesia"
                         onerror="this.src='https://via.placeholder.com/200x60/000000/ffffff?text=MICRODATA';"
                         class="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105">
                </a>

                <!-- Nav Menu Links -->
                <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
                    <a href="#" class="hover:text-purple-400 transition-colors">Beranda</a>
                    <a href="#fitur" class="hover:text-purple-400 transition-colors">Fitur Utama</a>
                    <a href="#tentang" class="hover:text-purple-400 transition-colors">Tentang</a>
                </nav>

                <!-- Navigation Actions -->
                <div class="flex items-center space-x-3 sm:space-x-4">
                    @auth
                        <a href="{{ url('/dashboard') }}"
                           class="btn-purple-magenta-glow px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all transform hover:-translate-y-0.5">
                            Dashboard
                        </a>
                    @else
                        <a href="{{ route('login') }}"
                           class="hidden sm:inline-flex px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-300 btn-outline-custom transition-all">
                            Masuk
                        </a>
                        <a href="{{ route('register') }}"
                           class="btn-purple-magenta-glow px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all transform hover:-translate-y-0.5">
                            Daftar Akun
                        </a>
                    @endauth
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10">

        <!-- Hero Section -->
        <section class="pt-32 pb-16 lg:pt-40 lg:pb-24 min-h-screen flex items-center">
            <div class="max-w-7xl mx-auto px-6 lg:px-12 w-full">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                    <!-- Hero Left Content -->
                    <div class="lg:col-span-6 space-y-6 text-center lg:text-left z-20">

                        <!-- Top Tagline Badge -->
                        <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider">
                            MICRODATA INDONESIA
                        </div>

                        <!-- Main Heading -->
                        <h1 class="font-heading text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.25]">
                            Solusi <span class="text-clean-gradient">Arsip Digital</span><br>Masa Depan
                        </h1>

                        <!-- Description -->
                        <p class="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Kami mendampingi transformasi administrasi Anda — mulai dari pengelolaan surat masuk & keluar, hingga penomoran otomatis yang terstruktur, aman, dan siap skala.
                        </p>

                        <!-- Action Buttons -->
                        <div class="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <a href="{{ route('login') }}"
                               class="btn-purple-magenta-glow px-7 py-3.5 rounded-full font-bold text-white text-sm tracking-wide flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5">
                                <span>Akses Sistem Sekarang</span>
                                <i class="bi bi-arrow-right text-base"></i>
                            </a>
                            <a href="{{ route('login') }}"
                               class="px-7 py-3.5 rounded-full font-semibold text-slate-300 text-sm btn-outline-custom transition-all">
                                Masuk
                            </a>
                        </div>

                        <!-- Mini Stats Bar -->
                        <div class="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto lg:mx-0 text-left">
                            <div class="flex sm:block items-center gap-3">
                                <span class="block font-heading text-2xl sm:text-3xl font-extrabold text-white">99.9%</span>
                                <span class="text-xs text-slate-400">Keamanan Arsip</span>
                            </div>
                            <div class="flex sm:block items-center gap-3">
                                <span class="block font-heading text-2xl sm:text-3xl font-extrabold text-purple-400">Otomatis</span>
                                <span class="text-xs text-slate-400">Penomoran Surat</span>
                            </div>
                            <div class="flex sm:block items-center gap-3">
                                <span class="block font-heading text-2xl sm:text-3xl font-extrabold text-white">Real-Time</span>
                                <span class="text-xs text-slate-400">Pencarian Data</span>
                            </div>
                        </div>

                    </div>

                    <!-- Hero Right Visual (3D DNA & Glowing Rings) -->
                    <div class="lg:col-span-6 relative flex items-center justify-center min-h-[420px] sm:min-h-[500px]">

                        <!-- Glowing Halo Orbit Rings -->
                        <div class="absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full border border-purple-500/20 animate-spin-slow pointer-events-none"></div>
                        <div class="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border border-dashed border-pink-500/20 animate-spin-reverse pointer-events-none"></div>
                        <div class="absolute w-[260px] h-[260px] sm:w-[350px] sm:h-[350px] rounded-full border border-purple-400/10 pointer-events-none"></div>

                        <!-- 3D DNA Canvas Render -->
                        <div id="dna-container" class="relative z-10 w-full h-[400px] sm:h-[480px] flex items-center justify-center"></div>

                        <!-- Star/Sparkle Accent -->
                        <div class="absolute bottom-6 right-8 text-purple-400/40 text-3xl pointer-events-none animate-pulse">
                            <i class="bi bi-asterisk"></i>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="fitur" class="py-24 relative border-t border-white/5 bg-black/20">
            <div class="max-w-7xl mx-auto px-6 lg:px-12">

                <div class="text-center max-w-2xl mx-auto mb-16">
                    <span class="text-xs font-bold text-pink-400 uppercase tracking-widest block mb-2">— MODUL UTAMA</span>
                    <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-white">Fitur Unggulan Sistem</h2>
                    <p class="text-slate-400 text-sm mt-3">Arsitektur terpadu untuk efisiensi penuh pengelolaan dokumen perusahaan.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    <!-- Card 1 -->
                    <div class="glass-panel p-8 rounded-2xl relative group hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl mb-6 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            <i class="bi bi-inbox-fill"></i>
                        </div>
                        <h3 class="font-heading text-lg font-bold text-white mb-2">Surat Masuk</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">Pencatatan, pengkategorian, dan digitalisasi dokumen masuk secara terstruktur.</p>
                    </div>

                    <!-- Card 2 -->
                    <div class="glass-panel p-8 rounded-2xl relative group hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl mb-6 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            <i class="bi bi-send-fill"></i>
                        </div>
                        <h3 class="font-heading text-lg font-bold text-white mb-2">Surat Keluar</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">Manajemen draf, verifikasi berjenjang, dan riwayat pengiriman dokumen.</p>
                    </div>

                    <!-- Card 3 -->
                    <div class="glass-panel p-8 rounded-2xl relative group hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center text-xl mb-6 group-hover:bg-pink-500 group-hover:text-black transition-all">
                            <i class="bi bi-hash"></i>
                        </div>
                        <h3 class="font-heading text-lg font-bold text-white mb-2">Nomor Otomatis</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">Penomoran pintar yang mencegah duplikasi sesuai format standar perusahaan.</p>
                    </div>

                    <!-- Card 4 -->
                    <div class="glass-panel p-8 rounded-2xl relative group hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl mb-6 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            <i class="bi bi-search"></i>
                        </div>
                        <h3 class="font-heading text-lg font-bold text-white mb-2">Pencarian Pintar</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">Temukan arsip fisik & digital hanya dalam hitungan detik dengan filter cepat.</p>
                    </div>

                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="tentang" class="py-20">
            <div class="max-w-7xl mx-auto px-6 lg:px-12">
                <div class="glass-panel rounded-3xl p-8 sm:p-12 border border-purple-500/20 relative overflow-hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div class="lg:col-span-8 space-y-3 text-center lg:text-left">
                            <span class="text-xs font-bold text-purple-400 uppercase tracking-widest">— TENTANG PLATFORM</span>
                            <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-white">Optimalisasi Tata Kelola Administrasi Digital</h3>
                            <p class="text-slate-400 text-sm leading-relaxed">
                                Sistem Arsip Surat PT Microdata Indonesia dirancang untuk mentransformasi tata kelola berkas konvensional menuju ekosistem digital yang efisien, aman, dan dapat diakses dari mana saja secara terintegrasi.
                            </p>
                        </div>
                        <div class="lg:col-span-4 flex justify-center lg:justify-end">
                            <a href="{{ route('login') }}" class="btn-purple-magenta-glow px-8 py-3.5 rounded-full font-bold text-white text-sm tracking-wide transition-transform hover:scale-105">
                                Mulai Sekarang
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </main>

    <!-- Footer Section -->
    <footer class="bg-[#020308] border-t border-white/5 pt-16 pb-12 text-slate-400 relative z-10 text-sm font-sans">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">

            <!-- Grid Baris Atas: Deskripsi & Navigasi -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/5">

                <!-- Col 1: Logo & Deskripsi Singkat -->
                <div class="lg:col-span-4 space-y-4">
                    <a href="#" class="inline-block">
                        <img src="{{ asset('images/microdata-logo.webp') }}"
                             alt="Logo PT Microdata Indonesia"
                             onerror="this.src='https://via.placeholder.com/200x60/000000/ffffff?text=MICRODATA';"
                             class="h-10 sm:h-12 w-auto object-contain">
                    </a>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
                        Artificial intelligence, rekayasa perangkat lunak, dan solusi TI — berkantor di Jakarta dan Bandar Lampung.
                    </p>
                </div>

                <!-- Col 2: Perusahaan -->
                <div class="lg:col-span-2 space-y-3">
                    <h4 class="text-xs font-bold text-slate-200 uppercase tracking-widest font-heading">PERUSAHAAN</h4>
                    <ul class="space-y-2 text-xs">
                        <li><a href="#tentang" class="hover:text-purple-400 transition-colors">Tentang kami</a></li>
                        <li><a href="#fitur" class="hover:text-purple-400 transition-colors">Layanan</a></li>
                        <li><a href="#" class="hover:text-purple-400 transition-colors">Hubungi kami</a></li>
                    </ul>
                </div>

                <!-- Col 3: Kontak -->
                <div class="lg:col-span-3 space-y-4">
                    <h4 class="text-xs font-bold text-slate-200 uppercase tracking-widest font-heading">KONTAK</h4>
                    <div class="space-y-3 text-xs">
                        <!-- Email -->
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-sm shrink-0">
                                <i class="bi bi-envelope"></i>
                            </div>
                            <div>
                                <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">EMAIL</span>
                                <a href="mailto:microdataindonesia@gmail.com" class="text-white hover:text-purple-400 font-medium transition-colors">microdataindonesia@gmail.com</a>
                            </div>
                        </div>

                        <!-- Telepon -->
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-sm shrink-0">
                                <i class="bi bi-telephone"></i>
                            </div>
                            <div>
                                <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">TELEPON</span>
                                <a href="tel:08118880853" class="text-white hover:text-purple-400 font-medium transition-colors">0811-888-0853</a>
                            </div>
                        </div>

                        <!-- Situs Web -->
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-sm shrink-0">
                                <i class="bi bi-globe"></i>
                            </div>
                            <div>
                                <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">SITUS WEB</span>
                                <a href="https://microdataindonesia.co.id" target="_blank" class="text-white hover:text-purple-400 font-medium transition-colors">microdataindonesia.co.id</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Col 4: Informasi -->
                <div class="lg:col-span-3 space-y-3">
                    <h4 class="text-xs font-bold text-slate-200 uppercase tracking-widest font-heading">INFORMASI</h4>
                    <ul class="space-y-2 text-xs">
                        <li><a href="#" class="hover:text-purple-400 transition-colors">Kebijakan privasi</a></li>
                        <li><a href="#" class="hover:text-purple-400 transition-colors">Syarat layanan</a></li>
                    </ul>
                </div>

            </div>

            <!-- Bagian Tengah: Lokasi Kantor Kami -->
            <div class="py-10 border-b border-white/5">
                <h4 class="text-xs font-bold text-slate-200 uppercase tracking-widest font-heading mb-6">KANTOR KAMI</h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Card Kantor Jakarta -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-4">
                        <div class="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
                            <i class="bi bi-geo-alt"></i>
                        </div>
                        <div class="space-y-1 text-xs">
                            <h5 class="font-bold text-white text-sm">Jakarta</h5>
                            <p class="text-slate-400 leading-relaxed">
                                Jl. Cempaka Putih Barat 26 No.25a, RT.7/RW.3, Cemp. Putih Bar., Kec. Cemp. Putih, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10520
                            </p>
                            <a href="https://maps.app.goo.gl/HGTExSjtHN11TBpi6" target="_blank" class="inline-flex items-center gap-1 text-purple-400 hover:text-pink-400 font-semibold pt-2 transition-colors">
                                <span>Google Maps</span>
                                <i class="bi bi-arrow-up-right text-[10px]"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Card Kantor Bandar Lampung -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-4">
                        <div class="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
                            <i class="bi bi-geo-alt"></i>
                        </div>
                        <div class="space-y-1 text-xs">
                            <h5 class="font-bold text-white text-sm">Bandar Lampung</h5>
                            <p class="text-slate-400 leading-relaxed">
                                Jl. Endro Suratmin No.52d, Way Dadi, Kec. Sukarame, Kota Bandar Lampung, Lampung 35131
                            </p>
                            <a href="https://maps.app.goo.gl/HGTExSjtHN11TBpi6" target="_blank" class="inline-flex items-center gap-1 text-purple-400 hover:text-pink-400 font-semibold pt-2 transition-colors">
                                <span>Google Maps</span>
                                <i class="bi bi-arrow-up-right text-[10px]"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Baris Bawah: Copyright & Navigasi Bahasa/Sosmed -->
            <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <p>&copy; 2026 PT Microdata Indonesia. Hak cipta dilindungi undang-undang.</p>

                <div class="flex items-center gap-4">
                    <button class="btn-outline-custom px-4 py-1.5 rounded-full text-xs text-slate-300 inline-flex items-center gap-2 hover:border-purple-500/50">
                        <i class="bi bi-globe"></i>
                        <span>ID - Bahasa Indonesia</span>
                        <i class="bi bi-chevron-down text-[10px]"></i>
                    </button>

                    <button class="w-8 h-8 rounded-full btn-outline-custom flex items-center justify-center text-slate-300 hover:text-purple-400 transition-colors" title="Toggle Mode">
                        <i class="bi bi-sun"></i>
                    </button>

                    <a href="#" class="w-8 h-8 rounded-full btn-outline-custom flex items-center justify-center text-slate-300 hover:text-purple-400 transition-colors">
                        <i class="bi bi-linkedin"></i>
                    </a>
                </div>
            </div>

        </div>
    </footer>

    <!-- Floating WhatsApp Widget -->
    <a href="https://wa.me/628118880853" target="_blank" class="fixed bottom-6 right-6 z-50 w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-110">
        <i class="bi bi-whatsapp"></i>
    </a>

    <!-- Script JavaScript untuk Floating Navbar & 3D DNA -->
    <script>
        // Script 1: Dynamic Scroll Floating Navbar
        document.addEventListener('DOMContentLoaded', () => {
            const navbar = document.getElementById('main-navbar');
            const navInner = document.getElementById('navbar-inner');
            const navContainer = document.getElementById('navbar-container');

            window.addEventListener('scroll', () => {
                if (window.scrollY > 40) {
                    navbar.classList.remove('glass-nav-default');
                    navbar.classList.add('glass-nav-scrolled');
                    navInner.classList.remove('h-20');
                    navInner.classList.add('h-16'); // Menjadi lebih ramping saat melayang
                    navContainer.classList.remove('px-6', 'lg:px-12');
                    navContainer.classList.add('px-4', 'lg:px-8');
                } else {
                    navbar.classList.remove('glass-nav-scrolled');
                    navbar.classList.add('glass-nav-default');
                    navInner.classList.remove('h-16');
                    navInner.classList.add('h-20');
                    navContainer.classList.remove('px-4', 'lg:px-8');
                    navContainer.classList.add('px-6', 'lg:px-12');
                }
            });
        });

        // Script 2: Three.js Visual 3D Digital Archive & Document Network
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('dna-container');
            if (!container) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            // 1. Scene & Camera Setup
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.set(0, 0, 28);

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            // Group Utama
            const mainGroup = new THREE.Group();
            scene.add(mainGroup);

            // Warna Tema
            const colorPurple = 0xa855f7;
            const colorPink = 0xec4899;
            const colorCyan = 0x38bdf8;

            // 2. Membuat 3D Glowing Folder Base
            const folderGroup = new THREE.Group();

            // Sampul Belakang Folder
            const backGeo = new THREE.BoxGeometry(7, 5, 0.2);
            const glassMat = new THREE.MeshBasicMaterial({
                color: colorPurple,
                wireframe: true,
                transparent: true,
                opacity: 0.6
            });
            const folderBack = new THREE.Mesh(backGeo, glassMat);
            folderGroup.add(folderBack);

            // Sampul Depan Folder
            const frontGeo = new THREE.BoxGeometry(7, 4.5, 0.2);
            const frontMat = new THREE.MeshBasicMaterial({
                color: colorPink,
                wireframe: true,
                transparent: true,
                opacity: 0.8
            });
            const folderFront = new THREE.Mesh(frontGeo, frontMat);
            folderFront.position.set(0, -0.5, 1.2);
            folderFront.rotation.x = Math.PI / 8;
            folderGroup.add(folderFront);

            mainGroup.add(folderGroup);

            // 3. Dokumen Digital Melayang
            const docsGroup = new THREE.Group();
            const numDocs = 5;

            for (let i = 0; i < numDocs; i++) {
                const docGeo = new THREE.PlaneGeometry(3.5, 4.8);
                const docMat = new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? colorCyan : 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.35,
                    wireframe: true
                });
                const doc = new THREE.Mesh(docGeo, docMat);

                const angle = (i / numDocs) * Math.PI * 0.8 - 0.4;
                doc.position.set(Math.sin(angle) * 3, i * 1.1 - 1, Math.cos(angle) * 2 + 0.5);
                doc.rotation.y = angle * 0.5;
                doc.rotation.z = (i - 2) * -0.1;

                docsGroup.add(doc);
            }
            mainGroup.add(docsGroup);

            // 4. Floating Data Particles
            const particleCount = 60;
            const particlesGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 18;
                positions[i + 1] = (Math.random() - 0.5) * 18;
                positions[i + 2] = (Math.random() - 0.5) * 18;
            }

            particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const particleMat = new THREE.PointsMaterial({
                color: colorPink,
                size: 0.35,
                transparent: true,
                opacity: 0.8
            });

            const particleSystem = new THREE.Points(particlesGeo, particleMat);
            mainGroup.add(particleSystem);

            // 5. Cincin Orbit
            const ringGeo = new THREE.TorusGeometry(8.5, 0.05, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({
                color: colorPurple,
                transparent: true,
                opacity: 0.4
            });
            const orbitRing = new THREE.Mesh(ringGeo, ringMat);
            orbitRing.rotation.x = Math.PI / 3;
            mainGroup.add(orbitRing);

            mainGroup.rotation.z = -Math.PI / 12;
            mainGroup.rotation.x = Math.PI / 16;

            // 6. Loop Animasi Smooth
            function animate() {
                requestAnimationFrame(animate);
                mainGroup.rotation.y += 0.005;
                orbitRing.rotation.z -= 0.003;
                renderer.render(scene, camera);
            }
            animate();

            // Resize Responsive
            window.addEventListener('resize', () => {
                const newW = container.clientWidth;
                const newH = container.clientHeight;
                camera.aspect = newW / newH;
                camera.updateProjectionMatrix();
                renderer.setSize(newW, newH);
            });
        });
    </script>
</body>
</html>
