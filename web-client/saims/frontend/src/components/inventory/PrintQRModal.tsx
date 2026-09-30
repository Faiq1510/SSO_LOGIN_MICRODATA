import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, QrCode } from 'lucide-react';
import { Asset } from '@/types';

interface PrintQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset;
}

export default function PrintQRModal({ isOpen, onClose, asset }: PrintQRModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !asset) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      
      // We want to print just the QR code div
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code - ${asset.id}</title>
              <style>
                body {
                  font-family: monospace;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                .print-container {
                  text-align: center;
                  padding: 20px;
                  border: 1px dashed #ccc;
                }
                h2 {
                  margin-top: 15px;
                  margin-bottom: 5px;
                  font-size: 18px;
                }
                p {
                  margin: 0;
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                ${printContent.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); }
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5" /> Cetak QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center">
          <div ref={printRef} className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-black">
            <QRCodeSVG value={asset.qr_code} size={200} level="H" includeMargin={true} />
            <h2 className="font-bold text-lg mt-4">{asset.id}</h2>
            <p className="text-sm text-gray-500 font-medium truncate max-w-[220px]">{asset.name}</p>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
            Scan QR Code ini menggunakan aplikasi SAIMS untuk melihat detail aset secara instan.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
