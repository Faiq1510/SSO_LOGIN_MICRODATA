import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, total, limit, onPageChange, onLimitChange }) => {
  const getPagesRange = () => {
    const range: (number | string)[] = [];
    const delta = 1;
    const left = page - delta;
    const right = page + delta + 1;
    let l: number | null = null;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    const rangeWithDots: (number | string)[] = [];
    for (const i of range) {
      if (l !== null) {
        if ((i as number) - l === 2) {
          rangeWithDots.push(l + 1);
        } else if ((i as number) - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    }

    return rangeWithDots;
  };

  const pages = getPagesRange();
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-surface-1 border border-border-subtle rounded-2xl shadow-sm select-none">
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <div className="font-medium">
          Menampilkan <span className="text-text-primary font-bold">{total > 0 ? startItem : 0}</span>
          {" - "}
          <span className="text-text-primary font-bold">{endItem}</span> dari <span className="text-text-primary font-bold">{total}</span> item
        </div>
        <div className="flex items-center gap-2">
          <span>Baris:</span>
          <CustomSelect
            value={limit}
            onChange={onLimitChange}
            options={[
              { value: 10, label: "10" },
              { value: 25, label: "25" },
              { value: 50, label: "50" },
            ]}
            className="w-16"
            direction="up"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-xs text-text-muted">
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p as number)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                page === p
                  ? "bg-brand text-text-inverse shadow-sm shadow-brand-glow"
                  : "border border-border-subtle bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="p-2 rounded-xl border border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
