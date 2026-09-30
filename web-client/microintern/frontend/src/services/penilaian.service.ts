import { apiRequest } from "../utils/api";

export const adminGetAllEvaluations = async (params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest(`/admin/penilaian${qs ? `?${qs}` : ""}`);
};
export const adminGetEvaluationByUser = async (id: string, pengajuanId?: string) => {
  const query = pengajuanId ? `?pengajuanId=${pengajuanId}` : "";
  return apiRequest(`/admin/penilaian/${id}${query}`);
};
export const adminCreateEvaluation = async (id: string, data: unknown) => apiRequest(`/admin/penilaian/${id}`, { method: "POST", body: JSON.stringify(data) });
export const adminUpdateEvaluation = async (id: string, data: unknown) => apiRequest(`/admin/penilaian/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const getMyEvaluation = async () => apiRequest("/penilaian/saya");
export const uploadFile = async (data: FormData, type?: string) => apiRequest(type ? `/upload?type=${type}` : "/upload", { method: "POST", body: data });
