import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Building2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        login: "",
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg overflow-hidden">
                        <img
                            src={logo}
                            alt="Microdata"
                            className="h-full w-full object-contain p-2"
                        />
                    </div>

                    <h1 className="text-4xl font-bold text-white">SiteFlow</h1>

                    <p className="mt-2 text-lg text-cyan-400">
                        Sistem Monitoring Perumahan
                    </p>
                </div>

                {/* Card Login */}
                <div className="rounded-[28px] border border-slate-700 bg-[#172B3A]/95 p-10 shadow-2xl backdrop-blur">
                    <h2 className="mb-8 text-center text-4xl font-bold text-white">
                        Masuk ke Akun Anda
                    </h2>

                    <form onSubmit={submit}>
                        {/* Username / Email */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Username / Email
                            </label>

                            <input
                                type="text"
                                value={data.login}
                                onChange={(e) =>
                                    setData("login", e.target.value)
                                }
                                placeholder="username atau email"
                                autoFocus
                                className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                            />

                            <p className="mt-2 text-sm text-red-400">
                                {errors.login}
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="Masukkan password"
                                    className="w-full rounded-2xl border border-slate-600 bg-[#2A3C4D] px-5 py-4 pr-14 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>

                            <p className="mt-2 text-sm text-red-400">
                                {errors.password}
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-8 w-full rounded-2xl bg-cyan-700 py-4 text-lg font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
                        >
                            {processing ? "Memproses..." : "Masuk"}
                        </button>

                        <a
                            href={route("login.sso")}
                            className="mt-4 block w-full rounded-2xl border border-cyan-600 py-4 text-center text-lg font-semibold text-cyan-300 transition hover:bg-cyan-900/40"
                        >
                            Masuk dengan SSO
                        </a>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-400">
                                Belum punya akun?{" "}
                                <Link
                                    href={route("register")}
                                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
                                >
                                    Daftar di sini
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    © 2026 SiteFlow - Housing Construction ERP
                </p>
            </div>
        </GuestLayout>
    );
}
