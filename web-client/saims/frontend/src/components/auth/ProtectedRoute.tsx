"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userCookie = Cookies.get('saims_user');
    
    if (!userCookie) {
      router.replace('/');
      return;
    }

    try {
      const user = JSON.parse(userCookie);
      
      if (allowedRoles && allowedRoles.length > 0) {
        if (allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
        } else {
          // Redirect if role is not allowed
          router.replace('/dashboard');
        }
      } else {
        setIsAuthorized(true);
      }
    } catch (e) {
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
