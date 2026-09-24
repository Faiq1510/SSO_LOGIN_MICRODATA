@extends('layouts.app')

@section('title', 'Data Instansi')

@section('content')
<div class="space-y-4">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-building text-indigo-400 text-xs sm:text-sm"></i>
                </span>
                Data Instansi
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1 ml-10 sm:ml-12">Kelola data instansi/pengirim surat pada sistem.</p>
        </div>
        <a href="{{ route('instansi.create') }}"
           class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 w-full sm:w-auto">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Tambah Instansi</span>
        </a>
    </div>

    {{-- Table Card --}}
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div class="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <i class="fa-solid fa-table-cells text-indigo-400"></i>
                Daftar Instansi
            </h2>
            <span class="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                Total: {{ count($instansi) }} instansi
            </span>
        </div>

        <div class="overflow-x-auto">
            <table id="tableInstansi" class="w-full text-sm">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Instansi</th>
                        <th>Nama Instansi</th>
                        <th>Telepon</th>
                        <th>Alamat</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($instansi as $index => $item)
                    <tr>
                        <td class="text-center text-slate-500 font-medium">{{ $index + 1 }}</td>
                        <td>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold">
                                {{ $item->kode_instansi }}
                            </span>
                        </td>
                        <td class="font-semibold text-slate-100">{{ $item->nama_instansi }}</td>
                        <td class="text-slate-400">
                            @if($item->telepon)
                                <span class="flex items-center gap-1.5">
                                    <i class="fa-solid fa-phone text-xs text-slate-600"></i>
                                    {{ $item->telepon }}
                                </span>
                            @else
                                <span class="text-slate-600">—</span>
                            @endif
                        </td>
                        <td class="text-slate-400 max-w-xs">
                            <span title="{{ $item->alamat }}">{{ $item->alamat ? Str::limit($item->alamat, 45) : '—' }}</span>
                        </td>
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <a href="{{ route('instansi.edit', $item->id) }}"
                                   class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 flex items-center justify-center transition-all duration-150"
                                   title="Edit">
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                </a>
                                <form action="{{ route('instansi.destroy', $item->id) }}" method="POST" class="deleteInstansiForm inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 flex items-center justify-center transition-all duration-150"
                                            title="Hapus">
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
document.querySelectorAll('.deleteInstansiForm').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Hapus Instansi?',
            text: 'Data instansi ini akan dihapus permanen.',
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
    $('#tableInstansi').DataTable({
        pageLength: 10,
        responsive: true,
        autoWidth: false,
        ordering: true,
        searching: true,
        info: true,
        columnDefs: [
            { orderable: false, targets: [0, 5] },
            { className: 'text-center', targets: [0, 5] },
            { className: 'text-left', targets: [1, 2, 3, 4] },
        ],
        language: {
            search: '🔍 Cari:',
            lengthMenu: 'Tampilkan _MENU_ data',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ instansi',
            infoEmpty: 'Tidak ada data',
            zeroRecords: 'Instansi tidak ditemukan',
            paginate: {
                previous: '‹',
                next: '›'
            }
        },
    });
});
</script>
@endpush