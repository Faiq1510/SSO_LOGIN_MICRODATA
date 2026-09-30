import { apiRequest } from "../utils/api";

export const getParticipants = async (params?: { page?: number; limit?: number; search?: string; status?: string; institusi?: string; prodi?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "Semua") query.set("status", params.status);
  if (params?.institusi && params.institusi !== "Semua") query.set("institusi", params.institusi);
  if (params?.prodi && params.prodi !== "Semua") query.set("prodi", params.prodi);
  const qs = query.toString();
  return apiRequest(`/admin/peserta${qs ? `?${qs}` : ""}`);
};
export const getParticipantDetail = async (id: string) => apiRequest(`/admin/peserta/${id}`);
export const updateParticipant = async (id: string, data: unknown) => apiRequest(`/admin/peserta/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const getParticipantHistori = async (id: string) => apiRequest(`/admin/peserta/${id}/histori`);
export const getParticipantStats = async () => apiRequest("/admin/peserta/statistik");
export const getParticipantPresensi = async (id: string) => apiRequest(`/admin/peserta/${id}/presensi`);
