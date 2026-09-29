<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateDataFromMysql extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:migrate-from-mysql
                            {--mysql-host= : Host MySQL sumber}
                            {--mysql-port= : Port MySQL sumber}
                            {--mysql-database= : Nama database MySQL sumber}
                            {--mysql-username= : Username MySQL sumber}
                            {--mysql-password= : Password MySQL sumber}
                            {--truncate : Kosongkan tabel target di PostgreSQL sebelum insert data (default: aktif)}
                            {--no-truncate : Jangan kosongkan tabel PostgreSQL sebelum insert}
                            {--tables= : Daftar tabel tertentu yang dipisah koma (contoh: users,surat_masuks)}
                            {--chunk=500 : Jumlah baris per batch proses}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrasikan seluruh isi data dari database MySQL ke PostgreSQL dan sinkronkan sequence ID';

    /**
     * Priority table ordering to maintain logical hierarchy
     *
     * @var array<string>
     */
    protected array $priorityTables = [
        'users',
        'instansis',
        'jenis_surats',
        'kelola_users',
        'surat_masuks',
        'surat_keluars',
        'arsips',
        'jobs',
        'job_batches',
        'failed_jobs',
        'cache',
        'cache_locks',
        'sessions',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("================================================================");
        $this->info("         MIGRASI DATA: MySQL ➜ PostgreSQL (Laravel)            ");
        $this->info("================================================================");

        // 1. Konfigurasi koneksi MySQL Sumber
        $this->configureMysqlSource();

        // 2. Uji Koneksi MySQL & PostgreSQL
        if (!$this->testConnections()) {
            return Command::FAILURE;
        }

        // 3. Tentukan daftar tabel yang akan dimigrasi
        $tablesToMigrate = $this->determineTables();
        if (empty($tablesToMigrate)) {
            $this->error("❌ Tidak ada tabel yang ditemukan untuk dimigrasikan.");
            return Command::FAILURE;
        }

        $this->info("📋 Menemukan " . count($tablesToMigrate) . " tabel untuk dimigrasikan: " . implode(', ', $tablesToMigrate));

        $shouldTruncate = !$this->option('no-truncate');
        $chunkSize = (int) $this->option('chunk');
        if ($chunkSize <= 0) $chunkSize = 500;

        $pgConnection = DB::connection('pgsql');
        $mysqlConnection = DB::connection('mysql_source');

        $summary = [];

        try {
            // Nonaktifkan trigger foreign key di PostgreSQL selama proses migrasi
            $this->line("⚙️  Menonaktifkan sementara trigger foreign key di PostgreSQL...");
            $pgConnection->statement("SET session_replication_role = 'replica';");

            foreach ($tablesToMigrate as $table) {
                $this->line("\n📦 Memproses tabel: <comment>{$table}</comment>");

                // Pastikan tabel ada di PostgreSQL
                if (!Schema::connection('pgsql')->hasTable($table)) {
                    $this->warn("   ⚠️ Tabel '{$table}' belum ada di PostgreSQL. Jalankan 'php artisan migrate' terlebih dahulu!");
                    $summary[] = ['table' => $table, 'source_rows' => 0, 'migrated_rows' => 0, 'status' => 'Skipped (Tabel tidak ada di PG)'];
                    continue;
                }

                // Truncate tabel jika diizinkan
                if ($shouldTruncate) {
                    $pgConnection->statement("TRUNCATE TABLE \"{$table}\" CASCADE;");
                    $this->line("   🧹 Tabel target dikosongkan.");
                }

                $totalSourceRows = $mysqlConnection->table($table)->count();
                if ($totalSourceRows === 0) {
                    $this->line("   ℹ️ Tabel kosong di MySQL sumber (0 baris).");
                    $summary[] = ['table' => $table, 'source_rows' => 0, 'migrated_rows' => 0, 'status' => 'Empty'];
                    continue;
                }

                $this->line("   🚀 Menyalin {$totalSourceRows} baris...");
                $migratedCount = 0;

                // Salin per batch / cursor
                $mysqlConnection->table($table)->orderBy(
                    $this->getPrimaryOrFirstColumn($mysqlConnection, $table)
                )->chunk($chunkSize, function ($rows) use ($pgConnection, $table, &$migratedCount) {
                    $dataToInsert = [];
                    foreach ($rows as $row) {
                        $dataToInsert[] = (array) $row;
                    }

                    if (!empty($dataToInsert)) {
                        $pgConnection->table($table)->insert($dataToInsert);
                        $migratedCount += count($dataToInsert);
                    }
                });

                $this->line("   ✅ Berhasil memindahkan <info>{$migratedCount}/{$totalSourceRows}</info> baris.");
                $summary[] = ['table' => $table, 'source_rows' => $totalSourceRows, 'migrated_rows' => $migratedCount, 'status' => 'Success'];
            }

        } catch (\Throwable $e) {
            $this->error("❌ Terjadi kesalahan saat migrasi data: " . $e->getMessage());
            return Command::FAILURE;
        } finally {
            // Aktifkan kembali trigger foreign key di PostgreSQL
            $this->line("\n⚙️  Mengaktifkan kembali trigger foreign key di PostgreSQL...");
            $pgConnection->statement("SET session_replication_role = 'origin';");
        }

        // 4. Sinkronisasi PostgreSQL Sequence auto-increment
        $this->call('db:sync-sequences', ['--connection' => 'pgsql']);

        // 5. Tampilkan ringkasan
        $this->table(
            ['Nama Tabel', 'Baris MySQL Sumber', 'Baris Dimigrasikan', 'Status'],
            $summary
        );

        $this->info("🎉 Migrasi data dari MySQL ke PostgreSQL selesai!");
        return Command::SUCCESS;
    }

    /**
     * Set konfigurasi dinamis untuk koneksi mysql_source dari option CLI atau .env
     */
    protected function configureMysqlSource(): void
    {
        $host = $this->option('mysql-host') ?: config('database.connections.mysql_source.host', '127.0.0.1');
        $port = $this->option('mysql-port') ?: config('database.connections.mysql_source.port', '3306');
        $database = $this->option('mysql-database') ?: config('database.connections.mysql_source.database', 'surat_penomoran');
        $username = $this->option('mysql-username') ?: config('database.connections.mysql_source.username', 'root');
        $password = $this->option('mysql-password') !== null ? $this->option('mysql-password') : config('database.connections.mysql_source.password', '');

        Config::set('database.connections.mysql_source', [
            'driver' => 'mysql',
            'host' => $host,
            'port' => $port,
            'database' => $database,
            'username' => $username,
            'password' => $password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => false,
            'engine' => null,
        ]);

        DB::purge('mysql_source');
    }

    /**
     * Test koneksi kedua database
     */
    protected function testConnections(): bool
    {
        // Cek PostgreSQL (Target)
        try {
            $this->line("🔌 Menguji koneksi target PostgreSQL (pgsql)...");
            DB::connection('pgsql')->getPdo();
            $this->line("   <info>✓ Koneksi PostgreSQL BERHASIL.</info>");
        } catch (\Throwable $e) {
            $this->error("   ✗ Gagal terhubung ke PostgreSQL target: " . $e->getMessage());
            $this->line("     Pastikan container/server PostgreSQL aktif dan kredensial di .env sudah benar.");
            return false;
        }

        // Cek MySQL (Sumber)
        try {
            $this->line("🔌 Menguji koneksi sumber MySQL (mysql_source)...");
            DB::connection('mysql_source')->getPdo();
            $this->line("   <info>✓ Koneksi MySQL Sumber BERHASIL.</info>");
        } catch (\Throwable $e) {
            $this->error("   ✗ Gagal terhubung ke MySQL sumber: " . $e->getMessage());
            $this->line("     Gunakan opsi --mysql-host=..., --mysql-port=..., --mysql-database=..., --mysql-username=..., --mysql-password=... jika berbeda.");
            return false;
        }

        return true;
    }

    /**
     * Tentukan daftar tabel dari MySQL sumber
     *
     * @return array<string>
     */
    protected function determineTables(): array
    {
        if ($tablesOption = $this->option('tables')) {
            return array_map('trim', explode(',', $tablesOption));
        }

        $mysqlConnection = DB::connection('mysql_source');
        $databaseName = $mysqlConnection->getDatabaseName();

        $tablesData = $mysqlConnection->select('SHOW TABLES');
        $allTables = [];
        $property = 'Tables_in_' . $databaseName;

        foreach ($tablesData as $t) {
            $tableObj = (array) $t;
            $tableName = $tableObj[$property] ?? array_values($tableObj)[0];
            
            // Lewati tabel migrasi jika tidak ingin ditimpa
            if ($tableName === 'migrations') {
                continue;
            }
            $allTables[] = $tableName;
        }

        // Urutkan berdasarkan priority tables terlebih dahulu, lalu sisanya
        $orderedTables = [];
        foreach ($this->priorityTables as $pt) {
            if (in_array($pt, $allTables)) {
                $orderedTables[] = $pt;
            }
        }
        foreach ($allTables as $table) {
            if (!in_array($table, $orderedTables)) {
                $orderedTables[] = $table;
            }
        }

        return $orderedTables;
    }

    /**
     * Dapatkan kolom primary key atau kolom pertama untuk chunk ordering
     */
    protected function getPrimaryOrFirstColumn($connection, string $table): string
    {
        try {
            $columns = $connection->select("SHOW COLUMNS FROM `{$table}`");
            foreach ($columns as $col) {
                if (($col->Key ?? '') === 'PRI') {
                    return $col->Field;
                }
            }
            if (!empty($columns)) {
                return $columns[0]->Field;
            }
        } catch (\Throwable $e) {
            // fallback
        }

        return 'id';
    }
}
