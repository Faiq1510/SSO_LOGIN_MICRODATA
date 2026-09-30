import { apiRequest } from "../utils/api";

export const getLaporanExport = async () => apiRequest("/admin/laporan/export");
