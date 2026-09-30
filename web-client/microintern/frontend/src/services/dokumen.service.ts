import { apiRequest } from "../utils/api";

export const getSuratBalasanList = async (page: number = 1, limit: number = 10) => apiRequest(`/admin/dokumen/surat-balasan?page=${page}&limit=${limit}`);

export const getSertifikatList = async (page: number = 1, limit: number = 10) => apiRequest(`/admin/dokumen/sertifikat?page=${page}&limit=${limit}`);
