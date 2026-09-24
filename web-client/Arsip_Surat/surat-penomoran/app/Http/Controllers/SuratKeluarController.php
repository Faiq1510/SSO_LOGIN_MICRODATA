<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuratKeluarStoreRequest;
use App\Http\Requests\SuratKeluarUpdateRequest;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\Arsip;
use App\Models\JenisSurat;
use App\Models\Instansi;
use App\Mail\SuratKeluarMail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;

       
class SuratKeluarController extends Controller
{
    /**
     * Menampilkan daftar surat keluar
     */
    public function index()
    {
        $surat = SuratKeluar::with('instansi')->latest()->get();
        $jumlahDihapus = SuratKeluar::onlyTrashed()->count();

        return view('surat_keluar.index', compact('surat','jumlahDihapus'));
    }

    /**
     * Menampilkan form tambah surat keluar
     */
    public function create(Request $request)
    {
        $suratMasuk = null;

        if ($request->filled('surat_masuk')) {
            $suratMasuk = SuratMasuk::findOrFail($request->surat_masuk);
        }

        $jenisSuratList = JenisSurat::orderBy('nama')->get();
        $instansis = Instansi::orderBy('nama_instansi')->get();

        return view('surat_keluar.create', compact('suratMasuk', 'jenisSuratList', 'instansis'));
    }

    /**
     * Bangun payload untuk jenis surat khusus (misal Surat Kuasa & Tabel Surat Umum).
     */
    private function buildKuasaData(Request $request)
    {
        $tipeForm = $request->input('tipe_form');
        if (!empty($tipeForm)) {
            $isKuasa = ($tipeForm === 'kuasa');
        } else {
            $isKuasa = JenisSurat::where('nama', $request->jenis_surat)
                ->where('form_type', 'kuasa')
                ->exists() || \Illuminate\Support\Str::contains(strtolower($request->jenis_surat), 'kuasa');
        }

        $dk = $request->input('data_khusus', []);
        $dk['tipe_form'] = $isKuasa ? 'kuasa' : 'umum';

        if (!$isKuasa) {
            return [
                'perihal' => $request->perihal,
                'tujuan' => $request->tujuan,
                'isi_surat' => $request->isi_surat,
                'data_khusus' => $dk,
            ];
        }

        $pemberi = $dk['pemberi'] ?? [];
        $penerima = $dk['penerima'] ?? [];
        $pembukaMaksud = $dk['pembuka_maksud'] ?? 'mewakili Direktur untuk melaksanakan Pembuktian Kualifikasi';
        $kegiatanItems = is_array($dk['kegiatan_items'] ?? null) 
            ? array_values(array_filter($dk['kegiatan_items'], fn($v) => trim($v ?? '') !== '')) 
            : [];
        $lokasiInstansi = $dk['lokasi_instansi'] ?? '';

        $isiSurat = "Yang bertanda tangan di bawah ini:\n";
        $isiSurat .= "Nama\t\t: " . ($pemberi['nama'] ?? '-') . "\n";
        $isiSurat .= "Jabatan\t\t: " . ($pemberi['jabatan'] ?? '-') . "\n";
        $isiSurat .= "Alamat\t\t: " . ($pemberi['alamat'] ?? '-') . "\n\n";
        $isiSurat .= "Dengan ini memberikan kuasa kepada:\n";
        $isiSurat .= "Nama\t\t: " . ($penerima['nama'] ?? '-') . "\n";
        $isiSurat .= "Jabatan\t\t: " . ($penerima['jabatan'] ?? '-') . "\n\n";
        $isiSurat .= "Dengan ini " . $pembukaMaksud . " dengan Kegiatan sebagai berikut:\n";
        foreach ($kegiatanItems as $idx => $item) {
            $isiSurat .= ($idx + 1) . ". " . $item . "\n";
        }
        if ($lokasiInstansi) {
            $isiSurat .= "pada " . $lokasiInstansi . ".\n\n";
        } else {
            $isiSurat .= "\n";
        }
        $isiSurat .= "Demikian Surat Kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.";

        return [
            'perihal' => 'SURAT KUASA',
            'tujuan' => $penerima['nama'] ?? ($request->tujuan ?: 'Penerima Kuasa'),
            'isi_surat' => $isiSurat,
            'data_khusus' => $dk,
        ];
    }

    /**
 * API: Hitung nomor surat berikutnya (untuk preview realtime di form create)
 * GET /surat_keluar/next-nomor?kode_surat=SK&kode_divisi=HRD&tanggal_surat=2026-08-11
 */
public function nextNomor(Request $request)
{
    $kodeSurat  = strtoupper($request->input('kode_surat', 'SK'));
    $kodeDivisi = $request->input('kode_divisi', 'HRD');
    $tglSurat   = $request->input('tanggal_surat');

    // Tentukan bulan & tahun dari tanggal yang dipilih user (bukan bulan sekarang)
    if ($tglSurat) {
        $dt     = \Carbon\Carbon::parse($tglSurat);
        $bulan  = $dt->month;
        $tahun  = $dt->year;
    } else {
        $bulan  = now()->month;
        $tahun  = now()->year;
    }

    $romawi = [
        1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
        5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
        9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
    ];

    $lastNomor = SuratKeluar::withTrashed()
        ->whereMonth('tanggal_surat', $bulan)
        ->whereYear('tanggal_surat', $tahun)
        ->get()
        ->map(fn($s) => (int) explode('/', $s->nomor_surat)[0])
        ->max();

    $jumlah = ($lastNomor ?? 0) + 1;
    $nomorFormatted = $jumlah < 100
        ? str_pad($jumlah, 2, '0', STR_PAD_LEFT)
        : $jumlah;

    $nomorSurat = $nomorFormatted . '/' . $kodeSurat . '/' . $kodeDivisi . '/PT-MDI/' . $romawi[$bulan] . '/' . $tahun;

    return response()->json(['nomor' => $nomorSurat]);
}

/**
 * Generate Nomor Surat Otomatis
 * Format:
 * 001/SK/DIR-I/PT-MDI/VIII/2026
 */    
    private function generateNomorSurat($kodeSurat, $kodeDivisi, $tanggalSurat = null)
    {
        if ($tanggalSurat) {
            $dt     = \Carbon\Carbon::parse($tanggalSurat);
            $bulan  = $dt->month;
            $tahun  = $dt->year;
        } else {
            $bulan  = now()->month;
            $tahun  = now()->year;
        }

        $romawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];

        $kodeSurat = strtoupper($kodeSurat);

        do {
            $lastNomor = SuratKeluar::withTrashed()
                ->whereMonth('tanggal_surat', $bulan)
                ->whereYear('tanggal_surat', $tahun)
                ->get()
                ->map(function ($surat) {
                    return (int) explode('/', $surat->nomor_surat)[0];
                })
                ->max();

            $jumlah = ($lastNomor ?? 0) + 1;

            $nomorFormatted = $jumlah < 100
                ? str_pad($jumlah, 2, '0', STR_PAD_LEFT)
                : $jumlah;

            $nomorSurat = $nomorFormatted . '/' . $kodeSurat . '/' . $kodeDivisi . '/PT-MDI/' . $romawi[$bulan] . '/' . $tahun;

            $exists = SuratKeluar::where('nomor_surat', $nomorSurat)->exists();

            $jumlah++;
        } while ($exists);

        return $nomorSurat;
    }
/**
 * Menyimpan surat keluar
 */
public function store(SuratKeluarStoreRequest $request)
{
    // Kumpulkan data khusus (misal data Surat Kuasa)
    $kuasaData = $this->buildKuasaData($request);
    $dataKhusus = $kuasaData['data_khusus'];

    // instansi_id hanya dipakai sebagai penanda/tag untuk sorting & filter
    // di daftar surat keluar — tidak memengaruhi isi surat (tujuan/perihal/isi_surat).
    $tujuan = $kuasaData['tujuan'];

    // Default nama file: null kalau tidak upload PDF baru
    $namaFile = null;

    if ($request->hasFile('file_surat')) {

        $namaFile = time() . '_' . $request->file('file_surat')->getClientOriginalName();

        $request->file('file_surat')->storeAs(
            'surat_keluar',
            $namaFile,
            'public'
        );
    }

    // Simpan Surat Keluar
    $surat = SuratKeluar::create([

        'nomor_surat' => $this->generateNomorSurat($request->kode_surat ?? 'SK', $request->kode_divisi, $request->tanggal_surat),

        'tanggal_surat' => $request->tanggal_surat,

        'jenis_surat' => $request->jenis_surat,

        'kode_surat' => strtoupper($request->kode_surat),

        'kode_divisi' => $request->kode_divisi,

        'instansi_id' => $request->instansi_id,

        'tujuan' => $tujuan,

        'perihal' => $kuasaData['perihal'],

        'isi_surat' => $kuasaData['isi_surat'],

        'data_khusus' => $dataKhusus,

        'lampiran' => $request->lampiran,

        'penandatangan' => $request->penandatangan ?? ($dataKhusus['pemberi']['nama'] ?? 'Pemberi Kuasa'),

        'jabatan_penandatangan' => $request->jabatan_penandatangan ?? 'Pemberi Kuasa',

        'status' => $request->status,

        'file_surat' => $namaFile,

        'surat_masuk_id' => $request->surat_masuk_id,

        'user_id' => Auth::id(),

    ]);

    // ============================
    // Simpan Otomatis ke Arsip
    // ============================

    Arsip::create([

        'surat_keluar_id' => $surat->id,

        'surat_masuk_id' => $surat->surat_masuk_id,

        'nomor_surat' => $surat->nomor_surat,

        'jenis' => 'Surat Keluar',

        'jenis_surat' => $surat->jenis_surat,

        'perihal' => $surat->perihal,

        'pengirim_penerima' => $surat->tujuan,

        'tanggal_surat' => $surat->tanggal_surat,

        'lampiran' => $surat->lampiran,

        'file_surat' => $surat->file_surat,

        'status' => $surat->status,

        'user_id' => $surat->user_id,

    ]);

    return redirect()
        ->route('surat_keluar.create', $surat->id)
        ->with('success', 'Surat keluar berhasil dibuat.')
        ->with('surat_tersimpan', $surat);
}
/**
 * Menampilkan detail surat
 */
public function show($id)
{
    $surat = SuratKeluar::findOrFail($id);

    return view('surat_keluar.show', compact('surat'));
}

/**
 * Menampilkan form edit surat
 */
public function edit($id)
{
    $surat = SuratKeluar::findOrFail($id);

    $jenisSuratList = JenisSurat::orderBy('nama')->get();
    $instansis = Instansi::orderBy('nama_instansi')->get();

    return view('surat_keluar.edit', compact('surat', 'jenisSuratList', 'instansis'));
}

/**
 * Mengupdate data surat keluar
 */
public function update(SuratKeluarUpdateRequest $request, $id)
{
    $surat = SuratKeluar::findOrFail($id);

    // Kumpulkan data khusus (misal data Surat Kuasa)
    $kuasaData = $this->buildKuasaData($request);
    $dataKhusus = $kuasaData['data_khusus'];

    // instansi_id hanya dipakai sebagai penanda/tag untuk sorting & filter
    // di daftar surat keluar — tidak memengaruhi isi surat.
    $tujuan = $kuasaData['tujuan'];

    // Default nama file: tetap pakai file lama kalau tidak upload PDF baru
    $namaFile = $surat->file_surat;

    if ($request->hasFile('file_surat')) {

        if (
            $surat->file_surat &&
            Storage::disk('public')->exists('surat_keluar/' . $surat->file_surat)
        ) {
            Storage::disk('public')->delete('surat_keluar/' . $surat->file_surat);
        }

        $namaFile = time() . '_' . $request->file('file_surat')->getClientOriginalName();

        $request->file('file_surat')->storeAs(
            'surat_keluar',
            $namaFile,
            'public'
        );
    }

    $surat->update([

        'tanggal_surat' => $request->tanggal_surat,

        'nomor_surat' => $request->filled('nomor_surat') ? $request->nomor_surat : $surat->nomor_surat,

        'jenis_surat' => $request->jenis_surat,

        'kode_surat' => strtoupper($request->kode_surat),

        'kode_divisi' => $request->kode_divisi,

        'instansi_id' => $request->instansi_id,

        'tujuan' => $tujuan,

        'perihal' => $kuasaData['perihal'],

        'isi_surat' => $kuasaData['isi_surat'],

        'data_khusus' => $dataKhusus,

        'lampiran' => $request->lampiran,

        'penandatangan' => $request->penandatangan ?? ($dataKhusus['pemberi']['nama'] ?? 'Pemberi Kuasa'),

        'jabatan_penandatangan' => $request->jabatan_penandatangan ?? 'Pemberi Kuasa',

        'status' => $request->status,

        'file_surat' => $namaFile,

    ]);

    // ===============================
    // Update data arsip otomatis
    // ===============================

    Arsip::where('surat_keluar_id', $surat->id)
        ->update([

            'nomor_surat' => $surat->nomor_surat,

            'jenis' => 'Surat Keluar',

            'jenis_surat' => $surat->jenis_surat,

            'perihal' => $surat->perihal,

            'pengirim_penerima' => $surat->tujuan,

            'tanggal_surat' => $surat->tanggal_surat,

            'lampiran' => $surat->lampiran,

            'file_surat' => $surat->file_surat,

            'status' => $surat->status,

            'user_id' => $surat->user_id,

        ]);

    return redirect()
        ->route('surat_keluar.index')
        ->with('success', 'Surat keluar berhasil diperbarui.');
}
/**
 * Menghapus surat keluar beserta arsipnya
 */
public function destroy($id)
{
    $surat = SuratKeluar::findOrFail($id);

    // Hapus data arsip yang terkait (soft delete otomatis)
    Arsip::where('surat_keluar_id', $surat->id)->delete();

    // Hapus surat keluar (soft delete otomatis)
    $surat->delete();

    return redirect()
        ->route('surat_keluar.index')
        ->with('success', 'Surat keluar berhasil dihapus.');
}
/**
 * Preview Surat
 */
public function preview($id)
{
    $surat = SuratKeluar::findOrFail($id);

    return view('surat_keluar.preview', compact('surat'));
}

/**
 * Download PDF
 */
    public function downloadPublic($id)
    {
        $surat = SuratKeluar::findOrFail($id);
 
        $pdf = Pdf::loadView('surat_keluar.pdf', compact('surat'));
 
        $namaFile = 'Surat-' . str_replace(['/', '\\'], '-', $surat->nomor_surat) . '.pdf';
 
        // Simpan ke storage/app/public/pdf/
        Storage::disk('public')->put('pdf/' . $namaFile, $pdf->output());

        return $pdf->download($namaFile);
    }

/**
 * Kirim Email — Generate PDF on-the-fly via DomPDF
 */
    public function sendEmail(Request $request, $id)
{
    $surat = SuratKeluar::findOrFail($id);

    $request->validate([
        'email' => 'required|email',
    ]);

    $namaFilePdf = 'Surat-' . str_replace(['/', '\\'], '-', $surat->nomor_surat) . '.pdf';

    // Cek apakah ada file fisik yang di-upload manual
    if ($surat->file_surat && Storage::disk('public')->exists('surat_keluar/' . $surat->file_surat)) {
        // Gunakan file fisik yang sudah ada
        $pdfContent = Storage::disk('public')->get('surat_keluar/' . $surat->file_surat);
    } else {
        // Generate PDF on-the-fly dari template (sama seperti downloadPublic)
        $pdf = Pdf::loadView('surat_keluar.pdf', compact('surat'));
        $pdfContent = $pdf->output();
    }

    $lampiran = [[
        'nama' => $namaFilePdf,
        'mime' => 'application/pdf',
        'isi'  => $pdfContent,
    ]];

    Mail::to($request->email)->send(new SuratKeluarMail($surat, $lampiran));

    return back()->with('success', 'Surat berhasil dikirim ke ' . $request->email);
}

/**
 * Kirim WA — Generate PDF on-the-fly, simpan temp, lalu kirim
 */

   public function sendWhatsapp(Request $request, $id)
{
    $surat = SuratKeluar::findOrFail($id);

    $request->validate([
        'nomor_wa' => 'required|string',
    ]);

    $nomor = preg_replace('/\D/', '', $request->nomor_wa);
    if (str_starts_with($nomor, '0')) {
        $nomor = '62' . substr($nomor, 1);
    } elseif (!str_starts_with($nomor, '62')) {
        $nomor = '62' . $nomor;
    }

    $namaFilePdf = 'Surat-' . str_replace(['/', '\\'], '-', $surat->nomor_surat) . '.pdf';

    // Cek apakah ada file fisik yang di-upload manual
    if ($surat->file_surat && file_exists(storage_path('app/public/surat_keluar/' . $surat->file_surat))) {
        $path = storage_path('app/public/surat_keluar/' . $surat->file_surat);
    } else {
        // Generate PDF on-the-fly, simpan ke file temp
        $pdf = Pdf::loadView('surat_keluar.pdf', compact('surat'));
        $tempDir = storage_path('app/public/surat_keluar/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $path = $tempDir . '/' . $namaFilePdf;
        file_put_contents($path, $pdf->output());
    }

    $pesan = "Berikut surat keluar No. {$surat->nomor_surat}, perihal: {$surat->perihal}.";

    $waServerUrl = rtrim(config('services.wa_server.url', env('WA_SERVER_URL', 'http://localhost:3000')), '/');

    $response = Http::timeout(15)->post($waServerUrl . '/send-file', [
        'nomor'    => $nomor,
        'pesan'    => $pesan,
        'filePath' => $path,
        'fileName' => $namaFilePdf,
    ]);

    // Hapus file temp jika dibuat
    if (!$surat->file_surat && isset($path) && file_exists($path)) {
        @unlink($path);
    }

    if ($response->successful() && $response->json('success') === true) {
        return back()->with('success', 'Surat berhasil dikirim ke WhatsApp.');
    }

    return back()->with('error', 'Gagal mengirim ke WhatsApp. Pastikan server WhatsApp aktif.');
}

/**
 * Download PDF dan simpan ke storage/app/public/pdf/
 */
public function downloadAndSave($id)
{
    $surat = SuratKeluar::findOrFail($id);

    $pdf = Pdf::loadView('surat_keluar.pdf', compact('surat'));

    $namaFile = 'Surat-' . str_replace(['/', '\\'], '-', $surat->nomor_surat) . '.pdf';

    // Simpan ke storage/app/public/pdf/
    Storage::disk('public')->put('pdf/' . $namaFile, $pdf->output());

    // Kembalikan sebagai download
    return $pdf->download($namaFile);
}

}