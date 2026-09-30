import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { confirmEmail, requestEmailConfirmation } from "../services/auth.service";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  otp: z.string().min(6, "OTP minimal 6 karakter"),
});

type FormValues = z.infer<typeof schema>;

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailParam },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setSuccess(null);
    try {
      await confirmEmail(data);
      setSuccess("Email berhasil dikonfirmasi! Anda dapat masuk sekarang.");
      localStorage.removeItem(`otp_resend_${data.email}`);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengkonfirmasi email.");
    }
  };

  const [countdown, setCountdown] = useState<number>(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!emailParam) return;
    const storedState = localStorage.getItem(`otp_resend_${emailParam}`);
    if (storedState) {
      const { nextAllowedTime } = JSON.parse(storedState);
      const now = Date.now();
      if (nextAllowedTime > now) {
        setCountdown(Math.ceil((nextAllowedTime - now) / 1000));
      }
    }
  }, [emailParam]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleResendOtp = async () => {
    if (!emailParam) {
      setError("Email tidak ditemukan untuk mengirim ulang OTP.");
      return;
    }
    if (countdown > 0) return;

    setError(null);
    setSuccess(null);
    setIsResending(true);
    try {
      await requestEmailConfirmation({ email: emailParam });
      setSuccess("OTP baru telah dikirim ke email Anda.");

      const storedState = localStorage.getItem(`otp_resend_${emailParam}`);
      let retryCount = 0;
      if (storedState) {
        retryCount = JSON.parse(storedState).retryCount + 1;
      }

      const delaySeconds = Math.pow(2, retryCount) * 60;
      const nextAllowedTime = Date.now() + delaySeconds * 1000;

      localStorage.setItem(`otp_resend_${emailParam}`, JSON.stringify({ nextAllowedTime, retryCount }));
      setCountdown(delaySeconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Konfirmasi Email</h1>
          <p className="text-text-secondary mt-2 text-sm">Masukkan kode OTP yang telah dikirim ke email Anda</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-status-reject/10 border border-status-reject/20 rounded-xl text-sm text-status-reject text-center animate-slide-in-error">{error}</div>
        )}
        {success && <div className="mb-6 p-4 bg-status-active/10 border border-status-active/20 rounded-xl text-sm text-status-active text-center">{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
            <input
              {...register("email")}
              type="email"
              readOnly={!!emailParam}
              className={`w-full ${emailParam ? "bg-surface-3 text-text-muted" : "bg-surface-2 text-text-primary"} border ${errors.email ? "border-status-reject" : "border-border-base"} px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
            />
            {errors.email && <p className="text-status-reject text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Kode OTP</label>
            <input
              {...register("otp")}
              type="text"
              className={`w-full bg-surface-2 border ${errors.otp ? "border-status-reject" : "border-border-base"} text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              placeholder="123456"
            />
            {errors.otp && <p className="text-status-reject text-xs mt-1">{errors.otp.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            Belum menerima kode?{" "}
            {countdown > 0 ? (
              <span className="text-text-muted font-medium">Kirim ulang dalam {formatCountdown(countdown)}</span>
            ) : (
              <button
                onClick={handleResendOtp}
                type="button"
                disabled={isResending}
                className="text-brand hover:underline font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? "Mengirim..." : "Kirim Ulang OTP"}
              </button>
            )}
          </p>
        </div>
      </div>
    </AuthShell>
  );
};
export default EmailConfirmation;
