<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncPgsqlSequences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:sync-sequences {--connection= : The database connection to use (must be pgsql)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync all PostgreSQL sequences to match the maximum ID in each table';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connectionName = $this->option('connection') ?: config('database.default');
        $driver = config("database.connections.{$connectionName}.driver");

        if ($driver !== 'pgsql') {
            $this->error("Connection '{$connectionName}' is using driver '{$driver}'. This command only works with PostgreSQL ('pgsql').");
            return Command::FAILURE;
        }

        $this->info("🔄 Menyinkronkan PostgreSQL sequences pada koneksi [{$connectionName}]...");

        $connection = DB::connection($connectionName);

        // Cari semua kolom yang memiliki sequence default (nextval) di schema public
        $columnsWithSequence = $connection->select("
            SELECT 
                c.table_name, 
                c.column_name
            FROM information_schema.columns c
            JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
            WHERE c.table_schema = 'public'
              AND t.table_type = 'BASE TABLE'
              AND c.column_default LIKE 'nextval(%'
            ORDER BY c.table_name, c.column_name
        ");

        if (empty($columnsWithSequence)) {
            $this->warn("Tidak ditemukan kolom dengan sequence auto-increment di schema public.");
            return Command::SUCCESS;
        }

        $syncedCount = 0;

        foreach ($columnsWithSequence as $item) {
            $tableName = $item->table_name;
            $columnName = $item->column_name;

            try {
                // Dapatkan sequence name dan update nilainya ke MAX(id)
                $query = sprintf(
                    "SELECT setval(pg_get_serial_sequence('%s', '%s'), COALESCE(MAX(\"%s\"), 1), MAX(\"%s\") IS NOT NULL) AS new_val FROM \"%s\"",
                    $tableName,
                    $columnName,
                    $columnName,
                    $columnName,
                    $tableName
                );

                $result = $connection->select($query);
                $newVal = $result[0]->new_val ?? 1;

                $this->line("  ✓ <comment>{$tableName}.{$columnName}</comment> sequence disetel ke: <info>{$newVal}</info>");
                $syncedCount++;
            } catch (\Throwable $e) {
                $this->warn("  ✗ Gagal menyinkronkan {$tableName}.{$columnName}: " . $e->getMessage());
            }
        }

        $this->info("✅ Berhasil menyinkronkan {$syncedCount} sequence PostgreSQL.");

        return Command::SUCCESS;
    }
}
