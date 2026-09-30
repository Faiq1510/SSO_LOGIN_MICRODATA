<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Material;
use App\Services\StokGudangService;

function printList($list, $title) {
    echo "\n--- $title ---\n";
    $i = 1;
    foreach ($list as $m) {
        echo sprintf("%2d. %s | id=%d | stock=%.2f\n", $i++, $m->nama_material, $m->id, getStock($m->id));
    }
}

function getStock($materialId) {
    $s = (new StokGudangService())->hitungMovingAverageFor([$materialId])->get($materialId, ['sisa_stok'=>0]);
    return $s['sisa_stok'] ?? 0;
}

// Order by nama
$byName = Material::query()->select('materials.*')->orderBy('nama_material', 'asc')->limit(20)->get();
// Order by computed stock desc
$orderExpr = "(COALESCE((SELECT SUM(qty) FROM log_masuk_gudang WHERE material_id = materials.id),0) - COALESCE((SELECT SUM(qty) FROM log_keluar_harian WHERE material_id = materials.id),0)) desc";
$byStock = Material::query()->select('materials.*')->orderByRaw($orderExpr)->limit(20)->get();

printList($byName, 'Order by NAME asc');
printList($byStock, 'Order by STOCK desc');

echo "\nFinished\n";
