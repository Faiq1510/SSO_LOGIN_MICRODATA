import axiosInstance from '../lib/axios';

export interface AssetDeletionRequest {
  id: string;
  asset_id: string;
  requested_by: string;
  approver_id?: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  asset?: any;
  requester?: any;
  approver?: any;
}

export const assetDeletionService = {
  getRequests: async (status?: string): Promise<AssetDeletionRequest[]> => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await axiosInstance.get(`/asset-deletions?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching asset deletion requests", error);
      throw error;
    }
  },

  approveRequest: async (id: string): Promise<void> => {
    try {
      await axiosInstance.post(`/asset-deletions/${id}/approve`);
    } catch (error) {
      console.error(`Error approving deletion request ${id}`, error);
      throw error;
    }
  },

  rejectRequest: async (id: string): Promise<void> => {
    try {
      await axiosInstance.post(`/asset-deletions/${id}/reject`);
    } catch (error) {
      console.error(`Error rejecting deletion request ${id}`, error);
      throw error;
    }
  }
};
