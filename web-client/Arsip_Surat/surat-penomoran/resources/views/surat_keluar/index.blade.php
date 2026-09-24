@extends('layouts.app')

@section('title', 'Data Surat Keluar')

@section('content')

<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-paper-plane text-violet-400 text-xs sm:text-sm"></i>
                </span>
                Data Surat Keluar
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Kelola seluruh data surat keluar PT Microdata Indonesia.</p>
        </div>
        <a href="{{ route('surat_keluar.create') }}"
           class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 whitespace-nowrap w-full sm:w-auto">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Tambah Surat</span>
        </a>
    </div>

    {{-- Peringatan surat di tempat sampah --}}
    @if($jumlahDihapus > 0)
    <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div class="flex items-center gap-3">
            <i class="fa-solid fa-trash-can text-amber-400 shrink-0"></i>
            <p class="text-xs sm:text-sm text-amber-300">
                Ada <span class="font-semibold">{{ $jumlahDihapus }} surat keluar</span> yang sudah dihapus dan menunggu di tempat sampah.
            </p>
        </div>
        <a href="{{ route('recycle-bin.index') }}"
           class="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors self-end sm:self-auto">
            Lihat Tempat Sampah →
        </a>
    </div>
    @endif

    {{-- Table Card --}}
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div class="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <i class="fa-solid fa-table-list text-violet-400"></i>
                Daftar Surat Keluar
            </h2>
            <span class="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                Total: {{ count($surat) }} surat
            </span>
        </div>

        <div class="p-2 sm:p-4 overflow-x-auto">
            <table id="tableSuratKeluar" class="w-full text-sm">
                <thead>
                    <tr>
                        <th class="px-6 py-4 text-center">No</th>
                        <th class="px-6 py-4">Nomor Surat</th>
                        <th class="px-6 py-4">Tanggal</th>
                        <th class="px-6 py-4">Instansi Tujuan</th>
                        <th class="px-6 py-4">Tujuan</th>
                        <th class="px-6 py-4 text-center">Status</th>
                        <th class="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($surat as $index => $item)
                    <tr>
                        <td class="text-center text-slate-500 font-medium">{{ $index + 1 }}</td>

                        <td class="font-mono font-semibold text-white">{{ $item->nomor_surat }}</td>

                        <td class="text-slate-400 whitespace-nowrap">
                            {{ \Carbon\Carbon::parse($item->tanggal_surat)->format('d-m-Y') }}
                        </td>

                        <td class="px-6 py-4">
                            @if($item->instansi)
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg {{ $item->instansi->trashed() ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' }} border text-xs font-medium" title="{{ $item->instansi->trashed() ? 'Instansi berada di tempat sampah' : '' }}">
                                    <i class="fa-solid {{ $item->instansi->trashed() ? 'fa-trash-can text-amber-400' : 'fa-building text-indigo-400' }} text-[10px]"></i>
                                    {{ $item->instansi->nama_instansi }}
                                    @if($item->instansi->trashed())
                                        <span class="text-[10px] opacity-75 font-normal">(Dihapus)</span>
                                    @endif
                                </span>
                            @else
                                <span class="text-slate-600 text-xs italic">—</span>
                            @endif
                        </td>

                        <td class="text-slate-300">
                            <span title="{{ $item->tujuan }}">{{ Str::limit($item->tujuan, 35) }}</span>
                        </td>

                        <td class="text-center">
                            @if($item->status == 'Draft')
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/20">
                                    <i class="fa-solid fa-file-pen text-xs"></i>
                                    Draft
                                </span>
                            @elseif($item->status == 'Dikirim')
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                    <i class="fa-solid fa-paper-plane text-xs"></i>
                                    Dikirim
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    <i class="fa-solid fa-check text-xs"></i>
                                    Selesai
                                </span>
                            @endif
                        </td>

                        <td class="text-center">
                            <div class="flex items-center justify-center gap-1.5">
                                {{-- Detail --}}
                                <a href="{{ route('surat_keluar.show', $item->id) }}"
                                   class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 flex items-center justify-center transition-all duration-150"
                                   title="Lihat Detail">
                                    <i class="fa-solid fa-eye text-xs"></i>
                                </a>

                                {{-- Preview PDF --}}
                                <a href="{{ route('surat_keluar.preview', $item->id) }}"
                                   class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 flex items-center justify-center transition-all duration-150"
                                   title="Preview PDF">
                                    <i class="fa-solid fa-file-lines text-xs"></i>
                                </a>

                                {{-- Kirim (Email / WA) Dropdown --}}
                                <div class="relative" x-data="{ open: false }" @click.outside="open = false">
                                    <button type="button" @click="open = !open"
                                            class="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-white hover:border-violet-500 flex items-center justify-center transition-all duration-150"
                                            title="Kirim Surat">
                                        <i class="fa-solid fa-share-nodes text-xs"></i>
                                    </button>

                                    <div x-show="open" x-cloak
                                         class="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                        <div class="px-3 py-2 text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-800">
                                            Kirim via
                                        </div>
                                        <button type="button"
                                                @click="$dispatch('open-modal-email-surat-{{ $item->id }}'); open = false"
                                                class="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                            <i class="fa-solid fa-envelope text-indigo-400 w-4"></i>
                                            Email
                                        </button>
                                        <button type="button"
                                                @click="$dispatch('open-modal-wa-surat-{{ $item->id }}'); open = false"
                                                class="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                            <i class="fa-brands fa-whatsapp text-emerald-400 w-4"></i>
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {{-- Hapus --}}
                                <form action="{{ route('surat_keluar.destroy', $item->id) }}" method="POST" class="deleteForm inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 flex items-center justify-center transition-all duration-150"
                                            title="Hapus Surat">
                                        <i class="fa-solid fa-trash text-xs"></i>
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

</div>

{{-- MODALS EMAIL & WA (di luar tabel agar HTML tetap bersih) --}}
@foreach($surat as $item)
    {{-- Modal Email (FIX: style="display: none;" & x-cloak untuk cegah modal muncul otomatis saat load) --}}
    <div x-data="{ show: false }"
         @open-modal-email-surat-{{ $item->id }}.window="show = true"
         x-show="show" x-cloak style="display: none;"
         class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="show = false"></div>
        <div class="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-envelope text-indigo-400"></i>
                </span>
                <div>
                    <h3 class="text-base font-semibold text-white">Kirim via Email</h3>
                    <p class="text-xs text-slate-500">Lampiran PDF akan disertakan otomatis</p>
                </div>
            </div>

            <form action="{{ route('surat_keluar.send.email', $item->id) }}" method="POST">
                @csrf
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Alamat Email Tujuan</label>
                <input type="email" name="email" required placeholder="nama@contoh.com"
                       class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mb-3">

                <p class="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
    <i class="fa-solid fa-paperclip text-slate-600"></i>
    File PDF surat ini akan otomatis dilampirkan.

    <a href="{{ route('surat_keluar.preview', ['id' => $item->id]) }}"
       target="_blank"
       class="text-indigo-400 hover:text-indigo-300 underline font-medium ml-1">
        Lihat PDF
    </a>
</p>

                <div class="flex justify-end gap-2">
                    <button type="button" @click="show = false"
                            class="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane text-xs"></i>
                        Kirim
                    </button>
                </div>
            </form>
        </div>
    </div>

    {{-- Modal WhatsApp (FIX: style="display: none;" & x-cloak untuk cegah modal muncul otomatis saat load) --}}
    <div x-data="{ show: false }"
         @open-modal-wa-surat-{{ $item->id }}.window="show = true"
         x-show="show" x-cloak style="display: none;"
         class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="show = false"></div>
        <div class="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <i class="fa-brands fa-whatsapp text-emerald-400 text-lg"></i>
                </span>
                <div>
                    <h3 class="text-base font-semibold text-white">Kirim via WhatsApp</h3>
                    <p class="text-xs text-slate-500">Surat dikirim beserta file PDF-nya</p>
                </div>
            </div>

            <form action="{{ route('surat_keluar.send.whatsapp', $item->id) }}" method="POST">
                @csrf
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Nomor WhatsApp</label>
                <input type="text" name="nomor_wa" required placeholder="08xxxxxxxxxx"
                       class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition mb-4">

                <div class="flex justify-end gap-2">
                    <button type="button" @click="show = false"
                            class="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-2">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        Kirim
                    </button>
                </div>
            </form>
        </div>
    </div>
@endforeach

@endsection

@push('scripts')
<script>
// SweetAlert konfirmasi hapus surat keluar
document.querySelectorAll('.deleteForm').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Hapus Surat?',
            text: 'Surat akan dipindahkan ke tempat sampah.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f8fafc',
        }).then((result) => {
            if (result.isConfirmed) {
                form.submit();
            }
        });
    });
});

$(document).ready(function () {
    $('#tableSuratKeluar').DataTable({
        pageLength: 10,
        responsive: true,
        autoWidth: false,
        ordering: true,
        searching: true,
        info: true,
        columnDefs: [
            { orderable: false, targets: [0, 6] },
            { className: 'text-center', targets: [0, 5, 6] },
            { className: 'text-left', targets: [1, 2, 3, 4] },
        ],
        language: {
            search: '🔍 Cari:',
            lengthMenu: 'Tampilkan _MENU_ data',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ surat',
            infoEmpty: 'Tidak ada data',
            zeroRecords: 'Surat keluar tidak ditemukan',
            paginate: {
                previous: '‹',
                next: '›'
            }
        },
    });
});
</script>
@endpush
