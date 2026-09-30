import React, { useState, useEffect, useRef, useCallback } from "react";

interface InputAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
  error?: string;
  name?: string;
  onBlur?: () => void;
  disabled?: boolean;
}

const InputAutocomplete: React.FC<InputAutocompleteProps> = ({ value, onChange, fetchSuggestions, placeholder, className, error, name, onBlur, disabled = false }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim() === "") {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      try {
        setIsLoading(true);
        const results = await fetchSuggestions(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSuggestions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      loadSuggestions(newVal);
    }, 250);
  };

  const handleFocus = () => {
    if (!disabled) {
      loadSuggestions(value);
    }
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={
          className ||
          `w-full bg-surface-0 border ${
            error ? "border-red-500" : "border-border-base"
          } text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`
        }
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface-0 border border-border-base rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-xs text-text-muted">Memuat saran...</div>
          ) : (
            <div className="py-1">
              {suggestions.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer ${
                    index === highlightedIndex ? "bg-brand/15 text-brand font-semibold" : "text-text-primary hover:bg-surface-1 hover:text-brand"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputAutocomplete;
