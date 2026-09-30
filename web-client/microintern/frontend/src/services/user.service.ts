import { apiRequest } from "../utils/api";

export const getUsers = async () => apiRequest("/admin/users");
export const searchUsers = async (query: string) => apiRequest(`/admin/users/search?q=${query}`);
