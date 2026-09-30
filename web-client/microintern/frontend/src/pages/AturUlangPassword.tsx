import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { resetPassword } from "../services/auth.service";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  otp: z.string().min(6, "OTP minimal 6 karakter"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
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
      await resetPassword(data);
      setSuccess("Kata sandi berhasil direset. Anda dapat login sekarang.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset kata sandi.");
    }
  };

  return (
    <AuthShell>
      <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Reset Kata Sandi</h1>
          <p className="text-text-secondary mt-2 text-sm">Masukkan OTP dan kata sandi baru Anda</p>
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
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Kata Sandi Baru</label>
            <input
              {...register("newPassword")}
              type="password"
              className={`w-full bg-surface-2 border ${errors.newPassword ? "border-status-reject" : "border-border-base"} text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              placeholder="••••••••"
            />
            {errors.newPassword && <p className="text-status-reject text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Memproses..." : "Reset Kata Sandi"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};
export default ResetPassword;
