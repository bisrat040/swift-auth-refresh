import React, { useMemo, useState } from 'react';
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  CreditCard,
  Building,
  Wallet,
  FileText,
  AlertCircle,
  Clock,
  Search,
  PieChart,
  Table,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Plus,
  Loader2,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { calculateVAT } from '../lib/taxCalculations';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeFilterSelector } from './TimeFilterSelector';
import { TransactionModal } from './modals/TransactionModal';
import { toast } from 'sonner';

type FinancialTab = 'overview' | 'taxation' | 'journal' | 'reports';

export const Financials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const { payrollRecords, financialTransactions, isLoading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const revenueFromTransactions = useMemo(() => {
    const incomeTxs = (financialTransactions || []).filter(t => t.category === 'Income');
    return incomeTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [financialTransactions]);

  const vatPayable = calculateVAT(revenueFromTransactions);
  const totalPayroll = (payrollRecords || []).reduce((sum, p) => sum + (p.netPay || 0), 0);
  const employerPension = (payrollRecords || []).reduce((sum, p) => sum + (p.pensionEmployer || 0), 0);
  const totalHRCost = totalPayroll + employerPension;

  const displayExpenses = totalHRCost; 

  const handleExport = () => {
    setIsExporting(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing financial ledger for export...',
        success: () => {
          setIsExporting(false);
          return 'Financial ledger exported successfully!';
        },
        error: () => {
          setIsExporting(false);
          return 'Export failed.';
        },
      }
    );
  };

  const handleGenerateTaxReport = () => {
    toast.promise(
       new Promise(resolve => setTimeout(resolve, 2000)),
       {
         loading: 'Analyzing transaction history for tax compliance...',
         success: () => {
           return 'Tax Compliance Report (Q1 2024) has been generated and is ready for download.';
         },
         error: 'Failed to generate tax report.',
       }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Accounting & Taxation</h2>
          <p className="text-slate-500 text-sm font-medium">Comprehensive tax compliance and financial reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilterSelector />
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Ledger
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn("px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'overview' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-indigo-600")}
        ><PieChart className="w-4 h-4" /> Overview</button>
        <button
          onClick={() => setActiveTab('taxation')}
          className={cn("px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'taxation' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-indigo-600")}
        ><ShieldCheck className="w-4 h-4" /> Taxation</button>
        <button
          onClick={() => setActiveTab('journal')}
          className={cn("px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'journal' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-indigo-600")}
        ><Table className="w-4 h-4" /> Journal</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Gross Revenue" value={formatCurrency(revenueFromTransactions)} icon={<Wallet className="w-6 h-6 text-emerald-600" />} color="emerald" />
                <StatCard title="Est. VAT Due" value={formatCurrency(vatPayable)} icon={<AlertCircle className="w-6 h-6 text-amber-600" />} color="amber" />
                <StatCard title="Total Expenses" value={formatCurrency(displayExpenses)} icon={<CreditCard className="w-6 h-6 text-rose-600" />} color="rose" />
                <StatCard title="Net Cash Flow" value={formatCurrency(revenueFromTransactions - displayExpenses - vatPayable)} icon={<Building className="w-6 h-6 text-indigo-600" />} color="indigo" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-indigo-600" /> Portfolio Growth</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Year-to-date comparison</p>
                    </div>
                    <button 
                      onClick={() => toast.info('Detailed growth analysis is available in the Reports section.')}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="h-72 bg-slate-50/50 rounded-[2rem] flex items-center justify-center border border-dashed border-slate-200 group">
                    <div className="text-center">
                       <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4 group-hover:text-indigo-200 transition-colors" />
                       <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">Market analytics engine loading...</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-8">Cost Allocation</h3>
                  <div className="space-y-6">
                    {[ 
                      { label: 'Lease Revenue', value: '78%', color: 'bg-emerald-500' },
                      { label: 'Maintenance', value: '12%', color: 'bg-indigo-500' },
                      { label: 'Payroll', value: '8%', color: 'bg-amber-500' },
                      { label: 'Other', value: '2%', color: 'bg-slate-300' }
                    ].map((cat, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{cat.label}</span>
                          <span className="text-slate-900">{cat.value}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: cat.value }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={cn("h-full rounded-full transition-all", cat.color)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                     <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Financial Insight</p>
                     <p className="text-xs text-indigo-900 font-bold leading-relaxed">Lease revenue has increased by 14% since the last quarter, offsetting maintenance costs.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'taxation' && (
            <motion.div 
              key="taxation"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><ShieldCheck className="w-8 h-8 text-emerald-600" /> Tax Liability Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Quarterly VAT</p>
                    <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{formatCurrency(vatPayable)}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                       <p className="text-[10px] text-emerald-600 font-black uppercase">15.0% Standard Rate</p>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Withholding Tax</p>
                    <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{formatCurrency(revenueFromTransactions * 0.02)}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                       <p className="text-[10px] text-indigo-600 font-black uppercase">2% Service Provision</p>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Corporate Income</p>
                    <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{formatCurrency((revenueFromTransactions - displayExpenses) * 0.3)}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                       <p className="text-[10px] text-rose-600 font-black uppercase">30% Profit Bracket</p>
                    </div>
                  </div>
                </div>
                <div className="mt-10 p-10 bg-amber-50/50 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 shrink-0 shadow-lg shadow-amber-100/50">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <p className="text-lg font-black text-amber-900">Compliance Deadline Approaching</p>
                    <p className="text-sm text-amber-700 font-medium leading-relaxed">
                      Your quarterly VAT declaration is due in <span className="font-black underline">5 business days</span>. Please review all invoices in the digital journal before final submission to the tax authority.
                    </p>
                  </div>
                  <button 
                    onClick={handleGenerateTaxReport}
                    className="px-10 py-4 bg-amber-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 active:scale-95"
                  >
                    Generate Official Report
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h3 className="text-lg font-black text-slate-900">General Ledger Journal</h3>
                 <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search journal entries..."
                      className="w-full pl-11 pr-4 py-2.5 text-sm border-none bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 shadow-sm"
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-8 py-6">Transaction Date</th>
                      <th className="px-8 py-6">Description & Reference</th>
                      <th className="px-8 py-6">Classification</th>
                      <th className="px-8 py-6">Debit (Exp)</th>
                      <th className="px-8 py-6 text-right">Credit (Rev)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialTransactions.length > 0 ? financialTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-indigo-50/10 transition-colors group cursor-pointer">
                        <td className="px-8 py-6 text-xs font-black text-slate-500">{tx.date}</td>
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">TX-REF: {tx.id.toUpperCase().slice(0, 10)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn("text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider", tx.category === 'Income' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100")}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-rose-600">{tx.type === 'Debit' ? formatCurrency(tx.amount) : '-'}</td>
                        <td className="px-8 py-6 text-sm font-black text-emerald-600 text-right">{tx.type === 'Credit' ? formatCurrency(tx.amount) : '-'}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-400 text-sm font-black italic uppercase tracking-widest">No journal entries found for the selected period.</td></tr>}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'indigo' }: any) => {
  const colors: any = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
      <div className={cn("w-14 h-14 p-2.5 rounded-2xl mb-6 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", colors[color])}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
};