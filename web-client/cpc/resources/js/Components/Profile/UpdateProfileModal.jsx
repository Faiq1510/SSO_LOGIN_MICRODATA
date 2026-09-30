import { useEffect, useState, useRef } from "react";
import { useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { X, Lock, Mail, ShieldCheck, ArrowLeft } from "lucide-react";


const OTP_DURATION_SECONDS = 10 * 60;

export default function UpdateProfileModal({ show, onClose, user }) {
    // idle -> otp_old -> new_email -> otp_new
    const [stage, setStage] = useState("idle");
    const [secondsLeft, setSecondsLeft] = useState(OTP_DURATION_SECONDS);
    const timerRef = useRef(null);

    const mainForm = useForm({
        name: user.name ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
    });

    const sendOldOtpForm = useForm({});
    const oldOtpForm = useForm({ otp: "" });
    const newEmailForm = useForm({ new_email: "" });
    const newOtpForm = useForm({ otp: "" });

    const oldOtpRefs = useRef([]);
    const newOtpRefs = useRef([]);

    function normalizeOtp(value) {
        return value.replace(/\D/g, "").slice(0, 6);
    }

    function focusOtpInput(refs, index) {
        const input = refs.current[index];
        if (input) input.focus();
    }

    function handleOtpDigitChange(form, refs, index, event) {
        const digit = normalizeOtp(event.target.value).slice(0, 1);
        const current = form.data.otp;
        const digits = current.split("").concat(Array(6).fill("")).slice(0, 6);
        digits[index] = digit;
        const nextValue = digits.join("").replace(/\D/g, "");
        form.setData("otp", nextValue);

        if (digit && index < 5) {
            focusOtpInput(refs, index + 1);
        }
    }

    function handleOtpKeyDown(form, refs, index, event) {
        if (event.key === "Backspace") {
            const digits = form.data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
            if (digits[index]) {
                digits[index] = "";
                form.setData("otp", digits.join(""));
                return;
            }
            if (index > 0) {
                focusOtpInput(refs, index - 1);
                const prevDigits = form.data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
                prevDigits[index - 1] = "";
                form.setData("otp", prevDigits.join(""));
            }
        }

        if (event.key === "ArrowLeft" && index > 0) {
            focusOtpInput(refs, index - 1);
            event.preventDefault();
        }

        if (event.key === "ArrowRight" && index < 5) {
            focusOtpInput(refs, index + 1);
            event.preventDefault();
        }
    }

    function handleOtpPaste(form, refs, event) {
        const pasted = normalizeOtp(event.clipboardData.getData("text"));
        if (!pasted) return;

        form.setData("otp", pasted);
        const nextIndex = Math.min(pasted.length, 5);
        setTimeout(() => focusOtpInput(refs, nextIndex), 0);
        event.preventDefault();
    }

    useEffect(() => {
        if (show) {
            setStage("idle");
            mainForm.setData({
                name: user.name ?? "",
                username: user.username ?? "",
                email: user.email ?? "",
            });
            [mainForm, oldOtpForm, newEmailForm, newOtpForm].forEach((f) => f.clearErrors());
            oldOtpForm.setData("otp", "");
            newEmailForm.setData("new_email", "");
            newOtpForm.setData("otp", "");
            stopCountdown();
        }
    }, [show]);

    useEffect(() => () => stopCountdown(), []);

    // Auto-submit OTP lama begitu 6 digit lengkap
    useEffect(() => {
        if (stage === "otp_old" && oldOtpForm.data.otp.length === 6 && !oldOtpForm.processing) {
            verifyOldOtp({ preventDefault: () => {} });
        }
    }, [oldOtpForm.data.otp, stage]);

    // Auto-submit OTP baru begitu 6 digit lengkap
    useEffect(() => {
        if (stage === "otp_new" && newOtpForm.data.otp.length === 6 && !newOtpForm.processing) {
            verifyNewOtp({ preventDefault: () => {} });
        }
    }, [newOtpForm.data.otp, stage]);

    if (!show) return null;

    function startCountdown() {
        stopCountdown();
        setSecondsLeft(OTP_DURATION_SECONDS);
        timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    stopCountdown();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    }

    function stopCountdown() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    function formatCountdown(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    }

    function submitMain(e) {
        e.preventDefault();
        mainForm.patch(route("profile.update"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    }

    function startChangeEmail() {
        oldOtpForm.clearErrors();
        sendOldOtpForm.post(route("profile.email.send-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                oldOtpForm.setData("otp", "");
                setStage("otp_old");
                startCountdown();
            },
        });
    }

    function resendOldOtp() {
        sendOldOtpForm.post(route("profile.email.send-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                oldOtpForm.setData("otp", "");
                oldOtpForm.clearErrors();
                startCountdown();
            },
        });
    }

    function verifyOldOtp(e) {
        e.preventDefault();
        oldOtpForm.post(route("profile.email.verify-old-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                stopCountdown();
                newEmailForm.setData("new_email", "");
                newEmailForm.clearErrors();
                setStage("new_email");
            },
        });
    }

    function sendNewOtp(e) {
        e.preventDefault();
        newEmailForm.post(route("profile.email.send-new-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                newOtpForm.setData("otp", "");
                newOtpForm.clearErrors();
                setStage("otp_new");
                startCountdown();
            },
        });
    }

    function verifyNewOtp(e) {
        e.preventDefault();
        newOtpForm.transform(() => ({
            new_email: newEmailForm.data.new_email,
            otp: newOtpForm.data.otp,
        }));
        newOtpForm.post(route("profile.email.verify-new-otp"), {
            preserveScroll: true,
            onSuccess: () => {
                stopCountdown();
                mainForm.setData("email", newEmailForm.data.new_email);
                setStage("idle");
            },
        });
    }

    function cancelEmailFlow() {
        stopCountdown();
        [oldOtpForm, newEmailForm, newOtpForm].forEach((f) => f.clearErrors());
        setStage("idle");
    }

    function closeModal() {
        stopCountdown();
        [mainForm, oldOtpForm, newEmailForm, newOtpForm].forEach((f) => f.clearErrors());
        setStage("idle");
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={closeModal}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        {stage !== "idle" && (
                            <button
                                type="button"
                                onClick={stage === "otp_old" ? cancelEmailFlow : () => setStage(stage === "otp_new" ? "new_email" : "otp_old")}
                                className="cursor-pointer rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {stage === "idle" ? <Lock size={16} /> : <ShieldCheck size={16} />}
                        </div>
                        <h2 className="text-base font-semibold text-slate-800">
                            {stage === "idle" && "Edit Informasi Akun"}
                            {stage === "otp_old" && "Verifikasi Email Saat Ini"}
                            {stage === "new_email" && "Masukkan Email Baru"}
                            {stage === "otp_new" && "Verifikasi Email Baru"}
                        </h2>
                    </div>
                    
                    <button
                        type="button"
                        onClick={closeModal}
                        className="cursor-pointer rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {/* ================= STAGE: idle ================= */}
                    {stage === "idle" && (
                        <form onSubmit={submitMain} className="space-y-4">
                            <p className="text-sm text-slate-500">
                                Perbarui nama dan username akun Anda.
                            </p>

                            <div>
                                <InputLabel htmlFor="name" value="Nama Lengkap" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="px-1.5 py-1 block w-full focus:border-blue-500 focus:ring-blue-500"
                                    value={mainForm.data.name}
                                    onChange={(e) => mainForm.setData("name", e.target.value)}
                                    autoComplete="name"
                                />
                                <InputError message={mainForm.errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="username" value="Username" />
                                <TextInput
                                    id="username"
                                    type="text"
                                    className="px-1.5 py-1 block w-full focus:border-blue-500 focus:ring-blue-500"
                                    value={mainForm.data.username}
                                    onChange={(e) => mainForm.setData("username", e.target.value)}
                                    autoComplete="username"
                                />
                                <InputError message={mainForm.errors.username} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <div className="mt-1.5 flex gap-2">
                                    <div className="relative flex-1">
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="block w-full px-1.5 py-1 bg-slate-100 text-slate-500"
                                            value={mainForm.data.email}
                                            disabled
                                        />
                                        <Lock
                                            size={14}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={startChangeEmail}
                                        disabled={sendOldOtpForm.processing}
                                        className="cursor-pointer shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                    >
                                        {sendOldOtpForm.processing ? "Mengirim..." : "Ganti Email"}
                                    </button>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Email hanya dapat diubah melalui verifikasi OTP dua tahap.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={mainForm.processing}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {mainForm.processing ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ================= STAGE: otp_old ================= */}
                    {stage === "otp_old" && (
                        <form onSubmit={verifyOldOtp} className="space-y-4">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
                                <Mail size={14} className="mb-1 text-blue-600" />
                                Kode OTP 6 digit dikirim ke email Anda saat ini:{" "}
                                <span className="font-semibold text-slate-800">{user.email}</span>
                            </div>

                            <div>
                                <InputLabel htmlFor="old_otp_0" value="Kode OTP" />
                                <div className="mt-1.5 grid grid-cols-6 gap-2">
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <input
                                            key={index}
                                            id={index === 0 ? "old_otp_0" : undefined}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            value={oldOtpForm.data.otp.split("")[index] ?? ""}
                                            onChange={(e) => handleOtpDigitChange(oldOtpForm, oldOtpRefs, index, e)}
                                            onKeyDown={(e) => handleOtpKeyDown(oldOtpForm, oldOtpRefs, index, e)}
                                            onPaste={(e) => handleOtpPaste(oldOtpForm, oldOtpRefs, e)}
                                            ref={(el) => (oldOtpRefs.current[index] = el)}
                                            autoComplete="one-time-code"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                <InputError message={oldOtpForm.errors.otp} className="mt-1.5" />

                                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                                    <span>
                                        {secondsLeft > 0
                                            ? `Kode berlaku ${formatCountdown(secondsLeft)}`
                                            : "Kode sudah kedaluwarsa"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={resendOldOtp}
                                        disabled={sendOldOtpForm.processing || secondsLeft > OTP_DURATION_SECONDS - 30}
                                        className="font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-300"
                                    >
                                        Kirim ulang kode
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={cancelEmailFlow}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={oldOtpForm.processing || oldOtpForm.data.otp.length !== 6}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {oldOtpForm.processing ? "Memverifikasi..." : "Lanjutkan"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ================= STAGE: new_email ================= */}
                    {stage === "new_email" && (
                        <form onSubmit={sendNewOtp} className="space-y-4">
                            <p className="text-sm text-slate-500">
                                Email lama terverifikasi. Masukkan alamat email baru Anda.
                            </p>

                            <div>
                                <InputLabel htmlFor="new_email" value="Email Baru" />
                                <TextInput
                                    id="new_email"
                                    type="email"
                                    className="mt-1.5 block w-full focus:border-blue-500 focus:ring-blue-500"
                                    value={newEmailForm.data.new_email}
                                    onChange={(e) => newEmailForm.setData("new_email", e.target.value)}
                                    placeholder="email-baru@contoh.com"
                                    autoFocus
                                />
                                <InputError message={newEmailForm.errors.new_email} className="mt-1.5" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={cancelEmailFlow}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={newEmailForm.processing || !newEmailForm.data.new_email}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {newEmailForm.processing ? "Mengirim..." : "Kirim OTP ke Email Baru"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ================= STAGE: otp_new ================= */}
                    {stage === "otp_new" && (
                        <form onSubmit={verifyNewOtp} className="space-y-4">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
                                <Mail size={14} className="mb-1 text-blue-600" />
                                Kode OTP 6 digit dikirim ke email baru:{" "}
                                <span className="font-semibold text-slate-800">
                                    {newEmailForm.data.new_email}
                                </span>
                            </div>

                            <div>
                                <InputLabel htmlFor="new_otp_0" value="Kode OTP" />
                                <div className="mt-1.5 grid grid-cols-6 gap-2">
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <input
                                            key={index}
                                            id={index === 0 ? "new_otp_0" : undefined}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            value={newOtpForm.data.otp.split("")[index] ?? ""}
                                            onChange={(e) => handleOtpDigitChange(newOtpForm, newOtpRefs, index, e)}
                                            onKeyDown={(e) => handleOtpKeyDown(newOtpForm, newOtpRefs, index, e)}
                                            onPaste={(e) => handleOtpPaste(newOtpForm, newOtpRefs, e)}
                                            ref={(el) => (newOtpRefs.current[index] = el)}
                                            autoComplete="one-time-code"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                <InputError message={newOtpForm.errors.otp} className="mt-1.5" />

                                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                                    <span>
                                        {secondsLeft > 0
                                            ? `Kode berlaku ${formatCountdown(secondsLeft)}`
                                            : "Kode sudah kedaluwarsa"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={sendNewOtp}
                                        disabled={newEmailForm.processing || secondsLeft > OTP_DURATION_SECONDS - 30}
                                        className="font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-300"
                                    >
                                        Kirim ulang kode
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={cancelEmailFlow}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={newOtpForm.processing || newOtpForm.data.otp.length !== 6}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {newOtpForm.processing ? "Memverifikasi..." : "Verifikasi & Ganti Email"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}   