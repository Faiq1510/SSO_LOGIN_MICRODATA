<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | VIEW : STOK GUDANG
        |--------------------------------------------------------------------------
        */

        DB::statement("DROP VIEW IF EXISTS v_stok_gudang;");

        DB::statement("
            CREATE VIEW v_stok_gudang AS
            SELECT
                m.id AS material_id,
                m.kode_material,
                m.nama_material,

                COALESCE(SUM(lm.qty),0) AS total_masuk,
                COALESCE(SUM(lk.qty),0) AS total_keluar,

                COALESCE(SUM(lm.qty),0)
                -
                COALESCE(SUM(lk.qty),0)
                AS sisa_stok

            FROM materials m

            LEFT JOIN log_masuk_gudang lm
                ON lm.material_id = m.id

            LEFT JOIN log_keluar_harian lk
                ON lk.material_id = m.id

            GROUP BY
                m.id,
                m.kode_material,
                m.nama_material
        ");

        /*
        |--------------------------------------------------------------------------
        | VIEW : MONITORING PROGRESS
        |--------------------------------------------------------------------------
        */

        DB::statement("DROP VIEW IF EXISTS v_monitoring_progress;");

        DB::statement("
            CREATE VIEW v_monitoring_progress AS

            SELECT

                pu.unit_id,

                u.nama_unit,

                pu.progress_percent,

                mp.tahap_pekerjaan,

                mpd.material_id,

                m.nama_material,

                mpd.qty_standar AS standar,

                COALESCE(SUM(lk.qty),0) AS aktual,

                CASE
                    WHEN COALESCE(SUM(lk.qty),0) > mpd.qty_standar * mpd.batas_boros THEN 'BOROS'
                    WHEN COALESCE(SUM(lk.qty),0) > mpd.qty_standar * mpd.batas_warning THEN 'WARNING'
                    ELSE 'AMAN'
                END AS analisa

            FROM progress_unit pu

            JOIN units u
                ON u.id = pu.unit_id

            JOIN matrix_progress mp
                ON mp.batas_atas = (
                    SELECT MIN(batas_atas)
                    FROM matrix_progress
                    WHERE batas_atas >= pu.progress_percent
                )

            JOIN matrix_progress_detail mpd
                ON mpd.matrix_id = mp.id

            JOIN materials m
                ON m.id = mpd.material_id

            LEFT JOIN log_keluar_harian lk
                ON lk.unit_id = pu.unit_id
                AND lk.material_id = mpd.material_id

            GROUP BY
            pu.unit_id,
            u.nama_unit,
            pu.progress_percent,
            mp.tahap_pekerjaan,
            mpd.material_id,
            m.nama_material,
            mpd.qty_standar,
            mpd.batas_warning,
            mpd.batas_boros
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS v_monitoring_progress CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_stok_gudang CASCADE;");
    }
};