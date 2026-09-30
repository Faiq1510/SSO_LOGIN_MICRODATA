import { useEffect, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { Eye, EyeOff, X } from "lucide-react";

export default function UpdatePasswordModal({ show, onClose, user }) {
    const [stage, setStage] = useState("current");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const otpRefs = useRef([]);

    const form = useForm({
        current_password: "",
        otp: "",
        password: "",
        password_confirmation: "",
    });

    const sendOtpForm = useForm({});
    const verifyOtpForm = useForm({ otp: "" });

    useEffect(() => {
        if (show) {
            setStage("current");
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setOtpVerified(false);
            form.reset();
            form.clearErrors();
            sendOtpForm.clearErrors();
            verifyOtpForm.reset();
            verifyOtpForm.clearErrors();
        }
    }, [show]);

    function normalizeOtp(value) {
        return value.replace(/\D/g, "").slice(0, 6);
    }

    function focusOtpInput(index) {
        const input = otpRefs.current[index];
        if (input) {
            input.focus();
        }
    }

    function handleOtpDigitChange(index, event) {
        const digit = normalizeOtp(event.target.value).slice(0, 1);
        const current = verifyOtpForm.data.otp;
        const digits = current.split("").concat(Array(6).fill("")).slice(0, 6);
        digits[index] = digit;
        verifyOtpForm.setData("otp", digits.join(""));

        if (digit && index < 5) {
            focusOtpInput(index + 1);
        }
    }

    function handleOtpKeyDown(index, event) {
        if (event.key === "Backspace") {
            const digits = verifyOtpForm.data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
            if (digits[index]) {
                digits[index] = "";
                verifyOtpForm.setData("otp", digits.join(""));
                return;
            }

            if (index > 0) {
                focusOtpInput(index - 1);
                const prevDigits = verifyOtpForm.data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
                prevDigits[index - 1] = "";
                verifyOtpForm.setData("otp", prevDigits.join(""));
            }
        }

        if (event.key === "ArrowLeft" && index > 0) {
            focusOtpInput(index - 1);
            event.preventDefault();
        }

        if (event.key === "ArrowRight" && index < 5) {
            focusOtpInput(index + 1);
            event.preventDefault();
        }
    }

    function handleOtpPaste(event) {
        const pasted = normalizeOtp(event.clipboardData.getData("text"));
        if (!pasted) return;

        verifyOtpForm.setData("otp", pasted);
        setTimeout(() => focusOtpInput(Math.min(pasted.length, 5)), 0);
        event.preventDefault();
    }

    const submitCurrentPassword = (e) => {
        e.preventDefault();

        form.put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.clearErrors();
                onClose();
            },
            onError: () => {
                if (form.errors.password) {
                    form.reset("password", "password_confirmation");
                }
            },
        });
    };

    const startForgotPasswordFlow = (e) => {
        e.preventDefault();

        sendOtpForm.post(route("profile.password.send-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                setStage("otp");
                form.setData("otp", "");
                form.setData("password", "");
                form.setData("password_confirmation", "");
                form.clearErrors();
                verifyOtpForm.reset();
                verifyOtpForm.clearErrors();
                setOtpVerified(false);
            },
        });
    };

    const submitVerifyOtp = (e) => {
        e.preventDefault();

        verifyOtpForm.post(route("profile.password.verify-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                setOtpVerified(true);
                setStage("new_password");
                form.clearErrors();
                verifyOtpForm.clearErrors();
            },
        });
    };

    const submitPasswordReset = (e) => {
        e.preventDefault();

        form.post(route("profile.password.reset"), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.clearErrors();
                setOtpVerified(false);
                setStage("current");
                onClose();
            },
        });
    };

    const closeModal = () => {
        form.reset();
        form.clearErrors();
        setStage("current");
        onClose();
    };

    return (
        <Modal show={show} onClose={closeModal}>
            <form
                onSubmit={
                    stage === "current" ? submitCurrentPassword :
                    stage === "otp" ? submitVerifyOtp :
                    submitPasswordReset
                }
                className="p-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {stage === "current" && "Ganti Password"}
                            {stage === "otp" && "Verifikasi OTP"}
                            {stage === "new_password" && "Reset Password"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {stage === "current" && "Perbarui password akun Anda dengan aman."}
                            {stage === "otp" && `Kode OTP dikirim ke email: ${user?.email ?? "-"}`}
                            {stage === "new_password" && "Silakan masukkan password baru Anda."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    {stage === "current" && (
                        <>
                            <div>
                                <InputLabel htmlFor="current_password" value="Password Lama" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="current_password"
                                        type={showCurrentPassword ? "text" : "password"}
                                        className="block w-full pr-12 px-1.5 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        value={form.data.current_password}
                                        onChange={(e) => form.setData("current_password", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputError message={form.errors.current_password} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password Baru" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="password"
                                        type={showNewPassword ? "text" : "password"}
                                        className="block w-full pr-12 px-1.5 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        value={form.data.password}
                                        onChange={(e) => form.setData("password", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputError message={form.errors.password} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password Baru" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="block w-full pr-12 px-1.5 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        value={form.data.password_confirmation}
                                        onChange={(e) => form.setData("password_confirmation", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputError message={form.errors.password_confirmation} className="mt-1.5" />
                            </div>
                        </>
                    )}

                    {stage === "otp" && (
                        <>
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
                                Kode OTP 6 digit dikirim ke email Anda saat ini: <span className="font-semibold text-slate-800">{user?.email}</span>
                            </div>

                            <div>
                                <InputLabel htmlFor="otp_0" value="Kode OTP" />
                                <div className="mt-1.5 grid grid-cols-6 gap-2">
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <input
                                            key={index}
                                            id={index === 0 ? "otp_0" : undefined}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            value={verifyOtpForm.data.otp.split("")[index] ?? ""}
                                            onChange={(e) => handleOtpDigitChange(index, e)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            autoComplete="one-time-code"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                <InputError message={verifyOtpForm.errors.otp || form.errors.otp} className="mt-1.5" />
                            </div>
                        </>
                    )}

                    {stage === "new_password" && (
                        <>
                            <div>
                                <InputLabel htmlFor="password" value="Password Baru" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="password"
                                        type={showNewPassword ? "text" : "password"}
                                        className="block w-full pr-12 px-1.5 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        value={form.data.password}
                                        onChange={(e) => form.setData("password", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputError message={form.errors.password} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password Baru" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="block w-full pr-12 px-1.5 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        value={form.data.password_confirmation}
                                        onChange={(e) => form.setData("password_confirmation", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputError message={form.errors.password_confirmation} className="mt-1.5" />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-between gap-2">
                    {stage === "otp" ? (
                        <button
                            type="button"
                            onClick={() => {
                                setStage("current");
                                form.setData("otp", "");
                                form.clearErrors();
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Kembali
                        </button>
                    ) : stage === "new_password" ? (
                        <div></div> 
                    ) : (
                        <button
                            type="button"
                            onClick={startForgotPasswordFlow}
                            disabled={sendOtpForm.processing}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            {sendOtpForm.processing ? "Mengirim..." : "Lupa Password?"}
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={
                                stage === "current" ? form.processing :
                                stage === "otp" ? (verifyOtpForm.processing || verifyOtpForm.data.otp.length !== 6) :
                                (form.processing || !form.data.password || !form.data.password_confirmation)
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {stage === "current"
                                ? (form.processing ? "Memproses..." : "Simpan Password")
                            : stage === "otp"
                                ? (verifyOtpForm.processing ? "Memverifikasi..." : "Verifikasi OTP")
                            : (form.processing ? "Memproses..." : "Simpan Password Baru")}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}