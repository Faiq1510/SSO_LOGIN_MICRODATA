'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

function SSOCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');

    let isMounted = true;

    async function processAuth() {
      try {
        if (code) {
          const savedState = sessionStorage.getItem('sso_state');
          const codeVerifier = sessionStorage.getItem('sso_code_verifier');

          if (!returnedState || returnedState !== savedState) {
            throw new Error('State SSO tidak valid atau sudah kedaluwarsa.');
          }

          if (!codeVerifier) {
            throw new Error('Sesi verifikasi SSO tidak ditemukan.');
          }

          // 1. Panggil Next.js internal API route (bebas dari CORS)
          const response = await fetch('/api/sso/exchange', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              code_verifier: codeVerifier,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Gagal menukar kode otentikasi SSO.');
          }

          sessionStorage.removeItem('sso_state');
          sessionStorage.removeItem('sso_code_verifier');

          if (isMounted) {
            // 2. Simpan sesi user ke cookie & localStorage
            localStorage.setItem('saims_user', JSON.stringify(data.user));
            Cookies.set('saims_user', JSON.stringify(data.user), { expires: 1 });
            if (data.token) {
              localStorage.setItem('saims_token', data.token);
              Cookies.set('saims_token', data.token, { expires: 1 });
            }

            // 3. Masuk ke Dashboard SAIMS
            router.replace('/dashboard');
          }
          return;
        }

        if (isMounted) {
          setError('Parameter kode otentikasi SSO tidak ditemukan.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Gagal memproses autentikasi SSO.');
        }
      }
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full bg-gray-800 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Autentikasi SSO Gagal</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 text-white">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-semibold tracking-wide mb-2">Memproses Autentikasi Single Sign-On...</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">
        Mohon tunggu sebentar, kami sedang memverifikasi identitas Anda dari Portal SSO Microdata.
      </p>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 text-white">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      }
    >
      <SSOCallbackContent />
    </Suspense>
  );
}
