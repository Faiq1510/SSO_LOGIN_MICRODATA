import { Notification } from '@/types';
import axiosInstance from '../lib/axios';

export const notificationService = {
  getMyNotifications: async (): Promise<{ data: Notification[]; unread_count: number }> => {
    try {
      const res = await axiosInstance.get('/notifications');
      return res.data;
    } catch (error) {
      console.error('Failed to get notifications', error);
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<any> => {
    try {
      const res = await axiosInstance.put(`/notifications/${id}/read`);
      return res.data;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read`, error);
      throw error;
    }
  },

  markAllAsRead: async (): Promise<any> => {
    try {
      const res = await axiosInstance.put('/notifications/read-all');
      return res.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      throw error;
    }
  },
};
