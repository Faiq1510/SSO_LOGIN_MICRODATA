import React from 'react';
import ErrorView from '@/components/ui/ErrorView';

export default function NotFound() {
  return (
    <ErrorView
      code={404}
      title="Halaman Tidak Ditemukan"
      message="Halaman yang Anda tuju tidak dapat ditemukan di dalam sistem SAIMS. Periksa kembali URL yang Anda masukkan."
    />
  );
}
