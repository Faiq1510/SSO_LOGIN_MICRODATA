const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export interface User {
  id: string;
  email: string;
  role: "peserta" | "admin";
  name: string | null;
  jenjang_pendidikan?: string | null;
}

export const getAuthToken = (): string | null => localStorage.getItem("token");
export const setAuthToken = (token: string) => localStorage.setItem("token", token);
export const removeAuthToken = () => localStorage.removeItem("token");

export const getRefreshToken = (): string | null => localStorage.getItem("refreshToken");
export const setRefreshToken = (token: string) => localStorage.setItem("refreshToken", token);
export const removeRefreshToken = () => localStorage.removeItem("refreshToken");

export const getLocalUser = (): User | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
export const setLocalUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("user-updated", { detail: user }));
};
export const removeLocalUser = () => localStorage.removeItem("user");

export const logout = () => {
  removeAuthToken();
  removeRefreshToken();
  removeLocalUser();
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && endpoint !== "/auth/login" && endpoint !== "/auth/register" && endpoint !== "/auth/refresh") {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          console.log("Access token expired, attempting to refresh token...");
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.data.accessToken;
            setAuthToken(newAccessToken);

            headers.set("Authorization", `Bearer ${newAccessToken}`);
            const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) {
              throw new Error(retryData.message || `Request failed with status ${retryResponse.status}`);
            }
            return retryData;
          } else {
            console.warn("Refresh token request failed. Status:", refreshRes.status);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
          logout();
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.", { cause: refreshErr });
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        const publicAuthPaths = ["/login", "/registrasi", "/lupa-password", "/atur-ulang-password", "/konfirmasi-email", "/sso/callback"];
        const isPublicAuthPath = publicAuthPaths.some((path) => window.location.pathname.startsWith(path));
        if (typeof window !== "undefined" && !isPublicAuthPath) {
          window.location.href = "/login";
        }
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request error on ${endpoint}:`, error);
    throw error;
  }
};
