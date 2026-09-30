import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { forgotPassword } from "../services/auth.service";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setSuccess(null);
    try {
      await forgotPassword({ email: data.email });
      setSuccess("Kode OTP telah dikirim ke email Anda.");
      setTimeout(() => navigate(`/atur-ulang-password?email=${encodeURIComponent(data.email)}`), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan.");
    }
  };

  return (
    <AuthShell>
      <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-2xl shadow-black/40 relative">
        <Link to="/login" className="absolute top-8 left-8 text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center mb-8 px-6">
          <h1 className="text-xl font-semibold text-text-primary">Lupa Password</h1>
          <p className="text-text-secondary mt-2 text-sm">Masukkan email Anda untuk mereset kata sandi</p>
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
              className={`w-full bg-surface-2 border ${errors.email ? "border-status-reject" : "border-border-base"} text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              placeholder="nama@email.com"
            />
            {errors.email && <p className="text-status-reject text-xs mt-1">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Mengirim..." : "Kirim OTP"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};
export default ForgotPassword;
