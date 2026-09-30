import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import TextInputField from "./TextInputField";

export default function EditProfileModal({ open, onClose, user }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: "",
        username: "",
        email: "",
    });

    useEffect(() => {
        if (user && open) {
            setData({
                name: user.name ?? "",
                username: user.username ?? "",
                email: user.email ?? "",
            });
        }
    }, [open, user]);

    function submit(e) {
        e.preventDefault();

        patch(route("profile.update"), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
                <h2 className="mb-6 text-2xl font-bold">Edit Profil</h2>

                <form onSubmit={submit} className="space-y-5">
                    <TextInputField
                        label="Nama Lengkap"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        error={errors.name}
                    />

                    <TextInputField
                        label="Username"
                        value={data.username}
                        onChange={(e) => setData("username", e.target.value)}
                        error={errors.username}
                    />

                    <TextInputField
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        error={errors.email}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border px-5 py-2 font-semibold hover:bg-slate-100"
                        >
                            Batal
                        </button>

                        <button
                            disabled={processing}
                            className="rounded-xl bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
