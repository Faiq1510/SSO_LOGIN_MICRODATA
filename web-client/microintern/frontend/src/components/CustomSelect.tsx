import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option<T> {
  value: T;
  label: string;
}

interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
  align?: "left" | "right";
  direction?: "up" | "down";
}

const CustomSelect = <T extends string | number>({ value, onChange, options, className = "", align = "left", direction = "down" }: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const isUp = direction === "up";

  return (
    <div className={`relative inline-block ${className} ${isOpen ? "z-50" : ""}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-surface-2 border border-border-subtle hover:border-border-strong text-text-primary rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer outline-none focus:border-brand"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${isUp ? "bottom-full mb-1.5" : "top-full mt-1.5"} ${
            align === "right" ? "right-0" : "left-0"
          } z-50 min-w-[120px] rounded-xl border border-border-base bg-surface-1 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value.toString()}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                  option.value === value ? "bg-brand-dim text-brand font-bold" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
