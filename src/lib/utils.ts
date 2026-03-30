import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  subMonths, 
  format 
} from 'date-fns';
import { TimeFilter } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/([A-Z])/g, ($1) => `_${$1.toLowerCase()}`)]: toSnake(obj[key]),
      }),
      {}
    );
  }
  return obj;
}

export function getDateRangeForFilter(filter: TimeFilter): { from: string; to: string } | null {
  const now = new Date();
  let from: Date, to: Date;

  switch (filter) {
    case 'today':
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case 'this_week':
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'this_month':
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      from = startOfMonth(lastMonth);
      to = endOfMonth(lastMonth);
      break;
    case 'this_quarter':
      from = startOfQuarter(now);
      to = endOfQuarter(now);
      break;
    case 'this_year':
      from = startOfYear(now);
      to = endOfYear(now);
      break;
    case 'all':
    default:
      return null;
  }

  return {
    from: format(from, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    to: format(to, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
  };
}