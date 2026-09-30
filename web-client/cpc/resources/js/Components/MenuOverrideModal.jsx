import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { X, LayoutGrid, Eye, EyeOff, RotateCcw } from "lucide-react";

/**
 * Daftar semua menu yang ada di sidebar.
 * menu_key HARUS konsisten dengan MENU_ROUTE_MAP di CheckMenuAccess.php dan Sidebar.jsx
 */
const ALL_MENUS = [
    {
        group: "Menu Utama",
        items: [
            { key: "dashboard", label: "Dashboard" },
            { key: "unit.index", label: "Mengelola Unit" },
            { key: "gudang.index", label: "Log Gudang" },
            { key: "progress.index", label: "Update Progress" },
            { key: "standar.index", label: "Standar Progress" },
            { key: "material.index", label: "Master Material" },
            { key: "users.index", label: "User & Role" },
        ],
    },
    {
        group: "Menu Keuangan",
        items: [
            { key: "finance.kartu-material-unit", label: "Kartu Material Unit" },
            { key: "finance.hpp-per-unit", label: "HPP per Unit" },
            { key: "finance.akun-referensi", label: "Akun Referensi" },
            { key: "finance.kas-masuk", label: "Kas Masuk" },
            { key: "finance.kas-keluar", label: "Kas Keluar" },
            { key: "finance.spj-otomatis", label: "Laporan Keuangan" },
        ],
    },
];

/**
 * state tiap menu:
 *   "default" → ikuti role (tidak ada override)
 *   "show"    → paksa tampilkan (visible=true)
 *   "hide"    → paksa sembunyikan (visible=false)
 */
function buildInitialState(menuOverrides) {
    const map = {};
    (menuOverrides ?? []).forEach(({ menu_key, visible }) => {
        map[menu_key] = visible ? "show" : "hide";
    });
    return map;
}

export default function MenuOverrideModal({ open, user, onClose }) {
    const [states, setStates] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open && user) {
            setStates(buildInitialState(user.menuOverrides ?? []));
        }
    }, [open, user]);

    if (!open || !user) return null;

    const toggle = (key, nextState) => {
        setStates((prev) => {
            const copy = { ...prev };
            if (nextState === 'default') {
                // remove key entirely so we only keep actual overrides in state
                delete copy[key];
            } else {
                copy[key] = nextState;
            }
            return copy;
        });
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);

        // Hanya kirim yang bukan "default"
        const overrides = Object.entries(states)
            .filter(([, s]) => s !== "default")
            .map(([menu_key, s]) => ({
                menu_key,
                visible: s === "show",
            }));

        router.post(
            route("users.menu-override.update", user.id),
            { overrides },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const countOverrides = Object.keys(states).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <LayoutGrid size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold leading-tight">
                                Atur Akses Menu
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {user.nama}{" "}
                                <span className="font-semibold text-foreground">
                                    ({user.role})
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                        Default (dari role)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Paksa Tampilkan
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                        Paksa Sembunyikan
                    </span>
                </div>

                {/* Menu List */}
                <form onSubmit={submit} className="flex flex-col">
                    <div className="max-h-[55vh] overflow-y-auto p-5 space-y-5">
                        {ALL_MENUS.map((group) => (
                            <div key={group.group}>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {group.group}
                                </p>
                                <div className="space-y-1.5">
                                    {group.items.map((menu) => {
                                        const current = states[menu.key] ?? "default";
                                        return (
                                            <div
                                                key={menu.key}
                                                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                                                    current === "show"
                                                        ? "border-emerald-200 bg-emerald-50"
                                                        : current === "hide"
                                                          ? "border-red-200 bg-red-50"
                                                          : "border-border bg-white hover:bg-secondary/40"
                                                }`}
                                            >
                                                <span
                                                    className={`text-sm font-medium ${
                                                        current === "show"
                                                            ? "text-emerald-700"
                                                            : current === "hide"
                                                              ? "text-red-600 line-through"
                                                              : "text-foreground"
                                                    }`}
                                                >
                                                    {menu.label}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {/* Tombol Default */}
                                                    <button
                                                        type="button"
                                                        title="Default (ikuti role)"
                                                        onClick={() =>
                                                            toggle(menu.key, "default")
                                                        }
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                                                            current === "default"
                                                                ? "border-slate-400 bg-slate-200 text-slate-700"
                                                                : "border-border text-muted-foreground hover:bg-secondary"
                                                        }`}
                                                    >
                                                        <RotateCcw size={12} />
                                                    </button>

                                                    {/* Tombol Tampilkan */}
                                                    <button
                                                        type="button"
                                                        title="Paksa tampilkan"
                                                        onClick={() =>
                                                            toggle(menu.key, "show")
                                                        }
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                                                            current === "show"
                                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                                : "border-border text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
                                                        }`}
                                                    >
                                                        <Eye size={12} />
                                                    </button>

                                                    {/* Tombol Sembunyikan */}
                                                    <button
                                                        type="button"
                                                        title="Paksa sembunyikan"
                                                        onClick={() =>
                                                            toggle(menu.key, "hide")
                                                        }
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                                                            current === "hide"
                                                                ? "border-red-500 bg-red-500 text-white"
                                                                : "border-border text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                        }`}
                                                    >
                                                        <EyeOff size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border p-5">
                        <p className="text-xs text-muted-foreground">
                            {countOverrides > 0 ? (
                                <span className="font-semibold text-primary">
                                    {countOverrides} menu di-override
                                </span>
                            ) : (
                                "Semua menu mengikuti default role"
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-secondary"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {processing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
