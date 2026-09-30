<?php
namespace App\Services;

use App\Models\LogMasukGudang;
use App\Models\LogKeluarHarian;
use App\Models\AkunReferensi;
use App\Models\JournalEntry;
use Illuminate\Support\Facades\DB;

class NeracaService
{
    /**
     * Calculate neraca (balance sheet) for a given date.
     *
     * Returns a structured array matching the standard accounting balance sheet:
     * - Aset: Kas & Setara Kas, Persediaan Material
     * - Liabilitas: from journal_entries
     * - Modal: Modal Disetor Owner + Laba/Rugi Berjalan
     */
    public function calculate(?string $perTanggal = null): array
    {
        $perTanggal = $perTanggal ?? now()->format('Y-m-d');

        // ===== ASET =====

        // 1. Kas & Setara Kas = total kas masuk - total kas keluar (up to date)
        $totalKasMasuk = (float) DB::table('kas_masuks')
            ->where('tanggal', '<=', $perTanggal)
            ->sum('nominal');

        $totalKasKeluar = (float) DB::table('kas_keluars')
            ->where('tanggal', '<=', $perTanggal)
            ->sum('total');

        $kasSetaraKas = $totalKasMasuk - $totalKasKeluar;

        // 2. Persediaan Material = net inventory value from gudang logs
        $totalMasukGudang = (float) DB::table('log_masuk_gudang')
            ->where('tanggal', '<=', $perTanggal)
            ->sum(DB::raw('qty * harga_satuan'));

        $totalKeluarGudang = (float) DB::table('log_keluar_harian')
            ->where('tanggal', '<=', $perTanggal)
            ->sum(DB::raw('qty * harga'));

        $persediaanMaterial = $totalMasukGudang - $totalKeluarGudang;

        $totalAset = $kasSetaraKas + $persediaanMaterial;

        // ===== LIABILITAS =====
        // Sum journal entries for accounts with tipe_neraca that represent liabilities
        // For now, we check journal_entries grouped by akun with matching tipe
        $liabilitasAccounts = AkunReferensi::where('tipe_neraca', 'liabilitas')->get();

        $liabilitasDetails = [];
        $totalLiabilitas = 0;
        foreach ($liabilitasAccounts as $akun) {
            $dariKas = (float) DB::table('kas_masuks')
                ->where('akun_referensi_id', $akun->id)
                ->where('tanggal', '<=', $perTanggal)
                ->sum('nominal');

            $agg = JournalEntry::where('account_id', $akun->id)
                ->where('tanggal', '<=', $perTanggal)
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');

            $saldo = $dariKas + (float) ($agg ?? 0);
            if ($saldo != 0) {
                $liabilitasDetails[] = [
                    'kode_akun' => $akun->kode_akun,
                    'nama_akun' => $akun->nama_akun,
                    'saldo' => $saldo,
                ];
                $totalLiabilitas += $saldo;
            }
        }

        // ===== MODAL =====

        // Modal Disetor Owner = sum of kas masuk where akun has tipe_neraca = 'modal'
        $modalAkunIds = AkunReferensi::where('tipe_neraca', 'modal')->pluck('id');
        $modalDisetor = (float) DB::table('kas_masuks')
            ->whereIn('akun_referensi_id', $modalAkunIds)
            ->where('tanggal', '<=', $perTanggal)
            ->sum('nominal');

        // Also add any journal-based modal entries
        $modalFromJournal = 0;
        foreach ($modalAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->where('tanggal', '<=', $perTanggal)
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');
            $modalFromJournal += (float) ($agg ?? 0);
        }
        $modalDisetor += $modalFromJournal;

        // Laba/Rugi Berjalan = Pendapatan - Beban
        $pendapatanAkunIds = AkunReferensi::where('tipe_neraca', 'pendapatan')->pluck('id');
        $totalPendapatan = (float) DB::table('kas_masuks')
            ->whereIn('akun_referensi_id', $pendapatanAkunIds)
            ->where('tanggal', '<=', $perTanggal)
            ->sum('nominal');

        // Also add journal-based pendapatan
        foreach ($pendapatanAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->where('tanggal', '<=', $perTanggal)
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');
            $totalPendapatan += (float) ($agg ?? 0);
        }

        // Beban from kas_keluar
        $bebanAkunIds = AkunReferensi::where('tipe_neraca', 'beban')->pluck('id');

        $totalBeban = (float) DB::table('kas_keluars')
            ->whereIn('akun_referensi_id', $bebanAkunIds)
            ->where('tanggal', '<=', $perTanggal)
            ->sum('total');

        // Also add journal-based beban
        foreach ($bebanAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->where('tanggal', '<=', $perTanggal)
                ->selectRaw('COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as saldo')
                ->value('saldo');
            $totalBeban += (float) ($agg ?? 0);
        }

        $labaRugiBerjalan = $totalPendapatan - $totalBeban;

        $totalModal = $modalDisetor + $labaRugiBerjalan;

        $totalLiabilitasModal = $totalLiabilitas + $totalModal;

        // Balance check
        $isBalanced = abs($totalAset - $totalLiabilitasModal) < 0.01;

        return [
            'per_tanggal' => $perTanggal,
            'is_balanced' => $isBalanced,

            'aset' => [
                'kas_setara_kas' => $kasSetaraKas,
                'persediaan_material' => $persediaanMaterial,
                'total' => $totalAset,
            ],

            'liabilitas' => [
                'details' => $liabilitasDetails,
                'total' => $totalLiabilitas,
            ],

            'modal' => [
                'modal_disetor' => $modalDisetor,
                'laba_rugi_berjalan' => $labaRugiBerjalan,
                'total' => $totalModal,
            ],

            'total_liabilitas_modal' => $totalLiabilitasModal,
        ];
    }

    public function calculateRange(string $startDate, string $endDate): array
    {
        $startDate = $startDate ?: now()->format('Y-m-d');
        $endDate = $endDate ?: now()->format('Y-m-d');

        // ===== ASET =====
        $totalKasMasuk = (float) DB::table('kas_masuks')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum('nominal');

        $totalKasKeluar = (float) DB::table('kas_keluars')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum('total');

        $kasSetaraKas = $totalKasMasuk - $totalKasKeluar;

        $totalMasukGudang = (float) DB::table('log_masuk_gudang')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum(DB::raw('qty * harga_satuan'));

        $totalKeluarGudang = (float) DB::table('log_keluar_harian')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum(DB::raw('qty * harga'));

        $persediaanMaterial = $totalMasukGudang - $totalKeluarGudang;

        $totalAset = $kasSetaraKas + $persediaanMaterial;

        // ===== LIABILITAS =====
        $liabilitasAccounts = AkunReferensi::where('tipe_neraca', 'liabilitas')->get();

        $liabilitasDetails = [];
        $totalLiabilitas = 0;
        foreach ($liabilitasAccounts as $akun) {
            $dariKas = (float) DB::table('kas_masuks')
                ->where('akun_referensi_id', $akun->id)
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->sum('nominal');

            $agg = JournalEntry::where('account_id', $akun->id)
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');

            $saldo = $dariKas + (float) ($agg ?? 0);
            if ($saldo != 0) {
                $liabilitasDetails[] = [
                    'kode_akun' => $akun->kode_akun,
                    'nama_akun' => $akun->nama_akun,
                    'saldo' => $saldo,
                ];
                $totalLiabilitas += $saldo;
            }
        }

        // ===== MODAL =====
        $modalAkunIds = AkunReferensi::where('tipe_neraca', 'modal')->pluck('id');
        $modalDisetor = (float) DB::table('kas_masuks')
            ->whereIn('akun_referensi_id', $modalAkunIds)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum('nominal');

        $modalFromJournal = 0;
        foreach ($modalAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');
            $modalFromJournal += (float) ($agg ?? 0);
        }
        $modalDisetor += $modalFromJournal;

        $pendapatanAkunIds = AkunReferensi::where('tipe_neraca', 'pendapatan')->pluck('id');
        $totalPendapatan = (float) DB::table('kas_masuks')
            ->whereIn('akun_referensi_id', $pendapatanAkunIds)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum('nominal');

        foreach ($pendapatanAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as saldo')
                ->value('saldo');
            $totalPendapatan += (float) ($agg ?? 0);
        }

        $bebanAkunIds = AkunReferensi::where('tipe_neraca', 'beban')->pluck('id');
        $totalBeban = (float) DB::table('kas_keluars')
            ->whereIn('akun_referensi_id', $bebanAkunIds)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->sum('total');

        foreach ($bebanAkunIds as $akunId) {
            $agg = JournalEntry::where('account_id', $akunId)
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->selectRaw('COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as saldo')
                ->value('saldo');
            $totalBeban += (float) ($agg ?? 0);
        }

        $labaRugiBerjalan = $totalPendapatan - $totalBeban;
        $totalModal = $modalDisetor + $labaRugiBerjalan;
        $totalLiabilitasModal = $totalLiabilitas + $totalModal;

        $isBalanced = abs($totalAset - $totalLiabilitasModal) < 0.01;

        return [
            'per_tanggal' => $endDate,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_balanced' => $isBalanced,

            'aset' => [
                'kas_setara_kas' => $kasSetaraKas,
                'persediaan_material' => $persediaanMaterial,
                'total' => $totalAset,
            ],

            'liabilitas' => [
                'details' => $liabilitasDetails,
                'total' => $totalLiabilitas,
            ],

            'modal' => [
                'modal_disetor' => $modalDisetor,
                'laba_rugi_berjalan' => $labaRugiBerjalan,
                'total' => $totalModal,
            ],

            'total_liabilitas_modal' => $totalLiabilitasModal,
        ];
    }
}
