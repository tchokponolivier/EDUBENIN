import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export interface OptionItem {
  value: string;
  label: string;
  group?: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
  label: string;
  options: OptionItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  maxBadgeDisplay?: number;
  className?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Sélectionner...",
  allLabel = "Tous",
  maxBadgeDisplay = 2,
  className = ""
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectAll = () => {
    const visibleValues = filteredOptions.map(o => o.value);
    const newSelected = Array.from(new Set([...selectedValues, ...visibleValues]));
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.group && opt.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;
  const isPartiallySelected = selectedValues.length > 0 && selectedValues.length < options.length;

  // Selected label summary
  const getButtonText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (isAllSelected) return `Tous (${options.length})`;
    if (selectedValues.length === 1) {
      const match = options.find(o => o.value === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${selectedValues.length} sélectionné${selectedValues.length > 1 ? "s" : ""}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {label}
          {selectedValues.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
              {selectedValues.length}
            </span>
          )}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-left flex items-center justify-between gap-2 transition outline-none cursor-pointer ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white"
            : selectedValues.length > 0
            ? "border-emerald-300 bg-emerald-50/20 text-gray-900"
            : "border-slate-200 text-slate-700 hover:bg-slate-100/70"
        }`}
      >
        <span className="truncate flex-1">
          {getButtonText()}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedValues.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-0.5 hover:text-rose-600 hover:bg-rose-50 rounded transition"
              title="Effacer la sélection"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          {/* Quick Header Actions: Select All / Clear All */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Tout cocher
            </button>
            <span className="text-slate-300 text-xs">•</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600"
            >
              Tout décocher
            </button>
          </div>

          {/* Search box if more than 6 options */}
          {options.length > 6 && (
            <div className="p-2 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer les options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-slate-100/70 rounded-md outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto p-1 divide-y divide-slate-50 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                    className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                      isSelected
                        ? "bg-emerald-50/70 text-emerald-950 font-bold"
                        : "hover:bg-slate-100/80 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {opt.badge !== undefined && (
                      <span className="text-[10px] text-slate-400 font-normal shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
