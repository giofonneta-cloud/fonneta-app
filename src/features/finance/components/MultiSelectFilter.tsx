'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const clearAll = () => onChange([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && event.target === buttonRef.current) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors h-9 whitespace-nowrap"
      >
        <span className="text-slate-700">
          {label}
          {selectedValues.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {selectedValues.length}
            </span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                No hay opciones disponibles
              </div>
            ) : (
              options.map(option => (
                <label
                  key={option}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-50 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {option}
                  </span>
                </label>
              ))
            )}
          </div>

          {selectedValues.length > 0 && (
            <div className="p-2 border-t border-slate-100">
              <button
                onClick={clearAll}
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
