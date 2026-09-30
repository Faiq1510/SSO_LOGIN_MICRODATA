"use client";
import { useRouter } from "next/navigation";
import Login from "@/components/auth/Login";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (token: string, user: any) => {
    // Navigate to dashboard on success
    router.replace("/dashboard");
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
