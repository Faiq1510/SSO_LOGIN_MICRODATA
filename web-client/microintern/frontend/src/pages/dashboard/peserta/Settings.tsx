import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getProfil, connectGoogle } from "../../../services/profil.service";
import { apiRequest } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { Lock, Sun, Mail, AlertTriangle, User } from "lucide-react";

interface GoogleCredentialResponse {
  credential: string;
}

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
    id: {
      initialize: (config: {
        client_id: string;
        callback: (res: GoogleCredentialResponse) => void | Promise<void>;
        use_fedcm_for_prompt?: boolean;
        use_fedcm_for_button?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement | null, options: object) => void;
      prompt: () => void;
    };
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (res: TokenResponse) => void | Promise<void>;
        error_callback?: (err: unknown) => void;
      }) => TokenClient;
    };
  };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

const Settings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") !== "light");
  const [currentEmail, setCurrentEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [emailFormState, setEmailFormState] = useState<"idle" | "otp">("idle");
  const [newEmailInput, setNewEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [showDisconnectPasswordForm, setShowDisconnectPasswordForm] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState("");
  const [showConnectPasswordForm, setShowConnectPasswordForm] = useState(false);
  const [connectPassword, setConnectPassword] = useState("");

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const handleToggleDarkMode = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);
    if (nextDarkMode) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await getProfil();
        if (response.status === "success" && response.data && active) {
          setIsGoogleConnected(response.data.isGoogleConnected);
          setHasPassword(response.data.hasPassword);
          setEmailVerified(response.data.emailVerified);
          setCurrentEmail(response.data.email || "");
          setUserId(response.data.id || "");
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      }
    };
    loadProfile();

    apiRequest("/auth/google/client-id")
      .then((res: { data?: { clientId?: string } }) => {
        if (res.data && res.data.clientId && active) {
          setGoogleClientId(res.data.clientId);
        }
      })
      .catch((err: unknown) => {
        console.error("Gagal mengambil Google Client ID:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleConnectResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      try {
        const apiRes = await connectGoogle({ token: response.credential, currentPassword: connectPassword });
        if (apiRes.status === "success") {
          showSuccess("Akun Google berhasil dihubungkan!");
          setIsGoogleConnected(true);
          setShowConnectPasswordForm(false);
          setConnectPassword("");

          const profileRes = await getProfil();
          if (profileRes.status === "success" && profileRes.data) {
            setIsGoogleConnected(profileRes.data.isGoogleConnected);
            setHasPassword(profileRes.data.hasPassword);
            setEmailVerified(profileRes.data.emailVerified);
          }
        }
      } catch (err) {
        const error = err as Error;
        showError(error.message || "Gagal menghubungkan akun Google.");
      }
    },
    [showSuccess, showError, connectPassword]
  );

  useEffect(() => {
    if (!googleClientId || isGoogleConnected) return;

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
  }, [googleClientId, isGoogleConnected]);

  const handleGoogleConnectClick = () => {
    if (!googleClientId || connectPassword.length < 6) return;

    const win = window as unknown as { google?: GoogleAccounts };
    if (!win.google) {
      showError("Google SDK belum siap. Silakan coba beberapa saat lagi.");
      return;
    }

    try {
      if (win.google.accounts && win.google.accounts.oauth2) {
        const tokenClient = win.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              handleGoogleConnectResponse({ credential: tokenResponse.access_token });
            } else if (tokenResponse.error) {
              showError("Gagal menghubungkan Google: " + (tokenResponse.error_description || tokenResponse.error));
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } else if (win.google.accounts && win.google.accounts.id) {
        win.google.accounts.id.prompt();
      }
    } catch (err) {
      console.error("GSI connect error:", err);
      showError("Gagal menghubungkan akun Google. Silakan coba lagi.");
    }
  };

  const handleDisconnectGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      showError("Anda harus menyambungkan email ke akun terlebih dahulu sebelum memutuskan akun Google.");
      return;
    }
    if (!hasPassword) {
      showError("Anda harus membuat kata sandi terlebih dahulu sebelum memutuskan akun Google agar tetap dapat masuk ke sistem.");
      return;
    }
    if (!disconnectPassword) {
      showError("Password saat ini wajib diisi");
      return;
    }
    try {
      const apiRes = await apiRequest("/profil/google/disconnect", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword: disconnectPassword }),
      });
      if (apiRes.status === "success") {
        showSuccess("Hubungan akun Google berhasil diputuskan.");
        setIsGoogleConnected(false);
        setShowDisconnectPasswordForm(false);
        setDisconnectPassword("");
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal memutuskan akun Google.");
    }
  };

  const onChangePassword = async (data: PasswordValues) => {
    if (hasPassword) {
      if (!data.currentPassword) {
        showError("Password lama wajib diisi");
        return;
      }
      if (data.currentPassword.length < 6) {
        showError("Password lama minimal 6 karakter");
        return;
      }
    }
    try {
      const response = await apiRequest("/profil/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (response.status === "success") {
        showSuccess("Password berhasil diubah!");
        resetPassword();
        setHasPassword(true);
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal mengubah password.");
    }
  };

  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes("@")) {
      showError("Email tidak valid");
      return;
    }
    if (hasPassword && !emailCurrentPassword) {
      showError("Password saat ini wajib diisi");
      return;
    }
    setIsSubmittingEmail(true);
    try {
      const response = await apiRequest("/profil/email/request-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: newEmailInput, currentPassword: emailCurrentPassword }),
      });
      if (response.status === "success") {
        showSuccess("OTP telah dikirim ke email baru");
        setEmailFormState("otp");
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal mengirim OTP.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) {
      showError("OTP wajib diisi");
      return;
    }
    setIsSubmittingEmail(true);
    try {
      const response = await apiRequest("/profil/email/confirm", {
        method: "PUT",
        body: JSON.stringify({ newEmail: newEmailInput, otp: otpInput }),
      });
      if (response.status === "success") {
        showSuccess("Email berhasil diubah!");
        setEmailFormState("idle");
        setNewEmailInput("");
        setOtpInput("");
        window.location.reload();
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal mengubah email.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Pengaturan Akun</h1>
        <p className="text-xs sm:text-sm text-text-secondary">Kelola keamanan, dan preferensi tampilan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand shrink-0" />
              Ubah Email
            </h3>
            {!hasPassword && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-500 tracking-wide uppercase">Kata Sandi Diperlukan</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">Anda harus membuat kata sandi terlebih dahulu sebelum mengubah email.</p>
                </div>
              </div>
            )}
            <div className="mb-6 pb-6 border-b border-border-base/50 space-y-4">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">User ID</span>
                <div className="flex items-center justify-between gap-2.5 px-4 py-3 bg-surface-0 border border-border-base rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="text-text-primary font-mono text-xs sm:text-sm truncate select-all">{userId || "Memuat..."}</span>
                  </div>
                  {userId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(userId);
                        showSuccess("User ID berhasil disalin!");
                      }}
                      className="text-xs text-brand hover:underline shrink-0 font-medium cursor-pointer"
                    >
                      Salin
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Email Saat Ini</span>
                <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-0 border border-border-base rounded-xl">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-text-primary font-medium text-xs sm:text-sm break-all">{currentEmail || "Memuat..."}</span>
                </div>
              </div>
            </div>
            {emailFormState === "idle" ? (
              <form onSubmit={handleRequestEmailOtp} className="space-y-4">
                {!hasPassword ? null : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-text-secondary">Password Saat Ini</label>
                      <input
                        type="password"
                        value={emailCurrentPassword}
                        onChange={(e) => setEmailCurrentPassword(e.target.value)}
                        className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-text-secondary">Email Baru</label>
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                        placeholder="email@contoh.com"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingEmail}
                      className="w-full bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3 rounded-xl transition-all border border-border-strong mt-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {isSubmittingEmail ? "Memproses..." : "Kirim OTP"}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleConfirmEmailChange} className="space-y-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-4">
                  <p className="text-xs sm:text-sm text-orange-400">
                    OTP telah dikirim ke <strong>{newEmailInput}</strong>. Silakan masukkan kode tersebut di bawah ini.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Kode OTP</label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                    placeholder="Masukkan OTP"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setEmailFormState("idle")}
                    disabled={isSubmittingEmail}
                    className="w-full sm:flex-1 bg-transparent hover:bg-surface-2 text-text-primary font-bold py-3 rounded-xl transition-all border border-border-strong cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full sm:flex-1 bg-brand hover:bg-brand/90 text-text-primary font-bold py-3 rounded-xl transition-all shadow-sm shadow-orange-900/20 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isSubmittingEmail ? "Memproses..." : "Konfirmasi"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand shrink-0" />
              Keamanan
            </h3>
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              {hasPassword && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Password Saat Ini</label>
                  <input
                    {...registerPassword("currentPassword")}
                    type="password"
                    className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                    placeholder="••••••••"
                  />
                  {passwordErrors.currentPassword && <p className="text-red-500 text-xs font-bold mt-1">{passwordErrors.currentPassword.message}</p>}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Password Baru</label>
                <input
                  {...registerPassword("newPassword")}
                  type="password"
                  className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                  placeholder="Min. 6 karakter"
                />
                {passwordErrors.newPassword && <p className="text-red-500 text-xs font-bold mt-1">{passwordErrors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Konfirmasi Password Baru</label>
                <input
                  {...registerPassword("confirmPassword")}
                  type="password"
                  className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs sm:text-sm"
                  placeholder="Ulangi password"
                />
                {passwordErrors.confirmPassword && <p className="text-red-500 text-xs font-bold mt-1">{passwordErrors.confirmPassword.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3 rounded-xl transition-all border border-border-strong mt-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
              >
                {isSubmittingPassword ? "Memproses..." : "Ganti Kata Sandi"}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Integrasi Google
            </h3>
            {isGoogleConnected && !hasPassword && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-500 tracking-wide uppercase">Keamanan Akun</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Anda harus membuat kata sandi terlebih dahulu sebelum memutuskan akun Google agar tetap dapat masuk ke sistem.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">Hubungkan akun Google Anda untuk login cepat secara instan.</p>
              {isGoogleConnected ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-0 border border-border-base rounded-2xl">
                    <div>
                      <p className="text-text-primary text-xs sm:text-sm font-bold">Terhubung</p>
                      <p className="text-text-muted text-[10px] sm:text-xs">Anda dapat login via Google.</p>
                    </div>
                    {!showDisconnectPasswordForm && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!emailVerified) {
                            showError("Anda harus menyambungkan email ke akun terlebih dahulu sebelum memutuskan akun Google.");
                            return;
                          }
                          setShowDisconnectPasswordForm(true);
                        }}
                        disabled={!hasPassword}
                        className={`w-full sm:w-auto font-bold px-3.5 py-2 rounded-lg text-xs transition-all text-center ${
                          !hasPassword
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                            : "bg-red-600/10 hover:bg-red-600 hover:text-text-primary border border-red-500/20 text-red-500 cursor-pointer"
                        }`}
                      >
                        Putuskan
                      </button>
                    )}
                  </div>
                  {showDisconnectPasswordForm && (
                    <form onSubmit={handleDisconnectGoogleSubmit} className="p-4 bg-surface-0 border border-border-base rounded-2xl space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary">Password Saat Ini</label>
                        <input
                          type="password"
                          value={disconnectPassword}
                          onChange={(e) => setDisconnectPassword(e.target.value)}
                          className="w-full bg-surface-0 border border-border-base text-text-primary px-3 py-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisconnectPasswordForm(false);
                            setDisconnectPassword("");
                          }}
                          className="w-full sm:flex-1 bg-transparent hover:bg-surface-2 text-text-primary py-2 rounded-xl transition-all border border-border-strong text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl transition-all text-xs cursor-pointer"
                          style={{ display: disconnectPassword.length >= 6 ? "block" : "none" }}
                        >
                          Konfirmasi
                        </button>
                      </div>
                      {disconnectPassword.length < 6 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[11px] text-yellow-500 font-bold leading-relaxed text-center">
                          Masukkan kata sandi saat ini terlebih dahulu untuk memutuskan akun Google.
                        </div>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!hasPassword ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs sm:text-sm text-yellow-500 font-bold">Anda harus membuat kata sandi terlebih dahulu sebelum menghubungkan akun Google.</p>
                    </div>
                  ) : !showConnectPasswordForm ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-0 border border-border-base rounded-2xl">
                      <div>
                        <p className="text-text-secondary text-xs sm:text-sm font-bold">Belum Terhubung</p>
                        <p className="text-text-muted text-[10px] sm:text-xs">Hubungkan akun Google Anda.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectPasswordForm(true)}
                        className="w-full sm:w-auto bg-brand/10 hover:bg-brand hover:text-white border border-brand/20 text-brand font-bold px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer text-center"
                      >
                        Hubungkan Google
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-0 border border-border-base rounded-2xl space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary">Password Saat Ini</label>
                        <input
                          type="password"
                          value={connectPassword}
                          onChange={(e) => setConnectPassword(e.target.value)}
                          className="w-full bg-surface-0 border border-border-base text-text-primary px-3 py-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all placeholder-zinc-700 text-xs"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      {connectPassword.length >= 6 ? (
                        <div className="space-y-3 pt-1">
                          <div onClick={handleGoogleConnectClick} className="w-full cursor-pointer">
                            <div className="w-full border border-border-base bg-surface-2 hover:bg-surface-3 text-text-primary font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all text-xs">
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  fill="#34A853"
                                />
                                <path
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                  fill="#EA4335"
                                />
                              </svg>
                              <span>Hubungkan dengan Google</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowConnectPasswordForm(false);
                              setConnectPassword("");
                            }}
                            className="w-full bg-transparent hover:bg-surface-2 text-text-primary py-2 rounded-xl transition-all border border-border-strong text-xs cursor-pointer font-medium"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[11px] text-yellow-500 font-bold leading-relaxed text-center">
                            Masukkan kata sandi saat ini terlebih dahulu untuk menghubungkan akun Google.
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowConnectPasswordForm(false);
                              setConnectPassword("");
                            }}
                            className="w-full bg-transparent hover:bg-surface-2 text-text-primary py-2 rounded-xl transition-all border border-border-strong text-xs cursor-pointer font-medium"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <Sun className="w-5 h-5 text-brand shrink-0" />
              Preferensi Tampilan
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 p-4 bg-surface-0 border border-border-base rounded-2xl">
                <div>
                  <p className="text-text-primary font-medium text-xs sm:text-sm">Tampilan Dark Mode</p>
                  <p className="text-xs text-text-muted">Aktifkan tema gelap untuk perangkat ini.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDarkMode}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${darkMode ? "bg-brand" : "bg-surface-2"}`}
                  aria-label="Toggle dark mode"
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${darkMode ? "right-1 bg-white" : "left-1 bg-zinc-600"}`} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
