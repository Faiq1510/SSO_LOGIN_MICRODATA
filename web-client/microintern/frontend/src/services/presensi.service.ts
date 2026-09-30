import { apiRequest } from "../utils/api";

export const postDatang = async (data: unknown) => apiRequest("/presensi/datang", { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data) });
export const postPulang = async (data: unknown) => apiRequest("/presensi/pulang", { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data) });
export const getPresensiHariIni = async () => apiRequest("/presensi/hari-ini");
export const getRiwayatPresensi = async () => apiRequest("/presensi/riwayat");
export const adminGetPresensiHarian = async (dateStr: string) => apiRequest(`/admin/presensi?tanggal=${dateStr}`);
