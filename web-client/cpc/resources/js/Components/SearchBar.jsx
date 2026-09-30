import { Search } from "lucide-react";

export default function SearchBar({
    value,
    onChange,
    placeholder = "supplier, kode, Material",
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    // debug: log input changes to help diagnose search issue
                    try {
                        console.debug("SearchBar onChange:", e.target.value);
                    } catch (e) {}
                    onChange(e.target.value);
                }}
                placeholder={placeholder}
                className="w-40 bg-transparent text-xs text-foreground caret-current outline-none"
            />
        </div>
    );
}
