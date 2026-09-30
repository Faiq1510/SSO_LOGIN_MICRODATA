import axiosInstance from '../lib/axios';
import { Asset, PaginatedResponse } from '@/types';

export interface AssetQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  location?: string;
}

export const assetService = {
  getAssets: async (options?: AssetQueryOptions): Promise<PaginatedResponse<Asset[]>> => {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.search) params.append('search', options.search);
      if (options?.category) params.append('category', options.category);
      if (options?.status) params.append('status', options.status);
      if (options?.condition) params.append('condition', options.condition);
      if (options?.location) params.append('location', options.location);

      const response = await axiosInstance.get(`/assets?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assets", error);
      throw error;
    }
  },

  getAssetById: async (id: string): Promise<Asset> => {
    try {
      const response = await axiosInstance.get(`/assets/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching asset ${id}`, error);
      throw error;
    }
  },

  createAsset: async (assetData: Partial<Asset>): Promise<Asset> => {
    try {
      const response = await axiosInstance.post('/assets', assetData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating asset", error);
      throw error;
    }
  },

  createBulkAssets: async (bulkData: {
    name: string;
    category: string;
    location: string;
    purchase_date?: string;
    description?: string;
    items: Array<{ serial_number?: string; condition: string; status?: string }>;
  }): Promise<Asset[]> => {
    try {
      const response = await axiosInstance.post('/assets/bulk', bulkData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating bulk assets", error);
      throw error;
    }
  },

  updateAsset: async (id: string, assetData: Partial<Asset>): Promise<Asset> => {
    try {
      const response = await axiosInstance.put(`/assets/${id}`, assetData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating asset ${id}`, error);
      throw error;
    }
  },

  deleteAsset: async (id: string, reason?: string): Promise<void> => {
    if (reason) {
      await axiosInstance.delete(`/assets/${id}`, { data: { reason } });
    } else {
      await axiosInstance.delete(`/assets/${id}`);
    }
  },

  uploadImage: async (assetId: string, file: File, isPrimary: boolean = false): Promise<unknown> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_primary', isPrimary.toString());

      const response = await axiosInstance.post(`/assets/${assetId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error uploading image for asset ${assetId}`, error);
      throw error;
    }
  },

  getAssetImages: async (assetId: string): Promise<Record<string, unknown>[]> => {
    try {
      const response = await axiosInstance.get(`/assets/${assetId}/images`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching images for asset ${assetId}`, error);
      throw error;
    }
  },

  deleteAssetImage: async (assetId: string, imageId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/assets/${assetId}/images/${imageId}`);
    } catch (error) {
      console.error(`Error deleting image ${imageId}`, error);
      throw error;
    }
  },

  setPrimaryImage: async (assetId: string, imageId: string): Promise<void> => {
    try {
      await axiosInstance.put(`/assets/${assetId}/images/${imageId}/primary`);
    } catch (error) {
      console.error(`Error setting primary image ${imageId} for asset ${assetId}`, error);
      throw error;
    }
  }
,

  getDeletedAssets: async (options?: AssetQueryOptions): Promise<PaginatedResponse<Asset[]>> => {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.search) params.append('search', options.search);
      if (options?.category) params.append('category', options.category);
      if (options?.status) params.append('status', options.status);
      if (options?.condition) params.append('condition', options.condition);
      if (options?.location) params.append('location', options.location);

      const response = await axiosInstance.get(`/assets/trash?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching deleted assets", error);
      throw error;
    }
  },

  restoreAsset: async (id: string): Promise<void> => {
    try {
      await axiosInstance.post(`/assets/${id}/restore`);
    } catch (error) {
      console.error(`Error restoring asset ${id}`, error);
      throw error;
    }
  }
};
