import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface CountryInfo {
  code: string;
  dial: string;
  name: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'bj', dial: '+229', name: 'Bénin' },
  { code: 'tg', dial: '+228', name: 'Togo' },
  { code: 'ci', dial: '+225', name: "Côte d'Ivoire" },
  { code: 'sn', dial: '+221', name: 'Sénégal' },
  { code: 'bf', dial: '+226', name: 'Burkina Faso' },
  { code: 'ne', dial: '+227', name: 'Niger' },
  { code: 'ml', dial: '+223', name: 'Mali' },
  { code: 'gn', dial: '+224', name: 'Guinée' },
  { code: 'cm', dial: '+237', name: 'Cameroun' },
  { code: 'ga', dial: '+241', name: 'Gabon' },
  { code: 'cd', dial: '+243', name: 'RDC' },
  { code: 'cg', dial: '+242', name: 'Congo' },
  { code: 'td', dial: '+235', name: 'Tchad' },
  { code: 'mr', dial: '+222', name: 'Mauritanie' },
  { code: 'fr', dial: '+33',  name: 'France' },
  { code: 'us', dial: '+1',   name: 'États-Unis' },
];

interface CountryDialPickerProps {
  value: string;
  onChange: (dial: string) => void;
  className?: string;
  size?: 'normal' | 'sm';
}

export function CountryFlag({ code, name, className = "w-6 h-4" }: { code: string; name: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  const lowerCode = code.toLowerCase();

  return (
    <span className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[3px] border border-slate-300/80 shadow-xs bg-slate-100 ${className}`}>
      <img
        src={hasError ? `https://flagcdn.com/w40/${lowerCode}.png` : `/flags/${lowerCode}.svg`}
        alt={name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </span>
  );
}

export function CountryDialPicker({
  value,
  onChange,
  className = "",
  size = 'normal'
}: CountryDialPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.dial === value) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredCountries = COUNTRIES.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 border border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer select-none ${
          isSmall ? 'py-2.5 px-3 text-xs' : 'py-3 px-3.5 text-sm'
        } ${isOpen ? 'ring-2 ring-emerald-500 border-emerald-500 bg-white' : ''}`}
        title={`Indicatif téléphonique : ${selectedCountry.name} (${selectedCountry.dial})`}
      >
        <CountryFlag code={selectedCountry.code} name={selectedCountry.name} className={isSmall ? "w-5 h-3.5" : "w-6 h-4"} />
        <span className="font-bold text-gray-900 tracking-tight">{selectedCountry.dial}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 max-h-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher pays ou indicatif..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-gray-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List of Countries */}
          <div className="overflow-y-auto flex-1 p-1 divide-y divide-slate-50">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.dial === selectedCountry.dial && c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.code}-${c.dial}`}
                    type="button"
                    onClick={() => {
                      onChange(c.dial);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl transition text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-gray-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag code={c.code} name={c.name} className="w-5 h-3.5" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="font-bold text-slate-500">{c.dial}</span>
                      {isSelected && <Check size={14} className="text-emerald-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
