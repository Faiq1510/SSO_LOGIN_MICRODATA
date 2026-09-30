import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onSuccess: () => {
                reset("password", "password_confirmation");
                window.open(route("register.verify.otp"), "_blank", "noopener,noreferrer");
            },
            onError: () => {},
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg overflow-hidden">
                        <img src={logo} alt="Microdata" className="h-full w-full object-contain p-2" />
                    </div>

                    <h1 className="text-4xl font-bold text-white">
                        SiteFlow
                    </h1>

                    <p className="mt-2 text-lg text-cyan-400">
                        Sistem Monitoring Perumahan
                    </p>
                </div>

                {/* Card Register */}
                <div className="rounded-[28px] border border-slate-700 bg-[#172B3A]/95 p-10 shadow-2xl backdrop-blur">

                    <h2 className="mb-8 text-center text-4xl font-bold text-white">
                        Buat Akun Baru
                    </h2>

                    {flash?.info && (
                        <div className="mb-6 rounded-2xl border border-cyan-700/50 bg-cyan-950/40 px-5 py-4 text-sm text-cyan-300">
                            {flash.info}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 rounded-2xl border border-red-700/50 bg-red-950/40 px-5 py-4 text-sm text-red-300">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submit}>

                        {/* Nama Lengkap */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Nama Lengkap
                            </label>

                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="Nama lengkap Anda"
                                autoComplete="name"
                                autoFocus
                                className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                            />

                            <p className="mt-2 text-sm text-red-400">
                                {errors.name}
                            </p>
                        </div>

                        {/* Username */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Username <span className="normal-case text-slate-400">(opsional)</span>
                            </label>

                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => setData("username", e.target.value)}
                                placeholder="Kosongkan untuk dibuat otomatis dari nama"
                                autoComplete="off"
                                className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                            />

                            <p className="mt-2 text-sm text-red-400">
                                {errors.username}
                            </p>
                        </div>

                        {/* Email */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Email
                            </label>

                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="nama@email.com"
                                autoComplete="email"
                                className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                            />

                            <p className="mt-2 text-sm text-red-400">
                                {errors.email}
                            </p>
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="Masukkan password"
                                    autoComplete="new-password"
                                    className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 pr-14 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <p className="mt-2 text-sm text-red-400">
                                {errors.password}
                            </p>
                        </div>

                        {/* Konfirmasi Password */}
                        <div>
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Konfirmasi Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showPasswordConfirmation ? "text" : "password"}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData("password_confirmation", e.target.value)}
                                    placeholder="Ulangi password"
                                    autoComplete="new-password"
                                    className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 pr-14 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPasswordConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <p className="mt-2 text-sm text-red-400">
                                {errors.password_confirmation}
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-8 w-full rounded-2xl bg-cyan-700 py-4 text-lg font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
                        >
                            {processing ? "Memproses..." : "Daftar"}
                        </button>

                        <p className="mt-6 text-center text-sm text-slate-400">
                            Sudah punya akun?{" "}
                            <Link href={route("login")} className="font-semibold text-cyan-400 hover:text-cyan-300">
                                Masuk di sini
                            </Link>
                        </p>

                    </form>

                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    © 2026 SiteFlow - Housing Construction ERP
                </p>

            </div>
        </GuestLayout>
    );
}