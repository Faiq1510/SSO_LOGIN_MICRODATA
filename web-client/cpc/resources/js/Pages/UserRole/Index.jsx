import { useState, useEffect, useMemo, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import ConfirmDialog from "@/Components/ConfirmDialog";
import {
    UserPlus,
    Pencil,
    Trash2,
    KeyRound,
    ShieldCheck,
    Eye,
    LayoutGrid,
    Search,
} from "lucide-react";
import UserFormModal from "@/Components/UserFormModal";
import MenuOverrideModal from "@/Components/MenuOverrideModal";

function initials(name) {
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function RoleBadge({ role }) {
    const map = {
        "Super Admin": {
            cls: "bg-amber-50 text-amber-700 ring-amber-200",
            icon: <KeyRound size={12} />,
        },
        Admin: {
            cls: "bg-sky-50 text-sky-700 ring-sky-200",
            icon: <ShieldCheck size={12} />,
        },
        Owner: {
            cls: "bg-violet-50 text-violet-700 ring-violet-200",
            icon: <Eye size={12} />,
        },
    };
    const r = map[role] ?? {
        cls: "bg-slate-100 text-slate-600 ring-slate-200",
        icon: null,
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${r.cls}`}
        >
            {r.icon}
            {role}
        </span>
    );
}

function StatusToggle({ user }) {
    const [enabled, setEnabled] = useState(user.isActive);

    // Sync ketika data user di-refresh oleh Inertia (misalnya setelah edit)
    useEffect(() => {
        setEnabled(user.isActive);
    }, [user.isActive]);

    const handleToggle = () => {
        router.patch(
            route("users.toggle", user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEnabled(!enabled);
                },
            },
        );
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition ${
                enabled ? "bg-emerald-500" : "bg-slate-300"
            }`}
        >
            <span
                className={`cursor-pointer inline-block h-5.5 w-5.5 transform rounded-full bg-white transition ${
                    enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
        </button>
    );
}

export default function Index({ users, roles, filters }) {
    const { auth, flash, errors } = usePage().props;
    const currentUserId = auth.user.id;
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? "");
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? "");
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? "");
    const [orderedIds, setOrderedIds] = useState(() => users.map((u) => u.id));
    const filterKeyRef = useRef(`${roleFilter}|${statusFilter}|${searchTerm}`);
    // Signature ini sengaja TIDAK melibatkan is_active, supaya toggle status
    // tidak memicu re-sort. Hanya id & role yang dipantau (edit role, tambah/hapus user).
    const usersSignature = useMemo(
        () => users.map((u) => `${u.id}:${u.role}`).join("|"),
        [users],
    );
    const signatureRef = useRef(usersSignature);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [menuOverrideTarget, setMenuOverrideTarget] = useState(null);

    const openCreate = () => {
        setModalMode("create");
        setSelectedUser(null);
        setModalOpen(true);
    };

    // Urutan tampilan di-refresh kalau: filter diganti, ATAU ada perubahan
    // yang mempengaruhi posisi selain status (role berubah, user baru/dihapus).
    // Toggle status TIDAK memicu re-sort — posisi baru berubah setelah reload.
    useEffect(() => {
        const filterKey = `${roleFilter}|${statusFilter}|${searchTerm}`;
        const filterChanged = filterKey !== filterKeyRef.current;
        const rolesChanged = usersSignature !== signatureRef.current;

        if (filterChanged || rolesChanged) {
            filterKeyRef.current = filterKey;
            signatureRef.current = usersSignature;
            setOrderedIds(users.map((u) => u.id));
        }
    }, [roleFilter, statusFilter, searchTerm, usersSignature, users]);

    // Susun data terbaru (status, dsb) mengikuti urutan yang sudah dibekukan.
    const displayedUsers = useMemo(() => {
        const byId = new Map(users.map((u) => [u.id, u]));
        const inOrder = orderedIds.map((id) => byId.get(id)).filter(Boolean);
        const newOnes = users.filter((u) => !orderedIds.includes(u.id));
        return [...inOrder, ...newOnes];
    }, [orderedIds, users]);

    const applyFilters = (nextRole, nextStatus, nextSearch) => {
        router.get(
            route("users.index"),
            {
                role: nextRole || undefined,
                status: nextStatus || undefined,
                search: nextSearch || undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const handleRoleFilterChange = (e) => {
        const value = e.target.value;
        setRoleFilter(value);
        applyFilters(value, statusFilter, searchTerm);
    };

    const handleStatusFilterChange = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        applyFilters(roleFilter, value, searchTerm);
    };

    // Debounce supaya tidak request ke server di setiap ketikan
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm !== (filters?.search ?? "")) {
                applyFilters(roleFilter, statusFilter, searchTerm);
            }
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const openEdit = (user) => {
        setModalMode("edit");
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleDelete = (user) => {
        setDeleteTarget(user);
    };

    const confirmDelete = () => {
        if (!deleteTarget || !deleteTarget.canDelete) {
            setDeleteTarget(null);
            return;
        }

        setDeleting(true);
        router.delete(route("users.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="User & Role Management" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">
                            User & Role Management
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola akun pengguna dan hak akses sistem (Super
                            Admin only).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        <UserPlus size={16} />
                        Tambah User
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}
                {(flash?.error || errors?.general) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {flash?.error ?? errors?.general}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <h2 className="font-bold">
                            Daftar Pengguna ({displayedUsers.length})
                        </h2>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Cari nama, username, email..."
                                    className="rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm font-medium w-64"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={handleRoleFilterChange}
                                className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
                            >
                                <option value="">Semua Role</option>
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    {[
                                        "Nama",
                                        "Username",
                                        "Email",
                                        "Role",
                                        "Status",
                                        "Login Terakhir",
                                        "Aksi",
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
                                {displayedUsers.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="border-t border-border hover:bg-secondary/50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                                    {initials(u.nama)}
                                                </div>
                                                <span className="font-bold">
                                                    {u.nama}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {u.username}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {u.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.id !== currentUserId ? (
                                                <StatusToggle user={u} />
                                            ) : (
                                                <span
                                                    className="text-xs text-muted-foreground/60"
                                                    title="Tidak bisa mengubah status akun sendiri"
                                                ></span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {u.lastLogin}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {u.id !== currentUserId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(u)}
                                                        title="Edit"
                                                        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                ) : (
                                                    <span
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                                        title="Tidak bisa mengedit akun sendiri"
                                                    >
                                                        <Pencil size={15} />
                                                    </span>
                                                )}
                                                {u.id !== currentUserId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMenuOverrideTarget(u)}
                                                        title="Atur visibilitas menu"
                                                        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-violet-600 hover:bg-violet-50 transition-colors"
                                                    >
                                                        <LayoutGrid size={15} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(u)}
                                                    className={`cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors ${u.canDelete ? "text-red-600 hover:bg-red-50" : "text-slate-300 cursor-not-allowed"}`}
                                                    title={
                                                        u.canDelete
                                                            ? "Hapus pengguna"
                                                            : "User ini sudah memiliki referensi, tidak bisa dihapus"
                                                    }
                                                    disabled={!u.canDelete}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {displayedUsers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Belum ada pengguna.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UserFormModal
                open={modalOpen}
                mode={modalMode}
                user={selectedUser}
                roles={roles}
                onClose={() => setModalOpen(false)}
            />

            <MenuOverrideModal
                open={!!menuOverrideTarget}
                user={menuOverrideTarget}
                onClose={() => setMenuOverrideTarget(null)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={
                    deleteTarget?.canDelete
                        ? "Hapus Pengguna Ini?"
                        : "Tidak Bisa Dihapus"
                }
                message={
                    deleteTarget
                        ? deleteTarget.canDelete
                            ? `Akun "${deleteTarget.nama}" (${deleteTarget.email}) akan dihapus permanen dan tidak bisa dikembalikan.`
                            : `Akun "${deleteTarget.nama}" tidak bisa dihapus karena masih memiliki data referensi.`
                        : ""
                }
                confirmText="Ya, Hapus"
                cancelText="Tutup"
                danger={!deleteTarget?.canDelete}
                processing={deleting}
                showConfirm={deleteTarget?.canDelete}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
