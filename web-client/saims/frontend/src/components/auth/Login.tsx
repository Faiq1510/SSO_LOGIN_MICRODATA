import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import Cookies from "js-cookie";
import { redirectToSSO } from "@/lib/sso";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Forgot Password States
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Request OTP, 2: Reset Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Toast notification for successful reset password
  const [resetToast, setResetToast] = useState<string | null>(null);

  useEffect(() => {
    let toastTimer: NodeJS.Timeout;
    if (resetToast) {
      toastTimer = setTimeout(() => {
        setResetToast(null);
      }, 5000);
    }
    return () => clearTimeout(toastTimer);
  }, [resetToast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email diperlukan untuk mengirim ulang OTP");
      return;
    }
    setIsResending(true);
    setError("");
    try {
      const response = await authService.resendOTP({ email });
      setError(
        response.message ||
          "OTP berhasil dikirim ulang. Silakan cek WhatsApp Anda.",
      );
      setCountdown(60);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Gagal mengirim ulang OTP");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccessMessage("");
    setIsForgotLoading(true);
    try {
      const res = await authService.forgotPassword({ email: forgotEmail });
      setForgotSuccessMessage(
        res.message || "Kode OTP telah dikirimkan ke WhatsApp Anda.",
      );
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(
        err.response?.data?.error || "Gagal meminta OTP lupa password.",
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccessMessage("");

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authService.resetPasswordWithOTP({
        email: forgotEmail,
        otp_code: forgotOtp,
        new_password: forgotNewPassword,
      });

      // Immediately close modal and reset form
      setIsForgotPasswordModalOpen(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setForgotError("");
      setForgotSuccessMessage("");

      // Show 5-second Toast notification
      setResetToast(
        res.message ||
          "Password berhasil diperbarui! Silakan login dengan password baru.",
      );
    } catch (err: any) {
      setForgotError(
        err.response?.data?.error || "Gagal memperbarui password.",
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isOtpStep) {
        const response = await authService.verifyOTP({
          email,
          otp_code: otp,
        });

        const token = response.token || "";
        const user = response.user;

        if (token) {
          Cookies.set("saims_token", token, { expires: 1 });
          localStorage.setItem("saims_token", token);
        }
        Cookies.set("saims_user", JSON.stringify(user), { expires: 1 });
        localStorage.setItem("saims_user", JSON.stringify(user));

        onLoginSuccess(token, user);
      } else if (isRegistering) {
        // Validate password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
          setError(
            "Password harus minimal 8 karakter dan mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka.",
          );
          setIsLoading(false);
          return;
        }

        const response = await authService.register({
          name,
          email,
          password,
          phone: phone ? `+62${phone}` : "",
          department,
        });

        if (response.message && response.message.includes("OTP")) {
          setIsOtpStep(true);
          setIsRegistering(false);
          setCountdown(60);
          setError("");
        }
      } else {
        const response = await authService.login({
          email,
          password,
        });

        if (response.require_otp) {
          setIsOtpStep(true);
          setCountdown(300); // 5 minutes for login OTP
          setError("");
          return;
        }

        const token = response.token || "";
        const user = response.user;

        if (token) {
          Cookies.set("saims_token", token, { expires: 1 });
          localStorage.setItem("saims_token", token);
        }
        Cookies.set("saims_user", JSON.stringify(user), { expires: 1 });
        localStorage.setItem("saims_user", JSON.stringify(user));

        onLoginSuccess(token, user);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "Terjadi kesalahan pada server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Hero/Branding Panel */}
      <div
        className={`hidden md:flex md:w-1/2 absolute top-0 bottom-0 left-0 transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] z-20 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 dark:from-blue-900 dark:via-gray-900 dark:to-indigo-950 flex-col justify-between p-12 lg:p-16 text-white overflow-hidden ${isRegistering ? "translate-x-full" : "translate-x-0"}`}
      >
        {/* Decorative Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400 blur-[100px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500 blur-[120px] opacity-40"></div>
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500 blur-[100px] opacity-20"></div>
        </div>

        <div className="relative z-10 flex items-center animate-fade-in-up -ml-2 md:-ml-4 lg:-ml-6">
          <Image
            src="/microdata-logo.png"
            alt="Microdata Logo"
            width={150}
            height={64}
            style={{ width: "auto" }}
            className="h-16 object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0 transition-all duration-300"
          />
        </div>

        <div className="relative z-10 max-w-lg mt-12 mb-auto animate-fade-in-up delay-150">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 font-display">
            Smart Asset &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
              Inventory System
            </span>
          </h1>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Platform modern untuk melacak, mengelola, dan mengoptimalkan semua
            aset perusahaan Anda dengan mudah dan efisien.
          </p>

          <div className="mt-10 flex gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              <span className="text-sm font-medium">Sistem Real-time</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
              <span className="text-sm font-medium">Aman & Terpusat</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-200/60 font-medium animate-fade-in delay-300">
          &copy; {new Date().getFullYear()} SAIMS. All rights reserved.
        </div>
      </div>

      {/* Auth Form Panel */}
      <div
        className={`w-full md:w-1/2 absolute top-0 bottom-0 left-0 overflow-y-auto bg-slate-50 dark:bg-gray-900 transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] z-10 ${isRegistering ? "translate-x-0" : "max-md:translate-x-0 md:translate-x-full"}`}
      >
        <div className="min-h-full flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-100 blur-[100px] opacity-40 pointer-events-none rounded-full"></div>

          <div className="w-full max-w-md relative z-10 py-8">
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col items-center gap-3 mb-10 animate-fade-in-up">
              <Image
                src="/microdata-logo.png"
                alt="Microdata Logo"
                width={150}
                height={64}
                style={{ width: "auto" }}
                className="h-16 object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0 transition-all duration-300"
              />
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Smart Asset & Inventory
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl py-10 px-6 sm:px-10 shadow-2xl shadow-blue-900/5 dark:shadow-black/20 rounded-[2rem] border border-white dark:border-gray-700 relative overflow-hidden transition-all duration-500 animate-zoom-in">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-up">
                  {isOtpStep
                    ? "Verifikasi OTP"
                    : isRegistering
                      ? "Buat Akun Baru"
                      : "Selamat Datang Kembali"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed animate-fade-in-up delay-75">
                  {isOtpStep
                    ? "Masukkan 6 digit OTP yang telah dikirimkan ke WhatsApp Anda."
                    : isRegistering
                      ? "Isi data di bawah ini untuk bergabung dengan SAIMS."
                      : "Silakan masuk ke akun Anda untuk melanjutkan."}
                </p>
              </div>

              <form
                className="space-y-5 animate-fade-in-up delay-150"
                onSubmit={handleSubmit}
              >
                {error && (
                  <div
                    className={`p-4 rounded-xl text-sm font-medium border ${
                      error.includes("berhasil")
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-700"
                        : "bg-red-50/50 border-red-200 text-red-700"
                    }`}
                  >
                    {error}
                  </div>
                )}

                {isOtpStep ? (
                  <div className="group animate-fade-in-up">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                      Kode OTP
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="block w-full pl-11 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500 tracking-[0.5em] font-mono text-center text-lg"
                        placeholder="••••••"
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isResending || countdown > 0}
                        className="text-sm font-medium text-blue-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {isResending
                          ? "Mengirim ulang..."
                          : countdown > 0
                            ? `Kirim Ulang OTP (${countdown}s)`
                            : "Kirim Ulang OTP"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isRegistering && (
                      <div className="space-y-5 animate-fade-in-up">
                        <div className="group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                            Nama Lengkap
                          </label>
                          <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="block w-full pl-11 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                              placeholder="Budi Santoso"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                            Nomor WhatsApp
                          </label>
                          <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <span className="text-gray-500 font-medium sm:text-sm">
                                +62
                              </span>
                            </div>
                            <input
                              type="text"
                              required
                              value={phone}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "");
                                if (val.startsWith("62"))
                                  val = val.substring(2);
                                if (val.startsWith("0")) val = val.substring(1);
                                if (val.length > 13) val = val.substring(0, 13);
                                setPhone(val);
                              }}
                              className="block w-full pl-12 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                              placeholder="81234567890"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                            Departemen
                          </label>
                          <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Building className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              type="text"
                              required
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              className="block w-full pl-11 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                              placeholder="IT / HR / Finance"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                        Email Address
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="email@perusahaan.com"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                          Password
                        </label>
                        {!isRegistering && !isOtpStep && (
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmail(email);
                              setForgotOtp("");
                              setForgotNewPassword("");
                              setForgotConfirmPassword("");
                              setForgotStep(1);
                              setForgotError("");
                              setForgotSuccessMessage("");
                              setIsForgotPasswordModalOpen(true);
                            }}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Lupa Password?
                          </button>
                        )}
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="••••••••"
                        />
                      </div>
                      {isRegistering && (
                        <p className="mt-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Password harus minimal 8 karakter dengan kombinasi
                          huruf besar, huruf kecil, dan angka.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isOtpStep
                          ? "Verifikasi"
                          : isRegistering
                            ? "Daftar Sekarang"
                            : "Masuk ke Sistem"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {/* Tombol SSO Microdata */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={redirectToSSO}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-sm font-semibold text-gray-800 dark:text-white shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-base">🛡️</span>
                    <span>Masuk dengan SSO Microdata</span>
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/80 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                      Atau
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOtpStep) {
                        setIsOtpStep(false);
                      } else {
                        setIsRegistering(!isRegistering);
                      }
                      setError("");
                    }}
                    className="text-sm font-semibold text-blue-600 hover:text-indigo-600 transition-colors"
                  >
                    {isOtpStep
                      ? "Kembali ke login"
                      : isRegistering
                        ? "Sudah punya akun? Masuk di sini"
                        : "Belum punya akun? Daftar sekarang"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden animate-zoom-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {forgotStep === 1 ? "Lupa Password" : "Reset Password via OTP"}
              </h3>
              <button
                onClick={() => {
                  setIsForgotPasswordModalOpen(false);
                  setForgotStep(1);
                  setForgotError("");
                  setForgotSuccessMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
                {forgotError}
              </div>
            )}

            {forgotSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {forgotSuccessMessage}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Masukkan email terdaftar Anda. Sistem akan mengirimkan kode
                  OTP 6-digit ke nomor WhatsApp akun ini.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordModalOpen(false)}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isForgotLoading ? "Mengirim..." : "Kirim OTP WA"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordWithOtp} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Masukkan kode OTP 6-digit dari WhatsApp dan password baru
                  Anda.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kode OTP WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={forgotOtp}
                    onChange={(e) =>
                      setForgotOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••••"
                    className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isForgotLoading ? "Memproses..." : "Simpan Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification Pop-up (5 seconds auto-dismiss or manual interrupt) */}
      {resetToast && (
        <div
          onClick={() => setResetToast(null)}
          className="fixed top-6 right-6 z-50 max-w-md w-full sm:w-auto flex items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 border border-emerald-400/30 cursor-pointer animate-fade-in-down transition-all transform hover:scale-[1.02]"
          title="Klik di mana saja untuk menutup"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              ✓
            </div>
            <p className="text-sm font-semibold leading-snug">{resetToast}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setResetToast(null);
            }}
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
