<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuratMasukStoreRequest;
use App\Http\Requests\SuratMasukUpdateRequest;
use App\Models\Arsip;
use App\Models\Instansi;
use App\Models\JenisSurat;
use App\Models\SuratMasuk;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SuratMasukController extends Controller
{
    /**
     * Menampilkan daftar surat masuk
     */
    public function index(Request $request)
    {
        $query = SuratMasuk::with('instansi');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nomor_agenda', 'like', '%' . $request->search . '%')
                    ->orWhere('nomor_surat', 'like', '%' . $request->search . '%')
                    ->orWhere('asal_surat', 'like', '%' . $request->search . '%')
                    ->orWhere('perihal', 'like', '%' . $request->search . '%');
            });
        }

        $surat = $query
            ->latest()
            ->get();

        $jumlahDihapus = SuratMasuk::onlyTrashed()->count();

        return view('surat_masuk.index', compact('surat', 'jumlahDihapus'));
    }

    /**
     * Form tambah surat masuk
     */
 public function create()
{
    $lastAngka = SuratMasuk::withTrashed()
        ->get()
        ->map(function ($surat) {
            return (int) substr($surat->nomor_agenda, 4);
        })
        ->max();

    $angka = ($lastAngka ?? 0) + 1;

    $nomorAgenda = 'AGD-' . str_pad($angka, 4, '0', STR_PAD_LEFT);

    $instansis = Instansi::orderBy('nama_instansi')->get();
    $jenisSurats = JenisSurat::orderBy('nama')->get();

    return view('surat_masuk.create', compact(
        'nomorAgenda',
        'instansis',
        'jenisSurats'
    ));
}
/**
 * Simpan surat masuk
 */
public function store(SuratMasukStoreRequest $request)
{
    $namaFile = null;

    if ($request->hasFile('file_surat')) {

        $namaFile = time() . '_' .
            $request->file('file_surat')->getClientOriginalName();

        $request->file('file_surat')->storeAs(
            'surat_masuk',
            $namaFile,
            'public'
        );
    }

    // ==========================
    // Simpan Surat Masuk
    // ==========================

    $lastAngka = SuratMasuk::withTrashed()
    ->get()
    ->map(function ($surat) {
        return (int) substr($surat->nomor_agenda, 4);
    })
    ->max();

$angka = ($lastAngka ?? 0) + 1;

$nomorAgenda = 'AGD-' . str_pad($angka, 4, '0', STR_PAD_LEFT);

$instansi = Instansi::findOrFail($request->instansi_id);

$surat = SuratMasuk::create([
    'nomor_agenda' => $nomorAgenda,
    'nomor_surat'    => $request->nomor_surat,

    'instansi_id'    => $request->instansi_id,
    'asal_surat'     => $instansi->nama_instansi,

    'tanggal_surat'  => $request->tanggal_surat,
    'tanggal_terima' => $request->tanggal_terima,

    'jenis_surat'    => $request->jenis_surat,
    'perihal'        => $request->perihal,
    'isi_ringkas'    => $request->isi_ringkas,
    'lampiran'       => $request->lampiran,
    'keterangan'     => $request->keterangan,
    'status'         => $request->status,
    'file_surat'     => $namaFile,
    'user_id'        => Auth::id(),

]);

    // ==========================
    // Simpan Otomatis ke Arsip
    // ==========================

    Arsip::create([

        'surat_masuk_id' => $surat->id,

        'surat_keluar_id' => null,

        'nomor_surat' => $surat->nomor_surat,

        'jenis' => 'Surat Masuk',

        'jenis_surat' => $surat->jenis_surat,

        'perihal' => $surat->perihal,

        'pengirim_penerima' => $surat->asal_surat,

        'tanggal_surat' => $surat->tanggal_surat,

        'lampiran' => $surat->lampiran,

        'file_surat' => $surat->file_surat,

        'status' => $surat->status,

        'user_id' => $surat->user_id,

    ]);

    return redirect()
        ->route('surat_masuk.index')
        ->with('success', 'Surat masuk berhasil ditambahkan.');
}
/**
 * Detail surat
 */
public function show(string $id)
{
    $surat = SuratMasuk::findOrFail($id);

    return view('surat_masuk.show', compact('surat'));
}

/**
 * Form edit surat
 */
public function edit($id)
{
    $surat = SuratMasuk::findOrFail($id);

    $instansis = Instansi::orderBy('nama_instansi')->get();
    $jenisSurats = JenisSurat::orderBy('nama')->get();

    return view('surat_masuk.edit', compact(
        'surat',
        'instansis',
        'jenisSurats'
    ));
}
/**
 * Update surat masuk
 */
public function update(SuratMasukUpdateRequest $request, string $id)
{
    $surat = SuratMasuk::findOrFail($id);

    $namaFile = $surat->file_surat;

    if ($request->hasFile('file_surat')) {

        if (
            $surat->file_surat &&
            Storage::disk('public')->exists('surat_masuk/' . $surat->file_surat)
        ) {
            Storage::disk('public')->delete('surat_masuk/' . $surat->file_surat);
        }

        $namaFile = time() . '_' .
            $request->file('file_surat')->getClientOriginalName();

        $request->file('file_surat')->storeAs(
            'surat_masuk',
            $namaFile,
            'public'
        );
    }

    // Update Surat Masuk
    $instansi = Instansi::findOrFail($request->instansi_id);
    $surat->update([

        'nomor_agenda'   => $request->nomor_agenda,

        'nomor_surat'    => $request->nomor_surat,

        'instansi_id' => $request->instansi_id,

        'tanggal_surat'  => $request->tanggal_surat,

        'tanggal_terima' => $request->tanggal_terima,

        'asal_surat' => $instansi->nama_instansi,

        'jenis_surat'    => $request->jenis_surat,

        'perihal'        => $request->perihal,

        'isi_ringkas'    => $request->isi_ringkas,

        'lampiran'       => $request->lampiran,

        'keterangan'     => $request->keterangan,

        'status'         => $request->status,

        'file_surat'     => $namaFile,

    ]);

    // ===============================
    // Update Arsip Otomatis
    // ===============================

    Arsip::where('surat_masuk_id', $surat->id)
        ->update([

            'nomor_surat' => $surat->nomor_surat,

            'jenis' => 'Surat Masuk',

            'jenis_surat' => $surat->jenis_surat,

            'perihal' => $surat->perihal,

            'pengirim_penerima' => $instansi->nama_instansi,

            'tanggal_surat' => $surat->tanggal_surat,

            'lampiran' => $surat->lampiran,

            'file_surat' => $surat->file_surat,

            'status' => $surat->status,

            'user_id' => $surat->user_id,

        ]);

    return redirect()
        ->route('surat_masuk.index')
        ->with('success', 'Surat masuk berhasil diperbarui.');
}
/**
 * Hapus surat masuk
 */
public function destroy(string $id)
{
    $surat = SuratMasuk::findOrFail($id);

    // Hapus Arsip Otomatis (soft delete)
    Arsip::where('surat_masuk_id', $surat->id)->delete();

    // Hapus Surat Masuk (soft delete)
    $surat->delete();

    return redirect()
        ->route('surat_masuk.index')
        ->with('success', 'Surat masuk berhasil dihapus.');
}

/**
 * Unduh PDF Lembar Agenda Surat Masuk
 */
public function downloadPdf($id)
{
    $surat = SuratMasuk::with('instansi')->findOrFail($id);

    $pdf = Pdf::loadView('surat_masuk.pdf', compact('surat'));

    $namaFile = 'Surat-Masuk-' . str_replace(['/', '\\'], '-', $surat->nomor_agenda) . '.pdf';

    return $pdf->stream($namaFile);
}
}
