import { db } from "../config/database";

export interface DashboardAdminStats {
  total_menunggu: number;
  total_aktif: number;
  total_selesai: number;
  total_ditolak: number;
  total_semua: number;
}

export const getDashboardAdmin = async (): Promise<DashboardAdminStats> => {
  const result = await db.query("SELECT * FROM v_dashboard_admin");
  if (result.rows.length === 0) {
    return { total_menunggu: 0, total_aktif: 0, total_selesai: 0, total_ditolak: 0, total_semua: 0 };
  }
  return {
    total_menunggu: parseInt(result.rows[0].total_menunggu || "0", 10),
    total_aktif: parseInt(result.rows[0].total_aktif || "0", 10),
    total_selesai: parseInt(result.rows[0].total_selesai || "0", 10),
    total_ditolak: parseInt(result.rows[0].total_ditolak || "0", 10),
    total_semua: parseInt(result.rows[0].total_semua || "0", 10),
  };
};
