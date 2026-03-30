import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  MoreVertical, 
  MessageSquare,
  Loader2,
  Send,
  X,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MaintenanceRequest, Tenant } from '../types';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { TimeFilterSelector } from './TimeFilterSelector';
import { MaintenanceModal } from './modals/MaintenanceModal';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles = { Urgent: 'bg-rose-100 text-rose-700 border-rose-200', High: 'bg-orange-100 text-orange-700 border-orange-200', Medium: 'bg-amber-100 text-amber-700 border-amber-200', Low: 'bg-slate-100 text-slate-700 border-slate-200' };
  return <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider", styles[priority as keyof typeof styles] || styles.Medium)}>{priority}</span>;
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Open': return <div className="p-2 bg-amber-50 rounded-xl border border-amber-100"><Clock className="w-5 h-5 text-amber-500" /></div>;
    case 'In Progress': return <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100"><Wrench className="w-5 h-5 text-indigo-500" /></div>;
    case 'Resolved': return <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>;
    default: return <div className="p-2 bg-slate-50 rounded-xl border border-slate-100"><XCircle className="w-5 h-5 text-slate-400" /></div>;
  }
};

const ChatBox = ({ request, onClose }: { request: MaintenanceRequest; onClose: () => void }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${request.tenantName}, the plumber will arrive tomorrow at 10 AM.`, sender: 'me', time: '10:30 AM' },
    { id: 2, text: 'Okay, I will be home. Thanks.', sender: 'tenant', time: '10:35 AM' }
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
        text: 'Noted. See you then!',
        sender: 'tenant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[450px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
            {request.unit}
          </div>
          <div>
            <p className="text-sm font-black leading-tight">{request.tenantName}</p>
            <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-tighter">Unit Maintenance Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
        {messages.map(msg => (
          <div key={msg.id} className={cn("max-w-[85%] flex flex-col", msg.sender === 'me' ? "ml-auto items-end" : "items-start")}>
            <div className={cn(
              "px-4 py-3 rounded-[1.25rem] text-sm font-medium shadow-sm",
              msg.sender === 'me' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
            )}>
              {msg.text}
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">{msg.time}</span>
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
            placeholder="Send update to tenant..." 
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const Maintenance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { currentUser, isSuperAdmin } = useUser();
  const { maintenanceRequests, isLoading: dataLoading } = useData();

  const filteredRequests = useMemo(() => {
    return (maintenanceRequests || []).filter(req => {
      const matchesSearch = (req.issue || '').toLowerCase().includes(searchTerm.toLowerCase()) || (req.unit || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || statusFilter === 'All Statuses' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [maintenanceRequests, searchTerm, statusFilter]);

  const selectedRequest = useMemo(() => 
    (maintenanceRequests || []).find(r => r.id === selectedRequestId), 
  [selectedRequestId, maintenanceRequests]);

  const handleCreate = () => {
    setEditingRequest(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (req: MaintenanceRequest) => {
    setEditingRequest(req);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      const { error } = await supabase.from('maintenance_requests').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted successfully');
      if (selectedRequestId === id) setSelectedRequestId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record');
    }
  };

  const handleStatusQuickUpdate = async (status: string) => {
    if (!selectedRequest) return;
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status })
        .eq('id', selectedRequest.id);
      
      if (error) throw error;
      toast.success(`Request status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Tracker</h2>
          <p className="text-slate-500 text-sm">Monitor and manage property service requests</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilterSelector />
          {(isSuperAdmin || currentUser?.role === 'ADMIN' || currentUser?.role === 'MAINTENANCE_CREW') && (
            <button 
              onClick={handleCreate} 
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by issue or unit..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 text-sm border-none bg-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
            <select 
              className="text-sm border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none p-3.5 bg-white min-w-[160px] font-bold text-slate-600 appearance-none"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>

          <div className="space-y-4">
            {dataLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
            ) : filteredRequests.length > 0 ? filteredRequests.map((req) => (
              <motion.div 
                layoutId={req.id}
                key={req.id} 
                onClick={() => setSelectedRequestId(req.id)} 
                className={cn(
                  "bg-white p-6 rounded-[2rem] border transition-all cursor-pointer shadow-sm group", 
                  selectedRequestId === req.id ? "border-indigo-600 ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-indigo-300"
                )}
              >
                <div className="flex items-start gap-5">
                  <StatusIcon status={req.status || 'Open'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Unit {req.unit}</h4>
                          <PriorityBadge priority={req.priority} />
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(req); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 line-clamp-1 mb-3">{req.issue}</p>
                    <div className="flex items-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {req.dateReported}</span>
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {req.tenantName}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : <div className="py-20 text-center">
                <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black italic">No active maintenance requests found.</p>
            </div>}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 sticky top-24"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Request Overview</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(selectedRequest)}
                      className="p-3 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"
                      title="Edit Request"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Summary</p>
                    <p className="text-sm text-slate-900 font-black">{selectedRequest.issue}</p>
                  </div>
                  
                  {selectedRequest.description && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Description</p>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {selectedRequest.description}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</p>
                      <PriorityBadge priority={selectedRequest.priority} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Status</p>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase">{selectedRequest.status}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleStatusQuickUpdate('In Progress')} 
                      className="py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[1.5rem] text-xs font-black hover:bg-indigo-50 transition-all active:scale-95"
                    >
                      Start Work
                    </button>
                    <button 
                      onClick={() => handleStatusQuickUpdate('Resolved')} 
                      className="py-4 bg-emerald-600 text-white rounded-[1.5rem] text-xs font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                    >
                      Mark Resolved
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-[1.5rem] text-xs font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                  >
                    <MessageSquare className="w-4 h-4" /> Message Tenant
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-indigo-50/20 p-12 rounded-[2.5rem] border-2 border-dashed border-indigo-100 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-200 mx-auto mb-6 shadow-xl shadow-indigo-50">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-black text-indigo-900 mb-2">No Request Selected</h4>
                <p className="text-sm font-bold text-indigo-400">Select a maintenance ticket from the list to manage the resolution workflow.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {isChatOpen && selectedRequest && <ChatBox request={selectedRequest} onClose={() => setIsChatOpen(false)} />}
      <MaintenanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} request={editingRequest} />
    </div>
  );
};