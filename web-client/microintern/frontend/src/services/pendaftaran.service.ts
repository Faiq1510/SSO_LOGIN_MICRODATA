import { apiRequest } from "../utils/api";

export const getPublicSchedule = async () => apiRequest("/pendaftaran/jadwal-publik");
export const createPendaftaran = async (data: unknown) => apiRequest("/pendaftaran", { method: "POST", body: JSON.stringify(data) });
export const getPendaftaranSaya = async () => apiRequest("/pendaftaran/saya");
export const getHistoriPendaftaran = async () => apiRequest("/pendaftaran/saya/histori");
export const adminGetAllPendaftaran = async (params?: { page?: number; limit?: number; status?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status && params.status !== "semua") query.set("status", params.status);
  const qs = query.toString();
  return apiRequest(`/pendaftaran/admin${qs ? `?${qs}` : ""}`);
};
export const adminTerimaPendaftaran = async (id: string, data: unknown) => apiRequest(`/pendaftaran/admin/${id}/terima`, { method: "PUT", body: JSON.stringify(data) });
export const adminTolakPendaftaran = async (id: string, data: unknown) => apiRequest(`/pendaftaran/admin/${id}/tolak`, { method: "PUT", body: JSON.stringify(data) });
export const adminBatalPendaftaran = async (id: string, data: unknown) => apiRequest(`/pendaftaran/admin/${id}/batal`, { method: "PUT", body: JSON.stringify(data) });
export const getPengajuan = async () => apiRequest("/profil/pengajuan");
export const pesertaCancelPendaftaran = async () => apiRequest("/pendaftaran/saya", { method: "DELETE" });
