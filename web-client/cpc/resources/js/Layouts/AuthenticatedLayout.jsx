import { Link, usePage, router } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import RoleBadge from "@/Components/RoleBadge";
import {
    Bell,
    AlertTriangle,
    AlertCircle,
    CheckCheck,
    Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "Baru saja";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function NotificationIcon({ action }) {
    if (action === "boros") {
        return <AlertTriangle size={16} className="text-red-500" />;
    }
    if (action === "warning") {
        return <AlertCircle size={16} className="text-amber-500" />;
    }
    return <Bell size={16} className="text-slate-400" />;
}

function NotificationDropdown() {
    const { notifications } = usePage().props;
    const items = notifications?.items ?? [];
    const unreadCount = notifications?.unreadCount ?? 0;

    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function markRead(log) {
        if (log.read_at) return;
        router.post(
            route("notifications.read", log.id),
            {},
            { preserveScroll: true },
        );
    }

    function markAllRead() {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Buka Notifikasi"
                onClick={() => setOpen((v) => !v)}
                className="relative text-slate-600 hover:text-slate-900"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-20 mt-3 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h3 className="text-sm font-bold">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                                <CheckCheck size={13} />
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 && (
                            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                                Belum ada notifikasi.
                            </p>
                        )}

                        {items.map((log) => (
                            <button
                                key={log.id}
                                onClick={() => markRead(log)}
                                className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/50 ${
                                    !log.read_at ? "bg-sky-50/60" : ""
                                }`}
                            >
                                <span className="mt-0.5 shrink-0">
                                    <NotificationIcon action={log.action} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs text-slate-700">
                                        {log.description}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                        {log.user?.name ?? "Sistem"} ·{" "}
                                        {timeAgo(log.created_at)}
                                    </span>
                                </span>
                                {!log.read_at && (
                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("sidebar-collapsed") === "true";
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showWhatsapp, setShowWhatsapp] = useState(false);
    const [isProfilePage, setIsProfilePage] = useState(false);
    const lastScrollYRef = useRef(0);
    const mainRef = useRef(null);

    function toggleSidebar() {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("sidebar-collapsed", String(next));
            if (!next) {
                setShowWhatsapp(true);
            }
            return next;
        });
    }

    function openMobileSidebar() {
        setMobileOpen(true);
        setShowWhatsapp(true);
    }

    function closeMobileSidebar() {
        setMobileOpen(false);
        setShowWhatsapp(false);
    }

    const role = auth.user.roles?.[0] ?? "";

    const initials = auth.user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const whatsappPhone =
        import.meta.env.VITE_WHATSAPP_PHONE || "6285268812239"; // ganti nomor disini
    const whatsappLabel = "Hubungi WhatsApp";
    const touchStartYRef = useRef(null);
    const touchMovedRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        setIsProfilePage(window.location.pathname.startsWith("/profile"));
        lastScrollYRef.current = window.pageYOffset;

        function handleScroll() {
            const currentY = window.pageYOffset;
            const delta = currentY - lastScrollYRef.current;

            if (delta < -15) {
                setShowWhatsapp(true);
            } else if (delta > 15) {
                setShowWhatsapp(false);
            }

            lastScrollYRef.current = currentY;
        }

        function handleTouchStart(event) {
            if (event.touches.length === 1) {
                touchStartYRef.current = event.touches[0].clientY;
                touchMovedRef.current = false;
            }
        }

        function handleTouchMove(event) {
            if (!touchStartYRef.current || event.touches.length !== 1) {
                return;
            }

            const currentY = event.touches[0].clientY;
            const delta = currentY - touchStartYRef.current;

            if (delta > 30) {
                setShowWhatsapp(true);
                touchMovedRef.current = true;
            } else if (delta < -30) {
                setShowWhatsapp(false);
                touchMovedRef.current = true;
            }
        }

        function handleTouchEnd() {
            if (touchStartYRef.current !== null && !touchMovedRef.current) {
                setShowWhatsapp(true);
            }

            touchStartYRef.current = null;
            touchMovedRef.current = false;
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        const touchTarget = mainRef.current ?? window;
        touchTarget.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        touchTarget.addEventListener("touchmove", handleTouchMove, {
            passive: true,
        });
        touchTarget.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });
        touchTarget.addEventListener("touchcancel", handleTouchEnd, {
            passive: true,
        });
        const handleRouteStart = () => setShowWhatsapp(false);
        router.on("start", handleRouteStart);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            touchTarget.removeEventListener("touchstart", handleTouchStart);
            touchTarget.removeEventListener("touchmove", handleTouchMove);
            touchTarget.removeEventListener("touchend", handleTouchEnd);
            touchTarget.removeEventListener("touchcancel", handleTouchEnd);
            if (typeof router.off === "function") {
                router.off("start", handleRouteStart);
            }
        };
    }, []);

    const subtitle =
        role === "Owner"
            ? "Monitoring Eksekutif"
            : role === "Super Admin"
              ? "Administrasi Sistem Penuh"
              : "Operasional Gudang & Unit";

    return (
        <div className="min-h-screen bg-background text-foreground print:min-h-0">
            <div className="min-h-screen print:min-h-0">
                <div className="print:hidden">
                    <Sidebar
                        collapsed={collapsed}
                        onToggle={toggleSidebar}
                        mobileOpen={mobileOpen}
                        onCloseMobile={() => setMobileOpen(false)}
                    />
                </div>

                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden print:hidden"
                        onClick={closeMobileSidebar}
                    />
                )}

                <div
                    className={`flex min-h-screen min-w-0 flex-col transition-[margin-left] duration-200 print:ml-0 print:min-h-0 print:h-auto ${collapsed ? "lg:ml-20" : "lg:ml-72"}`}
                >
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6 print:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                aria-label="Buka Menu"
                                onClick={openMobileSidebar}
                                className="cursor-pointer text-foreground lg:hidden"
                                title="Buka menu"
                            >
                                <Menu size={22} />
                            </button>

                            <div>
                                <h1 className="text-base font-extrabold leading-tight">
                                    SiteFlow
                                </h1>
                                <p className="text-[11px] text-slate-700">
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationDropdown />

                            <Link
                                href={route("profile")}
                                className="hidden items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-muted sm:flex"
                            >
                                <div className="text-right">
                                    <p className="text-xs font-semibold leading-tight">
                                        {auth.user.name}
                                    </p>

                                    <RoleBadge role={role} />
                                </div>

                                <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                                    {initials}
                                </div>
                            </Link>
                        </div>
                    </header>

                    <main
                        ref={mainRef}
                        className="flex-1 overflow-auto p-4 md:p-6 print:overflow-visible print:h-auto"
                    >
                        {children}
                    </main>

                    {!isProfilePage && (
                        <div
                            className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center transition-all duration-300 ease-out md:bottom-6 md:right-6"
                            onMouseEnter={() => setShowWhatsapp(true)}
                            onMouseLeave={() => setShowWhatsapp(false)}
                            onTouchStart={() => setShowWhatsapp(true)}
                        >
                            <a
                                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_PHONE || "6285268812239"}`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Hubungi WhatsApp"
                                className={`flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-300 ease-out hover:scale-110 hover:bg-emerald-500 active:scale-95 ${
                                    showWhatsapp
                                        ? "translate-y-0 opacity-100"
                                        : "translate-y-6 opacity-0 pointer-events-none"
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
