'use client';

import React, { useEffect } from 'react';
import ErrorView from '@/components/ui/ErrorView';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log uncaught error to console for diagnostic purposes
    console.error('SAIMS Runtime Error caught by error boundary:', error);
  }, [error]);

  return (
    <ErrorView
      code={500}
      title="Kendala Sistem Backend (500)"
      message={error?.message || "Terjadi kesalahan internal pada server backend SAIMS atau koneksi jaringan terputus."}
      onRetry={() => reset()}
    />
  );
}
