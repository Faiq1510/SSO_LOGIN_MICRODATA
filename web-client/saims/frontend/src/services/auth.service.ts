import axiosInstance from '../lib/axios';

export const authService = {
  login: async (data: Record<string, unknown>) => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },
  
  register: async (data: Record<string, unknown>) => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  verifyOTP: async (data: { email: string; otp_code: string }) => {
    const response = await axiosInstance.post('/auth/verify-otp', data);
    return response.data;
  },

  resendOTP: async (data: { email: string }) => {
    const response = await axiosInstance.post('/auth/resend-otp', data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  ssoCallback: async (ssoToken: string) => {
    const response = await axiosInstance.get(`/auth/sso/callback?sso_token=${encodeURIComponent(ssoToken)}`);
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await axiosInstance.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPasswordWithOTP: async (data: { email: string; otp_code: string; new_password: string }) => {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  }
};

