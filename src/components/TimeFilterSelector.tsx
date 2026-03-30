import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { TimeFilter } from '../types';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';

export const TimeFilterSelector: React.FC = () => {
  const { timeFilter, setTimeFilter } = useData();

  const options: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ];

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
        <Calendar className="w-4 h-4 text-indigo-600" />
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="bg-transparent text-sm font-bold text-slate-700 outline-none appearance-none pr-6 cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 pointer-events-none" />
      </div>
    </div>
  );
};