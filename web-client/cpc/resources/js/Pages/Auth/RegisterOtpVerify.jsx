import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";

export default function RegisterOtpVerify({ email }) {
    const { flash } = usePage().props;
    const [message, setMessage] = useState(flash?.status || "");
    const otpRefs = useRef([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        otp: "",
    });

    const resendForm = useForm({});

    function normalizeOtp(value) {
        return value.replace(/\D/g, "").slice(0, 6);
    }

    function focusOtpInput(index) {
        const input = otpRefs.current[index];
        if (input) input.focus();
    }

    function handleOtpDigitChange(index, event) {
        const digit = normalizeOtp(event.target.value).slice(0, 1);
        const current = data.otp;
        const digits = current.split("").concat(Array(6).fill("")).slice(0, 6);
        digits[index] = digit;
        setData("otp", digits.join(""));

        if (digit && index < 5) {
            focusOtpInput(index + 1);
        }
    }

    function handleOtpKeyDown(index, event) {
        if (event.key === "Backspace") {
            if (data.otp[index]) {
                const digits = data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
                digits[index] = "";
                setData("otp", digits.join(""));
            } else if (index > 0) {
                const digits = data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
                digits[index - 1] = "";
                setData("otp", digits.join(""));
                focusOtpInput(index - 1);
            }
        }

        if (event.key === "ArrowLeft" && index > 0) {
            focusOtpInput(index - 1);
        }

        if (event.key === "ArrowRight" && index < 5) {
            focusOtpInput(index + 1);
        }
    }

    function handleOtpPaste(event) {
        const pasted = normalizeOtp(event.clipboardData.getData("text"));
        if (!pasted) return;
        setData("otp", pasted);
        setTimeout(() => focusOtpInput(Math.min(pasted.length, 5)), 0);
    }

    useEffect(() => {
        if (data.otp.length === 6) {
            post(route("register.verify.otp.post"), {
                onSuccess: () => reset("otp"),
                onError: () => setMessage("Kode OTP salah atau sudah kadaluwarsa."),
            });
        }
    }, [data.otp]);

    const submit = (e) => {
        e.preventDefault();
        post(route("register.verify.otp.post"), {
            onSuccess: () => reset("otp"),
            onError: () => setMessage("Kode OTP salah atau sudah kadaluwarsa."),
        });
    };

    const resendOtp = (e) => {
        e.preventDefault();
        resendForm.post(route("register.resend.otp"), {
            onSuccess: () => setMessage("Kode OTP baru telah dikirim ke email Anda."),
        });
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi OTP" />

            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl shadow-lg">
                        <img src={logo} alt="Microdata" className="h-full w-full object-contain p-2" />
                    </div>
                    <h1 className="text-4xl font-bold text-white">SiteFlow</h1>
                    <p className="mt-2 text-lg text-cyan-400">Verifikasi Email</p>
                </div>

                <div className="rounded-[28px] border border-slate-700 bg-[#172B3A]/95 p-10 shadow-2xl backdrop-blur">
                    <h2 className="mb-3 text-center text-3xl font-bold text-white">Masukkan Kode OTP</h2>
                    <p className="mb-6 text-center text-sm text-slate-300">
                        Kode OTP telah dikirim ke <span className="font-semibold text-cyan-300">{email}</span>
                    </p>

                    {message ? (
                        <div className="mb-6 rounded-2xl border border-cyan-700/50 bg-cyan-950/40 px-5 py-4 text-sm text-cyan-300">
                            {message}
                        </div>
                    ) : null}

                    {flash?.error ? (
                        <div className="mb-6 rounded-2xl border border-red-700/50 bg-red-950/40 px-5 py-4 text-sm text-red-300">
                            {flash.error}
                        </div>
                    ) : null}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-cyan-300">
                                Kode OTP 6 Digit
                            </label>
                            <div className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={data.otp.split("")[index] ?? ""}
                                        onChange={(e) => handleOtpDigitChange(index, e)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        className="h-12 w-full rounded-xl border border-slate-600 bg-[#2A3C4D] text-center text-lg font-semibold text-white outline-none focus:border-cyan-500"
                                    />
                                ))}
                            </div>
                            {errors.otp ? (
                                <p className="mt-2 text-sm text-red-400">{errors.otp}</p>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.otp.length !== 6}
                            className="w-full rounded-2xl bg-cyan-700 py-3 text-lg font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
                        >
                            {processing ? "Memverifikasi..." : "Verifikasi OTP"}
                        </button>
                    </form>

                    <form onSubmit={resendOtp} className="mt-4 text-center">
                        <button
                            type="submit"
                            disabled={resendForm.processing}
                            className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            {resendForm.processing ? "Mengirim..." : "Kirim ulang OTP"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-400">
                        <Link href={route("register")} className="font-semibold text-cyan-400 hover:text-cyan-300">
                            Kembali ke form register
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
