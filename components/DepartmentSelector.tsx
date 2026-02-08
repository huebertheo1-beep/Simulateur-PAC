
import React from 'react';
import { DEPARTMENTS } from '../constants';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const DepartmentSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">Département</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
      >
        <option value="">Sélectionnez votre département</option>
        {DEPARTMENTS.map(d => (
          <option key={d.code} value={d.code}>
            {d.code} - {d.name}
          </option>
        ))}
      </select>
    </div>
  );
};
