import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { setAuthToken, setRefreshToken, setLocalUser } from "../utils/api";
import { ssoCallbackApi, ssoExchangeApi } from "../services/auth.service";

const SSOCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSSO = async () => {
      try {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const userParam = searchParams.get("user");
        const ssoToken = searchParams.get("sso_token");
        const code = searchParams.get("code");
        const returnedState = searchParams.get("state");

        if (accessToken && refreshToken && userParam) {
          const user = JSON.parse(userParam);
          setAuthToken(accessToken);
          setRefreshToken(refreshToken);
          setLocalUser(user);
          navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard/peserta", { replace: true });
          return;
        }

        if (ssoToken) {
          const res = await ssoCallbackApi(ssoToken);
          const { accessToken: accToken, refreshToken: refToken, user } = res.data;
          setAuthToken(accToken);
          setRefreshToken(refToken);
          setLocalUser(user);
          navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard/peserta", { replace: true });
          return;
        }

        if (code) {
          const savedState = sessionStorage.getItem("sso_state");
          const codeVerifier = sessionStorage.getItem("sso_code_verifier");

          if (!returnedState || returnedState !== savedState) {
            throw new Error("State SSO tidak valid atau sudah kedaluwarsa.");
          }

          if (!codeVerifier) {
            throw new Error("Sesi SSO tidak ditemukan. Silakan mulai login SSO kembali.");
          }

          const res = await ssoExchangeApi(code, codeVerifier);
          const { accessToken: accToken, refreshToken: refToken, user } = res.data;
          sessionStorage.removeItem("sso_state");
          sessionStorage.removeItem("sso_code_verifier");
          setAuthToken(accToken);
          setRefreshToken(refToken);
          setLocalUser(user);
          navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard/peserta", { replace: true });
          return;
        }

        setError("Parameter autentikasi SSO tidak ditemukan.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "SSO Token tidak valid atau sudah kadaluarsa.";
        setError(message);
      }
    };

    handleSSO();
  }, [navigate, searchParams]);

  return (
    <AuthShell>
      <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-2xl shadow-black/40 text-center">
        {error ? (
          <div>
            <div className="w-12 h-12 bg-status-reject/10 border border-status-reject/20 rounded-full flex items-center justify-center mx-auto mb-4 text-status-reject">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Otentikasi SSO Gagal</h1>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <Link to="/login" className="inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-all text-sm">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Memproses Login SSO</h1>
            <p className="text-text-secondary text-sm">Mohon tunggu sebentar, memverifikasi kredensial Anda...</p>
          </div>
        )}
      </div>
    </AuthShell>
  );
};

export default SSOCallback;
