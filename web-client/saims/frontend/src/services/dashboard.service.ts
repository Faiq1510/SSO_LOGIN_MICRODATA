import axiosInstance from '../lib/axios';

export interface DashboardStats {
  total_assets: number;
  available_assets: number;
  borrowed_assets: number;
  maintenance_assets: number;
  total_users: number;
  total_borrowings: number;
  total_maintenance: number;
  categories_stats: Array<{ category: string; count: number }>;
  conditions_stats: Array<{ condition: string; count: number }>;
}

export interface LandingStats {
  integrated_modules: number;
  role_types: number;
  auto_notifications: number;
  system_uptime: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await axiosInstance.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats", error);
      throw error;
    }
  },
  
  getLandingStats: async (): Promise<LandingStats> => {
    try {
      const response = await axiosInstance.get('/public/landing-stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching landing stats", error);
      throw error;
    }
  }
};
