import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, CheckCheck, Inbox } from "lucide-react";
import { getAdminNotifications, getAdminUnreadCount, markNotificationRead, markAllNotificationsRead, deleteAdminNotification } from "../services/notification.service";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  related_id: string | null;
  target_date: string | null;
  is_read: boolean;
  created_at: string;
}

const LoncengNotifikasi: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await getAdminUnreadCount();
      if (res.status === "success" && res.data) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminNotifications();
      if (res.status === "success" && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = async (item: NotificationItem) => {
    setIsOpen(false);
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (item.target_date) {
      navigate(`/dashboard/admin/izin?date=${item.target_date}`);
    } else {
      navigate("/dashboard/admin/izin");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAdminNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors focus:outline-none cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-reject text-[9px] font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border-base bg-surface-1 shadow-2xl z-50 overflow-hidden transition-all duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-base bg-surface-2">
            <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
              Notifikasi
              {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold">{unreadCount} baru</span>}
            </span>
            {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-brand hover:text-brand-glow font-medium flex items-center gap-1 cursor-pointer transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border-subtle scrollbar-hide">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-3"></div>
                <span className="text-xs">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-text-muted mb-4 border border-border-base">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Tidak ada notifikasi</h4>
                <p className="text-xs text-text-secondary max-w-[240px]">Semua pengajuan izin dari peserta akan muncul di sini.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-3 p-4 hover:bg-surface-2 transition-colors cursor-pointer relative group ${!item.is_read ? "bg-surface-2/60" : ""}`}
                >
                  {!item.is_read && <span className="absolute left-3 top-[22px] w-2 h-2 rounded-full bg-brand"></span>}
                  <div className={`flex-1 ${!item.is_read ? "pl-3" : "pl-3"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-amber-400 border border-amber-500/40">{item.type.toUpperCase()}</span>
                      <span className="text-[10px] text-text-secondary tabular-nums">{formatDate(item.created_at)}</span>
                    </div>
                    <h5 className={`text-xs font-semibold mb-1 text-text-primary`}>{item.title}</h5>
                    <p className="text-[11px] leading-relaxed text-text-secondary">{item.body}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer self-start"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-surface-2 border-t border-border-base text-center">
            <span className="text-[10px] text-text-muted">Menampilkan 50 notifikasi terbaru</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoncengNotifikasi;
