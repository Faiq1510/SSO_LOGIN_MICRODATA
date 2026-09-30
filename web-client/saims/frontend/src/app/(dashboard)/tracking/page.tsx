"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Asset, Borrowing } from '@/types';
import { assetService } from '@/services/asset.service';
import { PackageSearch, AlertCircle, CheckCircle2, QrCode, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '@/lib/axios';

export default function TrackingPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<Asset | null>(null);
  const [activeBorrowing, setActiveBorrowing] = useState<Borrowing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    // Use a short timeout to prevent double-rendering in React 18 Strict Mode
    // The cleanup function will clear this timeout if unmounted immediately
    const renderTimeout = setTimeout(() => {
      scanner.render(onScanSuccess, onScanFailure);
    }, 50);

    return () => {
      clearTimeout(renderTimeout);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [scanResult]);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    // Stop scanning
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setScanResult(decodedText);
    
    // Process the QR code. Expecting format: SAIMS-{AssetID}
    let assetId = decodedText;
    if (decodedText.startsWith('SAIMS-')) {
      assetId = decodedText.replace('SAIMS-', '');
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await assetService.getAssetById(assetId);
      setAssetData(data);
      
      if (data.status === 'Dipinjam') {
        try {
          const res = await axiosInstance.get('/borrowings?limit=1000');
          const borrowings = res.data?.data || [];
          const active = borrowings.find((b: Borrowing) => b.asset_id === assetId && (b.status === 'Approved' || b.status === 'Menunggu_Kembali'));
          setActiveBorrowing(active || null);
        } catch (e) {
          console.error("Failed to fetch active borrowing", e);
        }
      } else {
        setActiveBorrowing(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Aset tidak ditemukan di dalam sistem.');
      setAssetData(null);
      setActiveBorrowing(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // silently ignore scan failures as they happen every frame a QR is not found
  };

  const resetScanner = () => {
    setScanResult(null);
    setAssetData(null);
    setActiveBorrowing(null);
    setError(null);
  };

  const handleReturnAsset = async () => {
    if (!activeBorrowing) return;
    setIsReturning(true);
    try {
      await axiosInstance.put(`/borrowings/${activeBorrowing.id}/status`, { status: 'Selesai' });
      alert('Aset berhasil dikembalikan!');
      // Refresh asset data
      const data = await assetService.getAssetById(activeBorrowing.asset_id);
      setAssetData(data);
      setActiveBorrowing(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Gagal menyelesaikan peminjaman');
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4 md:p-6" id="tracking-workspace">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scanner QR Aset</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pindai kode QR pada aset untuk melihat detail, riwayat peminjaman, dan status maintenance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Card */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[420px] h-full"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PackageSearch className="w-4 h-4" /> Area Pindai
            </h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-100/50 dark:bg-gray-950/50 overflow-y-auto">
            <div className={`w-full max-w-sm rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 bg-black shrink-0 ${scanResult ? 'hidden' : ''}`}>
              <style dangerouslySetInnerHTML={{__html: `
                #qr-reader {
                  border: none !important;
                  width: 100% !important;
                }
                #qr-reader button {
                  background-color: #4f46e5;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  margin: 10px 0;
                  cursor: pointer;
                  font-weight: 500;
                }
                #qr-reader a {
                  color: #4f46e5;
                  text-decoration: none;
                }
                #qr-reader video {
                  width: 100% !important;
                  height: auto !important;
                  object-fit: contain !important;
                }
                #qr-reader__dashboard_section_csr span {
                  color: white !important;
                }
                #qr-reader__scan_region {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
              `}} />
              <div id="qr-reader" className="w-full"></div>
            </div>

            {scanResult && (
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">QR Code Terdeteksi</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-mono mt-1 text-sm bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full inline-block">{scanResult}</p>
                </div>
                <button
                  onClick={resetScanner}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Pindai Ulang
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Result Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[420px] h-full"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Informasi Aset
            </h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {!scanResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600 space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <QrCode className="w-12 h-12" />
                </div>
                <p className="max-w-[200px] text-sm">Pindai QR code untuk menampilkan informasi aset di sini.</p>
              </div>
            ) : isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium text-sm animate-pulse">Mengambil data aset...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aset Tidak Ditemukan</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[250px] mx-auto">{error}</p>
                </div>
              </div>
            ) : assetData ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{assetData.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700">
                      {assetData.id}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                      {assetData.category}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mb-0.5 uppercase tracking-wider">Status</p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-400 text-xs">{assetData.status}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mb-0.5 uppercase tracking-wider">Kondisi</p>
                    <p className="font-bold text-amber-900 dark:text-amber-400 text-xs">{assetData.condition}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider">Lokasi</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">{assetData.location}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider">Tgl Perolehan</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">{assetData.purchase_date}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 col-span-2">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider">Nomor Serial</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white text-xs">{assetData.serial_number || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-xs border-b border-gray-200 dark:border-gray-800 pb-1">Detail Deskripsi</h4>
                  <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-2">
                    {assetData.description || 'Tidak ada deskripsi.'}
                  </div>
                </div>

                {activeBorrowing && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 animate-in fade-in zoom-in duration-300">
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5 text-xs">
                      <PackageSearch className="w-3.5 h-3.5" /> Aset Sedang Dipinjam
                    </h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mb-2">
                      Peminjam: <b>{activeBorrowing.borrower_name}</b> <br/>
                      Form ID: <span className="font-mono">{activeBorrowing.id}</span>
                    </p>
                    <button
                      onClick={handleReturnAsset}
                      disabled={isReturning}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isReturning ? 'Memproses...' : <><Check className="w-3.5 h-3.5" /> Selesaikan Peminjaman</>}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
