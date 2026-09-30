import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState, useEffect } from "react";

function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>;

    // escape karakter regex spesial biar gak error kalau user ngetik simbol seperti ( ) . * dll
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark
                        key={i}
                        className="bg-yellow-200 text-inherit rounded px-0.5"
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
}

export default function StokGudangIndex() {
    const { stok, filters } = usePage().props;
    const [q, setQ] = useState(filters.q || "");
    const [sortBy, setSortBy] = useState(filters.sortBy || "nama");
    const [sortDir, setSortDir] = useState(filters.sortDir || "asc");
    const [perPage, setPerPage] = useState(filters.perPage || 15);

    const page = stok.current_page;
    const lastPage = stok.last_page;

    function applyFilters(params = {}) {
        const payload = { q, sortBy, sortDir, perPage, page: 1, ...params };
        router.get(route("stok.index"), payload, {
            replace: true,
            preserveScroll: true,
            preserveState: true,
            only: ["stok", "filters"],
        });
    }

    function gotoPage(p) {
        applyFilters({ page: p });
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route("stok.index"),
                { q, sortBy, sortDir, perPage, page: 1 },
                {
                    replace: true,
                    preserveScroll: true,
                    preserveState: true, // <-- ini kuncinya, biar komponen (dan fokus input) gak di-remount
                    only: ["stok", "filters"], // opsional tapi disarankan: cuma fetch data yg berubah, lebih cepat
                },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [q]);

    return (
        <AuthenticatedLayout>
            <Head title="Stok Gudang" />

            <div className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Stok Gudang</h1>
                        <p className="text-sm text-muted-foreground">
                            Daftar stok material di gudang.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ChevronLeft size={16} />
                        Kembali
                    </button>
                </div>

                <div className="rounded-2xl border border-border bg-white p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Cari kode atau nama..."
                                    className="rounded-xl border border-border px-3 py-2 text-sm"
                                />
                                <Search
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    applyFilters({ sortBy: e.target.value });
                                }}
                                className="rounded-xl border border-border px-3 py-2 text-sm"
                            >
                                <option value="nama">Nama</option>
                                <option value="stok">Stok</option>
                            </select>
                            <select
                                value={sortDir}
                                onChange={(e) => {
                                    setSortDir(e.target.value);
                                    applyFilters({ sortDir: e.target.value });
                                }}
                                className="rounded-xl border border-border px-3 py-2 text-sm"
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    applyFilters({
                                        perPage: Number(e.target.value),
                                    });
                                }}
                                className="rounded-xl border border-border px-3 py-2 text-sm"
                            >
                                <option value={10}>10 / halaman</option>
                                <option value={15}>15 / halaman</option>
                                <option value={25}>25 / halaman</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {stok.data.map((s) => (
                            <div
                                key={s.material_id}
                                className="rounded-xl border border-border bg-white p-3"
                            >
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold">
                                        <HighlightText
                                            text={s.nama}
                                            query={q}
                                        />{" "}
                                        <span className="text-xs text-muted-foreground ml-2">
                                            <HighlightText
                                                text={s.kode}
                                                query={q}
                                            />
                                        </span>
                                    </span>
                                    <span className="font-mono text-xs font-bold text-slate-700">
                                        {Number(s.sisa_stok).toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        {s.satuan}
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                                    {s.total_masuk > 0 && (
                                        <div
                                            className={`h-1.5 rounded-full ${s.is_warning ? "bg-red-500" : s.sisa_stok / s.total_masuk > 0.5 ? "bg-emerald-500" : "bg-amber-400"}`}
                                            style={{
                                                width: `${Math.max(0, Math.min(100, Math.round((s.sisa_stok / s.total_masuk) * 100)))}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground">
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    }).format(s.nilai_rupiah || 0)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Halaman {page} dari {lastPage}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => gotoPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="rounded-lg border border-border px-3 py-1"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() =>
                                    gotoPage(Math.min(lastPage, page + 1))
                                }
                                disabled={page >= lastPage}
                                className="rounded-lg border border-border px-3 py-1"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
