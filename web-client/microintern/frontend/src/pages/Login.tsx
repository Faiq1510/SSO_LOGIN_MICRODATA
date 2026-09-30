import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { setAuthToken, setRefreshToken, setLocalUser, getLocalUser, logout } from "../utils/api";
import { getGoogleClientId, login } from "../services/auth.service";
import { redirectToSSO } from "../utils/sso";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface TokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleAccounts {
  accounts: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (res: TokenResponse) => void | Promise<void>;
        error_callback?: (err: unknown) => void;
      }) => TokenClient;
    };
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleClientIdError, setGoogleClientIdError] = useState<"network_error" | "not_configured" | null>(null);

  useEffect(() => {
    const user = getLocalUser();
    if (user) {
      navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard/peserta");
    }
  }, [navigate]);

  useEffect(() => {
    getGoogleClientId()
      .then((res) => {
        if (res.data && res.data.clientId) {
          setGoogleClientId(res.data.clientId);
          setGoogleClientIdError(null);
        } else {
          setGoogleClientIdError("not_configured");
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil Google Client ID:", err);
        setGoogleClientIdError("network_error");
      });
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    const win = window as unknown as { google?: GoogleAccounts };
    if (win.google) return;

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleClick = () => {
    if (!googleClientId) {
      if (googleClientIdError === "network_error") {
        setError("Gagal terhubung ke server backend (Network Error / CORS). Hubungi Administrator atau pastikan CORS origin di backend sudah diatur dan server aktif.");
      } else if (googleClientIdError === "not_configured") {
        setError("Fitur Google Sign-In belum dikonfigurasi di server backend. Silakan hubungi Administrator atau atur GOOGLE_CLIENT_ID di backend (.env).");
      } else {
        setError("Fitur Google Sign-In sedang memuat atau belum siap. Silakan coba beberapa saat lagi.");
      }
      return;
    }

    const win = window as unknown as { google?: GoogleAccounts };
    if (!win.google) {
      setError("Google SDK sedang memuat. Silakan coba beberapa saat lagi.");
      return;
    }

    try {
      if (win.google.accounts && win.google.accounts.oauth2) {
        const tokenClient = win.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              setError(null);
              try {
                const apiResponse = await login({ token: tokenResponse.access_token });
                logout();
                const { accessToken, refreshToken, user } = apiResponse.data;
                setAuthToken(accessToken);
                setRefreshToken(refreshToken);
                setLocalUser(user);

                if (user.role === "admin") {
                  navigate("/dashboard/admin");
                } else {
                  navigate("/dashboard/peserta");
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : "Gagal masuk menggunakan Google.";
                setError(message);
              }
            } else if (tokenResponse.error) {
              setError("Gagal masuk dengan Google: " + (tokenResponse.error_description || tokenResponse.error));
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
      }
    } catch (err) {
      console.error("GSI error:", err);
      setError("Gagal memproses login Google. Silakan coba lagi.");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await login({ email: data.email, password: data.password });

      logout();
      const { accessToken, refreshToken, user } = response.data;
      setAuthToken(accessToken);
      setRefreshToken(refreshToken);
      setLocalUser(user);

      if (user.role === "admin") {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/peserta");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal masuk. Periksa kembali email dan password Anda.";

      if (message.includes("confirm your email address") || message.includes("memverifikasi email")) {
        navigate(`/konfirmasi-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      setError(message);
    }
  };

  return (
    <AuthShell>
      <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Selamat Datang Kembali</h1>
          <p className="text-text-secondary mt-2 text-sm">Masuk ke akun Microintern Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-reject/10 border border-status-reject/20 rounded-xl text-sm text-status-reject text-center animate-slide-in-error">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
            <input
              {...register("email")}
              type="email"
              className={`w-full bg-surface-2 border ${
                errors.email ? "border-status-reject" : "border-border-base"
              } text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              placeholder="nama@email.com"
            />
            {errors.email && <p className="text-status-reject text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <input
              {...register("password")}
              type="password"
              className={`w-full bg-surface-2 border ${
                errors.password ? "border-status-reject" : "border-border-base"
              } text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-status-reject text-xs mt-1">{errors.password.message}</p>}
            <div className="flex justify-end mt-2">
              <Link to="/lupa-password" className="text-brand hover:underline text-sm font-medium">
                Lupa Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border-base"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-mono-data">
            <span className="bg-surface-1 px-3 text-text-muted">Atau masuk dengan</span>
          </div>
        </div>

        <div className="w-full flex justify-center mt-6">
          <div onClick={handleGoogleClick} className="w-full cursor-pointer">
            <div className="w-full border border-border-base bg-surface-2 hover:bg-surface-3 text-text-primary font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span className="text-sm">Masuk dengan Google</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={redirectToSSO}
          className="w-full mt-3 border border-border-base bg-surface-2 hover:bg-surface-3 text-text-primary font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <span className="text-base">SSO</span>
          <span className="text-sm">Masuk dengan SSO Microdata</span>
        </button>

        <div className="mt-8 text-center">
          <p className="text-text-secondary text-sm">
            Belum punya akun?{" "}
            <Link to="/registrasi" className="text-brand hover:underline font-medium">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

export default Login;
