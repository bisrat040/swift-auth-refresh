import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  Wrench,
  Car,
  Loader2,
  FileText,
  FileSpreadsheet,
  Trash2,
  Filter,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { TimeFilterSelector } from './TimeFilterSelector';
import { ReportModal } from './modals/ReportModal';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export const Reports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Reports');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser, isSuperAdmin } = useUser();
  const { reports, isLoading: dataLoading } = useData();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return (reports || []).filter(report => {
      const matchesSearch = (report.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All Reports' || report.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [reports, searchTerm, typeFilter]);

  const handleDownload = (report: any) => {
    setIsDownloading(report.id);
    
    // Simulate real report generation and download
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: `Authenticating data stream for ${report.title}...`,
        success: () => {
           setIsDownloading(null);
           
           // Simulate file download by creating a dummy file
           const content = `Report Title: ${report.title}
Generated on: ${report.generatedDate}
Category: ${report.type}
Format: ${report.format}`;
           const blob = new Blob([content], { type: 'text/plain' });
           const url = URL.createObjectURL(blob);
           const link = document.createElement('a');
           link.href = url;
           link.download = `${report.title.replace(/\s+/g, '_')}_${report.id.slice(0, 8)}.${report.format.toLowerCase()}`;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);

           return `"${report.title}.${report.format.toLowerCase()}" downloaded successfully!`;
        },
        error: 'Failed to stream report data.',
      }
    );
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report record permanently?')) return;
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      toast.success('System record purged successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete report');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence & Audits</h2>
          <p className="text-slate-500 text-sm font-medium">Generate and monitor property performance datasets</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilterSelector />
          {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> New Intelligence Report
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search generated intelligence files..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3.5 text-sm border-none bg-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
        </div>
        <div className="relative w-full sm:w-auto">
           <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
           <select 
             className="w-full sm:w-auto pl-11 pr-8 py-3.5 text-sm border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-black text-slate-600 appearance-none shadow-sm"
             value={typeFilter} 
             onChange={(e) => setTypeFilter(e.target.value)}
           >
             <option>All Reports</option>
             <option>Financial</option>
             <option>Occupancy</option>
             <option>Maintenance</option>
             <option>Tenant</option>
             <option>Parking</option>
             <option>Tax</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-6">Intelligence File Title</th>
                  <th className="px-8 py-6">Categorization</th>
                  <th className="px-8 py-6">Output Format</th>
                  <th className="px-8 py-6">Generated Timestamp</th>
                  <th className="px-8 py-6 text-right">System Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-indigo-50/10 transition-colors group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{report.title}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">UID: {report.id.toUpperCase().slice(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-white border border-slate-200 text-slate-500 uppercase tracking-wider">{report.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                        report.format === 'PDF' ? "bg-rose-50 text-rose-600 border border-rose-100" : 
                        report.format === 'Excel' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                        "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      )}>
                        {report.format}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-bold text-slate-400">{report.generatedDate}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(report)}
                          disabled={isDownloading === report.id}
                          className="p-3 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all active:scale-90 disabled:opacity-50"
                          title="Download Data Stream"
                        >
                          {isDownloading === report.id ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Download className="w-4.5 h-4.5" />}
                        </button>
                        {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            title="Purge Record"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                       <div className="flex flex-col items-center gap-4 text-slate-300">
                          <BarChart3 className="w-16 h-16 opacity-20" />
                          <p className="text-sm font-black uppercase tracking-[0.2em] italic">No intelligence reports detected in archival storage.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
               <Users className="w-6 h-6" />
            </div>
            <h4 className="font-black text-lg text-slate-900 mb-2">Tenant Demographics</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Comprehensive analysis of occupancy trends and business industry distribution.</p>
            <button onClick={() => toast.success('Snapshot queued for next period.')} className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">Queue Snapshot</button>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
               <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="font-black text-lg text-slate-900 mb-2">Yield Analysis</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Financial yield performance vs market benchmarks and operational overheads.</p>
            <button onClick={() => toast.success('Yield snapshot queued successfully.')} className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all">Queue Snapshot</button>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
               <Wrench className="w-6 h-6" />
            </div>
            <h4 className="font-black text-lg text-slate-900 mb-2">Operational Friction</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Detailed log of maintenance response times and recurring structural issues.</p>
            <button onClick={() => toast.success('Operational audit queued.')} className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all">Queue Snapshot</button>
         </div>
      </div>

      <ReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};