import React, { useMemo } from 'react';
import { Wallet, Info, ArrowUpRight } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';
import { Tenant, Lease } from '../../types';
import { DEFAULT_VAT_RATE } from '../../lib/taxCalculations';

interface TotalPaidDisplayProps {
  tenant: Tenant;
  lease?: Lease; // Optional override for better control from parent
  className?: string;
}

const getMultiplier = (frequency: string): number => {
  if (!frequency) return 1;
  const legacy: Record<string, number> = {
    'Monthly': 1,
    'Quarterly': 3,
    'Semi-Annually': 6,
    'Yearly': 12
  };
  
  if (legacy[frequency]) return legacy[frequency];
  const parsed = parseInt(frequency);
  return isNaN(parsed) ? 1 : parsed;
};

export const TotalPaidDisplay: React.FC<TotalPaidDisplayProps> = ({ tenant, lease: leaseProp, className }) => {
  const { leases } = useData();

  const lease = useMemo(() => 
    leaseProp || leases.find(l => l.tenantId === tenant.id || l.tenantName === tenant.name),
    [leases, tenant, leaseProp]
  );

  const calculation = useMemo(() => {
    if (!lease) return null;

    const rentedSqm = lease.sqm || 0;
    const pricePerSquare = lease.pricePerSqm || 0;
    const paymentTerm = getMultiplier(lease.paymentFrequency || '1');
    const vatRate = (lease.vatRate || (DEFAULT_VAT_RATE * 100)) / 100;

    // Formula: (rented_sqm * price_per_square * payment_term) * (1 + VAT_rate)
    const baseAmount = rentedSqm * pricePerSquare * paymentTerm;
    const totalPaid = baseAmount * (1 + vatRate);

    return {
      rentedSqm,
      pricePerSquare,
      paymentTerm,
      vatRate: vatRate * 100,
      baseAmount,
      totalPaid
    };
  }, [lease]);

  if (!calculation) {
    return (
      <div className={cn("bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl flex items-center gap-4", className)}>
        <div className="p-3 bg-white/10 rounded-2xl">
          <Info className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lease Data Missing</p>
          <p className="text-sm font-bold text-slate-300">Could not calculate Total Paid for this tenant profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group transition-all hover:shadow-indigo-500/10", className)}>
      {/* Decorative Elements */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/40">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Individual Profile Analytics</h4>
              <p className="text-xl font-black text-white">Total Paid <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest ml-1">(Agreement Values)</span></p>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-white/30 transition-all cursor-pointer">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
              {formatCurrency(calculation.totalPaid)}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                Gross Total
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Including {calculation.vatRate}% VAT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Area (sqm)</p>
              <p className="text-sm font-bold text-slate-200">{calculation.rentedSqm} m²</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rate / m²</p>
              <p className="text-sm font-bold text-slate-200">{formatCurrency(calculation.pricePerSquare)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Term</p>
              <p className="text-sm font-bold text-slate-200">{calculation.paymentTerm} Mo</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">VAT Rate</p>
              <p className="text-sm font-bold text-slate-200">{calculation.vatRate}%</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Subtotal (Excl. VAT)</span>
              <span className="text-slate-200 font-bold">{formatCurrency(calculation.baseAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-white/5">
              <span className="text-slate-400 font-medium">VAT Amount</span>
              <span className="text-emerald-400 font-bold">+{formatCurrency(calculation.totalPaid - calculation.baseAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};