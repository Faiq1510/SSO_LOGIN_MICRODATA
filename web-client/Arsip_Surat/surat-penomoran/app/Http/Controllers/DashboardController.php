<?php

namespace App\Http\Controllers;

use App\Models\SuratMasuk;
use App\Models\SuratKeluar;
use App\Models\Arsip;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Hitung total statistik utama
        $totalSuratMasuk  = SuratMasuk::count();
        $totalSuratKeluar = SuratKeluar::count();
        $totalArsip       = Arsip::count();
        $totalPengguna    = User::count();

        // 2. Rincian status masing-masing modul
        $statusSuratMasuk = [
            'Baru'     => SuratMasuk::where('status', 'Baru')->count(),
            'Diproses' => SuratMasuk::where('status', 'Diproses')->count(),
            'Selesai'  => SuratMasuk::where('status', 'Selesai')->count(),
        ];

        $statusSuratKeluar = [
            'Draft'   => SuratKeluar::where('status', 'Draft')->count(),
            'Dikirim' => SuratKeluar::where('status', 'Dikirim')->count(),
            'Selesai' => SuratKeluar::where('status', 'Selesai')->count(),
        ];

        $statusArsip = [
            'Surat Masuk'  => Arsip::where('jenis', 'Surat Masuk')->count(),
            'Surat Keluar' => Arsip::where('jenis', 'Surat Keluar')->count(),
        ];

        // 3. Olah data statistik 6 bulan terakhir untuk grafik komparasi
        $chartLabels     = [];
        $dataSuratMasuk  = [];
        $dataSuratKeluar = [];
        $dataArsip       = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonthsNoOverflow($i);
            $chartLabels[] = $date->translatedFormat('M Y');

            // Hitung Surat Masuk per bulan
            $countMasuk = SuratMasuk::where(function ($query) use ($date) {
                $query->whereYear('tanggal_surat', $date->year)
                      ->whereMonth('tanggal_surat', $date->month);
            })->orWhere(function ($query) use ($date) {
                $query->whereYear('created_at', $date->year)
                      ->whereMonth('created_at', $date->month);
            })->count();

            // Hitung Surat Keluar per bulan
            $countKeluar = SuratKeluar::where(function ($query) use ($date) {
                $query->whereYear('tanggal_surat', $date->year)
                      ->whereMonth('tanggal_surat', $date->month);
            })->orWhere(function ($query) use ($date) {
                $query->whereYear('created_at', $date->year)
                      ->whereMonth('created_at', $date->month);
            })->count();

            // Hitung Arsip per bulan
            $countArsip = Arsip::where(function ($query) use ($date) {
                $query->whereYear('tanggal_surat', $date->year)
                      ->whereMonth('tanggal_surat', $date->month);
            })->orWhere(function ($query) use ($date) {
                $query->whereYear('created_at', $date->year)
                      ->whereMonth('created_at', $date->month);
            })->count();

            $dataSuratMasuk[]  = $countMasuk;
            $dataSuratKeluar[] = $countKeluar;
            $dataArsip[]       = $countArsip;
        }

        // 4. Data terbaru untuk masing-masing modul
        $suratMasukTerbaru  = SuratMasuk::with('instansi')->latest()->take(5)->get();
        $suratKeluarTerbaru = SuratKeluar::with('instansi')->latest()->take(5)->get();
        $arsipTerbaru       = Arsip::latest('tanggal_surat')->take(5)->get();

        return view('dashboard', compact(
            'totalSuratMasuk',
            'totalSuratKeluar',
            'totalArsip',
            'totalPengguna',
            'statusSuratMasuk',
            'statusSuratKeluar',
            'statusArsip',
            'chartLabels',
            'dataSuratMasuk',
            'dataSuratKeluar',
            'dataArsip',
            'suratMasukTerbaru',
            'suratKeluarTerbaru',
            'arsipTerbaru'
        ));
    }
}