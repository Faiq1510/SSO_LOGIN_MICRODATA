import { apiRequest } from "../utils/api";

export const adminGetTemplateById = async (id: string) => apiRequest(`/admin/template-penilaian/${id}`);

export const adminCreateTemplate = async (data: unknown) =>
  apiRequest("/admin/template-penilaian", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminUpdateTemplate = async (id: string, data: unknown) =>
  apiRequest(`/admin/template-penilaian/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
