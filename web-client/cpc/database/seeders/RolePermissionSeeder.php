<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]
            ->forgetCachedPermissions();

        $permissions = [
            'dashboard',
            'unit',
            'gudang',
            'material',
            'progress',
            'standar',
            'users',
            'finance',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $superAdmin = Role::firstOrCreate([
            'name' => 'Super Admin',
            'guard_name' => 'web',
        ]);

        $admin = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
        ]);

        $owner = Role::firstOrCreate([
            'name' => 'Owner',
            'guard_name' => 'web',
        ]);

        $adminKeuangan = Role::firstOrCreate([
            'name' => 'Admin Keuangan',
            'guard_name' => 'web',
        ]);

        $superAdmin->syncPermissions($permissions);

        $admin->syncPermissions([
            'dashboard',
            'unit',
            'gudang',
            'material',
            'progress',
            'standar',
        ]);

        $owner->syncPermissions([
            'dashboard',
            'progress',
        ]);

        $adminKeuangan->syncPermissions([
            'finance',
        ]);
    }
}