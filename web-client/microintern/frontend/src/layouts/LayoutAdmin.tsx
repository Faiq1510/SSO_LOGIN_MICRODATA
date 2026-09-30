import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SidebarAdmin from "../components/SidebarAdmin";
import { getLocalUser, getAuthToken } from "../utils/api";
import LoncengNotifikasi from "../components/LoncengNotifikasi";

const LayoutAdmin: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const token = getAuthToken();
  const user = getLocalUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard/peserta" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-surface-0 text-text-primary overflow-hidden font-sans">
      <div className="hidden md:flex md:w-56 md:flex-col md:shrink-0 border-r border-border-base bg-surface-1">
        <SidebarAdmin />
      </div>

      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-surface-3/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div
          className={`absolute inset-y-0 left-0 w-72 bg-surface-1 border-r border-border-base transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex flex-col h-full">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border-base">
              <span className="text-sm font-medium text-text-muted">Menu Navigasi</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-text-secondary hover:text-text-primary p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarAdmin onNavigate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 shrink-0 border-b border-border-base bg-surface-1/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-text-secondary hover:text-text-primary p-2 -ml-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-medium text-text-muted hidden sm:block">Dashboard Admin / HRD</h2>
          </div>
          <div className="flex items-center gap-3">
            <LoncengNotifikasi />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col">
          <div className="flex-1 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto w-full">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LayoutAdmin;
