import axiosInstance from '../lib/axios';
import { User } from '../types';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get('/users');
    return response.data.data;
  },
  
  getUserById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data.data;
  },
  
  updateUserRole: async (id: string, role: string): Promise<unknown> => {
    const response = await axiosInstance.put(`/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: string): Promise<unknown> => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (data: { 
    name: string; 
    phone: string; 
    id_karyawan?: string; 
    department?: string; 
  }): Promise<any> => {
    const response = await axiosInstance.put('/users/profile', data);
    return response.data;
  },

  verifyPhone: async (otp_code: string, phone: string): Promise<any> => {
    const response = await axiosInstance.post('/users/profile/verify-phone', { otp_code, phone });
    return response.data;
  },

  changePassword: async (data: Record<string, unknown>): Promise<unknown> => {
    const response = await axiosInstance.put('/users/change-password', data);
    return response.data;
  }
};
