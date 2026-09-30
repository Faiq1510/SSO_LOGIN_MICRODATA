import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";

export default function UserFormModal({ open, mode, user, roles, onClose }) {
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        role: roles[0] ?? "",
        status: "Active",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (mode === "edit" && user) {
            setForm({
                name: user.nama,
                username: user.username,
                email: user.email,
                password: "",
                role: user.role,
                status: user.isActive ? "Active" : "Non-active",
            });
        } else {
            setForm({
                name: "",
                username: "",
                email: "",
                password: "",
                role: roles[0] ?? "",
                status: "Active",
            });
        }
        setErrors({});
    }, [mode, user, open]);

    if (!open) return null;

    const handleChange = (key, value) =>
        setForm((f) => ({ ...f, [key]: value }));

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            name: form.name,
            username: form.username,
            email: form.email,
            password: form.password,
            role: form.role,
            is_active: form.status === "Active",
        };

        const options = {
            preserveScroll: true,
            onError: (err) => setErrors(err),
            onSuccess: () => onClose(),
            onFinish: () => setProcessing(false),
        };

        if (mode === "edit") {
            router.put(route("users.update", user.id), payload, options);
        } else {
            router.post(route("users.store"), payload, options);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold">
                        {mode === "edit"
                            ? "Edit Pengguna"
                            : "Tambah Pengguna Baru"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                            placeholder="Nama lengkap"
                            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Username
                        </label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) =>
                                handleChange("username", e.target.value)
                            }
                            placeholder="contoh: admin.baru"
                            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                handleChange("email", e.target.value)
                            }
                            placeholder="email@estate.id"
                            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Password{" "}
                            {mode === "edit" && (
                                <span className="font-normal normal-case">
                                    (kosongkan jika tidak diubah)
                                </span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                handleChange("password", e.target.value)
                            }
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Role
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    handleChange("role", e.target.value)
                                }
                                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    handleChange("status", e.target.value)
                                }
                                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                            >
                                <option value="Active">Active</option>
                                <option value="Non-active">Non-active</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {mode === "edit"
                                ? "Simpan Perubahan"
                                : "Tambah User"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-border px-6 py-3 text-sm font-bold hover:bg-secondary"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
