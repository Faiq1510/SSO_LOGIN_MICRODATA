@extends('layouts.app')

@section('title', 'Tambah Surat Keluar')

@section('content')

@php
    $oldDk = old('data_khusus', []);
    $oldKegiatan = old('data_khusus.kegiatan_items');
    $kegiatanItems = is_array($oldKegiatan) ? array_values($oldKegiatan) : [''];
    if (empty($kegiatanItems)) $kegiatanItems = [''];

    $oldHeaders = old('data_khusus.table_headers');
    $tableHeaders = is_array($oldHeaders) ? $oldHeaders : ['No', 'Uraian / Kegiatan', 'Jumlah', 'Keterangan'];

    $oldRows = old('data_khusus.table_rows');
    $tableRows = is_array($oldRows) ? $oldRows : [
        ['1', 'Contoh item kegiatan / barang A', '1 Paket', 'Terlampir'],
        ['2', 'Contoh item kegiatan / barang B', '2 Unit', 'Lengkap']
    ];

    $defaultTujuan = isset($suratMasuk) ? $suratMasuk->pengirim : '';
    $defaultPerihal = isset($suratMasuk) ? 'Balasan: ' . $suratMasuk->perihal : '';
    $defaultInstansiId = isset($suratMasuk) ? $suratMasuk->instansi_id : '';
@endphp

<style>
    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1) brightness(2) !important;
        cursor: pointer !important;
        opacity: 0.9 !important;
    }
    [x-cloak] { display: none !important; }
  .a4-paper {
    width: 100%;
    height: 297mm;
    min-height: 297mm;
    max-height: 297mm;

    box-sizing: border-box;

    background: white;
    color: #000;
    font-family: "Times New Roman", Times, serif;

    display: flex;
    flex-direction: column;

    overflow: hidden;
}
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #020617;
        border-radius: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6366f1;
    }
</style>

<div class="max-w-[1700px] mx-auto"
     x-data="{
        jenisSuratList: {{ json_encode($jenisSuratList) }},
        jenis_surat: @js(old('jenis_surat', '')),
        kode_surat: '',
        kode_divisi: @js(old('kode_divisi', 'HRD')),
        instansi_id: @js(old('instansi_id', (string)$defaultInstansiId)),
        instansi_nama: '',
        tanggal_surat: @js(old('tanggal_surat', date('Y-m-d'))),
        tujuan: @js(old('tujuan', $defaultTujuan)),
        perihal: @js(old('perihal', $defaultPerihal)),
        isi_surat: @js(old('isi_surat', '')),
        lampiran: @js(old('lampiran', '')),
        status: @js(old('status', 'Draft')),
        penandatangan: @js(old('penandatangan', 'DIREKTUR UTAMA')),
        jabatan_penandatangan: @js(old('jabatan_penandatangan', 'PT Microdata Indonesia')),

        tipe_form: @js(old('tipe_form', 'umum')),
        isKuasa: false,

        setTipeForm(type) {
            this.tipe_form = type;
            this.isKuasa = (type === 'kuasa');
            if (this.isKuasa && (!this.kode_surat || this.kode_surat === '')) {
                this.kode_surat = 'SK';
            }
            if (this.isKuasa && (!this.perihal || this.perihal.trim() === '' || this.perihal === 'SURAT KELUAR')) {
                this.perihal = 'SURAT KUASA';
            }
            this.fetchNextNomor();
        },

        // Nomor surat preview (diisi via fetch ke server)
        nomorUrut: '...',

        // Data Khusus Surat Kuasa (Struktur Gambar) & Surat Umum Tabel
        dataKhusus: {
            pemberi: {
                nama: @js(old('data_khusus.pemberi.nama', '')),
                jabatan: @js(old('data_khusus.pemberi.jabatan', '')),
                alamat: @js(old('data_khusus.pemberi.alamat', ''))
            },
            penerima: {
                nama: @js(old('data_khusus.penerima.nama', '')),
                jabatan: @js(old('data_khusus.penerima.jabatan', '')),
                alamat: @js(old('data_khusus.penerima.alamat', ''))
            },
            pembuka_maksud: @js(old('data_khusus.pembuka_maksud', 'mewakili Direktur untuk melaksanakan Pembuktian Kualifikasi')),
            kegiatan_items: {{ json_encode($kegiatanItems) }},
            lokasi_instansi: @js(old('data_khusus.lokasi_instansi', '')),
            penutup: @js(old('data_khusus.penutup', 'Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.')),
            kota_tanggal: @js(old('data_khusus.kota_tanggal', '')),

            // Builder Tabel Surat Umum
            has_table: {{ old('data_khusus.has_table') ? 'true' : 'false' }},
            table_title: @js(old('data_khusus.table_title', '')),
            table_headers: {{ json_encode($tableHeaders) }},
            table_rows: {{ json_encode($tableRows) }},
            isi_setelah_tabel: @js(old('data_khusus.isi_setelah_tabel', ''))
        },

        addKegiatanItem() {
            this.dataKhusus.kegiatan_items.push('');
        },
        removeKegiatanItem(idx) {
            if (this.dataKhusus.kegiatan_items.length > 1) {
                this.dataKhusus.kegiatan_items.splice(idx, 1);
            } else {
                this.dataKhusus.kegiatan_items[0] = '';
            }
        },

        addTableHeader() {
            this.dataKhusus.table_headers.push('Header Baru');
            this.dataKhusus.table_rows.forEach(r => r.push('-'));
        },
        removeTableHeader(idx) {
            if (this.dataKhusus.table_headers.length > 1) {
                this.dataKhusus.table_headers.splice(idx, 1);
                this.dataKhusus.table_rows.forEach(r => r.splice(idx, 1));
            }
        },
        addTableRow() {
            const newR = this.dataKhusus.table_headers.map((_, i) => i === 0 ? (this.dataKhusus.table_rows.length + 1).toString() : '');
            this.dataKhusus.table_rows.push(newR);
        },
        removeTableRow(idx) {
            if (this.dataKhusus.table_rows.length > 1) {
                this.dataKhusus.table_rows.splice(idx, 1);
            }
        },

        updateInstansiNama(el) {
            if (el && el.selectedIndex >= 0) {
                const optText = el.options[el.selectedIndex].text;
                this.instansi_nama = optText.startsWith('--') ? '' : optText;
            }
        },

        updateJenisSurat() {
            const val = this.jenis_surat || '';
            const found = Array.isArray(this.jenisSuratList) ? this.jenisSuratList.find(j => j.nama === val) : null;
            if (found) {
                this.kode_surat = found.kode_surat || '';
                const formType = (found.form_type || '').toLowerCase();
                if (formType === 'kuasa' || formType === 'umum') {
                    this.setTipeForm(formType);
                } else if (val.toLowerCase().includes('kuasa')) {
                    this.setTipeForm('kuasa');
                }
            } else {
                const isK = val.toLowerCase().includes('kuasa');
                if (isK) {
                    this.setTipeForm('kuasa');
                }
            }

            this.fetchNextNomor();
        },

        formatTanggal(val) {
            if (!val) return '-';
            const parts = val.split('-');
            if (parts.length !== 3) return val;
            const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const blnIdx = parseInt(parts[1], 10);
            return parseInt(parts[2], 10) + ' ' + (bulan[blnIdx] || '') + ' ' + parts[0];
        },

        async fetchNextNomor() {
            const kode = this.kode_surat || 'SK';
            const div  = this.kode_divisi || 'HRD';
            const tgl  = this.tanggal_surat || '';
            try {
                const res = await fetch(
                    `{{ route('surat_keluar.next_nomor') }}?kode_surat=${encodeURIComponent(kode)}&kode_divisi=${encodeURIComponent(div)}&tanggal_surat=${encodeURIComponent(tgl)}`,
                    { headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' } }
                );
                if (res.ok) {
                    const data = await res.json();
                    this.nomorUrut = data.nomor ?? '...';
                }
            } catch(e) {
                // Fallback bila fetch gagal
                const romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
                const d = new Date(this.tanggal_surat || Date.now());
                this.nomorUrut = '01/' + kode + '/' + div + '/PT-MDI/' + (romawi[d.getMonth()] || 'I') + '/' + d.getFullYear();
            }
        },

        get previewNomor() {
            return this.nomorUrut;
        },

       downloadPreviewPdf() {
    const element = document.getElementById('surat-keluar-preview-paper');

    const opt = {
        margin: 0,

        filename: 'Surat_Keluar_Preview.pdf',

        image: {
            type: 'jpeg',
            quality: 0.98
        },

        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0
        },

        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },

        pagebreak: {
            mode: ['avoid-all']
        }
    };

    html2pdf()
        .set(opt)
        .from(element)
        .save();
}
     }"
     x-init="$nextTick(() => {
        $watch('jenis_surat', () => updateJenisSurat());
        $watch('kode_divisi', () => fetchNextNomor());
        $watch('tanggal_surat', () => fetchNextNomor());
        const selInstansi = document.getElementById('instansi_select');
        if (selInstansi) updateInstansiNama(selInstansi);
        updateJenisSurat();
     })">

    {{-- Notification if saved --}}
    @if(session('surat_tersimpan'))
        @php($suratBaru = session('surat_tersimpan'))
        <div x-data="{ openKirim: false }" class="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
                <p class="text-emerald-400 font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-circle-check"></i>
                    Surat keluar berhasil disimpan
                </p>
                <p class="text-sm text-slate-400 mt-1">
                    Nomor Surat: <span class="text-slate-200 font-medium">{{ $suratBaru->nomor_surat }}</span>
                </p>
            </div>
            <div class="flex items-center gap-3">

                {{-- Preview --}}
                <a href="{{ route('surat_keluar.preview', $suratBaru->id) }}" target="_blank"
                   class="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition flex items-center gap-2">
                    <i class="fa-solid fa-eye"></i> Preview
                </a>

                {{-- Dropdown Kirim --}}
                <div class="relative" @click.outside="openKirim = false">
                    <button type="button" @click="openKirim = !openKirim"
                            class="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition flex items-center gap-2">
                        <i class="fa-solid fa-share-nodes"></i>
                        Kirim Surat
                        <i class="fa-solid fa-chevron-down text-xs" :class="openKirim ? 'rotate-180' : ''"
                           style="transition: transform .2s"></i>
                    </button>
                    <div x-show="openKirim" x-cloak
                         class="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1">

                        {{-- Kirim via Email --}}
                        <button type="button"
                                @click="$dispatch('open-modal-email-notif-{{ $suratBaru->id }}'); openKirim = false"
                                class="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
                            <i class="fa-solid fa-envelope text-indigo-400 w-4"></i>
                            Kirim ke Email
                        </button>

                        {{-- Kirim via WhatsApp --}}
                        <button type="button"
                                @click="$dispatch('open-modal-wa-notif-{{ $suratBaru->id }}'); openKirim = false"
                                class="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
                            <i class="fa-brands fa-whatsapp text-emerald-400 w-4"></i>
                            Kirim ke WhatsApp
                        </button>
                    </div>
                </div>

            </div>
        </div>

        {{-- Modal Email (notifikasi sukses) --}}
        <div x-data="{ show: false }"
             @open-modal-email-notif-{{ $suratBaru->id }}.window="show = true"
             x-show="show" x-cloak style="display: none;"
             class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/60" @click="show = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6">
                <h3 class="text-base font-semibold text-white mb-1">Kirim Surat via Email</h3>
                <p class="text-sm text-slate-400 mb-4">
                    Masukkan alamat email tujuan, surat akan dikirim beserta lampiran PDF-nya.
                </p>
                <form action="{{ route('surat_keluar.send.email', $suratBaru->id) }}" method="POST">
                    @csrf
                    <label class="block text-sm font-medium text-slate-300 mb-1">Alamat Email</label>
                    <input type="email" name="email" required placeholder="nama@contoh.com"
                           class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4">
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="show = false"
                                class="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 transition">Batal</button>
                        <button type="submit"
                                class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Kirim</button>
                    </div>
                </form>
            </div>
        </div>

        {{-- Modal WhatsApp (notifikasi sukses) --}}
        <div x-data="{ show: false }"
             @open-modal-wa-notif-{{ $suratBaru->id }}.window="show = true"
             x-show="show" x-cloak style="display: none;"
             class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/60" @click="show = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6">
                <h3 class="text-base font-semibold text-white mb-1">Kirim Surat ke WhatsApp</h3>
                <p class="text-sm text-slate-400 mb-4">Surat akan dikirim beserta file PDF-nya.</p>
                <form action="{{ route('surat_keluar.send.whatsapp', $suratBaru->id) }}" method="POST">
                    @csrf
                    <label class="block text-sm font-medium text-slate-300 mb-1">Nomor WhatsApp</label>
                    <input type="text" name="nomor_wa" required placeholder="08xxxxxxxxxx"
                           class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4">
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="show = false"
                                class="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 transition">Batal</button>
                        <button type="submit"
                                class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">Kirim</button>
                    </div>
                </form>
            </div>
        </div>

    @endif

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 sm:gap-3">
                <i class="fa-solid fa-paper-plane text-indigo-500"></i>
                Tambah Surat Keluar
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">
                Form <span class="text-indigo-400 font-semibold">Surat Keluar</span> — pratinjau A4 real-time.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="{{ route('surat_keluar.index') }}"
               class="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition inline-flex items-center justify-center gap-2 border border-slate-700">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Kembali</span>
            </a>
        </div>
    </div>

    {{-- Resizable Split Container (Equal Height with Independent Scrolling) --}}
    <div class="flex flex-col lg:flex-row items-stretch relative w-full gap-0 lg:h-[calc(100vh-8rem)] lg:min-h-[600px]"
         x-data="resizableSplit('split_pos_surat_keluar', 50)"
         x-ref="splitContainer"
         :class="{ 'select-none': isDragging }">

        {{-- LEFT COLUMN: FORM INPUTS (Independent Scroll) --}}
        <div class="w-full shrink-0 flex flex-col lg:h-full lg:overflow-hidden"
             :style="isDesktop ? { width: leftWidth + '%', minWidth: '320px' } : { width: '100%' }">

            <div class="flex-1 lg:overflow-y-auto custom-scrollbar space-y-6 pr-0 lg:pr-2">

                {{-- Mode Indicator Card --}}
                <div class="p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between"
                 :class="isKuasa ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                         :class="isKuasa ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'">
                        <i :class="isKuasa ? 'fa-solid fa-file-signature' : 'fa-solid fa-file-lines'"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm" x-text="isKuasa ? 'Surat Kuasa — Dual Penandatangan' : 'Surat Umum — Standar & Tabel Fleksibel'"></h4>
                        <p class="text-xs opacity-80" x-text="isKuasa ? 'Pemberi → Penerima → Maksud → Kegiatan → 2 Tanda Tangan' : 'Isi surat standar dengan opsi tabel fleksibel'"></p>
                    </div>
                </div>
            </div>

            @if(isset($suratMasuk))
                <div class="mb-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between text-sky-300">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-reply text-lg"></i>
                        <div>
                            <p class="text-sm font-semibold">Membalas Surat Masuk</p>
                            <p class="text-xs text-sky-400">Nomor: <span class="font-bold">{{ $suratMasuk->nomor_surat }}</span> (Pengirim: {{ $suratMasuk->pengirim }})</p>
                        </div>
                    </div>
                    <span class="text-xs bg-sky-500/20 px-3 py-1 rounded-full font-medium">Terhubung</span>
                </div>
            @endif

            <form action="{{ route('surat_keluar.store') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <input type="hidden" name="surat_masuk_id" value="{{ old('surat_masuk_id', $suratMasuk->id ?? '') }}">
                <input type="hidden" name="tipe_form" :value="tipe_form">



                {{-- CARD 1: INFORMASI KEPALA SURAT --}}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                        <h2 class="text-base font-bold text-white flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
                            Informasi Dasar Surat
                        </h2>
                    </div>

                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        {{-- Jenis Surat + Modal Tambah --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Jenis Surat <span class="text-rose-500">*</span>
                            </label>
                            <div class="flex gap-2">
                                <select name="jenis_surat" id="jenis_surat" required
                                        x-model="jenis_surat"
                                        @change="updateJenisSurat()"
                                        class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">-- Pilih Jenis Surat --</option>
                                    @foreach($jenisSuratList as $jenis)
                                        <option value="{{ $jenis->nama }}"
                                            data-kode="{{ $jenis->kode_surat }}"
                                            data-form="{{ $jenis->form_type }}"
                                            {{ old('jenis_surat') == $jenis->nama ? 'selected' : '' }}>
                                            {{ $jenis->nama }} ({{ $jenis->kode_surat }})
                                        </option>
                                    @endforeach
                                </select>
                                <button type="button" @click="$dispatch('open-modal-jenis-surat')"
                                    title="Tambah Jenis Surat Baru"
                                    class="shrink-0 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        {{-- Kode Surat (Otomatis) --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Kode Surat
                            </label>
                            <input type="text" name="kode_surat" x-model="kode_surat" readonly
                                   placeholder="Otomatis dari Jenis Surat"
                                   class="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-300 outline-none cursor-not-allowed">
                        </div>

                        {{-- Kode Divisi --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Divisi Pengirim <span class="text-rose-500">*</span>
                            </label>
                            <select name="kode_divisi" required x-model="kode_divisi"
                                    @change="fetchNextNomor()"
                                    class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="HRD">HRD</option>
                                <option value="DIR-I">Direktur I</option>
                                <option value="DIR-II">Direktur II</option>
                                <option value="DIR-III">Direktur III</option>
                                <option value="KOM">Komisaris</option>
                                <option value="IT">IT & Software</option>
                                <option value="OPS">Operasional</option>
                            </select>
                        </div>

                        {{-- Tanggal Surat --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Tanggal Surat <span class="text-rose-500">*</span>
                            </label>
                            <input type="date" name="tanggal_surat" required x-model="tanggal_surat"
                                   @change="fetchNextNomor()"
                                   class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                        </div>

                        {{-- Instansi (Penanda di Tabel Data, bukan isi surat) --}}
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Instansi Tujuan
                                <span class="ml-2 text-xs font-normal text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <i class="fa-solid fa-tag text-indigo-400 text-[10px]"></i>
                                    Penanda di Tabel Data
                                </span>
                            </label>
                            <select name="instansi_id" id="instansi_select" x-model="instansi_id" @change="updateInstansiNama($event.target)"
                                    class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">-- Tanpa Instansi / Bebas --</option>
                                @foreach($instansis as $instansi)
                                    <option value="{{ $instansi->id }}" {{ old('instansi_id') == $instansi->id ? 'selected' : '' }}>
                                        {{ $instansi->nama_instansi }}
                                    </option>
                                @endforeach
                            </select>

                        </div>

                    </div>
                </div>

                {{-- CARD 2: ISIAN KHUSUS SURAT KUASA (MENGIKUTI STRUKTUR GAMBAR TOP-TO-BOTTOM) --}}
                <template x-if="isKuasa">
                    <div class="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div class="border-b border-amber-500/20 px-6 py-4 bg-amber-500/5 flex items-center justify-between">
                            <h2 class="text-base font-bold text-amber-300 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                                Isi Surat Kuasa
                            </h2>
                            <span class="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-medium">Surat Kuasa</span>
                        </div>

                        <div class="p-6 space-y-6">

                            {{-- SECTION A: PEMBERI KUASA --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <i class="fa-solid fa-user-tie text-amber-400"></i>
                                    1. Pemberi Kuasa
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap & Gelar <span class="text-rose-500">*</span></label>
                                        <input type="text" name="data_khusus[pemberi][nama]" x-model="dataKhusus.pemberi.nama" required
                                               placeholder="Contoh: Budi Setyadi S,Kom"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Jabatan <span class="text-rose-500">*</span></label>
                                        <input type="text" name="data_khusus[pemberi][jabatan]" x-model="dataKhusus.pemberi.jabatan" required
                                               placeholder="Jabatan Pemberi Kuasa"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Alamat</label>
                                        <input type="text" name="data_khusus[pemberi][alamat]" x-model="dataKhusus.pemberi.alamat"
                                               placeholder="Alamat lengkap pemberi kuasa"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- SECTION B: PENERIMA KUASA --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <i class="fa-solid fa-user text-indigo-400"></i>
                                    2. Penerima Kuasa
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap <span class="text-rose-500">*</span></label>
                                        <input type="text" name="data_khusus[penerima][nama]" x-model="dataKhusus.penerima.nama" required
                                               placeholder="Nama penerima kuasa"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Jabatan <span class="text-rose-500">*</span></label>
                                        <input type="text" name="data_khusus[penerima][jabatan]" x-model="dataKhusus.penerima.jabatan" required
                                               placeholder="Jabatan penerima kuasa"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Alamat (Opsional)</label>
                                        <input type="text" name="data_khusus[penerima][alamat]" x-model="dataKhusus.penerima.alamat"
                                               placeholder="Alamat penerima (jika ada)"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- SECTION C: MAKSUD & LIST KEGIATAN --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <i class="fa-solid fa-list-check text-emerald-400"></i>
                                    3. Maksud & Kegiatan
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kalimat Maksud</label>
                                        <input type="text" name="data_khusus[pembuka_maksud]" x-model="dataKhusus.pembuka_maksud"
                                               placeholder="Contoh: mewakili Direktur untuk Pembuktian Kualifikasi"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    </div>

                                    {{-- Dynamic Kegiatan Items Builder --}}
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Poin Kegiatan</label>
                                            <button type="button" @click="addKegiatanItem()"
                                                    class="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition">
                                                <i class="fa-solid fa-plus"></i> Tambah
                                            </button>
                                        </div>

                                        <div class="space-y-2">
                                            <template x-for="(item, idx) in dataKhusus.kegiatan_items" :key="idx">
                                                <div class="flex items-center gap-2">
                                                    <span class="w-7 h-9 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0" x-text="(idx + 1) + '.'"></span>
                                                    <input type="text" :name="'data_khusus[kegiatan_items][' + idx + ']'"
                                                           x-model="dataKhusus.kegiatan_items[idx]"
                                                           placeholder="Isi poin kegiatan..."
                                                           class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                                    <button type="button" @click="removeKegiatanItem(idx)"
                                                            class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 shrink-0 transition"
                                                            title="Hapus Poin Ini">
                                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>
                                            </template>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Target Instansi / Lokasi</label>
                                        <input type="text" name="data_khusus[lokasi_instansi]" x-model="dataKhusus.lokasi_instansi"
                                               placeholder="Nama dinas / instansi tujuan"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- SECTION D: PENUTUP & LOKASI TANGGAL --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <i class="fa-solid fa-location-dot text-rose-400"></i>
                                    4. Penutup & Pengesahan
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kalimat Penutup</label>
                                        <input type="text" name="data_khusus[penutup]" x-model="dataKhusus.penutup"
                                               placeholder="Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya."
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kota & Tanggal TTD</label>
                                        <input type="text" name="data_khusus[kota_tanggal]" x-model="dataKhusus.kota_tanggal"
                                               placeholder="Contoh: Bekasi, 03 Mei 2016"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none">
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </template>

                {{-- CARD 2: ISIAN STANDAR SURAT UMUM (DENGAN FLEXIBLE TABLE BUILDER) --}}
                <template x-if="!isKuasa">
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
                                Isi Surat & Tabel
                            </h2>
                            <span class="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-medium">Surat Umum</span>
                        </div>

                        <div class="p-6 space-y-5">

                            {{-- Tujuan Penerima Detail --}}
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Tujuan (Yth.) <span class="text-rose-500">*</span>
                                </label>
                                <input type="text" name="tujuan" x-model="tujuan" required
                                       placeholder="Contoh: Kepada Yth. Pimpinan PT Jaya Abadi"
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>

                            {{-- Perihal --}}
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Perihal <span class="text-rose-500">*</span>
                                </label>
                                <input type="text" name="perihal" x-model="perihal" required
                                       placeholder="Perihal surat"
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>

                            {{-- Isi Utama Surat --}}
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Isi Surat <span class="text-rose-500">*</span>
                                </label>
                                <textarea name="isi_surat" rows="6" x-model="isi_surat" required
                                          placeholder="Tuliskan isi surat di sini..."
                                          class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                            </div>

                            {{-- FLEXIBLE TABLE BUILDER ACCORDION --}}
                            <div class="border border-slate-800 rounded-xl bg-slate-950/60 p-5">
                                <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" id="has_table_check" name="data_khusus[has_table]" value="1"
                                               x-model="dataKhusus.has_table"
                                               class="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500">
                                        <label for="has_table_check" class="font-bold text-sm text-slate-200 cursor-pointer flex items-center gap-2">
                                            <i class="fa-solid fa-table text-indigo-400"></i>
                                            Sertakan Tabel Dalam Surat
                                        </label>
                                    </div>
                                    <span class="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-medium">Opsional</span>
                                </div>

                                <div x-show="dataKhusus.has_table" x-cloak class="space-y-4 pt-2">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Judul Tabel (Opsional)</label>
                                        <input type="text" name="data_khusus[table_title]" x-model="dataKhusus.table_title"
                                               placeholder="Pengantar tabel, misal: Berikut rinciannya:"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>

                                    {{-- Headers Configurator --}}
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Header Kolom</label>
                                            <button type="button" @click="addTableHeader()"
                                                    class="text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <i class="fa-solid fa-plus"></i> Tambah
                                            </button>
                                        </div>
                                        <div class="flex flex-wrap gap-2">
                                            <template x-for="(header, hIdx) in dataKhusus.table_headers" :key="hIdx">
                                                <div class="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                                                    <input type="text" :name="'data_khusus[table_headers][' + hIdx + ']'"
                                                           x-model="dataKhusus.table_headers[hIdx]"
                                                           class="bg-transparent text-white text-xs font-semibold outline-none w-28">
                                                    <button type="button" @click="removeTableHeader(hIdx)"
                                                            class="text-rose-400 hover:text-rose-300 text-xs px-1">
                                                        &times;
                                                    </button>
                                                </div>
                                            </template>
                                        </div>
                                    </div>

                                    {{-- Rows Configurator --}}
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Baris Data</label>
                                            <button type="button" @click="addTableRow()"
                                                    class="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <i class="fa-solid fa-plus"></i> Tambah Baris
                                            </button>
                                        </div>

                                        <div class="overflow-x-auto border border-slate-800 rounded-xl">
                                            <table class="w-full text-xs text-left">
                                                <thead class="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                                                    <tr>
                                                        <template x-for="(hdr, hIdx) in dataKhusus.table_headers" :key="hIdx">
                                                            <th class="p-2 border-r border-slate-800" x-text="hdr"></th>
                                                        </template>
                                                        <th class="p-2 w-10 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <template x-for="(r, rIdx) in dataKhusus.table_rows" :key="rIdx">
                                                        <tr class="border-b border-slate-800/60 bg-slate-950/40">
                                                            <template x-for="(c, cIdx) in dataKhusus.table_headers" :key="cIdx">
                                                                <td class="p-1.5 border-r border-slate-800">
                                                                    <input type="text" :name="'data_khusus[table_rows][' + rIdx + '][' + cIdx + ']'"
                                                                           x-model="dataKhusus.table_rows[rIdx][cIdx]"
                                                                           class="w-full bg-slate-900 border border-slate-700/60 rounded px-2 py-1 text-white text-xs outline-none">
                                                                </td>
                                                            </template>
                                                            <td class="p-1.5 text-center">
                                                                <button type="button" @click="removeTableRow(rIdx)" class="text-rose-400 hover:text-rose-300 p-1">
                                                                    <i class="fa-solid fa-trash-can"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </template>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Teks Setelah Tabel (Opsional)</label>
                                        <textarea name="data_khusus[isi_setelah_tabel]" rows="2" x-model="dataKhusus.isi_setelah_tabel"
                                                  placeholder="Penjelasan lanjutan setelah tabel..."
                                                  class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </template>

                {{-- CARD 3: PENANDATANGAN & PENGESAHAN --}}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                        <h2 class="text-base font-bold text-white flex items-center gap-2">

                            Penandatangan
                        </h2>

                    </div>

                    <div class="p-6">
                        {{-- IF SURAT KUASA: INFORMASI DUAL PENANDATANGAN --}}
                        <template x-if="isKuasa">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input type="hidden" name="penandatangan" :value="dataKhusus.pemberi.nama || penandatangan || 'Pemberi Kuasa'">
                                <input type="hidden" name="jabatan_penandatangan" :value="dataKhusus.pemberi.jabatan || jabatan_penandatangan || 'Pemberi Kuasa'">
                                <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <h4 class="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-signature text-indigo-400"></i> Penandatangan Kiri (Penerima Kuasa)
                                    </h4>
                                    <p class="text-sm font-semibold text-white" x-text="dataKhusus.penerima.nama || '(Nama Penerima)'"></p>
                                    <p class="text-xs text-slate-400" x-text="dataKhusus.penerima.jabatan || '(Jabatan Penerima)'"></p>
                                </div>

                                <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <h4 class="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-signature text-amber-400"></i> Penandatangan Kanan (Pemberi Kuasa)
                                    </h4>
                                    <p class="text-sm font-semibold text-white" x-text="dataKhusus.pemberi.nama || '(Nama Pemberi)'"></p>
                                    <p class="text-xs text-slate-400" x-text="dataKhusus.pemberi.jabatan || '(Jabatan Pemberi)'"></p>
                                </div>
                            </div>
                        </template>

                        {{-- IF SURAT UMUM: INPUT PENANDATANGAN SINGLE --}}
                        <template x-if="!isKuasa">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">
                                        Nama Penandatangan <span class="text-rose-500">*</span>
                                    </label>
                                    <input type="text" name="penandatangan" x-model="penandatangan" required
                                           placeholder="Nama Lengkap Penandatangan"
                                           class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">
                                        Jabatan Penandatangan <span class="text-rose-500">*</span>
                                    </label>
                                    <input type="text" name="jabatan_penandatangan" x-model="jabatan_penandatangan" required
                                           placeholder="Jabatan Penandatangan"
                                           class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                </div>
                            </div>
                        </template>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-4 border-t border-slate-800">
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Lampiran Dokumen
                                </label>
                                <input type="text" name="lampiran" x-model="lampiran"
                                       placeholder="Contoh: 1 Berkas / -"
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Status Surat <span class="text-rose-500">*</span>
                                </label>
                                <select name="status" required x-model="status"
                                        class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="Draft">Draft</option>
                                    <option value="Dikirim">Dikirim</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>
                        </div>

                    </div>
                </div>

                {{-- Submit Buttons --}}
                <div class="flex flex-col sm:flex-row gap-3">
                    <button type="submit"
                            class="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 text-sm sm:text-base w-full sm:w-auto">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>Simpan Surat Keluar</span>
                    </button>
                    <button type="reset"
                            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition border border-slate-700 text-sm sm:text-base w-full sm:w-auto">
                        <i class="fa-solid fa-rotate-left"></i>
                        <span>Reset Form</span>
                    </button>
                </div>

            </form>

            </div>

        </div>

        {{-- SPLITTER / DIVIDER BAR --}}
        <div class="hidden lg:flex items-center justify-center shrink-0 group relative z-20 cursor-col-resize select-none mx-2 self-stretch min-h-[500px]"
             style="width: 16px;"
             @mousedown="startDrag($event)"
             @touchstart="startTouchDrag($event)"
             @dblclick="resetSplit()"
             title="Tarik ke kiri atau kanan untuk mengatur ukuran panel (Klik 2x untuk reset 50:50)">

            {{-- Vertical line --}}
            <div class="w-1 h-full rounded-full transition-colors duration-200"
                 :class="isDragging ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-slate-800/80 group-hover:bg-indigo-500/70'"></div>

            {{-- Center Grip Pill Handle --}}
            <div class="sticky top-1/2 -translate-y-1/2 w-6 h-12 rounded-xl border flex flex-col items-center justify-center gap-1 shadow-lg transition-all duration-200 backdrop-blur-md"
                 :class="isDragging ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-indigo-500/30 ring-2 ring-indigo-400/40' : 'bg-slate-900/90 border-slate-700/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-indigo-300 group-hover:border-indigo-500/60'">
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
            </div>
        </div>

        {{-- RIGHT COLUMN: REALTIME A4 LETTER PREVIEW (Independent Scroll) --}}
        <div class="w-full lg:flex-1 min-w-0 shrink-0 mt-6 lg:mt-0 flex flex-col lg:h-full lg:overflow-hidden"
             :style="isDesktop ? { minWidth: '320px' } : { width: '100%' }">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 lg:h-full">
                <div class="border-b border-slate-800 px-4 sm:px-6 py-3.5 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-eye text-emerald-400"></i>
                        <span>Pratinjau Surat (A4)</span>
                    </h2>
                    <div class="flex items-center gap-2">
                        <button type="button" @click="downloadPreviewPdf()"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer">
                            <i class="fa-solid fa-file-pdf text-xs"></i>
                            <span>Unduh PDF</span>
                        </button>
                    </div>
                </div>

                {{-- A4 Container Scroll Area --}}
                <div class="custom-scrollbar p-3 sm:p-6 bg-slate-950 flex-1 overflow-x-auto overflow-y-auto flex justify-center -webkit-overflow-scrolling-touch">
                   <div id="surat-keluar-preview-paper"
     class="a4-paper w-full p-6 sm:p-10 text-slate-900 relative text-xs sm:text-sm md:text-base leading-relaxed shrink-0">
                        {{-- Kop Surat Header --}}
                        <div>
                            <img src="{{ asset('image/kop-surat.png') }}" alt="Kop Surat" class="w-full h-auto block"
                                 onerror="this.style.display='none'; document.getElementById('kop-fallback').style.display='block';">
                            <div id="kop-fallback" style="display:none;" class="text-center font-bold text-lg border-b-2 border-black pb-2">
                                PT MICRODATA INDONESIA<br>
                                <span class="text-xs font-normal">Jl. Utama No. 123, Bandar Lampung | Telp: (0721) 123456</span>
                            </div>
                        </div>

                        {{-- ============================================================
                             REALTIME PREVIEW: SURAT KUASA (STRUKTUR GAMBAR EXACT)
                        ============================================================ --}}
                        <template x-if="isKuasa">
                            <div>
                                <div class="text-center my-4">
                                    <h2 class="font-bold text-lg">SURAT KUASA</h2>
                                    <p class="text-sm mt-1">No : <span x-text="previewNomor"></span></p>
                                </div>

                                <div class="my-5 text-sm space-y-3">
                                    <p>Yang bertanda tangan di bawah ini :</p>
                                    <table class="w-full text-sm border-collapse ml-4">
                                        <tr><td class="w-28 py-0.5">Nama</td><td class="w-4 py-0.5">:</td><td class="py-0.5 font-bold" x-text="dataKhusus.pemberi.nama || '(Nama Pemberi Kuasa)'"></td></tr>
                                        <tr><td class="py-0.5">Jabatan</td><td class="py-0.5">:</td><td class="py-0.5" x-text="dataKhusus.pemberi.jabatan || '(Jabatan Pemberi Kuasa)'"></td></tr>
                                        <tr><td class="py-0.5">Alamat</td><td class="py-0.5">:</td><td class="py-0.5" x-text="dataKhusus.pemberi.alamat || '(Alamat Pemberi Kuasa)'"></td></tr>
                                    </table>

                                    <p class="pt-2">Dengan ini memberikan kuasa kepada :</p>
                                    <table class="w-full text-sm border-collapse ml-4">
                                        <tr><td class="w-28 py-0.5">Nama</td><td class="w-4 py-0.5">:</td><td class="py-0.5 font-bold" x-text="dataKhusus.penerima.nama || '(Nama Penerima Kuasa)'"></td></tr>
                                        <tr><td class="py-0.5">Jabatan</td><td class="py-0.5">:</td><td class="py-0.5" x-text="dataKhusus.penerima.jabatan || '(Jabatan Penerima Kuasa)'"></td></tr>
                                        <template x-if="dataKhusus.penerima.alamat">
                                            <tr><td class="py-0.5">Alamat</td><td class="py-0.5">:</td><td class="py-0.5" x-text="dataKhusus.penerima.alamat"></td></tr>
                                        </template>
                                    </table>

                                    <div class="pt-2 text-justify">
                                        <p>Dengan ini <span x-text="dataKhusus.pembuka_maksud || 'mewakili Direktur untuk melaksanakan Pembuktian Kualifikasi'"></span> dengan Kegiatan sebagai berikut :</p>

                                        <ol class="list-decimal list-inside ml-4 my-2 font-bold space-y-1">
                                            <template x-for="(kItem, kIdx) in dataKhusus.kegiatan_items" :key="kIdx">
                                                <template x-if="kItem && String(kItem).trim() !== ''">
                                                    <li x-text="kItem"></li>
                                                </template>
                                            </template>
                                        </ol>

                                        <template x-if="dataKhusus.lokasi_instansi">
                                            <p class="mt-2">pada <span x-text="dataKhusus.lokasi_instansi"></span>.</p>
                                        </template>
                                    </div>

                                    <p class="pt-3 text-justify" x-text="dataKhusus.penutup || 'Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.'"></p>

                                    {{-- Signatories Table Dual --}}
                                    <div class="mt-12 text-sm">
                                        <table class="w-full text-center border-collapse">
                                            <tr>
                                                <td class="w-1/2 align-top pb-2"></td>
                                                <td class="w-1/2 align-top pb-2" x-text="dataKhusus.kota_tanggal || ('Bandar Lampung, ' + formatTanggal(tanggal_surat))"></td>
                                            </tr>
                                            <tr>
                                                <td class="w-1/2 align-top pb-14 font-medium">Penerima Kuasa,</td>
                                                <td class="w-1/2 align-top pb-14 font-medium">Pemberi Kuasa,</td>
                                            </tr>
                                            <tr>
                                                <td class="w-1/2 align-top">
                                                    <p class="font-bold underline uppercase" x-text="dataKhusus.penerima.nama || '(NAMA PENERIMA)'"></p>
                                                    <p class="text-xs text-slate-700 font-medium" x-text="dataKhusus.penerima.jabatan || 'Staff'"></p>
                                                </td>
                                                <td class="w-1/2 align-top">
                                                    <p class="font-bold underline uppercase" x-text="dataKhusus.pemberi.nama || '(NAMA PEMBERI)'"></p>
                                                    <p class="text-xs text-slate-700 font-medium" x-text="dataKhusus.pemberi.jabatan || 'Direktur Utama'"></p>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </template>

                        {{-- ============================================================
                             REALTIME PREVIEW: SURAT UMUM (DENGAN BUILDER TABEL)
                        ============================================================ --}}
                        <template x-if="!isKuasa">
                            <div>
                                <div class="text-center my-4">
                                    <h2 class="font-bold text-lg" x-text="jenis_surat ? jenis_surat.toUpperCase() : 'SURAT KELUAR'"></h2>
                                </div>

                                <div class="text-right my-4 text-sm font-medium">
                                    Bandar Lampung, <span x-text="formatTanggal(tanggal_surat)"></span>
                                </div>

                                <table class="w-full text-sm mb-6 border-collapse">
                                    <tr><td class="w-28 align-top py-1">Nomor</td><td class="w-4 align-top py-1">:</td><td class="align-top py-1 font-mono font-semibold" x-text="previewNomor"></td></tr>
                                    <tr><td class="align-top py-1">Lampiran</td><td class="align-top py-1">:</td><td class="align-top py-1" x-text="lampiran || '-'"></td></tr>
                                    <tr><td class="align-top py-1">Hal / Perihal</td><td class="align-top py-1">:</td><td class="align-top py-1 font-bold" x-text="perihal || '(Perihal Surat)'"></td></tr>
                                </table>

                                <div class="my-6 text-sm leading-relaxed">
                                    <p>Kepada Yth.</p>
                                    <p class="font-bold" x-text="tujuan || '(Tujuan Penerima)'"></p>
                                    <p>Di Tempat</p>
                                </div>

                                <div class="my-6 text-sm leading-relaxed space-y-3">
                                    <p>Dengan hormat,</p>
                                    <div class="text-justify whitespace-pre-line leading-relaxed min-h-[100px]"
                                         x-text="isi_surat || 'Tuliskan isi utama surat Anda pada form di sebelah kiri...'"></div>
                                </div>

                                {{-- Render Flexible Data Table Preview --}}
                                <template x-if="dataKhusus.has_table">
                                    <div class="my-4 text-sm">
                                        <template x-if="dataKhusus.table_title">
                                            <p class="font-bold mb-2" x-text="dataKhusus.table_title"></p>
                                        </template>
                                        <table class="w-full border-collapse border border-black text-xs my-2">
                                            <thead>
                                                <tr class="bg-gray-100 border-b border-black">
                                                    <template x-for="(h, hI) in dataKhusus.table_headers" :key="hI">
                                                        <th class="border border-black p-2 text-left font-bold" x-text="h"></th>
                                                    </template>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <template x-for="(r, rI) in dataKhusus.table_rows" :key="rI">
                                                    <tr class="border-b border-black">
                                                        <template x-for="(cell, cI) in r" :key="cI">
                                                            <td class="border border-black p-2" x-text="cell"></td>
                                                        </template>
                                                    </tr>
                                                </template>
                                            </tbody>
                                        </table>
                                        <template x-if="dataKhusus.isi_setelah_tabel">
                                            <p class="mt-3 text-justify whitespace-pre-line" x-text="dataKhusus.isi_setelah_tabel"></p>
                                        </template>
                                    </div>
                                </template>

                                <div class="my-6 text-sm leading-relaxed">
                                    <p>Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.</p>
                                </div>

                                {{-- Single Signatory --}}
                                <div class="mt-12 text-sm flex justify-end">
                                    <div class="w-64 text-center">
                                        <p>Hormat kami,</p>
                                        <p class="font-semibold">PT Microdata Indonesia</p>
                                        <div class="h-20 flex items-center justify-center text-slate-400 text-xs italic">
                                            ( Tanda Tangan & Stempel )
                                        </div>
                                        <p class="font-bold uppercase underline" x-text="penandatangan || 'NAMA PENANDATANGAN'"></p>
                                        <p class="text-xs text-slate-700 font-medium" x-text="jabatan_penandatangan || 'Jabatan'"></p>
                                    </div>
                                </div>
                            </div>
                        </template>

                        {{-- Footer --}}
<div class="mt-auto pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500">
    Dokumen ini dibuat melalui <strong>Sistem Arsip Surat PT Microdata Indonesia</strong>
</div>

                    </div>
                </div>
            </div>
        </div>

    </div>

</div>

{{-- MODAL TAMBAH JENIS SURAT --}}
<div x-data="modalJenisSurat()"
     @open-modal-jenis-surat.window="openModal()"
     x-show="isOpen" x-cloak
     class="fixed inset-0 z-50 overflow-y-auto">
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="closeModal()"></div>
    <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fa-solid fa-plus-circle text-emerald-400"></i> Tambah Jenis Surat Baru
            </h3>
            <form @submit.prevent="submitForm">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Nama Jenis Surat</label>
                        <input type="text" x-model="nama" required placeholder="Contoh: Surat Kuasa Khusus"
                               class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Kode Surat</label>
                        <input type="text" x-model="kode_surat" required placeholder="Contoh: SK"
                               class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white uppercase outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Tipe Form Template</label>
                        <select x-model="form_type" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none">
                            <option value="umum">Surat Umum (Standard & Tabel)</option>
                            <option value="kuasa">Surat Kuasa (Dual Penandatangan & Poin Kegiatan)</option>
                        </select>
                    </div>
                    <template x-if="errorMessage">
                        <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span x-text="errorMessage"></span>
                        </div>
                    </template>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button type="button" @click="closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium">Batal</button>
                    <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function resizableSplit(storageKey = 'split_pos_default', defaultPercent = 50) {
    return {
        isDragging: false,
        leftWidth: defaultPercent,
        isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
        storageKey: storageKey,

        init() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved !== null) {
                    const parsed = parseFloat(saved);
                    if (!isNaN(parsed) && parsed >= 25 && parsed <= 75) {
                        this.leftWidth = parsed;
                    }
                }
            } catch(e) {}

            const onResize = () => {
                this.isDesktop = window.innerWidth >= 1024;
            };
            window.addEventListener('resize', onResize);
        },

        startDrag(e) {
            if (!this.isDesktop) return;
            e.preventDefault();
            this.isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                if (!this.isDragging) return;
                this.updateWidth(moveEvent.clientX);
            };

            const onMouseUp = () => {
                this.isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                try {
                    localStorage.setItem(this.storageKey, this.leftWidth);
                } catch(e) {}
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        },

        startTouchDrag(e) {
            if (!this.isDesktop) return;
            if (e.touches.length !== 1) return;
            this.isDragging = true;

            const onTouchMove = (moveEvent) => {
                if (!this.isDragging || moveEvent.touches.length !== 1) return;
                moveEvent.preventDefault();
                this.updateWidth(moveEvent.touches[0].clientX);
            };

            const onTouchEnd = () => {
                this.isDragging = false;
                try {
                    localStorage.setItem(this.storageKey, this.leftWidth);
                } catch(e) {}
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
            };

            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);
        },

        updateWidth(clientX) {
            const container = this.$refs.splitContainer;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            let percent = (relativeX / rect.width) * 100;

            const minPx = 320;
            const minPercent = Math.max(25, (minPx / rect.width) * 100);
            const maxPercent = Math.min(75, 100 - (minPx / rect.width) * 100);

            if (percent < minPercent) percent = minPercent;
            if (percent > maxPercent) percent = maxPercent;

            this.leftWidth = Math.round(percent * 10) / 10;
        },

        resetSplit() {
            this.leftWidth = defaultPercent;
            try {
                localStorage.setItem(this.storageKey, this.leftWidth);
            } catch(e) {}
        }
    };
}

function modalJenisSurat() {
    return {
        isOpen: false,
        nama: '',
        kode_surat: '',
        form_type: 'umum',
        errorMessage: '',
        openModal() {
            this.isOpen = true;
            this.errorMessage = '';
        },
        closeModal() {
            this.isOpen = false;
            this.errorMessage = '';
        },
        async submitForm() {
            this.errorMessage = '';
            try {
                const res = await fetch("{{ route('jenis_surat.store') }}", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-TOKEN": "{{ csrf_token() }}"
                    },
                    body: JSON.stringify({
                        nama: this.nama,
                        kode_surat: this.kode_surat,
                        form_type: this.form_type
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: data.message || 'Jenis surat berhasil ditambahkan.',
                        background: '#0f172a',
                        color: '#f8fafc',
                        confirmButtonColor: '#6366f1'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    let msg = 'Gagal menambahkan jenis surat.';
                    if (data.errors) {
                        if (data.errors.kode_surat) {
                            msg = data.errors.kode_surat[0];
                        } else if (data.errors.nama) {
                            msg = data.errors.nama[0];
                        } else {
                            msg = Object.values(data.errors).flat().join('\n');
                        }
                    } else if (data.message) {
                        msg = data.message;
                    }

                    this.errorMessage = msg;

                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Simpan!',
                        text: msg,
                        background: '#0f172a',
                        color: '#f8fafc',
                        confirmButtonColor: '#e11d48'
                    });
                }
            } catch(e) {
                console.error(e);
                Swal.fire({
                    icon: 'error',
                    title: 'Kesalahan Sistem',
                    text: 'Terjadi kesalahan saat menghubungkan ke server.',
                    background: '#0f172a',
                    color: '#f8fafc',
                    confirmButtonColor: '#e11d48'
                });
            }
        }
    }
}
</script>

@endsection
