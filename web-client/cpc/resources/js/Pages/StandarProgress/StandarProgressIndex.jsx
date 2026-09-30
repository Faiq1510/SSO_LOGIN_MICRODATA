import { useMemo, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Pencil, Trash2, Plus, X, Search, Eye, ListChecks, ArrowLeft } from "lucide-react";

function formatRange(row) {
  return `${row.range_progress}%`;
}

// Props yang diharapkan dari controller:
// - matrixRows: [{ id, batas_atas, tahap_pekerjaan, details: [{ id, material_id, kode_material, nama_material, satuan, qty_standar }] }]
// - materials: [{ id, kode_material, nama_material, satuan }]  -> daftar lengkap utk picker "Tambah Material"
// - canEdit: boolean, dihitung SERVER-SIDE dari auth()->user()->hasRole('Super Admin')
// - tahapOptions: array of available tahap options
export default function StandarProgressIndex({ master, matrixRows, materials, canEdit, tahapOptions, deletedStages = [] }) {
  const { flash } = usePage().props;

  const sortedRows = useMemo(
    () => [...matrixRows].sort((a, b) => a.batas_atas - b.batas_atas),
    [matrixRows]
  );

  // ── State: modal tambah/edit Tahap (matrix_progress) ─────────────────
  const [tahapDrawerOpen, setTahapDrawerOpen] = useState(false);
  const [editTahap, setEditTahap] = useState(null); // null = mode tambah
  const [deletingTahap, setDeletingTahap] = useState(null);
  const [deletedDropdownOpen, setDeletedDropdownOpen] = useState(false);

  // ── State: modal kelola material per tahap (matrix_progress_detail) ──
  const [detailPanelTahapId, setDetailPanelTahapId] = useState(null);
  const [deletingDetail, setDeletingDetail] = useState(null);
  const [materialQuery, setMaterialQuery] = useState("");
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [editingDetailId, setEditingDetailId] = useState(null);
  const [editingQty, setEditingQty] = useState(0);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  // Selalu diturunkan dari sortedRows (bukan snapshot) -> otomatis ikut
  // ter-refresh begitu Inertia reload props setelah add/edit/delete detail.
  const detailPanelTahap = sortedRows.find((r) => r.id === detailPanelTahapId) ?? null;

  const tahapForm = useForm({
    tahap_pekerjaan: "",
    batas_atas: "",
  });

  const detailForm = useForm({
    material_id: "",
    qty_standar: 0,
  });

  // ── Handlers: Tahap ────────────────────────────────────────────────────
  function openAddTahap() {
    setDetailPanelTahapId(null);
    setEditTahap(null);
    tahapForm.reset();
    tahapForm.clearErrors();
    tahapForm.setData({ tahap_pekerjaan: "", batas_atas: "" });
    setTahapDrawerOpen(true);
  }

  function openEditTahap(row) {
    setEditTahap(row);
    setDetailPanelTahapId(row.id);
    setIsAddingMaterial(false);
    tahapForm.clearErrors();
    tahapForm.setData({
      tahap_pekerjaan: row.tahap_pekerjaan,
      batas_atas: row.batas_atas,
    });
    setTahapDrawerOpen(true);
  }

  function closeTahapDrawer() {
    setTahapDrawerOpen(false);
    setEditTahap(null);
    setDetailPanelTahapId(null);
    setIsAddingMaterial(false);
    tahapForm.clearErrors();
  }

  function handleSaveTahap(e) {
    e.preventDefault();
    if (editTahap) {
      tahapForm.put(route("standar.update", { master: master.id, matrix: editTahap.id }), {
        preserveScroll: true,
        onSuccess: () => closeTahapDrawer(),
      });
    } else {
      tahapForm.post(route("standar.store", master.id), {
        preserveScroll: true,
        onSuccess: () => closeTahapDrawer(),
      });
    }
  }

  function confirmDeleteTahap() {
    if (!deletingTahap) return;
    router.delete(route("standar.destroy", { master: master.id, matrix: deletingTahap.id }), {
      preserveScroll: true,
      onSuccess: () => {
        if (detailPanelTahapId === deletingTahap.id) setDetailPanelTahapId(null);
        setDeletingTahap(null);
      },
    });
  }

  // ── Handlers: Panel Kelola Material per Tahap ─────────────────────────
  function openDetailPanel(row) {
    setTahapDrawerOpen(false);
    setEditTahap(null);
    setDetailPanelTahapId(row.id);
    setMaterialQuery("");
    setMaterialDropdownOpen(false);
    setEditingDetailId(null);
    setIsAddingMaterial(false);
    detailForm.reset();
    detailForm.clearErrors();
  }

  function closeDetailPanel() {
    setDetailPanelTahapId(null);
    setEditingDetailId(null);
    detailForm.clearErrors();
  }

  // Material yang belum punya standar di tahap ini -> jadi pilihan dropdown tambah
  const availableMaterials = useMemo(() => {
    if (!detailPanelTahap) return [];
    const usedIds = new Set(detailPanelTahap.details.map((d) => d.material_id));
    const q = materialQuery.trim().toLowerCase();
    return materials.filter((m) => {
      if (usedIds.has(m.id)) return false;
      if (!q) return true;
      return (
        m.kode_material.toLowerCase().includes(q) ||
        m.nama_material.toLowerCase().includes(q)
      );
    });
  }, [detailPanelTahap, materials, materialQuery]);

  function selectMaterial(m) {
    detailForm.setData("material_id", m.id);
    setMaterialQuery(`${m.kode_material} · ${m.nama_material}`);
    setMaterialDropdownOpen(false);
  }

  function handleAddDetail(e) {
    e.preventDefault();
    if (!detailPanelTahap || !detailForm.data.material_id) return;
    detailForm.post(route("standar.detail.store", { master: master.id, matrix: detailPanelTahap.id }), {
      preserveScroll: true,
      onSuccess: () => {
        detailForm.reset();
        setMaterialQuery("");
        setMaterialDropdownOpen(false);
        setIsAddingMaterial(false);
      },
    });
  }

  function startEditQty(detail) {
    setEditingDetailId(detail.id);
    setEditingQty(detail.qty_standar);
  }

  function saveEditQty(detail) {
    router.put(
      route("standar.detail.update", detail.id),
      { qty_standar: editingQty },
      { preserveScroll: true, onSuccess: () => setEditingDetailId(null) }
    );
  }

  function confirmDeleteDetail() {
    if (!deletingDetail) return;
    router.delete(route("standar.detail.destroy", deletingDetail.id), {
      preserveScroll: true,
      onSuccess: () => setDeletingDetail(null),
    });
  }

  return (
    <AuthenticatedLayout auth={usePage().props.auth}>
      <Head title={`Standar Progres · ${master.nama_standar}`} />

      <div className="space-y-5">

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{master.nama_standar}</h1>
            <p className="text-sm text-muted-foreground">
              {master.deskripsi || (canEdit
                ? "Acuan pemakaian material kumulatif per milestone progres."
                : "Standar acuan material (read-only).")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                <Eye size={12} /> Read Only
              </span>
            )}
            {canEdit && (
              <button
                onClick={openAddTahap}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                + Tambah Tahap
              </button>
            )}
            <button
              onClick={() => router.visit(route('standar.master.index'))}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali
            </button>
          </div>
        </div>

        {flash?.success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
            {flash.success}
          </div>
        )}

        {/* ── Table: Tahapan Pekerjaan ────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold">Tahapan Pekerjaan ({sortedRows.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Range</th>
                  <th className="px-4 py-3 text-left font-semibold">Tahap Pekerjaan</th>
                  <th className="px-4 py-3 text-left font-semibold">Jumlah Material</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {formatRange(row)}
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.tahap_pekerjaan}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                        {row.details.length} material
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!canEdit && (
                        <button                            type="button"
                            aria-label={`Lihat material untuk ${row.tahap_pekerjaan}`}                          onClick={() => openDetailPanel(row)}
                          title="Lihat Material"
                          className="cursor-pointer mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <ListChecks size={16} />
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            aria-label={`Edit tahap ${row.tahap_pekerjaan}`}
                            onClick={() => openEditTahap(row)}
                            title="Edit Tahap & Material"
                            className="cursor-pointer mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={row.canDelete ? `Hapus tahap ${row.tahap_pekerjaan}` : `Tidak bisa hapus tahap ${row.tahap_pekerjaan}`}
                            onClick={() => setDeletingTahap(row)}
                            title={row.canDelete ? "Hapus" : "Tidak bisa dihapus"}
                            className={`cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 ${row.canDelete ? 'text-red-600 hover:bg-red-50' : 'text-muted-foreground opacity-60' } transition-colors`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Belum ada tahap pekerjaan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Qty pada setiap material bersifat <strong>kumulatif</strong> — total pemakaian yang diizinkan s.d.
            milestone progres tersebut tercapai.
          </div>
        </div>
      </div>

      {/* ── Modal: Tambah / Edit Tahap ───────────────────────────── */}
      {tahapDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeTahapDrawer}
        >
          <div
            className={`w-full ${editTahap ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editTahap ? "Edit Tahap & Kelola Material" : "Tambah Tahap Baru"}
              </h2>
              <button
                type="button"
                aria-label="Tutup modal tahap"
                onClick={closeTahapDrawer}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-8">
            {editTahap ? (
              /* ── Mode Edit: layout compact inline ── */
              <div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1 min-w-[180px]">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tahap Pekerjaan
                    </span>
                    <input
                      type="text"
                      value={tahapForm.data.tahap_pekerjaan}
                      onChange={(e) => tahapForm.setData("tahap_pekerjaan", e.target.value)}
                      placeholder="Nama tahap pekerjaan..."
                      className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      autoComplete="off"
                    />
                  </label>
                  <label className="w-32">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Batas Atas (%)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={tahapForm.data.batas_atas}
                      onChange={(e) => tahapForm.setData("batas_atas", e.target.value)}
                      placeholder="25"
                      className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>
                {(tahapForm.errors.tahap_pekerjaan || tahapForm.errors.batas_atas) && (
                  <div className="mt-2 flex gap-4 text-xs text-red-600">
                    {tahapForm.errors.tahap_pekerjaan && <span>{tahapForm.errors.tahap_pekerjaan}</span>}
                    {tahapForm.errors.batas_atas && <span>{tahapForm.errors.batas_atas}</span>}
                  </div>
                )}
              </div>
            ) : (
              /* ── Mode Tambah: layout vertikal (original) ── */
              <form onSubmit={handleSaveTahap} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tahap Pekerjaan
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={tahapForm.data.tahap_pekerjaan}
                      onChange={(e) => {
                        tahapForm.setData("tahap_pekerjaan", e.target.value);
                        if (deletedStages.length > 0) setDeletedDropdownOpen(true);
                      }}
                      onClick={() => { if (deletedStages.length > 0) setDeletedDropdownOpen(true); }}
                      onBlur={() => setTimeout(() => setDeletedDropdownOpen(false), 200)}
                      placeholder="Cari atau pilih nama tahap..."
                      className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      autoComplete="off"
                    />
                    {deletedDropdownOpen && deletedStages.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                        <div className="bg-secondary/40 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          Pulihkan Tahap yang Dihapus
                        </div>
                        {deletedStages
                          .filter((s) =>
                            s.tahap_pekerjaan
                              .toLowerCase()
                              .includes(tahapForm.data.tahap_pekerjaan.toLowerCase())
                          )
                          .map((s) => (
                            <button
                              type="button"
                              key={s.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                tahapForm.setData({
                                  tahap_pekerjaan: s.tahap_pekerjaan,
                                  batas_atas: s.batas_atas,
                                });
                                setDeletedDropdownOpen(false);
                              }}
                              className="block w-full px-3 py-2 text-left text-xs hover:bg-primary/5 hover:text-primary transition-colors border-b border-border last:border-b-0"
                            >
                              <span className="font-semibold text-slate-800">{s.tahap_pekerjaan}</span>{" "}
                              <span className="text-muted-foreground">(Semula: {s.batas_atas}%)</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {tahapForm.errors.tahap_pekerjaan && (
                    <span className="mt-1 block text-xs text-red-600">{tahapForm.errors.tahap_pekerjaan}</span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Batas Atas Progres (%)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tahapForm.data.batas_atas}
                    onChange={(e) => tahapForm.setData("batas_atas", e.target.value)}
                    placeholder="Contoh: 25 (artinya tahap ini selesai di 25%)"
                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  {tahapForm.errors.batas_atas && (
                    <span className="mt-1 block text-xs text-red-600">{tahapForm.errors.batas_atas}</span>
                  )}
                </label>

                <p className="text-xs text-muted-foreground">
                  Nama tahap dan batas atas bisa ditentukan sendiri sesuai kebutuhan standar ini.
                </p>

                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={tahapForm.processing || !tahapForm.data.tahap_pekerjaan}
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {tahapForm.processing ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={closeTahapDrawer}
                    className="rounded-xl border border-border px-4 py-3 text-sm"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Bagian Kelola Material (Hanya muncul jika Mode Edit) */}
            {editTahap && detailPanelTahap && (
              <div className="border-t border-border pt-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Standar Material</h3>
                  {!isAddingMaterial && (
                    <button
                      type="button"
                      onClick={() => setIsAddingMaterial(true)}
                      className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={14} /> Tambah
                    </button>
                  )}
                </div>

                {isAddingMaterial && (
                  <form onSubmit={handleAddDetail} className="rounded-xl border border-border bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tambah Material Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingMaterial(false);
                          detailForm.reset();
                          setMaterialQuery("");
                        }}
                        className="cursor-pointer text-muted-foreground hover:text-slate-900"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-[200px] relative">
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus-within:border-primary">
                          <Search size={14} className="shrink-0 text-muted-foreground" />
                          <input
                            value={materialQuery}
                            onChange={(e) => {
                              setMaterialQuery(e.target.value);
                              detailForm.setData("material_id", "");
                              setMaterialDropdownOpen(true);
                            }}
                            onFocus={() => setMaterialDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setMaterialDropdownOpen(false), 150)}
                            placeholder="Cari & pilih material..."
                            className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                            autoComplete="off"
                          />
                        </div>

                        {materialDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-lg z-20">
                            {availableMaterials.length === 0 && (
                              <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                                Material tidak ditemukan.
                              </p>
                            )}
                            {availableMaterials.map((m) => (
                              <button
                                type="button"
                                key={m.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectMaterial(m)}
                                className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary border-b border-border last:border-b-0"
                              >
                                <span className="font-mono font-semibold text-primary">{m.kode_material}</span>{" "}
                                · {m.nama_material}
                              </button>
                            ))}
                          </div>
                        )}
                        {detailForm.errors.material_id && (
                          <span className="mt-1 block text-xs text-red-600">{detailForm.errors.material_id}</span>
                        )}
                      </div>

                      <div className="w-32">
                        <input
                          type="number"
                          min={0}
                          value={detailForm.data.qty_standar}
                          onChange={(e) => detailForm.setData("qty_standar", e.target.value)}
                          placeholder="Qty"
                          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                        />
                        {detailForm.errors.qty_standar && (
                          <span className="mt-1 block text-xs text-red-600">{detailForm.errors.qty_standar}</span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={detailForm.processing || !detailForm.data.material_id}
                        className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {detailPanelTahap.details.length === 0 && !isAddingMaterial && (
                    <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                      Belum ada standar material di tahap ini.
                    </p>
                  )}
                  {detailPanelTahap.details.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{d.nama_material}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{d.kode_material}</p>
                      </div>

                      {editingDetailId === d.id ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            autoFocus
                            value={editingQty}
                            onChange={(e) => setEditingQty(Number(e.target.value))}
                            className="w-20 rounded-lg border border-border px-2 py-1 text-xs font-mono outline-none focus:border-primary"
                          />
                          <span className="w-8 text-[11px] text-muted-foreground">{d.satuan}</span>
                          <button
                            onClick={() => saveEditQty(d)}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingDetailId(null)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-xs font-bold">{d.qty_standar}</span>
                          <span className="w-8 text-[11px] text-muted-foreground">{d.satuan}</span>
                          <button
                            onClick={() => startEditQty(d)}
                            title="Edit qty"
                            className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingDetail(d)}
                            title={d.canDelete ? "Hapus" : "Tidak bisa dihapus"}
                            className={`cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 transition-colors ${d.canDelete ? 'text-red-600 hover:bg-red-50' : 'text-muted-foreground opacity-60'}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* ── Bottom bar: Simpan (Edit mode) ── */}
            {editTahap && (
              <div className="shrink-0 border-t border-border pt-4 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTahapDrawer}
                  className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveTahap(e)}
                  disabled={tahapForm.processing}
                  className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-primary/90 transition-colors"
                >
                  {tahapForm.processing ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Lihat Material per Tahap (Read-Only) ────────────────────────── */}
      {detailPanelTahap && !tahapDrawerOpen && !canEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeDetailPanel}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Lihat Material — {detailPanelTahap.tahap_pekerjaan}
              </h2>
              <button                type="button"
                aria-label="Tutup panel detail material"                onClick={closeDetailPanel}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Range {formatRange(detailPanelTahap)}
            </p>

            <div className="space-y-2">
              {detailPanelTahap.details.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  Belum ada standar material di tahap ini.
                </p>
              )}
              {detailPanelTahap.details.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{d.nama_material}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{d.kode_material}</p>
                  </div>
                  <span className="font-mono text-xs font-bold">{d.qty_standar}</span>
                  <span className="w-8 text-[11px] text-muted-foreground">{d.satuan}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal konfirmasi hapus Tahap ─────────────────────────────── */}
      {deletingTahap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setDeletingTahap(null)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {deletingTahap.canDelete ? (
              <>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Hapus Tahap?</h2>
                <p className="mb-6 text-sm text-slate-500">
                  Tahap <span className="font-medium text-slate-700">{deletingTahap.tahap_pekerjaan}</span> beserta{" "}
                  <span className="font-medium text-slate-700">{deletingTahap.details.length} standar material</span> di
                  dalamnya akan dihapus permanen.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeletingTahap(null)}
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDeleteTahap}
                    className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Tidak bisa dihapus</h2>
                <p className="mb-6 text-sm text-slate-500">
                  Tahap <span className="font-medium text-slate-700">{deletingTahap.tahap_pekerjaan}</span> tidak dapat dihapus karena
                  sedang digunakan di data progres.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeletingTahap(null)}
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal konfirmasi hapus standar material ─────────────────── */}
      {deletingDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setDeletingDetail(null)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {deletingDetail.canDelete ? (
              <>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Hapus Standar Material?</h2>
                <p className="mb-6 text-sm text-slate-500">
                  Standar <span className="font-medium text-slate-700">{deletingDetail.nama_material}</span> pada tahap
                  ini akan dihapus.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeletingDetail(null)}
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDeleteDetail}
                    className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Tidak bisa dihapus</h2>
                <p className="mb-6 text-sm text-slate-500">
                  Standar <span className="font-medium text-slate-700">{deletingDetail.nama_material}</span> tidak dapat dihapus karena
                  sedang digunakan di data progres.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeletingDetail(null)}
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}