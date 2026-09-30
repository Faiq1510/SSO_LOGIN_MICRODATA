import React from "react";

interface HeaderHalamanProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const HeaderHalaman: React.FC<HeaderHalamanProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default HeaderHalaman;
