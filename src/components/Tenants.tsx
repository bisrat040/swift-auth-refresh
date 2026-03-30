import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal,
  BadgeCheck,
  Clock,
  AlertTriangle,
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Users,
  Briefcase,
  Wallet,
  FileSpreadsheet,
  Trash2,
  MessageCircle,
  Loader2,
  X,
  Send,
  Download,
  AlertCircle,
  History,
  Info,
  ChevronRight,
  Building2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { Tenant, UIConfiguration, TenantProfileConfig } from '../types';
import { tenantProfileUIConfig } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { ExcelImport } from './ExcelImport';
import { toast } from 'sonner';
import { TenantModal } from './modals/TenantModal';
import { supabase } from '../lib/supabase';
import { TotalPaidDisplay } from './tenants/TotalPaidDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const IconMap: Record<string, any> = {
  Mail, Phone, ShieldCheck, Calendar, CreditCard, FileText, Wallet, UserIcon, Trash2, MessageCircle, Download
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Active':
      return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><BadgeCheck className="w-3 h-3" /> Active</span>;
    case 'Late':
      return <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
    case 'Notice':
      return <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Moving Out</span>;
    default:
      return <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">{status || 'N/A'}</span>;
  }
};

const DynamicComponent: React.FC<{ config: UIConfiguration; data: any; onAction?: (id: string) => void }> = ({ config, data, onAction }) => {
  if (!data) return null;
  const value = config.dataKey ? data[config.dataKey] : null;
  const Icon = config.icon ? IconMap[config.icon] : null;

  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return 'N/A';
    if (config.formatter === 'currency') return formatCurrency(Number(value));
    return value;
  }, [value, config.formatter]);

  switch (config.type) {
    case 'avatar-header':
      return (
        <div className={cn("relative group", config.className)}>
          {value ? (
            <img src={value} alt="Avatar" className="w-full h-full object-cover rounded-full border-4 border-white shadow-md" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-50 rounded-full border-4 border-white shadow-md">
              <UserIcon className="w-12 h-12 text-indigo-600" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white" title="Online"></div>
        </div>
      );
    case 'data-field':
      return (
        <div className={config.className}>
          {config.label && <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-2">{config.label}:</span>}
          <span className="font-bold text-slate-900">{formattedValue}</span>
        </div>
      );
    case 'status-badge':
      return (
        <div className={cn("flex items-center", config.className)}>
          <StatusBadge status={String(value || 'Active')} />
        </div>
      );
    case 'stat-card':
      return (
        <div className={cn("group transition-all hover:shadow-md", config.className)}>
          <div className="flex items-center gap-3 mb-4">
            {Icon && (
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{config.label}</h4>
          </div>
          {config.label === 'Lease Period' ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-900">{data.leaseStart || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">Start Date</p>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{data.leaseEnd || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">End Date</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-black text-slate-900">{formattedValue}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Verified Data</p>
            </>
          )}
        </div>
      );
    case 'action-button':
      return (
        <button 
          onClick={() => onAction?.(config.id)}
          className={cn("active:scale-[0.98] transition-all", config.className)}
        >
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {config.label}
        </button>
      );
    default:
      return null;
  }
};

const ChatBox = ({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${tenant.name}, regarding your rent payment...`, sender: 'me', time: '10:30 AM' },
    { id: 2, text: 'Yes, I was just about to pay.', sender: 'tenant', time: '10:35 AM' }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Received. Thank you!',
        sender: 'tenant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[450px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
            {tenant.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{tenant.name || 'Unknown Tenant'}</p>
            <p className="text-[10px] text-indigo-100">Direct Tenant Messaging</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.map(msg => (
          <div key={msg.id} className={cn("max-w-[85%] flex flex-col", msg.sender === 'me' ? "ml-auto items-end" : "items-start")}>
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm",
              msg.sender === 'me' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
            )}>
              {msg.text}
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write a message..." 
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const TenantProfile = ({ 
  tenant, 
  onBack, 
  onEdit, 
  uiConfig 
}: { 
  tenant: Tenant; 
  onBack: () => void; 
  onEdit: () => void;
  uiConfig: TenantProfileConfig | null;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { leases } = useData();

  const lease = useMemo(() => 
    leases.find(l => l.tenantId === tenant.id || l.tenantName === tenant.name),
    [leases, tenant.id, tenant.name]
  );

  const handleAction = async (id: string) => {
    if (id === 'a2') onEdit();
    if (id === 'a1') setIsChatOpen(true);
    if (id === 'a3') {
      if (!confirm('Are you sure you want to delete this tenant record permanently?')) return;
      setIsDeleting(true);
      try {
        const { error } = await supabase.from('tenants').delete().eq('id', tenant.id);
        if (error) throw error;
        toast.success('Tenant record deleted successfully.');
        onBack();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete tenant');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!uiConfig) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Compiling Dynamic Profile...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Individual Profile</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resident UID: {tenant.id?.slice(0, 8) || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {uiConfig.actions.map(action => (
            <DynamicComponent key={action.id} config={action} data={tenant} onAction={handleAction} />
          ))}
          <button 
            onClick={() => handleAction('a3')} 
            disabled={isDeleting}
            className="bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Purge Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex flex-col items-center relative z-10">
              {uiConfig.header.map(comp => (
                <DynamicComponent key={comp.id} config={comp} data={tenant} />
              ))}
            </div>
            
            <div className="mt-10 space-y-5 pt-8 border-t border-slate-100">
              {uiConfig.details.map(detail => (
                <div key={detail.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-slate-400">
                    {detail.icon && IconMap[detail.icon] && React.createElement(IconMap[detail.icon], { className: "w-4.5 h-4.5" })}
                    <span className="text-[10px] font-black uppercase tracking-widest">{detail.label}</span>
                  </div>
                  <span className="text-slate-900 font-black">
                    {detail.dataKey ? (detail.formatter === 'currency' ? formatCurrency(tenant[detail.dataKey as keyof Tenant] as any) : tenant[detail.dataKey as keyof Tenant] as any) : 'N/A'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-3">
              <button 
                onClick={() => toast.info('Generating official residency clearance...') }
                className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                <Download className="w-4 h-4" /> Export Residency Data
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Internal Notes</h4>
             <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                "{tenant.notes || 'Standard residency terms apply. No historical violations or complaints recorded for this profile.'}"
             </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <TotalPaidDisplay tenant={tenant} lease={lease} />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100/50 p-1.5 rounded-2xl mb-8 h-auto flex-wrap shadow-inner border border-slate-200/50">
              <TabsTrigger value="overview" className="flex-1 py-3 px-6 rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Info className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="financials" className="flex-1 py-3 px-6 rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Wallet className="w-4 h-4" /> Financials
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 py-3 px-6 rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <History className="w-4 h-4" /> Activity Log
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="space-y-8 outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uiConfig.stats.map(stat => (
                      <DynamicComponent key={stat.id} config={stat} data={tenant} />
                    ))}
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mt-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Residency Timeline</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lifecycle Tracking</p>
                      </div>
                      <BadgeCheck className="w-8 h-8 text-emerald-500 opacity-20" />
                    </div>
                    <div className="relative pl-8 border-l-2 border-slate-100 space-y-10">
                       <div className="relative">
                          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lease Commencement</p>
                          <p className="text-sm font-black text-slate-900 mt-1">{tenant.leaseStart || 'N/A'}</p>
                       </div>
                       <div className="relative">
                          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status: {tenant.status || 'N/A'}</p>
                          <p className="text-sm font-medium text-slate-600 mt-1">Resident is currently in good standing with all utility payments verified.</p>
                       </div>
                       <div className="relative">
                          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Termination</p>
                          <p className="text-sm font-black text-slate-900 mt-1">{tenant.leaseEnd || 'N/A'}</p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-8 outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payment Ledger</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transactional History</p>
                      </div>
                      <button 
                        onClick={() => toast.info('Navigating to full accounting dashboard...') }
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                      >
                        Detailed Statements <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/80">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-8 py-6">Date</th>
                            <th className="px-8 py-6">Method</th>
                            <th className="px-8 py-6 text-center">Reference</th>
                            <th className="px-8 py-6 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(tenant.paymentHistory || []).map(payment => (
                            <tr key={payment.id} className="hover:bg-indigo-50/10 transition-colors group">
                              <td className="px-8 py-6 text-xs font-black text-slate-500">{payment.date}</td>
                              <td className="px-8 py-6 text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                                <CreditCard className="w-3.5 h-3.5 text-slate-300" />
                                {payment.method}
                              </td>
                              <td className="px-8 py-6 text-[10px] font-mono font-black text-slate-400 text-center">{payment.receiptNumber}</td>
                              <td className="px-8 py-6 text-sm font-black text-emerald-600 text-right">{formatCurrency(payment.amount)}</td>
                            </tr>
                          ))}
                          {(tenant.paymentHistory || []).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm italic font-medium uppercase tracking-widest bg-slate-50/30">No archival payments found for this profile.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="history" className="space-y-8 outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                   <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-24">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                         <History className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Activity Log Empty</h4>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">There are no administrative audit logs or system events recorded for this tenant profile in the current session.</p>
                   </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
      
      {isChatOpen && <ChatBox tenant={tenant} onClose={() => setIsChatOpen(false)} />}
    </motion.div>
  );
};

export const Tenants: React.FC = () => {
  const { tenants, isLoading: dataLoading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [uiConfig, setUiConfig] = useState<TenantProfileConfig | null>(tenantProfileUIConfig);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const { currentUser, isSuperAdmin } = useUser();

  // Unified configuration initialization
  useEffect(() => {
    if (!uiConfig) {
      setUiConfig(tenantProfileUIConfig);
    }
  }, [uiConfig]);

  const filteredTenants = useMemo(() => {
    return (tenants || []).filter(tenant => {
      if (!tenant) return false;
      const name = String(tenant.name || '');
      const unit = String(tenant.unit || (tenant as any).unitNumber || '');
      const status = String(tenant.status || '');

      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  const selectedTenant = useMemo(() => 
    (tenants || []).find(t => t.id === selectedTenantId), 
  [tenants, selectedTenantId]);

  const handleAddTenant = () => {
    setEditingTenant(undefined);
    setIsModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDataImported = (data: any[]) => {
    toast.success(`${data.length} records processed from Excel.`);
    refreshData('tenants');
  };

  if (selectedTenant) {
    return (
      <>
        <TenantProfile 
          tenant={selectedTenant} 
          onBack={() => setSelectedTenantId(null)} 
          onEdit={() => handleEditTenant(selectedTenant)}
          uiConfig={uiConfig}
        />
        <TenantModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          tenant={editingTenant} 
        />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tenant Directory</h2>
          <p className="text-slate-500 text-sm font-medium">Manage residency, communications, and agreement compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImport 
            entityType="Tenant" 
            onDataImported={handleDataImported} 
            trigger={
              <button className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
                <FileSpreadsheet className="w-4 h-4" />
                Import Dataset
              </button>
            }
          />
          {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
            <button 
              onClick={handleAddTenant}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Onboard Tenant
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search directory by name, email or unit identity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-sm border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium shadow-sm"
            />
          </div>
          <select 
            className="text-xs border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none p-3.5 bg-white min-w-[160px] font-black uppercase tracking-widest text-slate-600 appearance-none shadow-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Late</option>
            <option>Notice</option>
          </select>
        </div>

        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white">
            <div className="relative">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
               <Users className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Secure Directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-6">Resident Identity</th>
                  <th className="px-8 py-6">Unit Location</th>
                  <th className="px-8 py-6">Monthly Yield</th>
                  <th className="px-8 py-6">Current Status</th>
                  <th className="px-8 py-6">Lease Maturity</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.length > 0 ? filteredTenants.map((tenant) => {
                  const tenantUnit = tenant.unit || (tenant as any).unitNumber || 'N/A';
                  return (
                    <tr 
                      key={tenant.id} 
                      className="hover:bg-indigo-50/10 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTenantId(tenant.id)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                            {tenant.avatarUrl ? <img src={tenant.avatarUrl} alt="" className="w-full h-full object-cover" /> : (tenant.name?.charAt(0) || '?')}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{tenant.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{tenant.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <Building2 className="w-3.5 h-3.5 text-slate-300" />
                           <p className="text-xs font-black text-slate-700">Unit {tenantUnit}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(tenant.rentAmount || 0)}</p>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={tenant.status || 'Active'} />
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-bold text-slate-500">{tenant.leaseEnd || 'N/A'}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          className="p-3 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-indigo-600 active:scale-90 border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTenant(tenant);
                          }}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <AlertCircle className="w-16 h-16 opacity-10" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] italic">No records found matching your current query parameters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenant={editingTenant} 
      />
    </div>
  );
};