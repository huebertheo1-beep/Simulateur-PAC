
import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  label: string;
  postcode: string;
  city: string;
  context: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface Props {
  value: string;
  onChange: (address: string, departmentCode: string, lat?: number, lng?: number) => void;
}

export const AddressAutocomplete: React.FC<Props> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3 || isLocating) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        const results = data.features.map((f: any) => ({
          label: f.properties.label,
          postcode: f.properties.postcode,
          city: f.properties.city,
          context: f.properties.context,
          coordinates: f.geometry.coordinates,
        }));
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isLocating]);

  const handleSelect = (s: Suggestion) => {
    const deptCode = s.postcode.substring(0, 2);
    setQuery(s.label);
    setIsOpen(false);
    // Note: API returns [lng, lat]
    onChange(s.label, deptCode, s.coordinates[1], s.coordinates[0]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-semibold text-slate-700 mb-2 block">Adresse de votre maison</label>
      <div className="relative group">
        <input
          type="text"
          placeholder="Saisissez votre adresse..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") onChange("", "", undefined, undefined);
          }}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl pr-12 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm font-medium text-slate-800"
        />
        
        <div className="absolute right-2 top-1.5 flex gap-1">
          <div className="p-2 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[60] w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            Résultats trouvés
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-5 py-3.5 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 group"
            >
              <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.context}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
