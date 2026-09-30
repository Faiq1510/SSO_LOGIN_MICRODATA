<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\NeracaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Keuangan - Neraca",
 *     description="Laporan neraca dan ekspor PDF"
 * )
 */
class NeracaController extends Controller
{
    /**
     * @OA\Get(
     *     path="/finance/neraca",
     *     tags={"Keuangan - Neraca"},
     *     summary="Halaman neraca",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="Halaman neraca")
     * )
     */
    public function index(Request $request, NeracaService $service)
    {
        $startDate = $request->get('start_date', now()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $data = $service->calculateRange($startDate, $endDate);

        return Inertia::render('Finance/Neraca', [
            'neraca' => $data,
            'perTanggal' => $endDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * @OA\Get(
     *     path="/finance/neraca/export",
     *     tags={"Keuangan - Neraca"},
     *     summary="Export PDF neraca",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="PDF neraca ditampilkan")
     * )
     */
    public function export(Request $request, NeracaService $service)
    {
        $startDate = $request->get('start_date', now()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $data = $service->calculateRange($startDate, $endDate);
        $periode = Carbon::createFromFormat('Y-m-d', $endDate)->translatedFormat('F Y');

        $pdf = Pdf::loadView('pdf.neraca', [
            'neraca' => $data,
            'periode' => $periode,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'createdBy' => auth()->user()?->name ?? null,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Neraca-' . now()->format('Y-m-d') . '.pdf');
    }
}
