import { apiRequest } from "../utils/api";

export const postIzin = async (data: unknown) => apiRequest("/izin", { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data) });
export const adminGetAllIzin = async (dateStr?: string) => apiRequest(dateStr ? `/admin/izin?tanggal=${dateStr}` : `/admin/izin`);
export const getIzinSaya = async () => apiRequest("/izin/saya");
export const deleteIzin = async (id: string) => apiRequest(`/izin/${id}`, { method: "DELETE" });
