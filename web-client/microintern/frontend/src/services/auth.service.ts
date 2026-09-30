import { apiRequest } from "../utils/api";

export const login = async (data: unknown) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(data) });
export const register = async (data: unknown) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) });
export const getGoogleClientId = async () => apiRequest("/auth/google/client-id");
export const googleLogin = async (data: unknown) => apiRequest("/auth/google/login", { method: "POST", body: JSON.stringify(data) });
export const forgotPassword = async (data: unknown) => apiRequest("/auth/password/forgot", { method: "POST", body: JSON.stringify(data) });
export const resetPassword = async (data: unknown) => apiRequest("/auth/password/reset", { method: "POST", body: JSON.stringify(data) });
export const confirmEmail = async (data: unknown) => apiRequest("/auth/email/confirm", { method: "POST", body: JSON.stringify(data) });
export const requestEmailConfirmation = async (data: unknown) => apiRequest("/auth/email/request-confirmation", { method: "POST", body: JSON.stringify(data) });
export const ssoCallbackApi = async (ssoToken: string) => apiRequest(`/auth/sso/callback?sso_token=${encodeURIComponent(ssoToken)}`);
export const ssoExchangeApi = async (code: string, codeVerifier: string) =>
  apiRequest("/auth/sso/exchange", {
    method: "POST",
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });
