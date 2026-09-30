<?php
// Simple script to bootstrap Laravel and test menu override creation for first user
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

echo "Testing for user: {$u->id} - {$u->name}\n";

// Clear existing overrides
$u->menuOverrides()->delete();

// Create an override entry
$ov = $u->menuOverrides()->create([
    'menu_key' => 'dashboard',
    'visible' => false,
]);

if ($ov) {
    echo "Created override: {$ov->menu_key} visible={$ov->visible}\n";
    exit(0);
}

echo "Failed to create override\n";
exit(1);
