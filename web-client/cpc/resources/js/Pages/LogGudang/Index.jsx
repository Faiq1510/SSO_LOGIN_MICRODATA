import { useMemo, useState, useEffect, useRef } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import {
    Plus,
    Edit3,
    Trash2,
    X,
    History,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SectionHeader from "@/Components/SectionHeader";
import TableCard from "@/Components/TableCard";
import SearchBar from "@/Components/SearchBar";
import MaterialSelect from "@/Components/MaterialSelect";
import ConfirmDialog from "@/Components/ConfirmDialog";

function formatRupiah(v) {
    return "Rp " + Number(v ?? 0).toLocaleString("id-ID");
}

const SATUAN_OPTIONS = [
    "Zak",
    "Sak",
    "Rit",
    "M3",
    "Bh",
    "Btg",
    "Kg",
    "Lbr",
    "Ltr",
    "Dus",
    "Set",
    "Kaleng",
    "Roll",
    "Pail",
];

export default function LogGudangIndex({
    masuk,
    keluar,
    materials,
    units,
    stok,
    canEdit,
    tab: initialTab,
    filters,
}) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.roles?.[0] ?? "";

    const [tab, setTab] = useState(initialTab ?? "masuk");
    const [search, setSearch] = useState(filters?.search ?? "");
    const [sortBy, setSortBy] = useState(filters?.sort_by ?? "tanggal");
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? "desc");
    const [perPage, setPerPage] = useState(filters?.per_page ?? 10);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [qtyMode, setQtyMode] = useState("total"); // "total" | "per_unit"
    const [qtyInputRaw, setQtyInputRaw] = useState("");
    const [unitRows, setUnitRows] = useState([""]); // array of unit_id string, default 1 slot kosong

    const [stokQuery, setStokQuery] = useState("");
    const [stokVisible, setStokVisible] = useState(5);
    const [stokSortBy, setStokSortBy] = useState(""); // 'harga' | 'stok' | ''
    const [stokSortDir, setStokSortDir] = useState("desc"); // 'asc' | 'desc'

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Mencegah request router.get saat komponen pertama kali mount
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timer = setTimeout(() => {
            const pageParam = tab === "masuk" ? "masuk_page" : "keluar_page";
            router.get(
                route("gudang.index"),
                {
                    tab,
                    search,
                    sort_by: sortBy,
                    sort_dir: sortDir,
                    per_page: perPage,
                    [pageParam]: 1,
                },
                { preserveState: true, preserveScroll: true, only: [tab] },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [search, sortBy, sortDir, perPage]);

    function openHistory() {
        setHistoryModalOpen(true);
        setLoadingHistory(true);
        fetch(route("log-gudang.history"))
            .then((res) => res.json())
            .then((data) => {
                setHistoryData(data);
                setLoadingHistory(false);
            })
            .catch((err) => {
                console.error(err);
                setLoadingHistory(false);
            });
    }

    function addUnitRow() {
        setUnitRows((prev) => [...prev, ""]);
    }

    function removeUnitRow(index) {
        setUnitRows((prev) => prev.filter((_, i) => i !== index));
    }

    function updateUnitRow(index, value) {
        setUnitRows((prev) => prev.map((v, i) => (i === index ? value : v)));
    }

    const masukForm = useForm({
        tanggal: "",
        supplier: "",
        material_id: "",
        qty: "",
        harga_satuan: "",
        total_harga: "",
        keterangan: "",
    });

    const keluarForm = useForm({
        tanggal: "",
        unit_id: "",
        material_id: "",
        qty: "",
        satuan: "",
        harga: "",
        total: "",
        keterangan: "",
    });

    const form = tab === "masuk" ? masukForm : keluarForm;
    const selectedMaterial = (materials ?? []).find(
        (m) => String(m.id) === String(form.data.material_id),
    );
    const selectedUnitIds = unitRows.filter((id) => id !== "");

    // Log Keluar (tambah, multi-unit): qty yg dikirim ke backend selalu "total barang"
    useEffect(() => {
        if (tab !== "keluar" || editTarget) return;
        const raw = Number(qtyInputRaw) || 0;
        const jumlahUnit = selectedUnitIds.length || 0;
        const totalQty = qtyMode === "total" ? raw : raw * jumlahUnit;
        keluarForm.setData("qty", totalQty);
    }, [tab, editTarget, qtyInputRaw, qtyMode, selectedUnitIds]);

    // Log Keluar: saat material dipilih, harga otomatis ambil dari moving average
    useEffect(() => {
        if (tab !== "keluar") return;
        if (!selectedMaterial) return;

        keluarForm.setData("harga", selectedMaterial.harga_terakhir ?? 0);
        keluarForm.setData("satuan", selectedMaterial.satuan ?? "");
    }, [tab, selectedMaterial?.id]);

    // Total Harga (masuk) otomatis = qty x harga_satuan
    useEffect(() => {
        const qty = Number(masukForm.data.qty) || 0;
        const harga = Number(masukForm.data.harga_satuan) || 0;
        masukForm.setData("total_harga", qty * harga);
    }, [masukForm.data.qty, masukForm.data.harga_satuan]);

    // Total (keluar) otomatis = qty x harga
    useEffect(() => {
        const qty = Number(keluarForm.data.qty) || 0;
        const harga = Number(keluarForm.data.harga) || 0;
        keluarForm.setData("total", qty * harga);
    }, [keluarForm.data.qty, keluarForm.data.harga]);

    // Data diambil langsung dari hasil paginasi server-side
    const paginatedMasuk = masuk?.data ?? [];

    const materialsTersedia = useMemo(() => {
        if (tab !== "keluar") return materials;
        const stokMap = new Map(stok.map((s) => [s.material_id, s.sisa_stok]));
        return materials.filter((m) => (stokMap.get(m.id) ?? 0) > 0);
    }, [materials, stok, tab]);

    const paginatedKeluar = keluar?.data ?? [];

    function gotoPage(jenis, page) {
        const paramName = jenis === "masuk" ? "masuk_page" : "keluar_page";
        router.get(
            route("gudang.index"),
            {
                tab,
                search,
                sort_by: sortBy,
                sort_dir: sortDir,
                per_page: perPage,
                [paramName]: page,
            },
            { preserveState: true, preserveScroll: true, only: [jenis] },
        );
    }

    function goToTab(t) {
        setTab(t);
        const pageParam = t === "masuk" ? "masuk_page" : "keluar_page";
        router.get(
            route("gudang.index"),
            {
                tab: t,
                search,
                sort_by: sortBy,
                sort_dir: sortDir,
                per_page: perPage,
                [pageParam]: 1,
            },
            { preserveState: true, preserveScroll: true, only: [t] },
        );
    }

    function openAdd() {
        setEditTarget(null);
        form.reset();
        setQtyMode("total");
        setQtyInputRaw("");
        setUnitRows([""]);
        setModalOpen(true);
    }

    function openEdit(row) {
        setEditTarget(row);
        setQtyMode("total");
        setQtyInputRaw("");
        setUnitRows([""]);
        if (tab === "masuk") {
            masukForm.setData({
                tanggal: row.tanggal.slice(0, 10),
                supplier: row.supplier,
                material_id: row.material_id,
                qty: row.qty,
                satuan: row.satuan ?? row.material?.satuan ?? "",
                harga_satuan: row.harga_satuan,
                total_harga: row.total_harga,
                keterangan: row.keterangan ?? "",
            });
        } else {
            keluarForm.setData({
                tanggal: row.tanggal.slice(0, 10),
                unit_id: row.unit_id,
                material_id: row.material_id,
                qty: row.qty,
                harga: row.harga,
                total: row.total,
                keterangan: row.keterangan ?? "",
            });
        }
        setModalOpen(true);
    }

    function handleSave(e) {
        e.preventDefault();
        const options = {
            onSuccess: () => setModalOpen(false),
            preserveScroll: true,
        };

        if (tab === "masuk") {
            editTarget
                ? masukForm.put(
                      route("log-gudang.masuk.update", editTarget.id),
                      options,
                  )
                : masukForm.post(route("log-gudang.masuk.store"), options);
        } else if (editTarget) {
            keluarForm.put(
                route("log-gudang.keluar.update", editTarget.id),
                options,
            );
        } else {
            keluarForm.transform((data) => ({
                ...data,
                unit_ids: selectedUnitIds,
            }));
            keluarForm.post(route("log-gudang.keluar.store"), options);
        }
    }

    function handleDelete(row) {
        // Jika row sudah dihapus (soft-deleted oleh SA lain), ini adalah konfirmasi hapus permanen
        setDeleteTarget(row);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);

        if (deleteTarget.deleted_at) {
            // Hapus permanen (force delete) — untuk baris yang sudah di-soft-delete oleh SA lain
            const routeName =
                tab === "masuk"
                    ? "log-gudang.masuk.force-destroy"
                    : "log-gudang.keluar.force-destroy";
            router.delete(route(routeName, deleteTarget.id), {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setDeleteTarget(null);
                },
            });
        } else {
            // Hapus biasa (soft delete)
            const routeName =
                tab === "masuk"
                    ? "log-gudang.masuk.destroy"
                    : "log-gudang.keluar.destroy";
            router.delete(route(routeName, deleteTarget.id), {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setDeleteTarget(null);
                },
            });
        }
    }

    return (
        <AuthenticatedLayout>
            <Head title="Log Transaksi Gudang" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <SectionHeader
                        title="Log Transaksi Gudang"
                        sub="Masuk dari supplier – Keluar ke unit – stok otomatis terbarui."
                    />
                    <div className="flex flex-wrap gap-2">
                        {userRole === "Super Admin" && (
                            <button
                                onClick={openHistory}
                                className="cursor-pointer rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition flex items-center gap-2"
                            >
                                <History size={16} />
                                Riwayat Perubahan
                            </button>
                        )}
                        {["masuk", "keluar"].map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    goToTab(t);
                                    setModalOpen(false);
                                    setDeleteTarget(null);
                                }}
                                className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                                    tab === t
                                        ? "bg-primary text-white"
                                        : "border border-border bg-white"
                                }`}
                            >
                                Log{" "}
                                {t === "masuk" ? "Masuk (In)" : "Keluar (Out)"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
                    {tab === "masuk" ? (
                        <TableCard
                            title="Log Masuk "
                            action={
                                <div className="flex gap-2">
                                    <SearchBar
                                        value={search}
                                        onChange={setSearch}
                                    />
                                    <select
                                        aria-label="Urutkan berdasarkan"
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value="tanggal">Tanggal</option>
                                        <option value="qty">Qty</option>
                                        <option value="total">Total</option>
                                    </select>
                                    <select
                                        aria-label="Arah pengurutan"
                                        value={sortDir}
                                        onChange={(e) =>
                                            setSortDir(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value="desc">
                                            {sortBy === "tanggal"
                                                ? "Terbaru"
                                                : "Terbesar"}
                                        </option>
                                        <option value="asc">
                                            {sortBy === "tanggal"
                                                ? "Terlama"
                                                : "Terkecil"}
                                        </option>
                                    </select>
                                    <select
                                        aria-label="Jumlah data per halaman"
                                        value={perPage}
                                        onChange={(e) =>
                                            setPerPage(Number(e.target.value))
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value={10}>10 / halaman</option>
                                        <option value={25}>25 / halaman</option>
                                        <option value={50}>50 / halaman</option>
                                        <option value={100}>
                                            100 / halaman
                                        </option>
                                    </select>
                                    {canEdit && (
                                        <button
                                            onClick={openAdd}
                                            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus
                                                size={14}
                                                className="inline mr-1"
                                            />{" "}
                                            Tambah
                                        </button>
                                    )}
                                </div>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            {[
                                                "Tanggal",
                                                "Supplier",
                                                "Kode",
                                                "Material",
                                                "Qty",
                                                "Satuan",
                                                "Harga Satuan",
                                                "Total",
                                                "Keterangan",
                                                "",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-4 py-3 text-left font-semibold"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedMasuk.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="border-t border-border hover:bg-secondary/50"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {r.tanggal.slice(0, 10)}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <Highlight
                                                        text={r.supplier}
                                                        query={search}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-bold text-primary">
                                                        <Highlight
                                                            text={
                                                                r.material
                                                                    ?.kode_material
                                                            }
                                                            query={search}
                                                        />
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-xs">
                                                    <Highlight
                                                        text={
                                                            r.material
                                                                ?.nama_material
                                                        }
                                                        query={search}
                                                    />
                                                    {r.deleted_at ? (
                                                        <div className="mt-1 text-[11px] font-semibold text-red-600">
                                                            Dihapus oleh{" "}
                                                            {r.row_status_by ??
                                                                "Admin"}
                                                            {r.row_status_at &&
                                                                ` pada ${r.row_status_at}`}
                                                        </div>
                                                    ) : r.row_status ===
                                                      "edited" ? (
                                                        <div className="mt-1 text-[11px] font-semibold text-amber-700">
                                                            Diedit oleh{" "}
                                                            {r.row_status_by ??
                                                                "Admin"}
                                                            {r.row_status_at &&
                                                                ` pada ${r.row_status_at}`}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-bold">
                                                    {Number(
                                                        r.qty,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {r.satuan ??
                                                        r.material?.satuan}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {formatRupiah(
                                                        r.harga_satuan,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {formatRupiah(
                                                        r.total_harga,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {r.keterangan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {canEdit &&
                                                        !r.deleted_at && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            r,
                                                                        )
                                                                    }
                                                                    title="Edit"
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                                >
                                                                    <Edit3
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            r,
                                                                        )
                                                                    }
                                                                    title="Hapus"
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    {/* Tombol hapus permanen — hanya untuk SA lain yang lihat baris terhapus */}
                                                    {r.deleted_at &&
                                                        userRole ===
                                                            "Super Admin" && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            r,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 transition"
                                                                    title="Konfirmasi hapus permanen"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    Hapus
                                                                    Permanen
                                                                </button>
                                                            </div>
                                                        )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                                <span>
                                    Menampilkan {masuk?.from ?? 0}–
                                    {masuk?.to ?? 0} dari {masuk?.total ?? 0}{" "}
                                    log
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Halaman sebelumnya"
                                        onClick={() =>
                                            gotoPage(
                                                "masuk",
                                                masuk?.current_page - 1,
                                            )
                                        }
                                        disabled={masuk?.current_page <= 1}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="font-semibold text-foreground">
                                        Halaman {masuk?.current_page} /{" "}
                                        {masuk?.last_page}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Halaman berikutnya"
                                        onClick={() =>
                                            gotoPage(
                                                "masuk",
                                                masuk?.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            masuk?.current_page >=
                                            masuk?.last_page
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </TableCard>
                    ) : (
                        <TableCard
                            title="Log Keluar "
                            action={
                                <div className="flex gap-2">
                                    <SearchBar
                                        value={search}
                                        onChange={setSearch}
                                    />
                                    <select
                                        aria-label="Urutkan berdasarkan"
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value="tanggal">Tanggal</option>
                                        <option value="qty">Qty</option>
                                        <option value="total">Total</option>
                                    </select>
                                    <select
                                        aria-label="Arah pengurutan"
                                        value={sortDir}
                                        onChange={(e) =>
                                            setSortDir(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value="desc">
                                            {sortBy === "tanggal"
                                                ? "Terbaru"
                                                : "Terbesar"}
                                        </option>
                                        <option value="asc">
                                            {sortBy === "tanggal"
                                                ? "Terlama"
                                                : "Terkecil"}
                                        </option>
                                    </select>
                                    <select
                                        aria-label="Jumlah data per halaman"
                                        value={perPage}
                                        onChange={(e) =>
                                            setPerPage(Number(e.target.value))
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold outline-none"
                                    >
                                        <option value={10}>10 / halaman</option>
                                        <option value={25}>25 / halaman</option>
                                        <option value={50}>50 / halaman</option>
                                        <option value={100}>
                                            100 / halaman
                                        </option>
                                    </select>
                                    {canEdit && (
                                        <button
                                            onClick={openAdd}
                                            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
                                        >
                                            <Plus
                                                size={14}
                                                className="inline"
                                            />{" "}
                                            Tambah
                                        </button>
                                    )}
                                </div>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            {[
                                                "Tanggal",
                                                "Unit",
                                                "Kode",
                                                "Material",
                                                "Qty",
                                                "Satuan",
                                                "Harga satuan",
                                                "Total",
                                                "Keterangan",
                                                "",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-4 py-3 text-left font-semibold"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedKeluar.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="border-t border-border hover:bg-secondary/50"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {r.tanggal.slice(0, 10)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 font-mono text-xs font-bold text-sky-700">
                                                            <Highlight
                                                                text={
                                                                    r.unit
                                                                        ?.nama_unit
                                                                }
                                                                query={search}
                                                            />
                                                        </span>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Zona {r.unit?.zona}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-bold text-primary">
                                                        <Highlight
                                                            text={
                                                                r.material
                                                                    ?.kode_material
                                                            }
                                                            query={search}
                                                        />
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-xs">
                                                    <Highlight
                                                        text={
                                                            r.material
                                                                ?.nama_material
                                                        }
                                                        query={search}
                                                    />
                                                    {r.deleted_at ? (
                                                        <div className="mt-1 text-[11px] font-semibold text-red-600">
                                                            Dihapus oleh{" "}
                                                            {r.row_status_by ??
                                                                "Admin"}
                                                            {r.row_status_at &&
                                                                ` pada ${r.row_status_at}`}
                                                        </div>
                                                    ) : r.row_status ===
                                                      "edited" ? (
                                                        <div className="mt-1 text-[11px] font-semibold text-amber-700">
                                                            Diedit oleh{" "}
                                                            {r.row_status_by ??
                                                                "Admin"}
                                                            {r.row_status_at &&
                                                                ` pada ${r.row_status_at}`}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-bold">
                                                    {Number(
                                                        r.qty,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {r.material?.satuan}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {formatRupiah(r.harga)}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {formatRupiah(r.total)}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {r.keterangan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {canEdit &&
                                                        !r.deleted_at && (
                                                            <div className="flex gap-2 text-muted-foreground">
                                                                <Edit3
                                                                    size={14}
                                                                    className="cursor-pointer hover:text-primary"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            r,
                                                                        )
                                                                    }
                                                                />
                                                                <Trash2
                                                                    size={14}
                                                                    className="cursor-pointer hover:text-red-500"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            r,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    {/* Tombol hapus permanen — hanya untuk SA lain yang lihat baris terhapus */}
                                                    {r.deleted_at &&
                                                        userRole ===
                                                            "Super Admin" && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            r,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 transition"
                                                                    title="Konfirmasi hapus permanen"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    Hapus
                                                                    Permanen
                                                                </button>
                                                            </div>
                                                        )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                                <span>
                                    Menampilkan {keluar?.from ?? 0}-
                                    {keluar?.to ?? 0} dari {keluar?.total ?? 0}{" "}
                                    log
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            gotoPage(
                                                "keluar",
                                                keluar?.current_page - 1,
                                            )
                                        }
                                        disabled={keluar?.current_page <= 1}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="font-semibold text-foreground">
                                        Halaman {keluar?.current_page} /{" "}
                                        {keluar?.last_page}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            gotoPage(
                                                "keluar",
                                                keluar?.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            keluar?.current_page >=
                                            keluar?.last_page
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </TableCard>
                    )}

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">Stok Real-time</p>
                            <div className="relative">
                                <Search
                                    size={13}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="text"
                                    placeholder="Cari material..."
                                    value={stokQuery}
                                    onChange={(e) => {
                                        setStokQuery(e.target.value);
                                        setStokVisible(5);
                                    }}
                                    className="w-40 rounded-lg border border-border bg-white py-1 pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <select
                                aria-label="Urutkan stok berdasarkan"
                                value={stokSortBy}
                                onChange={(e) => setStokSortBy(e.target.value)}
                                className="rounded-lg border border-border bg-white py-1 pl-3 pr-2 text-xs focus:outline-none"
                            >
                                <option value="">Urutkan</option>
                                <option value="harga">Harga</option>
                                <option value="stok">Stok</option>
                            </select>
                            <select
                                aria-label="Arah pengurutan stok"
                                value={stokSortDir}
                                onChange={(e) => setStokSortDir(e.target.value)}
                                className="rounded-lg border border-border bg-white py-1 pl-3 pr-2 text-xs focus:outline-none"
                            >
                                <option value="desc">Terbesar</option>
                                <option value="asc">Terkecil</option>
                            </select>

                            <span className="text-xs text-muted-foreground ml-2">
                                {stokSortBy === "harga" &&
                                    (stokSortDir === "desc"
                                        ? "(besar -> kecil)"
                                        : "(kecil -> besar)")}
                                {stokSortBy === "stok" &&
                                    (stokSortDir === "desc"
                                        ? "(banyak -> sedikit)"
                                        : "(sedikit -> banyak)")}
                            </span>
                        </div>

                        {stok
                            .filter((s) =>
                                s.nama
                                    .toLowerCase()
                                    .includes(stokQuery.toLowerCase()),
                            )
                            .sort((a, b) => {
                                if (!stokSortBy) return 0;
                                const dir = stokSortDir === "asc" ? 1 : -1;
                                if (stokSortBy === "harga") {
                                    return (
                                        (Number(
                                            a.nilai_rupiah ??
                                                a.harga_satuan ??
                                                0,
                                        ) -
                                            Number(
                                                b.nilai_rupiah ??
                                                    b.harga_satuan ??
                                                    0,
                                            )) *
                                        dir
                                    );
                                }
                                if (stokSortBy === "stok") {
                                    return (
                                        (Number(a.sisa_stok ?? 0) -
                                            Number(b.sisa_stok ?? 0)) *
                                        dir
                                    );
                                }
                                return 0;
                            })
                            .slice(0, stokVisible)
                            .map((s) => {
                                const pct =
                                    s.total_masuk > 0
                                        ? Math.min(
                                              100,
                                              (s.sisa_stok / s.total_masuk) *
                                                  100,
                                          )
                                        : 0;
                                const barColor = s.is_warning
                                    ? "bg-red-500"
                                    : pct > 50
                                      ? "bg-emerald-500"
                                      : "bg-amber-400";
                                return (
                                    <div
                                        key={s.material_id}
                                        className="rounded-xl border border-border bg-white p-3"
                                    >
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold">
                                                {s.nama}
                                            </span>
                                            <span className="font-mono text-xs font-bold">
                                                {s.sisa_stok.toLocaleString(
                                                    "id-ID",
                                                )}{" "}
                                                {s.satuan}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                                            {pct > 0 && (
                                                <div
                                                    className={`h-1.5 rounded-full ${barColor}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            )}
                                        </div>
                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                            {formatRupiah(s.nilai_rupiah)}
                                        </div>
                                    </div>
                                );
                            })}

                        <div className="flex flex-col gap-2 sm:flex-row">
                            {stok.filter((s) =>
                                s.nama
                                    .toLowerCase()
                                    .includes(stokQuery.toLowerCase()),
                            ).length > stokVisible && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(route("stok.index"))
                                    }
                                    className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                                >
                                    Tampilkan Semua
                                </button>
                            )}
                            {stokVisible > 5 && (
                                <button
                                    type="button"
                                    onClick={() => setStokVisible(5)}
                                    className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                                >
                                    Sembunyikan
                                </button>
                            )}
                        </div>

                        {stok.filter((s) =>
                            s.nama
                                .toLowerCase()
                                .includes(stokQuery.toLowerCase()),
                        ).length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                {stokQuery
                                    ? `Tidak ada hasil untuk "${stokQuery}".`
                                    : "Belum ada data stok gudang."}
                            </p>
                        )}
                    </div>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <form
                            onSubmit={handleSave}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">
                                    {editTarget ? "Edit" : "Tambah"} Log{" "}
                                    {tab === "masuk" ? "Masuk" : "Keluar"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-5 space-y-4">
                                <Field
                                    label="Tanggal"
                                    type="date"
                                    value={form.data.tanggal}
                                    onChange={(v) => form.setData("tanggal", v)}
                                    error={form.errors.tanggal}
                                />

                                {tab === "masuk" && (
                                    <Field
                                        label="Supplier"
                                        value={masukForm.data.supplier}
                                        onChange={(v) =>
                                            masukForm.setData("supplier", v)
                                        }
                                        placeholder="Nama supplier"
                                        error={masukForm.errors.supplier}
                                    />
                                )}

                                {tab === "keluar" && editTarget && (
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Unit
                                        </span>
                                        <select
                                            value={keluarForm.data.unit_id}
                                            onChange={(e) =>
                                                keluarForm.setData(
                                                    "unit_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                        >
                                            <option value="">
                                                -- pilih unit --
                                            </option>
                                            {units.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.nama_unit} - Zona{" "}
                                                    {u.zona}
                                                </option>
                                            ))}
                                        </select>
                                        {keluarForm.errors.unit_id && (
                                            <span className="mt-1 block text-xs text-red-500">
                                                {keluarForm.errors.unit_id}
                                            </span>
                                        )}
                                    </label>
                                )}

                                {tab === "keluar" && !editTarget && (
                                    <div>
                                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Unit Tujuan
                                        </span>
                                        <div className="space-y-2">
                                            {unitRows.map((unitId, index) => {
                                                const usedElsewhere =
                                                    unitRows.filter(
                                                        (_, i) => i !== index,
                                                    );
                                                const availableUnits =
                                                    units.filter(
                                                        (u) =>
                                                            !usedElsewhere.includes(
                                                                String(u.id),
                                                            ),
                                                    );
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex gap-2"
                                                    >
                                                        <select
                                                            value={unitId}
                                                            onChange={(e) =>
                                                                updateUnitRow(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="flex-1 rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                                        >
                                                            <option value="">
                                                                -- pilih unit --
                                                            </option>
                                                            {availableUnits.map(
                                                                (u) => (
                                                                    <option
                                                                        key={
                                                                            u.id
                                                                        }
                                                                        value={String(
                                                                            u.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            u.nama_unit
                                                                        }{" "}
                                                                        - Zona{" "}
                                                                        {u.zona}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        {unitRows.length >
                                                            1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeUnitRow(
                                                                        index,
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded-xl border border-border px-3 text-muted-foreground hover:text-red-500"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {unitRows.length < units.length && (
                                            <button
                                                type="button"
                                                onClick={addUnitRow}
                                                className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                            >
                                                <Plus size={12} /> Tambah Unit
                                            </button>
                                        )}
                                        {keluarForm.errors.unit_ids && (
                                            <span className="mt-1 block text-xs text-red-500">
                                                {keluarForm.errors.unit_ids}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <MaterialSelect
                                    materials={materialsTersedia}
                                    value={form.data.material_id}
                                    onChange={(id) =>
                                        form.setData("material_id", id)
                                    }
                                    error={form.errors.material_id}
                                />

                                <div>
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Satuan
                                    </span>

                                    {tab === "keluar" ? (
                                        <>
                                            <select
                                                value={keluarForm.data.satuan}
                                                onChange={(e) =>
                                                    keluarForm.setData(
                                                        "satuan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="">
                                                    — pilih satuan —
                                                </option>
                                                {SATUAN_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                            {keluarForm.errors.satuan && (
                                                <span className="mt-1 block text-xs text-red-500">
                                                    {keluarForm.errors.satuan}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            value={
                                                selectedMaterial?.satuan ?? ""
                                            }
                                            readOnly
                                            placeholder="Otomatis"
                                            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-muted-foreground"
                                        />
                                    )}
                                </div>

                                {tab === "keluar" && !editTarget && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Input Berdasarkan
                                        </span>
                                        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                                            <input
                                                type="radio"
                                                checked={qtyMode === "total"}
                                                onChange={() =>
                                                    setQtyMode("total")
                                                }
                                            />
                                            Total Barang
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                                            <input
                                                type="radio"
                                                checked={qtyMode === "per_unit"}
                                                onChange={() =>
                                                    setQtyMode("per_unit")
                                                }
                                            />
                                            Per Unit
                                        </label>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Field
                                            label={
                                                tab === "keluar" && !editTarget
                                                    ? qtyMode === "total"
                                                        ? `Total Barang${selectedMaterial?.satuan ? ` (${selectedMaterial.satuan})` : ""}`
                                                        : `Qty per Unit${selectedMaterial?.satuan ? ` (${selectedMaterial.satuan})` : ""}`
                                                    : `Qty${selectedMaterial?.satuan ? ` (${selectedMaterial.satuan})` : ""}`
                                            }
                                            type="number"
                                            value={
                                                tab === "keluar" && !editTarget
                                                    ? qtyInputRaw
                                                    : form.data.qty
                                            }
                                            onChange={
                                                tab === "keluar" && !editTarget
                                                    ? setQtyInputRaw
                                                    : (v) =>
                                                          form.setData("qty", v)
                                            }
                                            error={form.errors.qty}
                                        />
                                        {tab === "keluar" &&
                                            !editTarget &&
                                            selectedUnitIds.length > 0 &&
                                            Number(qtyInputRaw) > 0 && (
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    {qtyMode === "total"
                                                        ? `~= ${(
                                                              Number(
                                                                  qtyInputRaw,
                                                              ) /
                                                              selectedUnitIds.length
                                                          ).toLocaleString(
                                                              "id-ID",
                                                          )} per unit`
                                                        : `Total: ${(
                                                              Number(
                                                                  qtyInputRaw,
                                                              ) *
                                                              selectedUnitIds.length
                                                          ).toLocaleString(
                                                              "id-ID",
                                                          )}`}
                                                </p>
                                            )}
                                    </div>

                                    {tab === "masuk" ? (
                                        <CurrencyField
                                            label="Harga Satuan"
                                            value={masukForm.data.harga_satuan}
                                            onChange={(v) =>
                                                masukForm.setData(
                                                    "harga_satuan",
                                                    v,
                                                )
                                            }
                                            error={
                                                masukForm.errors.harga_satuan
                                            }
                                        />
                                    ) : (
                                        <CurrencyField
                                            label="Harga"
                                            value={keluarForm.data.harga}
                                            error={keluarForm.errors.harga}
                                            readOnly
                                        />
                                    )}
                                </div>

                                {tab === "masuk" ? (
                                    <CurrencyField
                                        label="Total Harga"
                                        value={masukForm.data.total_harga}
                                        error={masukForm.errors.total_harga}
                                        readOnly
                                    />
                                ) : (
                                    <CurrencyField
                                        label="Total"
                                        value={keluarForm.data.total}
                                        error={keluarForm.errors.total}
                                        readOnly
                                    />
                                )}

                                <Field
                                    label="Keterangan"
                                    value={form.data.keterangan}
                                    onChange={(v) =>
                                        form.setData("keterangan", v)
                                    }
                                    placeholder="opsional"
                                    error={form.errors.keterangan}
                                />
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        (tab === "keluar" &&
                                            !editTarget &&
                                            selectedUnitIds.length === 0)
                                    }
                                    className="cursor-pointer flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                >
                                    {editTarget ? "Simpan Perubahan" : "Tambah"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <ConfirmDialog
                    open={!!deleteTarget}
                    title={
                        deleteTarget?.deleted_at
                            ? "Hapus permanen data ini?"
                            : "Hapus data log gudang?"
                    }
                    message={
                        deleteTarget
                            ? deleteTarget.deleted_at
                                ? `Data ${tab === "masuk" ? "masuk" : "keluar"} untuk ${deleteTarget?.material?.nama_material ?? "material ini"} sudah dihapus sebelumnya. Apakah Anda ingin menghapusnya secara permanen? Tindakan ini tidak bisa dibatalkan.`
                                : `Data ${tab === "masuk" ? "masuk" : "keluar"} untuk ${deleteTarget?.material?.nama_material ?? "material ini"} akan dihapus.`
                            : ""
                    }
                    confirmText={
                        deleteTarget?.deleted_at
                            ? "Ya, Hapus Permanen"
                            : "Ya, Hapus"
                    }
                    cancelText="Batal"
                    danger
                    processing={deleting}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />

                {historyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                        <History
                                            className="text-primary"
                                            size={20}
                                        />
                                        Riwayat Perubahan Log Gudang
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHistoryModalOpen(false)}
                                    className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4 min-h-[300px]">
                                {loadingHistory ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <span className="mt-2 text-sm">
                                            Memuat data riwayat...
                                        </span>
                                    </div>
                                ) : historyData.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground text-sm">
                                        Belum ada riwayat perubahan yang
                                        tercatat.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {historyData.map((item) => {
                                            const actionColors = {
                                                create: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                update: "bg-amber-50 text-amber-700 border-amber-200",
                                                delete: "bg-red-50 text-red-700 border-red-200",
                                            };
                                            const actionLabels = {
                                                create: "TAMBAH",
                                                update: "EDIT",
                                                delete: "HAPUS",
                                            };
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="border border-border rounded-xl p-4 space-y-2 bg-card hover:shadow-sm transition"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm text-foreground">
                                                                {item.user_name}
                                                            </span>
                                                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                                                {item.user_role}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                            {item.created_at}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${actionColors[item.action] || "bg-gray-50"}`}
                                                        >
                                                            {actionLabels[
                                                                item.action
                                                            ] ||
                                                                item.action.toUpperCase()}
                                                        </span>
                                                        <p className="text-xs font-semibold text-gray-800">
                                                            {item.summary}
                                                        </p>
                                                    </div>

                                                    {item.details &&
                                                        item.details.length >
                                                            0 && (
                                                            <div className="bg-muted/40 rounded-lg p-3 border border-border/50">
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {item.details.map(
                                                                        (
                                                                            detail,
                                                                            idx,
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="text-xs text-muted-foreground"
                                                                            >
                                                                                {
                                                                                    detail
                                                                                }
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setHistoryModalOpen(false)}
                                    className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm bg-white hover:bg-gray-50 transition"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, value, onChange, placeholder, error, type = "text" }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (
                        type === "number" &&
                        ["-", "+", "e", "E"].includes(e.key)
                    ) {
                        e.preventDefault();
                    }
                }}
                placeholder={placeholder}
                step={type === "number" ? "any" : undefined}
                min={type === "number" ? 0 : undefined}
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {error && (
                <span className="mt-1 block text-xs text-red-500">{error}</span>
            )}
        </label>
    );
}

function CurrencyField({ label, value, onChange, error, readOnly = false }) {
    function handleChange(e) {
        if (readOnly) return;
        const digits = e.target.value.replace(/\D/g, "");
        onChange?.(digits);
    }

    const displayValue =
        value === "" || value === null || value === undefined
            ? ""
            : Number(value).toLocaleString("id-ID");

    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label} (Rp)
            </span>
            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    readOnly={readOnly}
                    placeholder="0"
                    className={`w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        readOnly ? "bg-secondary" : "bg-input-background"
                    }`}
                />
            </div>
            {error && (
                <span className="mt-1 block text-xs text-red-500">{error}</span>
            )}
        </label>
    );
}

function Highlight({ text, query }) {
    if (!query || !text) return <>{text}</>;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${safeQuery})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark
                        key={i}
                        className="rounded bg-yellow-200 px-0.5 text-inherit"
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
