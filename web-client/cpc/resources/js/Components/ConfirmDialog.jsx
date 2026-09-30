import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
    open,
    title = "Apakah Anda yakin?",
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    danger = false,
    processing = false,
    onConfirm,
    onCancel,
    showConfirm = true,
}) {
    if (!open) return null;

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                    <div
                        className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${
                            danger ? "bg-red-100" : "bg-cyan-100"
                        }`}
                    >
                        <AlertTriangle
                            size={22}
                            className={danger ? "text-red-500" : "text-cyan-600"}
                        />
                    </div>

                    <h2 className="text-center text-lg font-bold text-foreground">
                        {title}
                    </h2>

                    {message && (
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                            {message}
                        </p>
                    )}

                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={processing}
                            className={`cursor-pointer ${showConfirm ? 'flex-1' : 'w-full'} rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-foreground transition hover:bg-gray-50 disabled:opacity-50`}
                        >
                            {cancelText}
                        </button>

                        {showConfirm && (
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={processing}
                                className={`cursor-pointer flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                                    danger
                                        ? "bg-red-600 hover:bg-red-500"
                                        : "bg-cyan-700 hover:bg-cyan-600"
                                }`}
                            >
                                {processing ? "Memproses..." : confirmText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}