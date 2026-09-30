<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
                ON mp.master_standar_id = u.master_standar_id
                AND mp.batas_atas = (
                    SELECT MIN(batas_atas)
                    FROM matrix_progress
                    WHERE batas_atas >= pu.progress_percent
                      AND master_standar_id = u.master_standar_id
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

    public function down(): void
    {
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

            JOIN units u ON u.id = pu.unit_id

            JOIN matrix_progress mp
                ON mp.batas_atas = (
                    SELECT MIN(batas_atas)
                    FROM matrix_progress
                    WHERE batas_atas >= pu.progress_percent
                )

            JOIN matrix_progress_detail mpd ON mpd.matrix_id = mp.id
            JOIN materials m ON m.id = mpd.material_id

            LEFT JOIN log_keluar_harian lk
                ON lk.unit_id = pu.unit_id
                AND lk.material_id = mpd.material_id

            GROUP BY
                pu.unit_id, u.nama_unit, pu.progress_percent,
                mp.tahap_pekerjaan, mpd.material_id, m.nama_material,
                mpd.qty_standar, mpd.batas_warning, mpd.batas_boros
        ");
    }
};
