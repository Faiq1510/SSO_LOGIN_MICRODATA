@extends('layouts.app')

@section('title', 'Arsip Surat')

@section('content')

<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-box-archive text-emerald-400 text-xs sm:text-sm"></i>
                </span>
                Arsip Surat
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Seluruh surat masuk dan surat keluar secara otomatis masuk ke arsip.</p>
        </div>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold self-start sm:self-auto">
            <i class="fa-solid fa-circle-check text-xs"></i>
            Arsip Otomatis
        </span>
    </div>

    {{-- Alert --}}
    @if(session('success'))
    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ session('success') }}</span>
    </div>
    @endif

    {{-- Filter Bar --}}
    <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div class="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <i class="fa-solid fa-filter"></i>
            Filter:
        </div>
        
        <div class="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 flex-1">
            {{-- Diubah value-nya agar cocok dengan teks yang dirender di tabel (Masuk / Keluar) --}}
            <select id="filterJenis"
                    class="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer w-full sm:w-auto">
                <option value="">Semua Jenis</option>
                <option value="Masuk">Surat Masuk</option>
                <option value="Keluar">Surat Keluar</option>
            </select>

            <select id="filterStatus"
                    class="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer w-full sm:w-auto">
                <option value="">Semua Status</option>
                <option value="Baru">Baru</option>
                <option value="Diproses">Diproses</option>
                <option value="Draft">Draft</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Selesai">Selesai</option>
            </select>

            <button id="resetFilter"
                    class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 w-full sm:w-auto">
                <i class="fa-solid fa-rotate-left text-xs"></i>
                Reset
            </button>
        </div>

        <div class="w-full sm:w-auto sm:ml-auto flex items-center justify-between sm:justify-start gap-2 text-slate-500 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-database text-slate-600"></i>
                Total: <span class="text-slate-300 font-semibold">{{ count($arsipSurat) }}</span> arsip
            </span>
        </div>
    </div>

    {{-- Table Card --}}
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div class="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center gap-2">
            <i class="fa-solid fa-table-list text-emerald-400"></i>
            <h2 class="text-sm font-semibold text-slate-300">Daftar Arsip Surat</h2>
        </div>

        <div class="overflow-x-auto">
            <table id="tableArsip" class="w-full text-sm">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nomor Surat</th>
                        <th>Jenis</th>
                        <th>Perihal</th>
                        <th>Pengirim / Penerima</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($arsipSurat as $index => $surat)
                    <tr>
                        <td class="text-center text-slate-500 font-medium">{{ $index + 1 }}</td>

                        <td class="font-semibold text-white font-mono">{{ $surat->nomor_surat }}</td>

                        <td>
                            {{-- Fleksibel mengecek 'Masuk', 'Surat Masuk', maupun lowercase --}}
                            @if(in_array(strtolower($surat->jenis), ['surat masuk', 'masuk']))
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                    <i class="fa-solid fa-inbox text-xs"></i>
                                    Masuk
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    <i class="fa-solid fa-paper-plane text-xs"></i>
                                    Keluar
                                </span>
                            @endif
                        </td>

                        <td class="text-slate-300 max-w-xs">
                            <span title="{{ $surat->perihal }}">{{ Str::limit($surat->perihal, 40) }}</span>
                        </td>

                        <td class="text-slate-300">{{ $surat->pengirim_penerima }}</td>

                        <td class="text-slate-400 whitespace-nowrap">
                            {{ \Carbon\Carbon::parse($surat->tanggal_surat)->translatedFormat('d M Y') }}
                        </td>

                        <td>
                            @php
                                $badge = match($surat->status) {
                                    'Baru'     => 'bg-sky-500/15 text-sky-400 border-sky-500/20',
                                    'Diproses' => 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
                                    'Draft'    => 'bg-slate-500/15 text-slate-300 border-slate-500/20',
                                    'Dikirim'  => 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
                                    'Selesai'  => 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                                    default    => 'bg-slate-500/15 text-slate-400 border-slate-500/20',
                                };
                            @endphp
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border {{ $badge }}">
                                {{ $surat->status }}
                            </span>
                        </td>

                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <a href="{{ route('arsip.show', $surat->id) }}"
                                   class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 flex items-center justify-center transition-all duration-150"
                                   title="Lihat Detail">
                                    <i class="fa-solid fa-eye text-xs"></i>
                                </a>

                                <form action="{{ route('arsip.destroy', $surat->id) }}" method="POST" class="deleteArsipForm inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 flex items-center justify-center transition-all duration-150"
                                            title="Hapus Arsip">
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

@endsection

@push('scripts')
<script>
// SweetAlert konfirmasi hapus arsip
document.querySelectorAll('.deleteArsipForm').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Hapus Arsip?',
            text: 'Arsip dan surat asli akan dihapus. Data tidak dapat dikembalikan.',
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
    // Inisialisasi DataTable
    var table = $('#tableArsip').DataTable({
        pageLength: 10,
        responsive: true,
        autoWidth: false,
        ordering: true,
        searching: true,
        info: true,
        columnDefs: [
            { orderable: false, targets: [0, 7] },
            { className: 'text-center', targets: [0, 2, 6, 7] },
            { className: 'text-left', targets: [1, 3, 4, 5] },
        ],
        language: {
            search: '🔍 Cari:',
            lengthMenu: 'Tampilkan _MENU_ data',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ arsip',
            infoEmpty: 'Tidak ada data',
            zeroRecords: 'Arsip tidak ditemukan',
            paginate: {
                previous: '‹',
                next: '›'
            }
        }
    });

    // Filter Jenis menggunakan pencarian parsial (tanpa regex rigid ^...$)
    $('#filterJenis').on('change', function () {
        table.column(2).search(this.value).draw();
    });

    // Filter Status menggunakan pencarian parsial
    $('#filterStatus').on('change', function () {
        table.column(6).search(this.value).draw();
    });

    // Reset filter
    $('#resetFilter').on('click', function () {
        $('#filterJenis').val('');
        $('#filterStatus').val('');
        table.search('').columns().search('').draw();
    });
});
</script>
@endpush