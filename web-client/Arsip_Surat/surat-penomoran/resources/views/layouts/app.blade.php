<!DOCTYPE html>
<html lang="id" class="dark">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', 'Dashboard') - Sistem Arsip Surat</title>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dark: {
                            bg: '#020617',
                            card: '#0f172a',
                            border: '#1e293b'
                        }
                    },
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                    }
                }
            }
        }
    </script>

    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet"
href="https://cdn.datatables.net/2.3.2/css/dataTables.dataTables.css">
<link rel="stylesheet"
href="https://cdn.datatables.net/searchbuilder/1.8.2/css/searchBuilder.dataTables.css">

<link rel="stylesheet"
href="https://cdn.datatables.net/searchpanes/2.3.2/css/searchPanes.dataTables.css">
<style>
/* IMPORTANT FIX: Menyembunyikan elemen Alpine.js x-cloak sebelum JS di-load untuk cegah popup otomatis */
[x-cloak] { display: none !important; }

/* =========================================================
   DataTables Dark Modern Theme (DataTables v2 Compatible)
   ========================================================= */
.dataTables_wrapper, .dt-container {
    color: #cbd5e1;
    font-size: 0.875rem;
    padding: 0.75rem 1rem 1.25rem 1rem;
    width: 100%;
    box-sizing: border-box;
}

/* Reset DataTables v2 layout row margins to remove excess gap */
div.dt-container div.dt-layout-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 0.25rem 0 !important;
    gap: 0.75rem;
}

div.dt-container div.dt-layout-row.dt-layout-table {
    margin: 0.25rem 0 !important;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
}

/* Top Controls Header Bar */
.dataTables_wrapper .dataTables_length,
.dt-container .dt-length {
    float: left;
    margin-bottom: 0.35rem !important;
}

.dataTables_wrapper .dataTables_filter,
.dt-container .dt-search {
    float: right;
    margin-bottom: 0.35rem !important;
}

.dataTables_wrapper .dataTables_length label,
.dataTables_wrapper .dataTables_filter label,
.dt-container .dt-length label,
.dt-container .dt-search label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.85rem;
}

/* Search Field */
.dataTables_wrapper .dataTables_filter input,
.dt-container .dt-search input {
    background-color: #020617 !important; /* slate-950 */
    color: #f8fafc !important;
    border: 1px solid #334155 !important; /* slate-700 */
    border-radius: 0.75rem !important;
    padding: 0.4rem 0.85rem !important;
    font-size: 0.85rem !important;
    outline: none !important;
    transition: all 0.2s ease-in-out;
    max-width: 100%;
}

.dataTables_wrapper .dataTables_filter input:focus,
.dt-container .dt-search input:focus {
    border-color: #6366f1 !important; /* indigo-500 */
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25) !important;
}

/* Length Dropdown Select */
.dataTables_wrapper .dataTables_length select,
.dt-container .dt-length select {
    background-color: #020617 !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
    border-radius: 0.75rem !important;
    padding: 0.35rem 0.75rem !important;
    font-size: 0.85rem !important;
    outline: none !important;
    cursor: pointer;
}

.dataTables_wrapper .dataTables_length select:focus,
.dt-container .dt-length select:focus {
    border-color: #6366f1 !important;
}

/* Main Table Styling */
table.dataTable {
    width: 100% !important;
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    border: none !important;
    margin-top: 0.25rem !important;
    margin-bottom: 0.75rem !important;
}

table.dataTable thead th {
    background-color: #0f172a !important; /* slate-900 */
    color: #94a3b8 !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #334155 !important;
    padding: 0.75rem 0.85rem !important;
    white-space: nowrap;
}

table.dataTable tbody td {
    background-color: transparent !important;
    color: #cbd5e1;
    padding: 0.75rem 0.85rem !important;
    border-bottom: 1px solid #1e293b !important;
    vertical-align: middle;
}

table.dataTable tbody tr {
    transition: background-color 0.15s ease-in-out;
}

table.dataTable tbody tr:hover {
    background-color: rgba(30, 41, 59, 0.5) !important; /* slate-800/50 */
}

/* Bottom Controls Footer Bar */
.dataTables_wrapper .dataTables_info,
.dt-container .dt-info {
    color: #94a3b8 !important;
    font-size: 0.85rem !important;
    padding-top: 0.75rem !important;
    float: left;
}

.dataTables_wrapper .dataTables_paginate,
.dt-container .dt-paging {
    float: right;
    padding-top: 0.75rem !important;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.dataTables_wrapper .dataTables_paginate .paginate_button,
.dt-container .dt-paging .dt-paging-button {
    background-color: #1e293b !important;
    color: #94a3b8 !important;
    border-radius: 0.6rem !important;
    border: 1px solid #334155 !important;
    margin: 0 2px !important;
    padding: 0.35rem 0.75rem !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s ease-in-out;
}

.dataTables_wrapper .dataTables_paginate .paginate_button:hover,
.dt-container .dt-paging .dt-paging-button:hover {
    background-color: #334155 !important;
    color: #ffffff !important;
    border-color: #475569 !important;
}

.dataTables_wrapper .dataTables_paginate .paginate_button.current,
.dt-container .dt-paging .dt-paging-button.current,
.dt-container .dt-paging .dt-paging-button.current:hover {
    background-color: #4f46e5 !important; /* indigo-600 */
    color: #ffffff !important;
    border-color: #6366f1 !important;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.dataTables_wrapper .dataTables_paginate .paginate_button.disabled,
.dt-container .dt-paging .dt-paging-button.disabled {
    opacity: 0.4;
    cursor: not-allowed !important;
}

/* Clearfix for float layout */
.dataTables_wrapper::after,
.dt-container::after {
    content: "";
    clear: both;
    display: table;
}

/* Mobile Responsiveness for DataTables */
@media (max-width: 640px) {
    .dataTables_wrapper, .dt-container {
        padding: 0.5rem 0.5rem 1rem 0.5rem;
    }

    div.dt-container div.dt-layout-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 0.6rem !important;
    }

    .dataTables_wrapper .dataTables_length,
    .dt-container .dt-length,
    .dataTables_wrapper .dataTables_filter,
    .dt-container .dt-search,
    .dataTables_wrapper .dataTables_info,
    .dt-container .dt-info,
    .dataTables_wrapper .dataTables_paginate,
    .dt-container .dt-paging {
        float: none !important;
        width: 100% !important;
        justify-content: center !important;
        text-align: center !important;
    }

    .dataTables_wrapper .dataTables_length label,
    .dt-container .dt-length label,
    .dataTables_wrapper .dataTables_filter label,
    .dt-container .dt-search label {
        width: 100% !important;
        justify-content: space-between !important;
    }

    .dataTables_wrapper .dataTables_filter input,
    .dt-container .dt-search input {
        flex: 1;
        width: auto !important;
        min-width: 0 !important;
    }

    .dt-container .dt-paging {
        justify-content: center !important;
        gap: 0.2rem !important;
    }
}

/* Smooth Touch Scrolling */
.overflow-x-auto {
    -webkit-overflow-scrolling: touch;
}
</style>

<!-- SweetAlert2 -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    @stack('styles')
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white min-h-screen">

    <!-- Top Navbar -->
    <header class="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 z-40 flex items-center justify-between px-3 sm:px-6">
        <div class="flex items-center gap-2.5 sm:gap-3">
            <!-- Sidebar Toggle Button (Mobile) -->
            <button id="toggleSidebar" aria-label="Toggle Navigation" class="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition focus:outline-none">
                <i class="fa-solid fa-bars text-lg"></i>
            </button>

            <a href="{{ route('dashboard') }}" class="flex items-center gap-2 sm:gap-2.5">
                <i class="fa-solid fa-box-archive text-indigo-500 text-lg sm:text-xl"></i>
                <span class="font-bold text-base sm:text-lg tracking-tight text-white inline-block">Sistem Arsip</span>
            </a>
        </div>

        <!-- User Profile Dropdown / Logout -->
        <div class="flex items-center gap-2 sm:gap-4">
            <div class="flex items-center gap-2 sm:gap-3 bg-slate-800/50 border border-slate-700/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
                <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {{ strtoupper(substr(Auth::user()->name ?? 'U', 0, 1)) }}
                </div>
                <span class="text-xs sm:text-sm font-medium text-slate-200 hidden sm:inline max-w-[120px] sm:max-w-[160px] truncate">{{ Auth::user()->name ?? 'User' }}</span>
                <form method="POST" action="{{ route('logout') }}" class="inline">
                    @csrf
                    <button type="submit" title="Logout" class="text-slate-400 hover:text-rose-400 transition-colors p-1">
                        <i class="fa-solid fa-right-from-bracket text-xs"></i>
                    </button>
                </form>
            </div>
        </div>
    </header>

    <!-- Overlay Backdrop for Mobile Sidebar -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 hidden md:hidden transition-opacity"></div>

    <!-- Sidebar Navigation -->
    <aside id="sidebar" class="fixed top-16 left-0 bottom-0 w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 z-30 transition-transform -translate-x-full md:translate-x-0 overflow-y-auto">
        <div class="p-4 space-y-4">

            <!-- Brand Logo Inside Sidebar -->
            <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl flex items-center justify-center shadow-md">
                <img src="{{ asset('images/microdata-logo.webp') }}"
                     alt="Microdata Indonesia"
                     class="h-9 w-auto object-contain">
            </div>

            <!-- Navigation Links -->
            <nav class="space-y-3 text-sm">

                <!-- Dashboard -->
                <a href="{{ route('dashboard') }}"
                   class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all {{ request()->routeIs('dashboard') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' }}">
                    <i class="fa-solid fa-chart-pie w-5 text-center text-indigo-400"></i>
                    <span>Dashboard</span>
                </a>

                <!-- Data Master Group Dropdown -->
                <div x-data="{ open: {{ request()->routeIs('instansi.*', 'jenis_surat.*') ? 'true' : 'false' }} }" class="space-y-1">
                    <button @click="open = !open"
                            type="button"
                            class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 tracking-wide uppercase transition-all hover:bg-slate-800/40">
                        <span class="flex items-center gap-2.5">
                            <i class="fa-solid fa-table-cells text-slate-400 text-sm"></i>
                            <span>DATA MASTER</span>
                        </span>
                        <i class="fa-solid fa-chevron-right text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-90': open }"></i>
                    </button>

                    <div x-show="open" x-transition class="ml-4 pl-3 border-l border-slate-800 space-y-1 font-mono text-xs">
                        <!-- Data Instansi -->
                        <a href="{{ route('instansi.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('instansi.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">├─</span>
                            <span>Data Instansi</span>
                        </a>
                        <!-- Data Jenis Surat -->
                        <a href="{{ route('jenis_surat.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('jenis_surat.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">└─</span>
                            <span>Data Jenis Surat</span>
                        </a>
                    </div>
                </div>

                <!-- Manajemen Surat Group Dropdown -->
                <div x-data="{ open: {{ request()->routeIs('surat_masuk.*', 'surat_keluar.*', 'arsip.*', 'laporan.*') ? 'true' : 'false' }} }" class="space-y-1">
                    <button @click="open = !open"
                            type="button"
                            class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 tracking-wide uppercase transition-all hover:bg-slate-800/40">
                        <span class="flex items-center gap-2.5">
                            <i class="fa-solid fa-paper-plane text-slate-400 text-sm"></i>
                            <span>MANAJEMEN SURAT</span>
                        </span>
                        <i class="fa-solid fa-chevron-right text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-90': open }"></i>
                    </button>

                    <div x-show="open" x-transition class="ml-4 pl-3 border-l border-slate-800 space-y-1 font-mono text-xs">
                        <!-- Surat Masuk -->
                        <a href="{{ route('surat_masuk.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('surat_masuk.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">├─</span>
                            <span>Surat Masuk</span>
                        </a>
                        <!-- Surat Keluar -->
                        <a href="{{ route('surat_keluar.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('surat_keluar.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">├─</span>
                            <span>Surat Keluar</span>
                        </a>
                        <!-- Arsip Surat -->
                        <a href="{{ route('arsip.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('arsip.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">├─</span>
                            <span>Arsip Surat</span>
                        </a>
                        <!-- Laporan -->
                        <a href="{{ route('laporan.index') }}"
                           class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all {{ request()->routeIs('laporan.*') ? 'bg-indigo-600 text-white font-sans font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-sans font-medium' }}">
                            <span class="text-slate-500 font-mono">└─</span>
                            <span>Laporan</span>
                        </a>
                    </div>
                </div>

                <hr class="border-slate-800/80 my-2">

                <!-- Pengaturan Akun -->
                <a href="{{ route('akun.index') }}"
                   class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all {{ request()->routeIs('akun.*') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' }}">
                    <i class="fa-solid fa-users w-5 text-center text-indigo-400"></i>
                    <span>Pengaturan Akun</span>
                </a>

                <!-- Tempat Sampah -->
                <a href="{{ route('recycle-bin.index') }}"
                   class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all {{ request()->routeIs('recycle-bin.*') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' }}">
                    <i class="fa-solid fa-trash-can w-5 text-center text-rose-400"></i>
                    <span>Tempat Sampah</span>
                </a>

            </nav>
        </div>
    </aside>



    <!-- Main Content Container -->
    <main class="pt-20 pb-10 md:pl-64 transition-all w-full min-h-screen overflow-x-hidden">
        <div class="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            @yield('content')
        </div>
    </main>

    <!-- Mobile Sidebar Backdrop & Toggle Script -->
    <script>
        const toggleBtn = document.getElementById('toggleSidebar');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');

        function openMenu() {
            if (sidebar && backdrop) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
                document.body.classList.add('overflow-hidden', 'md:overflow-auto');
            }
        }

        function closeMenu() {
            if (sidebar && backdrop) {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
                document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
            }
        }

        function toggleMenu() {
            if (sidebar && sidebar.classList.contains('-translate-x-full')) {
                openMenu();
            } else {
                closeMenu();
            }
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleMenu);
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeMenu);
        }

        // Close sidebar on mobile when clicking nav links
        if (sidebar) {
            const navLinks = sidebar.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        closeMenu();
                    }
                });
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && window.innerWidth < 768) {
                closeMenu();
            }
        });
    </script>

    <!-- Flash Alert Handler (SweetAlert2) -->
    <script>
        @if (session('success'))
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: "{{ session('success') }}",
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#6366f1'
            });
        @endif

        @if (session('error'))
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: "{{ session('error') }}",
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#6366f1'
            });
        @endif
    </script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script src="https://cdn.datatables.net/2.3.2/js/dataTables.js"></script>
<script src="https://cdn.datatables.net/searchbuilder/1.8.2/js/dataTables.searchBuilder.js"></script>

<script src="https://cdn.datatables.net/searchpanes/2.3.2/js/dataTables.searchPanes.js"></script>
    @stack('scripts')


</body>
</html>
