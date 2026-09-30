<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            // Data User
            $table->string('name',100);
            $table->string('username',50)->unique();
            $table->string('email',150)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password',255);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();

            // Laravel
            $table->rememberToken();
            $table->timestamps();

            $table->string('avatar')->nullable();
            $table->string('photo')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
$table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};