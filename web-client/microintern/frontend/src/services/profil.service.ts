import { apiRequest } from "../utils/api";

export const getProfil = async () => apiRequest("/profil");
export const updateProfil = async (data: unknown) => apiRequest("/profil", { method: "PUT", body: JSON.stringify(data) });
export const changePassword = async (data: unknown) => apiRequest("/profil/password", { method: "PUT", body: JSON.stringify(data) });
export const connectGoogle = async (data: unknown) => apiRequest("/profil/google/connect", { method: "POST", body: JSON.stringify(data) });
export const disconnectGoogle = async () => apiRequest("/profil/google/disconnect", { method: "DELETE" });
export const requestChangeEmailOTP = async (data: unknown) => apiRequest("/profil/email/request-otp", { method: "POST", body: JSON.stringify(data) });
export const confirmChangeEmail = async (data: unknown) => apiRequest("/profil/email/confirm", { method: "PUT", body: JSON.stringify(data) });

export const getInstitusiSuggestions = async (q?: string) => {
  const queryParam = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiRequest(`/profil/suggestions/institusi${queryParam}`);
};

export const getProdiSuggestions = async (q?: string, institusi?: string) => {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (institusi) params.append("institusi", institusi);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/profil/suggestions/prodi${queryString}`);
};
