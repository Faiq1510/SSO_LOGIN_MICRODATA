<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\LogGudangController;

$controller = new LogGudangController();

$params = [
    'q' => '',
    'sortBy' => 'stok',
    'sortDir' => 'desc',
    'perPage' => 15,
    'page' => 1,
];

$request = Request::create('/stok-gudang', 'GET', $params);

$response = $controller->stokIndex($request);

echo "Response class: " . get_class($response) . "\n";

if (is_object($response)) {
    // try to get content
    if (method_exists($response, 'getContent')) {
        $content = $response->getContent();
        echo "Content length: " . strlen($content) . "\n";
        // search for JSON props in HTML
        if (strpos($content, 'page') !== false) {
            // try to extract the Inertia 'page' JSON variable
            if (preg_match('/<script>\s*window\.__INITIAL_PAGE__\s*=\s*(\{.*?\});\s*<\/script>/s', $content, $m)) {
                $json = $m[1];
                echo "Found initial page JSON\n";
                // decode and list stok items if present
                $data = json_decode($json, true);
                if (isset($data['props']['stok'])) {
                    $stok = $data['props']['stok'];
                    echo "stok is present in props\n";
                }
            }
        }
    } else {
        var_dump($response);
    }
}

// Additionally replicate the DB-level ordering to list ids
use App\Models\Material;
$orderExpr = "(COALESCE((SELECT SUM(qty) FROM log_masuk_gudang WHERE material_id = materials.id),0) - COALESCE((SELECT SUM(qty) FROM log_keluar_harian WHERE material_id = materials.id),0)) desc";
$byStock = Material::query()->select('materials.*')->orderByRaw($orderExpr)->paginate($params['perPage'], ['*'], 'page', $params['page']);

echo "Top materials by stock (server-side):\n";
foreach ($byStock->items() as $i => $m) {
    echo sprintf("%2d. %s (id=%d)\n", $i+1, $m->nama_material, $m->id);
}

echo "Done\n";
