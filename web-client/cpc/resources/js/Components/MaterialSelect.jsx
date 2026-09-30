import { useEffect, useMemo, useRef, useState } from "react";

export default function MaterialSelect({
    materials = [],
    value,
    onChange,
    error,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const wrapperRef = useRef(null);

    const selected = materials.find(
        (m) => String(m.id) === String(value)
    );

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    const filtered = useMemo(() => {
        if (!search) return materials;

        const keyword = search.toLowerCase();

        return materials.filter((m) =>
            `${m.kode} ${m.nama} ${m.satuan}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [materials, search]);

    return (
        <div className="relative" ref={wrapperRef}>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Material
            </span>

            <input
                type="text"
                value={open ? search : selected ? `${selected.kode} • ${selected.nama}` : ""}
                placeholder="Cari material..."
                onFocus={() => {
                    setOpen(true);
                    setSearch("");
                }}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {open && (
                <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-xl">
                    {filtered.length > 0 ? (
                        filtered.map((m) => (
                            <button
                                type="button"
                                key={m.id}
                                onClick={() => {
                                    onChange(m.id);
                                    setSearch("");
                                    setOpen(false);
                                }}
                                className="flex w-full flex-col border-b border-border px-4 py-3 text-left hover:bg-muted last:border-none"
                            >
                                <span className="font-mono text-xs text-primary">
                                    {m.kode}
                                </span>

                                <span className="font-semibold">
                                    {m.nama}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                    {m.satuan}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            Material tidak ditemukan
                        </div>
                    )}
                </div>
            )}

            {error && (
                <span className="mt-1 block text-xs text-red-500">
                    {error}
                </span>
            )}
        </div>
    );
}