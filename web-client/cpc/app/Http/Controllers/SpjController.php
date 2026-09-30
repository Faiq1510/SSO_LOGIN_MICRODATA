<?php
namespace App\Http\Controllers;
use App\Services\SpjService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
/**
 * @OA\Tag(
 *     name="Keuangan - SPJ",
 *     description="Laporan kas flow dan ekspor SPJ"
 * )
 */
class SpjController extends Controller
{
    public function __construct(protected SpjService $service) {}

    /**
     * @OA\Get(
     *     path="/finance/kas-flow",
     *     tags={"Keuangan - SPJ"},
     *     summary="Halaman kas flow SPJ",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="Halaman kas flow")
     * )
     */
    public function index(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $dokumen = $this->service->getDokumen($startDate, $endDate);
        $summary = $this->service->getSummary($dokumen);

        return Inertia::render('Finance/Spj/KasFlow', [
            'dokumen' => $dokumen->reverse()->values(),
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * @OA\Get(
     *     path="/finance/kas-flow/export",
     *     tags={"Keuangan - SPJ"},
     *     summary="Export PDF kas flow SPJ",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="bulan", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="tahun", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="PDF kas flow ditampilkan")
     * )
     */
    public function export(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020|max:2100',
        ]);

        $awal = Carbon::create($request->tahun, $request->bulan, 1)->startOfMonth();
        $akhir = $awal->copy()->endOfMonth();

        $dokumen = $this->service->getDokumen($awal->toDateString(), $akhir->toDateString());
        $summary = $this->service->getSummary($dokumen);
        $saldoAwal = $this->service->getSaldoSebelum($awal->toDateString());

       $pdf = Pdf::loadView('pdf.spj-otomatis', [
            'dokumen' => $dokumen,
            'summary' => $summary,
            'periode' => $awal->translatedFormat('F Y'),
            'saldoAwal' => $saldoAwal,
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('SPJ-' . $awal->format('Y-m') . '.pdf');
    }
}