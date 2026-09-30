import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";

export default function AlertDialog({
    open,
    title = "Pemberitahuan",
    message,
    confirmText = "Tutup",
    danger = false,
    onClose,
}) {
    if (!open) return null;

    return (
        <Fragment>
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                    <div
                        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                            danger ? "bg-red-100" : "bg-cyan-100"
                        }`}
                    >
                        <AlertTriangle
                            size={22}
                            className={danger ? "text-red-500" : "text-cyan-600"}
                        />
                    </div>

                    <h2 className="text-center text-lg font-bold text-slate-900">{title}</h2>

                    {message && (
                        <p className="mt-3 text-center text-sm text-slate-600">
                            {message}
                        </p>
                    )}

                    <div className="mt-6 flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                                danger ? "bg-red-600 hover:bg-red-500" : "bg-cyan-700 hover:bg-cyan-600"
                            }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
