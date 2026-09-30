import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X, AlertTriangle } from "lucide-react";
import { resolveFileUrl } from "../utils/fileUrl";

interface ModalPratinjauBerkasProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  title?: string;
}

const ModalPratinjauBerkas: React.FC<ModalPratinjauBerkasProps> = ({ isOpen, onClose, fileUrl, title = "Preview Dokumen" }) => {
  const { resolvedUrl, fileType, isCreatedBlob } = useMemo(() => {
    if (!isOpen || !fileUrl) {
      return { resolvedUrl: null, fileType: "unknown" as const, isCreatedBlob: false };
    }

    const urlToUse = resolveFileUrl(fileUrl) ?? "";

    const lowerUrl = fileUrl.toLowerCase();
    let detectedType: "pdf" | "image" | "unknown" = "unknown";
    if (lowerUrl.endsWith(".pdf") || lowerUrl.includes("pdf")) {
      detectedType = "pdf";
    } else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/) || lowerUrl.includes("image") || lowerUrl.includes("jpg") || lowerUrl.includes("png")) {
      detectedType = "image";
    }

    return { resolvedUrl: urlToUse, fileType: detectedType, isCreatedBlob: false };
  }, [isOpen, fileUrl]);

  useEffect(() => {
    return () => {
      if (isCreatedBlob && resolvedUrl && resolvedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [isCreatedBlob, resolvedUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !resolvedUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[95vw] h-[95vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{title}</h3>
            <p className="text-xs text-zinc-500 truncate mt-0.5">Previewing file online</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl transition-all duration-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-xl transition-all duration-200"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-zinc-950 flex items-center justify-center p-2">
          {fileType === "pdf" ? (
            <iframe src={`${resolvedUrl}#toolbar=0`} className="w-full h-full border-0 bg-zinc-900 rounded-xl shadow-inner" title={title} />
          ) : fileType === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-auto">
              <img src={resolvedUrl} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg select-none" />
            </div>
          ) : (
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">Preview Tidak Tersedia</h4>
              <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">Format dokumen ini tidak dapat di-preview secara langsung.</p>
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-all duration-200"
              >
                Unduh Dokumen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalPratinjauBerkas;
