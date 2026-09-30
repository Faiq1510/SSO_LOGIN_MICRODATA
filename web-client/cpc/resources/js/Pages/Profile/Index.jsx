import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import UpdatePasswordModal from "@/Components/Profile/UpdatePasswordModal";
import UpdateProfileModal from "@/Components/Profile/UpdateProfileModal";
import {
    Pencil,
    KeyRound,
    LayoutDashboard,
    Building2,
    Boxes,
    ClipboardList,
    TrendingUp,
    Database,
    Users,
    Check,
} from "lucide-react";

export default function Index() {
    const { user } = usePage().props;

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Dibuka lewat setTimeout supaya event klik tombol ini benar-benar
    // selesai diproses dulu sebelum Headless UI Dialog memasang listener
    // "klik di luar". Tanpa ini, klik yang sama yang membuka modal bisa
    // ikut kedeteksi sebagai "klik di luar" dan modal langsung tertutup lagi.
    const openPasswordModal = () => {
        setTimeout(() => setShowPasswordModal(true), 0);
    };

    const openProfileModal = () => {
        setTimeout(() => setShowProfileModal(true), 0);
    };

    const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const permissions = user.permissions ?? [];
    const lastLogin = user.last_login
        ? user.last_login.replace("T", " ").substring(0, 16)
        : "-";

    const menuIcons = {
        dashboard: <LayoutDashboard size={18} />,
        unit: <Building2 size={18} />,
        gudang: <Boxes size={18} />,
        progress: <TrendingUp size={18} />,
        standar: <ClipboardList size={18} />,
        material: <Database size={18} />,
        user: <Users size={18} />,
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profil Saya" />

            <div className="space-y-5">
                {/* ================= HEADER ================= */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                                {initials}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">
                                    {user.name}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    @{user.username}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <span className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                                {user.role}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                    user.is_active === false
                                        ? "border-red-200 bg-red-50 text-red-600"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-600"
                                }`}
                            >
                                {user.is_active === false
                                    ? "Non Aktif"
                                    : "Aktif"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
                        <Stat title="Role" value={user.role} />
                        <Stat
                            title="Hak Akses"
                            value={`${permissions.length} Permission`}
                        />
                        <Stat
                            title="Login Terakhir"
                            value={lastLogin}
                        />
                    </div>
                </div>

                {/* ================= CARD ================= */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="font-bold">Informasi Akun</h2>
                            <button
                                onClick={openProfileModal}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary/50"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                        </div>

                        <div className="space-y-4">
                            <Field label="Nama Lengkap" value={user.name} />
                            <Field label="Username" value={user.username} />
                            <Field label="Email" value={user.email} />
                            <div>
                                <label className="text-xs font-semibold px-1.5 py-1.5 uppercase tracking-wider text-muted-foreground">
                                    Role
                                </label>
                                <div className="mt-1.5 inline-flex rounded-lg border border-border bg-muted px-2 py-1.5 text-sm font-semibold">
                                    {user.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="font-bold">Keamanan</h2>
                            <button
                                onClick={openPasswordModal}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary/50"
                            >
                                <KeyRound size={14} />
                                Ganti Password
                            </button>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                            <div className="rounded-lg bg-muted p-2.5">
                                <KeyRound size={18} className="text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Password
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Password terenkripsi
                                </p>
                            </div>
                            <div className="ml-auto text-lg tracking-[4px] text-muted-foreground">
                                ••••••••
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= PERMISSION ================= */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <h2 className="mb-5 font-bold">Hak Akses</h2>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {permissions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Tidak ada permission.
                            </p>
                        )}

                        {permissions.map((permission) => (
                            <Permission
                                key={permission}
                                icon={menuIcons[permission] ?? <Check size={18} />}
                                text={permission}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <UpdatePasswordModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                user={user}
            />

            <UpdateProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
            />
        </AuthenticatedLayout>
    );
}

function Stat({ title, value }) {
    return (
        <div className="px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-0.5 text-sm font-bold">{value}</p>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </label>
            <div className="mt-1.5 rounded-xl bg-muted px-3 py-2.5 text-sm">
                {value}
            </div>
        </div>
    );
}

function Permission({ icon, text }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3.5">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                {icon}
            </div>
            <span className="text-sm font-medium">{text}</span>
            <Check size={16} className="ml-auto text-emerald-500" />
        </div>
    );
}