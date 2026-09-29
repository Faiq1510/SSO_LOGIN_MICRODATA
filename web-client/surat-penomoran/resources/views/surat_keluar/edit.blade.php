@extends('layouts.app')

@section('title', 'Edit Surat Keluar')

@section('content')

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

@php
    $dk = $surat->data_khusus ?? [];
    $pemberi = $dk['pemberi'] ?? [];
    $penerima = $dk['penerima'] ?? [];
    $pembukaMaksud = $dk['pembuka_maksud'] ?? ($dk['maksud'] ?? 'mewakili Direktur untuk melaksanakan Pembuktian Kualifikasi');
    $kegiatanItems = is_array($dk['kegiatan_items'] ?? null) ? array_values(array_filter($dk['kegiatan_items'])) : (is_array($dk['kegiatan'] ?? null) ? $dk['kegiatan'] : ['']);
    if (empty($kegiatanItems)) $kegiatanItems = [''];
    $lokasiInstansi = $dk['lokasi_instansi'] ?? '';
    $penutupText = $dk['penutup'] ?? 'Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.';
    $kotaTanggal = $dk['kota_tanggal'] ?? '';

    $hasTable = !empty($dk['has_table']);
    $tableTitle = $dk['table_title'] ?? '';
    $tableHeaders = $dk['table_headers'] ?? ['No', 'Uraian / Kegiatan', 'Jumlah', 'Keterangan'];
    $tableRows = $dk['table_rows'] ?? [['1', 'Item 1', '1', 'Baik']];
    $isiSetelahTabel = $dk['isi_setelah_tabel'] ?? '';

    $savedTipeForm = $dk['tipe_form'] ?? null;
    if ($savedTipeForm) {
        $isKuasaInitial = ($savedTipeForm === 'kuasa');
    } else {
        $isKuasaInitial = (isset($surat->jenisSurat) && $surat->jenisSurat->form_type === 'kuasa')
            || Str::contains(strtolower($surat->jenis_surat), 'kuasa')
            || !empty($pemberi['nama']);
    }
@endphp

<div class="max-w-[1700px] mx-auto"
     x-data="{
        jenisSuratList: {{ json_encode($jenisSuratList) }},
        nomor_surat: @js(old('nomor_surat', $surat->nomor_surat)),
        jenis_surat: @js(old('jenis_surat', $surat->jenis_surat)),
        kode_surat: @js($surat->jenisSurat->kode_surat ?? ''),
        kode_divisi: @js(old('kode_divisi', $surat->kode_divisi ?? 'HRD')),
        instansi_id: @js((string)old('instansi_id', $surat->instansi_id)),
        instansi_nama: @js($surat->instansi->nama_instansi ?? ''),
        tanggal_surat: @js(old('tanggal_surat', $surat->tanggal_surat)),
        tujuan: @js(old('tujuan', $surat->tujuan)),
        perihal: @js(old('perihal', $surat->perihal)),
        isi_surat: @js(old('isi_surat', $surat->isi_surat)),
        lampiran: @js(old('lampiran', $surat->lampiran)),
        status: @js(old('status', $surat->status)),
        penandatangan: @js(old('penandatangan', $surat->penandatangan)),
        jabatan_penandatangan: @js(old('jabatan_penandatangan', $surat->jabatan_penandatangan)),

        tipe_form: @js($isKuasaInitial ? 'kuasa' : 'umum'),
        isKuasa: {{ $isKuasaInitial ? 'true' : 'false' }},

        setTipeForm(type) {
            this.tipe_form = type;
            this.isKuasa = (type === 'kuasa');
            if (this.isKuasa && (!this.perihal || this.perihal.trim() === '' || this.perihal === 'SURAT KELUAR')) {
                this.perihal = 'SURAT KUASA';
            }
        },

        dataKhusus: {
            pemberi: {
                nama: @js(old('data_khusus.pemberi.nama', $pemberi['nama'] ?? '')),
                jabatan: @js(old('data_khusus.pemberi.jabatan', $pemberi['jabatan'] ?? '')),
                alamat: @js(old('data_khusus.pemberi.alamat', $pemberi['alamat'] ?? ''))
            },
            penerima: {
                nama: @js(old('data_khusus.penerima.nama', $penerima['nama'] ?? '')),
                jabatan: @js(old('data_khusus.penerima.jabatan', $penerima['jabatan'] ?? '')),
                alamat: @js(old('data_khusus.penerima.alamat', $penerima['alamat'] ?? ''))
            },
            pembuka_maksud: @js(old('data_khusus.pembuka_maksud', $pembukaMaksud)),
            kegiatan_items: {{ json_encode($kegiatanItems) }},
            lokasi_instansi: @js(old('data_khusus.lokasi_instansi', $lokasiInstansi)),
            penutup: @js(old('data_khusus.penutup', $penutupText)),
            kota_tanggal: @js(old('data_khusus.kota_tanggal', $kotaTanggal)),

            has_table: {{ $hasTable ? 'true' : 'false' }},
            table_title: @js(old('data_khusus.table_title', $tableTitle)),
            table_headers: {{ json_encode($tableHeaders) }},
            table_rows: {{ json_encode($tableRows) }},
            isi_setelah_tabel: @js(old('data_khusus.isi_setelah_tabel', $isiSetelahTabel))
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
            } else if (val.toLowerCase().includes('kuasa')) {
                this.setTipeForm('kuasa');
            }
            this.fetchNextNomor();
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
                    this.nomor_surat = data.nomor ?? this.nomor_surat;
                }
            } catch(e) {
                // Fallback bila fetch gagal — biarkan nomor lama
            }
        },

        formatTanggal(val) {
            if (!val) return '-';
            const parts = val.split('-');
            if (parts.length !== 3) return val;
            const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const blnIdx = parseInt(parts[1], 10);
            return parseInt(parts[2], 10) + ' ' + (bulan[blnIdx] || '') + ' ' + parts[0];
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
},

        get divisiLabel() {
            const map = {
                'HRD'    : 'HRD',
                'DIR-I'  : 'Direktur I',
                'DIR-II' : 'Direktur II',
                'DIR-III': 'Direktur III',
                'KOM'    : 'Komisaris',
                'IT'     : 'IT & Software',
                'OPS'    : 'Operasional'
            };
            return map[this.kode_divisi] || this.kode_divisi || 'HRD';
        }
     }"
     x-init="$nextTick(() => {
         $watch('jenis_surat', () => updateJenisSurat());
         $watch('kode_divisi', () => fetchNextNomor());
         $watch('tanggal_surat', () => fetchNextNomor());
         updateJenisSurat();
     })">

    {{-- Header --}}
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <i class="fa-solid fa-pen-to-square text-amber-500"></i>
                Edit Surat Keluar
            </h1>
            <p class="text-slate-400 mt-1">
                Perbarui data surat keluar. Pratinjau surat A4 ter-update secara real-time.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="{{ route('surat_keluar.index') }}"
               class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition inline-flex items-center gap-2 border border-slate-700">
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

        {{-- LEFT COLUMN: FORM EDIT (Independent Scroll) --}}
        <div class="w-full shrink-0 flex flex-col lg:h-full lg:overflow-hidden"
             :style="isDesktop ? { width: leftWidth + '%', minWidth: '320px' } : { width: '100%' }">

            <div class="flex-1 lg:overflow-y-auto custom-scrollbar space-y-6 pr-0 lg:pr-2">

                <div class="p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between"
                 :class="isKuasa ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                         :class="isKuasa ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'">
                        <i :class="isKuasa ? 'fa-solid fa-file-signature' : 'fa-solid fa-file-lines'"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm" x-text="isKuasa ? 'Mode Edit: SURAT KUASA (Dual Penandatangan)' : 'Mode Edit: SURAT UMUM (Standard & Dynamic Table)'"></h4>
                        <p class="text-xs opacity-80" x-text="isKuasa ? 'Mengubah struktur Pemberi, Penerima, Maksud, Poin Kegiatan & Penandatangan Dual' : 'Mengubah isian surat standar & tabel fleksibel'"></p>
                    </div>
                </div>
            </div>

            <form action="{{ route('surat_keluar.update', $surat->id) }}" method="POST" enctype="multipart/form-data">
                @csrf
                @method('PUT')
                <input type="hidden" name="tipe_form" :value="tipe_form">
                <input type="hidden" name="nomor_surat" :value="nomor_surat">

                {{-- CARD UTAMA: PEMILIH TIPE FORM SURAT --}}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6 p-5">
                    <label class="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-amber-400"></i>
                        Pilih Tipe Form Pengeditan Surat <span class="text-rose-500">*</span>
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" @click="setTipeForm('umum')"
                                class="p-4 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer"
                                :class="!isKuasa ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                                     :class="!isKuasa ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'">
                                    <i class="fa-solid fa-file-lines"></i>
                                </div>
                                <div>
                                    <h5 class="text-sm font-bold text-white">Form Surat Umum</h5>
                                    <p class="text-xs text-slate-400 mt-0.5">Format standar & tabel fleksibel</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-circle-check text-indigo-400 text-xl" x-show="!isKuasa"></i>
                        </button>

                        <button type="button" @click="setTipeForm('kuasa')"
                                class="p-4 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer"
                                :class="isKuasa ? 'bg-amber-600/20 border-amber-500 text-white font-semibold shadow-lg shadow-amber-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                                     :class="isKuasa ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'">
                                    <i class="fa-solid fa-file-signature"></i>
                                </div>
                                <div>
                                    <h5 class="text-sm font-bold text-white">Form Surat Kuasa</h5>
                                    <p class="text-xs text-slate-400 mt-0.5">Pemberi, Penerima & Dual Ttd</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-circle-check text-amber-400 text-xl" x-show="isKuasa"></i>
                        </button>
                    </div>
                </div>

                {{-- CARD 1: INFORMASI KEPALA SURAT --}}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                        <h2 class="text-base font-bold text-white flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
                            Informasi Dasar Surat
                        </h2>
                        <span class="text-xs text-amber-400 font-mono" x-text="nomor_surat"></span>
                    </div>

                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        {{-- Jenis Surat --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Jenis Surat <span class="text-rose-500">*</span>
                            </label>
                            <select name="jenis_surat" required x-model="jenis_surat"
                                    class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                                <option value="">-- Pilih Jenis Surat --</option>
                                @foreach($jenisSuratList as $jenis)
                                    <option value="{{ $jenis->nama }}"
                                        data-form="{{ $jenis->form_type }}"
                                        {{ old('jenis_surat', $surat->jenis_surat) == $jenis->nama ? 'selected' : '' }}>
                                        {{ $jenis->nama }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Divisi --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Divisi Pengirim <span class="text-rose-500">*</span>
                            </label>
                            <select name="kode_divisi" required x-model="kode_divisi"
                                    class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none">
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
                                   class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                        </div>

                        {{-- Instansi --}}
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Instansi Terkait
                            </label>
                            <select name="instansi_id" id="instansi_select" x-model="instansi_id" @change="updateInstansiNama($event.target)"
                                    class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                                <option value="">-- Tanpa Instansi / Bebas --</option>
                                @foreach($instansis as $instansi)
                                    <option value="{{ $instansi->id }}" {{ old('instansi_id', $surat->instansi_id) == $instansi->id ? 'selected' : '' }}>
                                        {{ $instansi->nama_instansi }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                    </div>
                </div>

                {{-- CARD 2: ISIAN KUASA --}}
                <template x-if="isKuasa">
                    <div class="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div class="border-b border-amber-500/20 px-6 py-4 bg-amber-500/5 flex items-center justify-between">
                            <h2 class="text-base font-bold text-amber-300 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                                Edit Form Isian Surat Kuasa
                            </h2>
                        </div>

                        <div class="p-6 space-y-6">

                            {{-- Pemberi Kuasa --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
                                    1. Data Pemberi Kuasa ("Yang bertanda tangan di bawah ini")
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap & Gelar</label>
                                        <input type="text" name="data_khusus[pemberi][nama]" x-model="dataKhusus.pemberi.nama"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Jabatan Pemberi Kuasa</label>
                                        <input type="text" name="data_khusus[pemberi][jabatan]" x-model="dataKhusus.pemberi.jabatan"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Alamat Lengkap</label>
                                        <input type="text" name="data_khusus[pemberi][alamat]" x-model="dataKhusus.pemberi.alamat"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- Penerima Kuasa --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
                                    2. Data Penerima Kuasa ("Dengan ini memberikan kuasa kepada")
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap Penerima</label>
                                        <input type="text" name="data_khusus[penerima][nama]" x-model="dataKhusus.penerima.nama"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Jabatan Penerima Kuasa</label>
                                        <input type="text" name="data_khusus[penerima][jabatan]" x-model="dataKhusus.penerima.jabatan"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- Maksud & Kegiatan --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <h3 class="text-sm font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
                                    3. Maksud Kuasa & Poin-Poin Kegiatan
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kalimat Maksud Utama</label>
                                        <input type="text" name="data_khusus[pembuka_maksud]" x-model="dataKhusus.pembuka_maksud"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>

                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Daftar Poin Kegiatan / Kuasa</label>
                                            <button type="button" @click="addKegiatanItem()"
                                                    class="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <i class="fa-solid fa-plus"></i> Tambah Poin
                                            </button>
                                        </div>

                                        <div class="space-y-2">
                                            <template x-for="(item, idx) in dataKhusus.kegiatan_items" :key="idx">
                                                <div class="flex items-center gap-2">
                                                    <span class="w-7 h-9 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0" x-text="(idx + 1) + '.'"></span>
                                                    <input type="text" :name="'data_khusus[kegiatan_items][' + idx + ']'"
                                                           x-model="dataKhusus.kegiatan_items[idx]"
                                                           class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm outline-none">
                                                    <button type="button" @click="removeKegiatanItem(idx)"
                                                            class="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
                                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>
                                            </template>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Target Dinas / Instansi / Lokasi Kegiatan</label>
                                        <input type="text" name="data_khusus[lokasi_instansi]" x-model="dataKhusus.lokasi_instansi"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                </div>
                            </div>

                            {{-- Penutup & Lokasi --}}
                            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kalimat Penutup Surat Kuasa</label>
                                        <input type="text" name="data_khusus[penutup]" x-model="dataKhusus.penutup"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Kota & Tanggal Ttd</label>
                                        <input type="text" name="data_khusus[kota_tanggal]" x-model="dataKhusus.kota_tanggal"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white text-sm outline-none">
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </template>

                {{-- CARD 2: ISIAN SURAT UMUM --}}
                <template x-if="!isKuasa">
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
                                Edit Konten Surat Umum & Tabel
                            </h2>
                        </div>

                        <div class="p-6 space-y-5">
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">Tujuan Penerima Detail</label>
                                <input type="text" name="tujuan" x-model="tujuan" required
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">Perihal Surat</label>
                                <input type="text" name="perihal" x-model="perihal" required
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">Isi Utama Surat</label>
                                <textarea name="isi_surat" rows="6" x-model="isi_surat" required
                                          class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"></textarea>
                            </div>

                            {{-- Flexible Table Builder --}}
                            <div class="border border-slate-800 rounded-xl bg-slate-950/60 p-5">
                                <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" id="has_table_check_edit" name="data_khusus[has_table]" value="1"
                                               x-model="dataKhusus.has_table"
                                               class="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500">
                                        <label for="has_table_check_edit" class="font-bold text-sm text-slate-200 cursor-pointer flex items-center gap-2">
                                            <i class="fa-solid fa-table text-amber-400"></i>
                                            Sertakan Tabel Data Fleksibel Dalam Surat
                                        </label>
                                    </div>
                                </div>

                                <div x-show="dataKhusus.has_table" x-cloak class="space-y-4 pt-2">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Judul Tabel / Pengantar</label>
                                        <input type="text" name="data_khusus[table_title]" x-model="dataKhusus.table_title"
                                               class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm outline-none">
                                    </div>

                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Kolom Header Tabel</label>
                                            <button type="button" @click="addTableHeader()"
                                                    class="text-xs bg-amber-600/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <i class="fa-solid fa-plus"></i> Tambah Kolom
                                            </button>
                                        </div>
                                        <div class="flex flex-wrap gap-2">
                                            <template x-for="(header, hIdx) in dataKhusus.table_headers" :key="hIdx">
                                                <div class="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                                                    <input type="text" :name="'data_khusus[table_headers][' + hIdx + ']'"
                                                           x-model="dataKhusus.table_headers[hIdx]"
                                                           class="bg-transparent text-white text-xs font-semibold outline-none w-28">
                                                    <button type="button" @click="removeTableHeader(hIdx)" class="text-rose-400 text-xs px-1">&times;</button>
                                                </div>
                                            </template>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-medium text-slate-300">Baris Data Tabel</label>
                                            <button type="button" @click="addTableRow()"
                                                    class="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <i class="fa-solid fa-plus"></i> Tambah Baris Data
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
                                                                <button type="button" @click="removeTableRow(rIdx)" class="text-rose-400 p-1">
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
                                        <label class="block text-xs font-medium text-slate-400 mb-1">Paragraf Penjelas Setelah Tabel</label>
                                        <textarea name="data_khusus[isi_setelah_tabel]" rows="2" x-model="dataKhusus.isi_setelah_tabel"
                                                  class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-white text-sm outline-none"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                {{-- CARD 3: PENANDATANGAN --}}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div class="border-b border-slate-800 px-6 py-4 bg-slate-950/50 flex items-center justify-between">
                        <h2 class="text-base font-bold text-white flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-semibold">3</span>
                            Pengesahan & Status
                        </h2>
                    </div>

                    <div class="p-6">
                        <template x-if="isKuasa">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input type="hidden" name="penandatangan" :value="dataKhusus.pemberi.nama || penandatangan || 'Pemberi Kuasa'">
                                <input type="hidden" name="jabatan_penandatangan" :value="dataKhusus.pemberi.jabatan || jabatan_penandatangan || 'Pemberi Kuasa'">
                                <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <h4 class="text-xs font-bold text-slate-400 mb-2">Penandatangan Kiri (Penerima Kuasa)</h4>
                                    <p class="text-sm font-semibold text-white" x-text="dataKhusus.penerima.nama || '(Penerima)'"></p>
                                    <p class="text-xs text-slate-400" x-text="dataKhusus.penerima.jabatan || 'Staff'"></p>
                                </div>
                                <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <h4 class="text-xs font-bold text-slate-400 mb-2">Penandatangan Kanan (Pemberi Kuasa)</h4>
                                    <p class="text-sm font-semibold text-white" x-text="dataKhusus.pemberi.nama || '(Pemberi)'"></p>
                                    <p class="text-xs text-slate-400" x-text="dataKhusus.pemberi.jabatan || 'Direktur Utama'"></p>
                                </div>
                            </div>
                        </template>

                        <template x-if="!isKuasa">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">Penandatangan</label>
                                    <input type="text" name="penandatangan" x-model="penandatangan" required
                                           class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">Jabatan Penandatangan</label>
                                    <input type="text" name="jabatan_penandatangan" x-model="jabatan_penandatangan" required
                                           class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                                </div>
                            </div>
                        </template>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-4 border-t border-slate-800">
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">Lampiran Dokumen</label>
                                <input type="text" name="lampiran" x-model="lampiran"
                                       class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">Status Surat</label>
                                <select name="status" required x-model="status"
                                        class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                                    <option value="Draft">Draft</option>
                                    <option value="Dikirim">Dikirim</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Action buttons --}}
                <div class="flex flex-col sm:flex-row gap-3">
                    <button type="submit"
                            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 rounded-xl text-white font-bold transition cursor-pointer shadow-lg shadow-amber-600/30 text-base">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>Perbarui Surat Keluar</span>
                    </button>
                    <a href="{{ route('surat_keluar.index') }}"
                       class="inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition border border-slate-700">
                        <i class="fa-solid fa-xmark"></i>
                        <span>Batal</span>
                    </a>
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
                 :class="isDragging ? 'bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-500/30' : 'bg-slate-800/80 group-hover:bg-amber-500/70'"></div>

            {{-- Center Grip Pill Handle --}}
            <div class="sticky top-1/2 -translate-y-1/2 w-6 h-12 rounded-xl border flex flex-col items-center justify-center gap-1 shadow-lg transition-all duration-200 backdrop-blur-md"
                 :class="isDragging ? 'bg-amber-600 border-amber-400 text-white scale-110 shadow-amber-500/30 ring-2 ring-amber-400/40' : 'bg-slate-900/90 border-slate-700/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-amber-300 group-hover:border-amber-500/60'">
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
                    <h2 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-eye text-emerald-400"></i>
                        <span>Pratinjau Realtime Surat (A4)</span>
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

                        {{-- SURAT KUASA PREVIEW --}}
                        <template x-if="isKuasa">
                            <div>
                                <div class="text-center my-4">
                                    <h2 class="font-bold text-lg">SURAT KUASA</h2>
                                    <p class="text-sm mt-1">No : <span x-text="nomor_surat"></span></p>
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
                                        <p>Dengan ini <span x-text="dataKhusus.pembuka_maksud"></span> dengan Kegiatan sebagai berikut :</p>

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
                                                    <p class="text-xs text-slate-600" x-text="'Divisi: ' + divisiLabel"></p>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </template>

                        {{-- SURAT UMUM PREVIEW --}}
                        <template x-if="!isKuasa">
                            <div>
                                <div class="text-center my-4">
                                    <h2 class="font-bold text-lg uppercase underline tracking-wider" x-text="jenis_surat ? jenis_surat.toUpperCase() : 'SURAT KELUAR'"></h2>
                                </div>

                                <div class="text-right my-4 text-sm font-medium">
                                    Bandar Lampung, <span x-text="formatTanggal(tanggal_surat)"></span>
                                </div>

                                <table class="w-full text-sm mb-6 border-collapse">
                                    <tr><td class="w-28 align-top py-1">Nomor</td><td class="w-4 align-top py-1">:</td><td class="align-top py-1 font-mono font-semibold" x-text="nomor_surat"></td></tr>
                                    <tr><td class="align-top py-1">Lampiran</td><td class="align-top py-1">:</td><td class="align-top py-1" x-text="lampiran || '-'"></td></tr>
                                    <tr><td class="align-top py-1">Hal / Perihal</td><td class="align-top py-1">:</td><td class="align-top py-1 font-bold" x-text="perihal"></td></tr>
                                </table>

                                <div class="my-6 text-sm leading-relaxed">
                                    <p>Kepada Yth.</p>
                                    <p class="font-bold" x-text="tujuan || instansi_nama || '(Tujuan Penerima)'"></p>
                                    <p>Di Tempat</p>
                                </div>

                                <div class="my-6 text-sm leading-relaxed space-y-3">
                                    <p>Dengan hormat,</p>
                                    <div class="text-justify whitespace-pre-line leading-relaxed min-h-[100px]" x-text="isi_surat"></div>
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

                                <div class="mt-12 text-sm flex justify-end">
                                    <div class="w-64 text-center">
                                        <p>Hormat kami,</p>
                                        <p class="font-semibold">PT Microdata Indonesia</p>
                                        <p class="text-xs text-slate-600" x-text="'Divisi: ' + divisiLabel"></p>
                                        <div class="h-20 flex items-center justify-center text-slate-400 text-xs italic">
                                            ( Tanda Tangan & Stempel )
                                        </div>
                                        <p class="font-bold uppercase underline" x-text="penandatangan"></p>
                                        <p class="text-xs text-slate-700 font-medium" x-text="jabatan_penandatangan"></p>
                                    </div>
                                </div>
                            </div>
                        </template>

                        {{-- Footer --}}
                        <div class="mt-auto pt-6 border-t border-slate-300 text-center text-[10px] text-slate-500">
                            Dokumen ini dibuat melalui <strong>Sistem Arsip Surat PT Microdata Indonesia</strong>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    </div>

</div>

@endsection

@push('scripts')
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
</script>
@endpush
