import React, { createContext, useContext, useState, useCallback } from "react";
import { Check, X } from "lucide-react";

interface Notification {
  type: "success" | "error";
  message: string;
}

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a ProviderNotifikasi");
  }
  return context;
};

export const ProviderNotifikasi: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showSuccess = useCallback((message: string) => {
    setNotification({ type: "success", message });
  }, []);

  const showError = useCallback((message: string) => {
    setNotification({ type: "error", message });
  }, []);

  const handleClose = useCallback(() => {
    setNotification(null);
  }, []);

  const contextValue = React.useMemo(() => ({ showSuccess, showError }), [showSuccess, showError]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-black/50 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {}
            <div
              className={`absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
                notification.type === "success" ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></div>

            {}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border transition-all ${
                notification.type === "success" ? "bg-zinc-800 text-emerald-400 border-emerald-500 shadow-md" : "bg-zinc-800 text-red-400 border-red-500 shadow-md"
              }`}
            >
              {notification.type === "success" ? <Check className="w-8 h-8" strokeWidth={2.5} /> : <X className="w-8 h-8" strokeWidth={2.5} />}
            </div>

            {}
            <h3 className="text-xl font-black text-white tracking-tight mb-2">{notification.type === "success" ? "Berhasil" : "Gagal"}</h3>

            {}
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">{notification.message}</p>

            {}
            <button
              onClick={handleClose}
              className="w-full bg-zinc-800 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-900/25 outline-none cursor-pointer text-sm tracking-wide uppercase"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
