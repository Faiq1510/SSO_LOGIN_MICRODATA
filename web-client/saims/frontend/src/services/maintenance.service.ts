import { MaintenanceRecord, PaginatedResponse } from '@/types';
import axiosInstance from '@/lib/axios';

export const maintenanceService = {
  getMaintenances: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    payment_status?: string;
    technician_id?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PaginatedResponse<MaintenanceRecord[]>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.type) params.append('type', options.type);
    if (options?.payment_status) params.append('payment_status', options.payment_status);
    if (options?.technician_id) params.append('technician_id', options.technician_id);
    if (options?.sort_by) params.append('sort_by', options.sort_by);
    if (options?.sort_order) params.append('sort_order', options.sort_order);
    const response = await axiosInstance.get(`/maintenance?${params.toString()}`);
    return response.data;
  },

  createMaintenance: async (data: Record<string, unknown>): Promise<void> => {
    await axiosInstance.post('/maintenance', data);
  },

  updateStatus: async (id: string, data: Record<string, unknown>): Promise<void> => {
    await axiosInstance.put(`/maintenance/${id}/status`, data);
  },

  updateDetails: async (id: string, data: Record<string, unknown>): Promise<void> => {
    await axiosInstance.put(`/maintenance/${id}/details`, data);
  },

  confirmPayment: async (maintenance_ids: string[]): Promise<void> => {
    await axiosInstance.post('/maintenance/payment/confirm', { maintenance_ids });
  }
};
