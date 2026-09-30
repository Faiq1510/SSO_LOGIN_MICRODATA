<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$u = User::first();
if (! $u) {
    echo "No users found\n";
    exit(1);
}

echo "Clearing overrides for user: {$u->id} - {$u->name}\n";
$u->menuOverrides()->delete();
$count = $u->menuOverrides()->count();

echo "Overrides left: {$count}\n";
exit($count === 0 ? 0 : 1);
