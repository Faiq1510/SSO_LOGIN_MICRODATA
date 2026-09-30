<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'email' => 'superadmin@gmail.com',
                'password' => 'superadmin123',
                'role' => 'Super Admin',
            ],
            [
                'name' => 'Admin',
                'username' => 'admin',
                'email' => 'admin@gmail.com',
                'password' => 'admin123',
                'role' => 'Admin',
            ],
            [
                'name' => 'Owner',
                'username' => 'owner',
                'email' => 'owner@gmail.com',
                'password' => 'owner123',
                'role' => 'Owner',
            ],
            [
                'name' => 'Admin Keuangan',
                'username' => 'adminkeuangan',
                'email' => 'adminkeuangan@gmail.com',
                'password' => 'adminkeuangan123',
                'role' => 'Admin Keuangan',
            ],
        ];


        foreach ($users as $data) {

            $user = User::firstOrCreate(
                [
                    'email' => $data['email']
                ],
                [
                    'name' => $data['name'],
                    'username' => $data['username'],
                    'password' => Hash::make($data['password']),
                    'email_verified_at' => now(),
                ]
            );


            $user->assignRole($data['role']);
        }
    }
}