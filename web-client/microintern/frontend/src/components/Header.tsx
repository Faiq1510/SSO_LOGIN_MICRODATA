import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";

const Header: React.FC = () => {
  const [isLight, setIsLight] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || document.documentElement.classList.contains("light")) {
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsLight((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add("light");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.classList.remove("light");
        localStorage.setItem("theme", "dark");
      }
      return newTheme;
    });
  };

  return (
    <header className="w-full h-14 bg-surface-1/80 backdrop-blur-md border-b border-border-subtle px-4 md:px-10 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 md:gap-3">
        <img src="/microdata-logo.webp" alt="Microintern Logo" className="h-7 w-auto" />
        <span className="text-sm font-semibold text-text-primary hidden sm:block">Microintern</span>
      </Link>

      <div className="flex items-center gap-4">
        <nav className="hidden sm:flex items-center gap-4">
          <Link to="/panduan" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
            Panduan
          </Link>
          <Link to="/login" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
            Login
          </Link>
          <Link to="/registrasi" className="bg-brand hover:bg-brand/90 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
            Daftar
          </Link>
        </nav>

        <div className="h-6 w-px bg-border-base hidden sm:block"></div>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
          title="Ubah Tema"
          aria-label="Toggle Theme"
        >
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="sm:hidden p-1.5 text-text-secondary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-surface-1 border-b border-border-subtle sm:hidden flex flex-col p-4 shadow-lg gap-2">
          <Link to="/panduan" className="py-2 text-text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
            Panduan PKL
          </Link>
          <Link to="/login" className="py-2 text-text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
            Login
          </Link>
          <Link
            to="/registrasi"
            className="mt-1 text-center bg-brand hover:bg-brand/90 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm block"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Daftar Sekarang
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
