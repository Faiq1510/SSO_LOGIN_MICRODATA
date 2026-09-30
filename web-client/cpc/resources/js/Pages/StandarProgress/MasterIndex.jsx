import { useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Pencil, Trash2, Plus, X, Eye, ListChecks } from "lucide-react";

export default function MasterIndex({ masters, canEdit }) {
  const { flash } = usePage().props;
  const [showForm, setShowForm] = useState(false);
  const [editMaster, setEditMaster] = useState(null);
  const [deletingMaster, setDeletingMaster] = useState(null);

  const form = useForm({ nama_standar: "", deskripsi: "" });

  function openAdd() {
    setEditMaster(null);
    form.reset();
    form.clearErrors();
    setShowForm(true);
  }

  function openEdit(master) {
    setEditMaster(master);
    form.clearErrors();
    form.setData({ nama_standar: master.nama_standar, deskripsi: master.deskripsi ?? "" });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditMaster(null);
    form.clearErrors();
  }

  function handleSave(e) {
    e.preventDefault();
    if (editMaster) {
      form.put(route("standar.master.update", editMaster.id), { preserveScroll: true, onSuccess: () => closeForm() });
    } else {
      form.post(route("standar.master.store"), { preserveScroll: true, onSuccess: () => closeForm() });
    }
  }

  function confirmDelete() {
    if (!deletingMaster) return;
    router.delete(route("standar.master.destroy", deletingMaster.id), {
      preserveScroll: true,
      onSuccess: () => setDeletingMaster(null),
    });
  }

  return (
    <AuthenticatedLayout auth={usePage().props.auth}>
      <Head title="Standar Progress" />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Standar Progress</h1>
            <p className="text-sm text-muted-foreground">
              {canEdit ? "Kelola standar progress untuk setiap tipe/blok unit." : "Daftar standar progress (read-only)."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                <Eye size={12} /> Read Only
              </span>
            )}
            {canEdit && (
              <button type="button" aria-label="Buat standar progres baru" onClick={openAdd} className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white">
                <Plus size={14} className="mr-1 inline" /> Buat Standar Baru
              </button>
            )}
          </div>
        </div>

        {flash?.success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{flash.success}</div>}
        {flash?.error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{flash.error}</div>}

        {masters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white py-16 text-center text-sm text-muted-foreground">
            Belum ada standar progress. {canEdit && 'Klik "Buat Standar Baru" untuk memulai.'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {masters.map((m) => (
              <div key={m.id} className="group flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <ListChecks size={12} /> {m.matrix_progress_count} Tahap
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    {m.units_count} Unit
                  </span>
                </div>
                <h2 className="mb-1 text-base font-bold text-slate-800 group-hover:text-primary">{m.nama_standar}</h2>
                <p className="mb-4 flex-1 text-xs text-muted-foreground line-clamp-2">{m.deskripsi || "Tidak ada deskripsi."}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Lihat tahapan standar ${m.nama_standar}`}
                    onClick={() => router.visit(route("standar.index", m.id))}
                    className="cursor-pointer flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-white hover:bg-primary/90"
                  >
                    Lihat Tahapan
                  </button>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit standar ${m.nama_standar}`}
                        onClick={() => openEdit(m)}
                        className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={m.units_count > 0 ? `Tidak bisa hapus standar ${m.nama_standar}` : `Hapus standar ${m.nama_standar}`}
                        onClick={() => m.units_count === 0 && setDeletingMaster(m)}
                        disabled={m.units_count > 0}
                        className={`cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 transition-colors ${m.units_count > 0 ? "text-slate-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
                        title={m.units_count > 0 ? "Tidak bisa dihapus – ada unit terhubung" : "Hapus"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeForm}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editMaster ? "Edit Standar" : "Buat Standar Baru"}</h2>
              <button type="button" aria-label="Tutup form standar" onClick={closeForm} className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Standar *</span>
                <input type="text" value={form.data.nama_standar} onChange={(e) => form.setData("nama_standar", e.target.value)} placeholder="Contoh: Standar Tipe 36, Standar Ruko..." className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary" autoFocus />
                {form.errors.nama_standar && <span className="mt-1 block text-xs text-red-600">{form.errors.nama_standar}</span>}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deskripsi</span>
                <textarea rows={3} value={form.data.deskripsi} onChange={(e) => form.setData("deskripsi", e.target.value)} placeholder="Opsional keterangan singkat tentang standar ini." className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
                {form.errors.deskripsi && <span className="mt-1 block text-xs text-red-600">{form.errors.deskripsi}</span>}
              </label>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={form.processing || !form.data.nama_standar} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {form.processing ? "Menyimpan..." : "Simpan"}
                </button>
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingMaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeletingMaster(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Hapus Standar?</h2>
            <p className="mb-6 text-sm text-slate-500">
              Standar <span className="font-medium text-slate-700">{deletingMaster.nama_standar}</span> beserta semua tahapannya akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingMaster(null)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm">Batal</button>
              <button onClick={confirmDelete} className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
