import React from "react";

interface AuthShellProps {
  children: React.ReactNode;
}

const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-4 py-12">
      <a href="/" className="mb-8 block">
        <img src="/microdata-logo.webp" alt="Microintern" className="h-9 w-auto" />
      </a>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

export default AuthShell;
