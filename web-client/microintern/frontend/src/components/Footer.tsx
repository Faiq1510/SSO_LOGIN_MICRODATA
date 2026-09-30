import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-0 border-t border-border-subtle py-6 px-4 md:px-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="/microdata-logo.webp" alt="Microdata Logo" className="h-7 w-auto opacity-60" />
          <span className="font-mono-data text-xs text-text-muted">© {new Date().getFullYear()} Microdata Indonesia</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
