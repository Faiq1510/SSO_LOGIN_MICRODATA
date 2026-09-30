'use client';

import React from 'react';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function TextModal({ isOpen, onClose, title, content }: TextModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 flex flex-col max-h-[90vh] overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="text-[14px]">📝</span>
            </div>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Tutup teks detail"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    </div>
  );
}
