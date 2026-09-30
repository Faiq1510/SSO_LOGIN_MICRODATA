<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\UserRoleController;
use App\Models\User;

$user = User::first();
if (! $user) {
    echo "No user\n";
    exit(1);
}

$controller = new UserRoleController();

$request = Request::create('/user-role/'.$user->id.'/menu-override', 'POST', ['overrides' => []]);

$response = $controller->updateMenuOverride($request, $user);

if (method_exists($response, 'getSession')) {
    $session = $response->getSession();
    echo "Redirected with session flashes:\n";
    print_r($session->all());
} else {
    echo "Response class: " . get_class($response) . "\n";
}

echo "Done\n";
