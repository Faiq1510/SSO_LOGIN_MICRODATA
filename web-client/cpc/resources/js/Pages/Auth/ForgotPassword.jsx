import { useEffect, useRef, useState } from "react";
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const [stage, setStage] = useState('idle');
    const [message, setMessage] = useState(status || '');
    const otpRefs = useRef([]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        otp: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (status) {
            setMessage(status);
        }
    }, [status]);

    function normalizeOtp(value) {
        return value.replace(/\D/g, '').slice(0, 6);
    }

    function focusOtpInput(index) {
        const input = otpRefs.current[index];
        if (input) input.focus();
    }

    function handleOtpDigitChange(index, event) {
        const digit = normalizeOtp(event.target.value).slice(0, 1);
        const current = data.otp;
        const digits = current.split('').concat(Array(6).fill('')).slice(0, 6);
        digits[index] = digit;
        setData('otp', digits.join(''));

        if (digit && index < 5) {
            focusOtpInput(index + 1);
        }
    }

    function handleOtpKeyDown(index, event) {
        if (event.key === 'Backspace') {
            const digits = data.otp.split('').concat(Array(6).fill('')).slice(0, 6);
            if (digits[index]) {
                digits[index] = '';
                setData('otp', digits.join(''));
                return;
            }

            if (index > 0) {
                focusOtpInput(index - 1);
                const prevDigits = data.otp.split('').concat(Array(6).fill('')).slice(0, 6);
                prevDigits[index - 1] = '';
                setData('otp', prevDigits.join(''));
            }
        }

        if (event.key === 'ArrowLeft' && index > 0) {
            focusOtpInput(index - 1);
            event.preventDefault();
        }

        if (event.key === 'ArrowRight' && index < 5) {
            focusOtpInput(index + 1);
            event.preventDefault();
        }
    }

    function handleOtpPaste(event) {
        const pasted = normalizeOtp(event.clipboardData.getData('text'));
        if (!pasted) return;

        setData('otp', pasted);
        setTimeout(() => focusOtpInput(Math.min(pasted.length, 5)), 0);
        event.preventDefault();
    }

    const sendOtp = (e) => {
        e.preventDefault();

        post(route('password.email.otp'), {
            preserveScroll: true,
            onSuccess: () => {
                setStage('otp');
                setMessage('Kode OTP telah dikirim ke email Anda jika terdaftar.');
                clearErrors();
                setData('otp', '');
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    };

    const submitReset = (e) => {
        e.preventDefault();

        post(route('password.email.otp-reset'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('token');
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-slate-900">
                        Lupa Password
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Masukkan email untuk menerima kode OTP. Setelah kode diterima, masukkan OTP dan password baru.
                    </p>
                </div>

                {message && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {message}
                    </div>
                )}

                {stage === 'idle' ? (
                    <form onSubmit={sendOtp} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1.5 block w-full focus:border-blue-500 focus:ring-blue-500"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="username"
                                isFocused={true}
                            />
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={processing || !data.email}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Mengirim...' : 'Kirim OTP ke Email'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitReset} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1.5 block w-full bg-slate-100 text-slate-500"
                                value={data.email}
                                disabled
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="otp_0" value="Kode OTP" />
                            <div className="mt-1.5 grid grid-cols-6 gap-2">
                                {Array.from({ length: 6 }, (_, index) => (
                                    <input
                                        key={index}
                                        id={index === 0 ? 'otp_0' : undefined}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-slate-900 caret-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        value={data.otp.split('')[index] ?? ''}
                                        onChange={(e) => handleOtpDigitChange(index, e)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        autoComplete="one-time-code"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <InputError message={errors.otp} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Password Baru" />
                            <TextInput
                                id="password"
                                type="password"
                                className="mt-1.5 block w-full focus:border-blue-500 focus:ring-blue-500"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password Baru" />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                className="mt-1.5 block w-full focus:border-blue-500 focus:ring-blue-500"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password_confirmation} className="mt-1.5" />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStage('idle');
                                    reset();
                                    clearErrors();
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Kembali
                            </button>
                            <button
                                type="submit"
                                disabled={processing || data.otp.length !== 6 || !data.password || !data.password_confirmation}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Memproses...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </GuestLayout>
    );
}
