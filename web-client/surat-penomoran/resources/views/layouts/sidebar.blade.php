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