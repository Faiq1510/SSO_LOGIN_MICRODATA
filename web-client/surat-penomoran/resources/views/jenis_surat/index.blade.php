@extends('layouts.app')

@section('title', 'Data Jenis Surat')

@section('content')
<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-tags text-indigo-400 text-xs sm:text-sm"></i>
                </span>
                Data Jenis Surat
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Kelola master jenis surat dan pengkodean pada sistem.</p>
        </div>
    </div>

    {{-- Alert Info Tambah Data via Form Surat Keluar --}}
    <div class="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
        <i class="fa-solid fa-circle-info text-indigo-400 text-base sm:text-lg mt-0.5 shrink-0"></i>
        <div class="text-xs text-indigo-200 space-y-1">
            <p class="font-semibold text-xs sm:text-sm">Informasi Penambahan Jenis Surat</p>
            <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Data Jenis Surat ditambahkan secara interaktif dari form input <span class="font-semibold text-white">Surat Keluar</span>. Pada halaman ini Anda dapat mengedit dan menghapus data jenis surat yang telah terdaftar.
            </p>
        </div>
    </div>

    {{-- Table Card --}}
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div class="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <i class="fa-solid fa-table-cells text-indigo-400"></i>
                Daftar Jenis Surat
            </h2>
            <span class="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                Total: {{ count($jenisSurat) }} jenis surat
            </span>
        </div>

        <div class="overflow-x-auto">
            <table id="tableJenisSurat" class="w-full text-sm">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Surat</th>
                        <th>Nama Jenis Surat</th>
                        <th>Tipe Form</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($jenisSurat as $index => $item)
                    <tr>
                        <td class="text-center text-slate-500 font-medium">{{ $index + 1 }}</td>
                        <td>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold">
                                {{ $item->kode_surat }}
                            </span>
                        </td>
                        <td class="font-semibold text-slate-100">{{ $item->nama }}</td>
                        <td>
                            @if($item->form_type === 'kuasa')
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    Surat Kuasa
                                </span>
                            @else
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-300">
                                    Umum
                                </span>
                            @endif
                        </td>
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <a href="{{ route('jenis_surat.edit', $item->id) }}"
                                   class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 flex items-center justify-center transition-all duration-150"
                                   title="Edit">
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                </a>
                                <form action="{{ route('jenis_surat.destroy', $item->id) }}" method="POST" class="deleteJenisSuratForm inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 flex items-center justify-center transition-all duration-150"
                                            title="Hapus ke Tempat Sampah">
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
document.querySelectorAll('.deleteJenisSuratForm').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Pindahkan ke Tempat Sampah?',
            text: 'Data jenis surat ini akan dipindahkan ke tempat sampah.',
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
    $('#tableJenisSurat').DataTable({
        pageLength: 10,
        responsive: true,
        autoWidth: false,
        ordering: true,
        searching: true,
        info: true,
        columnDefs: [
            { orderable: false, targets: [0, 4] },
            { className: 'text-center', targets: [0, 4] },
            { className: 'text-left', targets: [1, 2, 3] },
        ],
        language: {
            search: '🔍 Cari:',
            lengthMenu: 'Tampilkan _MENU_ data',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ jenis surat',
            infoEmpty: 'Tidak ada data',
            zeroRecords: 'Jenis surat tidak ditemukan',
            paginate: {
                previous: '‹',
                next: '›'
            }
        },
    });
});
</script>
@endpush
