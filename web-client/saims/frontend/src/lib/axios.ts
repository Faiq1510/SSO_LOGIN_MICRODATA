import axios from "axios";
import Cookies from "js-cookie";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // In browser: use the API_URL env variable or default to http://localhost:8080/api
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      `http://${window.location.hostname}:8080/api`
    );
  }
  // Server-side: use env variable or localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Generate UUID for Idempotency-Key if not set for POST/PUT/PATCH
    if (
      config.method &&
      ["post", "put", "patch"].includes(config.method.toLowerCase())
    ) {
      if (!config.headers["Idempotency-Key"]) {
        config.headers["Idempotency-Key"] = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2);
      }
    }

    // Cookies are host-scoped, so also send the native SAIMS token explicitly
    // when the frontend and API use different ports or hosts.
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("saims_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept if it's already a login or refresh request
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Assume refresh token is handled by HTTPOnly cookies, so just calling the endpoint works
        await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        isRefreshing = false;
        processQueue(null, "refreshed");

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;

        Cookies.remove("saims_user");

        if (typeof window !== "undefined") {
          localStorage.removeItem("saims_user");
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/login"
          ) {
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }
    }

    if (error.response && error.response.status === 500) {
      if (error.response.data && typeof error.response.data === "object") {
        const msg = error.response.data.error || error.response.data.message;
        // If message looks like a raw SQL or Go error trace, sanitize it
        if (
          !msg ||
          typeof msg !== "string" ||
          msg.includes("sql:") ||
          msg.includes("gorm:") ||
          msg.includes("pq:") ||
          msg.includes("panic:")
        ) {
          error.response.data.error =
            "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
