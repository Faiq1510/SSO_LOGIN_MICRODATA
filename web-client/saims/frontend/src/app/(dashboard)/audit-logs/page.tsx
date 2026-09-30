'use client';

import React, { useState, useEffect } from 'react';
import { auditLogService, AuditLog } from '@/services/audit-log.service';
import {
  ClipboardList, Search, Filter, Calendar, ChevronDown, ChevronRight, ChevronLeft,
  ArrowRight, ShieldAlert, FileJson
} from 'lucide-react';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import Pagination from '@/components/ui/Pagination';

// Responsive Diff Viewer Component
const DiffViewer = ({ oldJson, newJson }: { oldJson: string, newJson: string }) => {
  let oldObj = {};
  let newObj = {};
  try { oldObj = JSON.parse(oldJson) || {}; } catch (e) {}
  try { newObj = JSON.parse(newJson) || {}; } catch (e) {}

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  if (allKeys.length === 0) {
    return <div className="text-gray-500 italic text-xs p-3">Tidak ada detail data yang tersedia.</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 md:p-3.5 font-mono text-xs border border-gray-200 dark:border-gray-800">
      {/* Header Grid */}
      <div className="hidden md:grid grid-cols-12 gap-4 font-semibold text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="col-span-3">Field</div>
        <div className="col-span-4 text-red-600 dark:text-red-400">Data Lama</div>
        <div className="col-span-1"></div>
        <div className="col-span-4 text-green-600 dark:text-green-400">Data Baru</div>
      </div>
      
      {/* Rows Container */}
      <div className="space-y-1.5">
        {allKeys.map(key => {
          const oldVal = oldObj[key as keyof typeof oldObj];
          const newVal = newObj[key as keyof typeof newObj];
          const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          
          return (
            <div 
              key={key} 
              className={`grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-4 py-1.5 px-2 rounded transition-all ${
                hasChanged 
                  ? 'bg-white dark:bg-gray-800 shadow-xs border border-gray-100 dark:border-gray-700' 
                  : 'opacity-70'
              }`}
            >
              {/* Field Name */}
              <div className="col-span-1 md:col-span-3 font-bold md:font-medium text-gray-700 dark:text-gray-300 truncate" title={key}>
                {key}
              </div>
              
              {/* Old Data */}
              <div className={`col-span-1 md:col-span-4 break-all ${hasChanged ? 'text-red-600/90 dark:text-red-400/95 bg-red-50/70 dark:bg-red-950/20 rounded px-1.5 py-0.5' : 'text-gray-500'}`}>
                <span className="inline md:hidden text-[10px] font-bold text-red-500 uppercase block mb-0.5">Lama:</span>
                {oldVal !== undefined ? String(oldVal) : <span className="italic text-gray-400">Kosong</span>}
              </div>
              
              {/* Arrow Indicator */}
              <div className="hidden md:flex col-span-1 items-center justify-center text-gray-400">
                {hasChanged && <ArrowRight className="w-3.5 h-3.5" />}
              </div>
              
              {/* New Data */}
              <div className={`col-span-1 md:col-span-4 break-all ${hasChanged ? 'text-green-600/90 dark:text-green-400/95 bg-green-50/70 dark:bg-green-950/20 rounded px-1.5 py-0.5' : 'text-gray-500'}`}>
                <span className="inline md:hidden text-[10px] font-bold text-green-500 uppercase block mb-0.5">Baru:</span>
                {newVal !== undefined ? String(newVal) : <span className="italic text-gray-400">Dihapus/Kosong</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getAuditLogs({ 
        page, 
        limit, 
        user: searchUser, 
        start_date: startDate, 
        end_date: endDate 
      });
      setLogs(response.data);
      setTotalPages(response.total_pages);
      setTotalLogs(response.total || response.data.length * response.total_pages);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchUser, startDate, endDate, page]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Header */}
      <PageHeaderCard
        moduleBadge="Modul Keamanan & Audit"
        badgeColorClass="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60"
        title="Audit Logs"
        description="Rekam jejak perubahan data di dalam sistem SAIMS. Data log ini bersifat append-only (tidak dapat dimodifikasi)."
        icon={ClipboardList}
        iconColorClass="text-orange-500"
        rightContent={
          <div className="hidden sm:block text-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[100px]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold uppercase">Total Log</span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{totalLogs} Baris</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Pengguna (Changed By)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama admin..." 
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Mulai</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Akhir</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden w-full">
        
        {/* Table container */}
        <div className="overflow-x-auto">
          {/* Base Font Size Dikecilkan dari text-sm ke text-xs md:text-[13px] */}
          <table className="w-full text-left text-xs md:text-[13px] text-gray-600 dark:text-gray-400 table-auto">
            {/* Header Table (Dikecilkan ke text-[11px] / py-3) */}
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] md:text-[11px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 w-10 text-center"></th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">ID Entitas</th>
                <th className="px-4 py-3">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <span>Memuat log keamanan...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileJson className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <span>Tidak ada log yang ditemukan.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedRows.has(log.id);
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => toggleRow(log.id)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors ${isExpanded ? 'bg-orange-50/20 dark:bg-orange-500/5' : ''}`}
                      >
                        {/* Padding Baris (py-4 dikecilkan ke py-2.5) */}
                        <td className="px-4 py-2.5 text-center">
                          <button className="text-gray-400 hover:text-orange-500 transition-colors">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {/* Badge padding dipersempit */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wide ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-300 whitespace-nowrap">
                          {log.entity_name}
                        </td>
                        <td className="px-4 py-2.5">
                          {/* Font monospaced & padding dikecilkan */}
                          <span className="font-mono text-[11px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 break-all inline-block">
                            {log.entity_id}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {log.changed_by}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/30 dark:bg-gray-950/20">
                          <td colSpan={6} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="pl-2 md:pl-8 pr-2">
                              <h4 className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileJson className="w-3.5 h-3.5" />
                                Perbandingan Data (Diff View)
                              </h4>
                              <DiffViewer oldJson={log.old_payload} newJson={log.new_payload} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Styled Pagination Controls */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalLogs}
          itemsPerPage={limit}
          onPageChange={(newPage) => setPage(newPage)}
          itemName="data log"
          isLoading={loading}
        />
      </div>
    </div>
  );
}