'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  isLoading?: boolean;
}

export const getPaginationRange = (currentPage: number, totalPages: number): (number | string)[] => {
  const delta = 1;
  const range: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  const left = currentPage - delta;
  const right = currentPage + delta;
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
  }

  return rangeWithDots;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  itemName = 'data',
  isLoading = false
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= itemsPerPage)) {
    return null;
  }

  const paginationRange = getPaginationRange(currentPage, totalPages);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : currentPage * itemsPerPage;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-800/80 px-4 md:px-6 py-4 bg-white dark:bg-gray-900/90 backdrop-blur-xs transition-colors rounded-b-xl">
      {/* Item Range Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {totalItems !== undefined ? (
          <span>
            Menampilkan{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {totalItems > 0 ? startItem : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {endItem}
            </span>{' '}
            dari{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {totalItems}
            </span>{' '}
            {itemName}
          </span>
        ) : (
          <span>
            Halaman <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> dari{' '}
            <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page Button (Visible if totalPages > 5) */}
        {totalPages > 5 && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
            aria-label="Halaman Pertama"
            title="Halaman Pertama"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          aria-label="Halaman Sebelumnya"
          title="Halaman Sebelumnya"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered Page Buttons with Smart Ellipsis Truncation */}
        <div className="flex items-center gap-1">
          {paginationRange.map((pageItem, index) => {
            if (typeof pageItem === 'string') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-600 select-none"
                >
                  •••
                </span>
              );
            }

            const isCurrent = pageItem === currentPage;

            return (
              <button
                key={pageItem}
                onClick={() => onPageChange(pageItem)}
                disabled={isLoading}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs ring-2 ring-gray-900/10 dark:ring-white/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                {pageItem}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Halaman Selanjutnya"
          title="Halaman Selanjutnya"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button (Visible if totalPages > 5) */}
        {totalPages > 5 && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            aria-label="Halaman Terakhir"
            title="Halaman Terakhir"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
