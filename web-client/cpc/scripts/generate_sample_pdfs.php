<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\NeracaController;
use App\Http\Controllers\FinanceController;

echo "Generating sample PDFs...\n";

// Ensure storage dir
$outDir = storage_path('app/public/reports');
if (!is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$neracaController = new NeracaController();
$financeController = new FinanceController();

// Neraca sample
$req = Request::create('/finance/neraca/export', 'GET', ['start_date' => now()->subMonth()->startOfMonth()->toDateString(), 'end_date' => now()->subMonth()->endOfMonth()->toDateString()]);
$response = $neracaController->export($req, app()->make(App\Services\NeracaService::class));

if (method_exists($response, 'getContent')) {
    $content = $response->getContent();
    $file = $outDir . '/Neraca-sample.pdf';
    file_put_contents($file, $content);
    echo "Wrote $file\n";
} else {
    echo "Neraca export did not return content directly.\n";
}

// Laba Rugi sample
$req2 = Request::create('/finance/laba-rugi/export', 'GET', ['start_date' => now()->subMonth()->startOfMonth()->toDateString(), 'end_date' => now()->subMonth()->endOfMonth()->toDateString()]);
$response2 = $financeController->exportLabaRugi($req2);
if (method_exists($response2, 'getContent')) {
    $content2 = $response2->getContent();
    $file2 = $outDir . '/LabaRugi-sample.pdf';
    file_put_contents($file2, $content2);
    echo "Wrote $file2\n";
} else {
    echo "Laba Rugi export did not return content directly.\n";
}

echo "Done.\n";
