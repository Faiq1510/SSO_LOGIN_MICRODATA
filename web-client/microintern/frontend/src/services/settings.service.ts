import { apiRequest } from "../utils/api";

export const getWebsiteSettings = async () => apiRequest("/admin/settings");
export const updateWebsiteSettings = async (data: unknown) => apiRequest("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
export const getUserSettings = async () => apiRequest("/profil"); // Wait, this is already in profil.service.ts. It's fine to leave it there. Wait, is it?
export const getAdminDashboard = async () => apiRequest("/admin/dashboard");
