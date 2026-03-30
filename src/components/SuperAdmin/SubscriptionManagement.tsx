import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Crown, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Settings2, 
  History, 
  XCircle,
  CreditCard,
  Calendar,
  X,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Download,
  MoreVertical,
  Plus,
  Layers,
  LayoutGrid,
  Trash2,
  UserPlus,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Subscription, SubscriptionPayment, SubscriptionTier, SubscriptionStatus, ContractTerm } from '../../types';
import { 
  getSubscriptions, 
  updateSubscription, 
  cancelSubscription, 
  getSubscriptionPayments, 
  createSubscription, 
  deleteSubscription,
  getConfirmedOwners 
} from '../../lib/supabase';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { SubscriptionPlans } from '../SubscriptionPlans';

export const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [confirmedOwners, setConfirmedOwners] = useState<{id: string, name: string, email: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // New State for internal tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');

  // For Edit/Create Modal
  const [editOwnerId, setEditOwnerId] = useState<string>('');
  const [editPlan, setEditPlan] = useState<SubscriptionTier>('BASIC');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('active');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editInterval, setEditInterval] = useState<'month' | 'year'>('month');
  const [editExpiry, setEditExpiry] = useState<string>('');
  const [editTrialDays, setEditTrialDays] = useState<number>(0);
  const [editContractTerm, setEditContractTerm] = useState<ContractTerm | undefined>(undefined);

  useEffect(() => {
    fetchData();
    fetchOwners();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsData, paymentsData] = await Promise.all([
        getSubscriptions(),
        getSubscriptionPayments()
      ]);
      setSubscriptions(subsData);
      setPayments(paymentsData);
    } catch (err: any) {
      toast.error('Failed to load subscription data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const owners = await getConfirmedOwners();
      setConfirmedOwners(owners);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch = (
        sub.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sub.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = subscriptions.filter(s => s.status === 'active');
    const monthlyRevenue = active.reduce((acc, sub) => acc + sub.price, 0);
    const proCount = active.filter(s => s.planName === 'PRO').length;
    const expiringSoon = subscriptions.filter(s => {
      const end = new Date(s.currentPeriodEnd);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000);
    }).length;

    return { monthlyRevenue, proCount, expiringSoon, total: subscriptions.length };
  }, [subscriptions]);

  const handleEditClick = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setEditPlan(sub.planName);
    setEditStatus(sub.status);
    setEditPrice(sub.price);
    setEditInterval(sub.billingInterval);
    setEditExpiry(sub.currentPeriodEnd.split('T')[0]);
    setEditTrialDays(sub.trialPeriodDays || 0);
    setEditContractTerm(sub.contractTerm);
    setIsEditModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditOwnerId('');
    setEditPlan('BASIC');
    setEditStatus('active');
    setEditPrice(15000);
    setEditInterval('month');
    setEditExpiry(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 6 months
    setEditTrialDays(0);
    setEditContractTerm('6 months');
    setIsCreateModalOpen(true);
  };

  const handleHistoryClick = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsHistoryModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSubscription) return;
    setUpdatingId(selectedSubscription.id);
    try {
      await updateSubscription(selectedSubscription.id, {
        planName: editPlan,
        status: editStatus,
        price: editPrice,
        billingInterval: editInterval,
        currentPeriodEnd: new Date(editExpiry).toISOString(),
        trialPeriodDays: editPlan === 'DEMO' ? editTrialDays : undefined,
        contractTerm: editPlan !== 'DEMO' ? editContractTerm : undefined
      });
      toast.success('Subscription updated successfully');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subscription');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreate = async () => {
    if (!editOwnerId) {
      toast.error('Please select a building owner');
      return;
    }
    setLoading(true);
    try {
      await createSubscription({
        ownerId: editOwnerId,
        planName: editPlan,
        status: editStatus,
        price: editPrice,
        billingInterval: editInterval,
        currentPeriodEnd: new Date(editExpiry).toISOString(),
        trialPeriodDays: editPlan === 'DEMO' ? (editTrialDays || 30) : undefined,
        contractTerm: editPlan !== 'DEMO' ? editContractTerm : undefined
      });
      toast.success('New subscription created successfully');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sub: Subscription) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE the subscription for ${sub.ownerName}? This action cannot be undone.`)) return;
    setUpdatingId(sub.id);
    try {
      await deleteSubscription(sub.id);
      toast.success('Subscription deleted permanently');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete subscription');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (sub: Subscription) => {
    const newStatus: SubscriptionStatus = sub.status === 'active' ? 'inactive' : 'active';
    setUpdatingId(sub.id);
    try {
      await updateSubscription(sub.id, { status: newStatus });
      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!confirm('Are you sure you want to cancel this subscription? The user will lose access at the end of the period.')) return;
    setUpdatingId(sub.id);
    try {
      await cancelSubscription(sub.id);
      toast.success('Subscription cancelled');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600" />
          <Loader2 className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Accessing Subscription Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000" 
            alt="Dashboard Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-indigo-500/20 backdrop-blur-md rounded-full border border-indigo-400/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Super Admin Console</span>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Subscription Controller</h1>
            <p className="text-slate-400 font-medium max-w-xl">
              Control building owner access tiers, manage revenue streams, and oversee the entire SaaS ecosystem from a single interface.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleCreateClick}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Subscription
            </button>
            <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-700 active:scale-95">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'overview' 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Layers className="w-4 h-4" />
          Registry Overview
        </button>
        <button 
          onClick={() => setActiveTab('plans')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'plans' 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Plan Configurations
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Active Revenue', value: `${stats.monthlyRevenue.toLocaleString()} ETB`, sub: 'Monthly recurring', icon: TrendingUp, color: 'indigo' },
              { label: 'Pro Members', value: stats.proCount, sub: 'Tier 2 Users', icon: Crown, color: 'emerald' },
              { label: 'Expiring Soon', value: stats.expiringSoon, sub: 'Next 7 Days', icon: AlertCircle, color: 'amber' },
              { label: 'Total Registry', value: stats.total, sub: 'All Owners', icon: ShieldCheck, color: 'slate' }
            ].map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={stat.label} 
                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110",
                    stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                    stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-[10px] font-black">12%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Table Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Filters */}
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by owner, email, or plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-bold transition-all shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full sm:w-40 px-4 py-3 text-sm border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold transition-all shadow-sm appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Showing {filteredSubscriptions.length} Registry Entries</p>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-6">Building Owner</th>
                    <th className="px-8 py-6">Plan & Tier</th>
                    <th className="px-8 py-6">Financials</th>
                    <th className="px-8 py-6">Renewal Date</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredSubscriptions.map((sub, idx) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={sub.id} 
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm">
                                {sub.ownerName?.charAt(0) || 'U'}
                              </div>
                              {sub.planName === 'PRO' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white">
                                  <Crown className="w-2.5 h-2.5" />
                                </div>
                              )}
                              {sub.planName === 'DEMO' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                                  <Timer className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{sub.ownerName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sub.ownerEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm flex items-center gap-1.5",
                                sub.planName === 'PRO' 
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                                  : sub.planName === 'DEMO'
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {sub.planName === 'PRO' && <Crown className="w-3 h-3" />}
                                {sub.planName === 'DEMO' && <Timer className="w-3 h-3" />}
                                {sub.planName}
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {sub.planName === 'DEMO' ? `Trial: ${sub.trialPeriodDays} Days` : sub.contractTerm || 'Monthly'}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{sub.price.toLocaleString()} ETB</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              billed {sub.billingInterval}ly
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-600">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{format(new Date(sub.currentPeriodEnd), 'MMM dd, yyyy')}</p>
                              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">
                                {Math.ceil((new Date(sub.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                              sub.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                              sub.status === 'cancelled' ? "bg-rose-50 text-rose-600 border border-rose-100" : 
                              "bg-slate-50 text-slate-500 border border-slate-100"
                            )}>
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                sub.status === 'active' ? "bg-emerald-500" : 
                                sub.status === 'cancelled' ? "bg-rose-500" : "bg-slate-400"
                              )} />
                              {sub.status}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleHistoryClick(sub)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                              title="Payment History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditClick(sub)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                              title="Configuration"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(sub)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1" />
                            <button 
                              onClick={() => handleStatusToggle(sub)}
                              disabled={updatingId === sub.id}
                              className={cn(
                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 shadow-sm",
                                sub.status === 'active' 
                                  ? "text-rose-600 bg-white border border-rose-100 hover:bg-rose-50"
                                  : "text-emerald-600 bg-white border border-emerald-100 hover:bg-emerald-50"
                              )}
                            >
                              {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (sub.status === 'active' ? 'Disable' : 'Enable')}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>

                  {filteredSubscriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-lg font-black text-slate-900">No registry entries found</h4>
                            <p className="text-sm text-slate-500 font-medium italic">We couldn't find any subscriptions matching your current search parameters or filters.</p>
                          </div>
                          <button 
                            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all disabled:opacity-50">Previous</button>
                <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all disabled:opacity-50">Next</button>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 1 of 1</p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
          <SubscriptionPlans />
        </div>
      )}

      {/* Create Subscription Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 relative z-10"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Provision Access</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">New Registry Entry</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Building Owner</label>
                    <select 
                      value={editOwnerId}
                      onChange={(e) => setEditOwnerId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all appearance-none shadow-inner"
                    >
                      <option value="">Select an Owner</option>
                      {confirmedOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Tier Selection</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'DEMO', label: 'Demo', color: 'amber' },
                        { id: 'BASIC', label: 'Basic', color: 'slate' },
                        { id: 'PRO', label: 'Pro', color: 'indigo' }
                      ].map((plan) => (
                        <button 
                          key={plan.id}
                          onClick={() => {
                            setEditPlan(plan.id as SubscriptionTier);
                            if (plan.id === 'DEMO') {
                              setEditPrice(0);
                              setEditTrialDays(30);
                              setEditInterval('month');
                            } else if (plan.id === 'BASIC') {
                              setEditPrice(15000);
                              setEditContractTerm('6 months');
                            } else {
                              setEditPrice(20000);
                              setEditContractTerm('1 year');
                            }
                          }}
                          className={cn(
                            "py-4 px-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2",
                            editPlan === plan.id 
                              ? plan.color === 'indigo' 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100" 
                                : plan.color === 'amber'
                                  ? "bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-100"
                                  : "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-100"
                              : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                          )}
                        >
                          {plan.id === 'PRO' ? <Crown className="w-4 h-4" /> : plan.id === 'DEMO' ? <Timer className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          {plan.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editPlan === 'DEMO' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Trial Period Days</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={editTrialDays}
                          onChange={(e) => setEditTrialDays(Number(e.target.value))}
                          className="w-full pl-5 pr-12 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Contract Term</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['6 months', '1 year'].map((term) => (
                          <button 
                            key={term}
                            onClick={() => setEditContractTerm(term as ContractTerm)}
                            className={cn(
                              "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                              editContractTerm === term 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Rate (ETB)</label>
                      <input 
                        type="number" 
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Expiry Date</label>
                      <input 
                        type="date" 
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleCreate}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Provisioning
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Subscription Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedSubscription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 relative z-10"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Settings2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Registry Config</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedSubscription.ownerName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Tier Selection</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'DEMO', label: 'Demo', color: 'amber' },
                        { id: 'BASIC', label: 'Basic', color: 'slate' },
                        { id: 'PRO', label: 'Pro', color: 'indigo' }
                      ].map((plan) => (
                        <button 
                          key={plan.id}
                          onClick={() => setEditPlan(plan.id as SubscriptionTier)}
                          className={cn(
                            "py-4 px-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2",
                            editPlan === plan.id 
                              ? plan.color === 'indigo' 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100" 
                                : plan.color === 'amber'
                                  ? "bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-100"
                                  : "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-100"
                              : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                          )}
                        >
                          {plan.id === 'PRO' ? <Crown className="w-4 h-4" /> : plan.id === 'DEMO' ? <Timer className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          {plan.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editPlan === 'DEMO' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Trial Period Days</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={editTrialDays}
                          onChange={(e) => setEditTrialDays(Number(e.target.value))}
                          className="w-full pl-5 pr-12 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Contract Term</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['6 months', '1 year'].map((term) => (
                          <button 
                            key={term}
                            onClick={() => setEditContractTerm(term as ContractTerm)}
                            className={cn(
                              "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                              editContractTerm === term 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Cycle Rate</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full pl-5 pr-12 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">ETB</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Billing Cycle</label>
                      <select 
                        value={editInterval}
                        onChange={(e) => setEditInterval(e.target.value as any)}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all appearance-none shadow-inner"
                      >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Expiry Protocol Date</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date" 
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                  <button 
                    onClick={handleUpdate}
                    disabled={updatingId !== null}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
                  >
                    {updatingId !== null ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Commit System Changes
                  </button>
                  <button 
                    onClick={() => handleCancel(selectedSubscription)}
                    className="w-full py-5 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 rounded-[1.5rem] transition-all border border-transparent hover:border-rose-100"
                  >
                    Immediate Access Revocation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedSubscription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 relative z-10"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <History className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Billing Records</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedSubscription.ownerName} &bull; ID: {selectedSubscription.id.slice(0,8)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto p-10 bg-white">
                <div className="space-y-6">
                  {payments.filter(p => p.subscriptionId === selectedSubscription.id).length > 0 ? (
                    payments.filter(p => p.subscriptionId === selectedSubscription.id).map((payment, pIdx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pIdx * 0.05 }}
                        key={payment.id} 
                        className="p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-indigo-100 hover:bg-indigo-50/20 transition-all group"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            payment.status === 'succeeded' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {payment.status === 'succeeded' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900">{payment.amount.toLocaleString()} ETB</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              {format(new Date(payment.paymentDate), 'MMM dd, yyyy')} 
                              <span className="text-slate-200">|</span> 
                              {payment.paymentMethod || 'SYSTEM_CREDIT'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border",
                            payment.status === 'succeeded' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {payment.status}
                          </span>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">TXN: {payment.transactionReference?.slice(0, 16)}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                        <CreditCard className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 italic uppercase tracking-[0.2em]">Zero Ledger Found.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Lifecycle Value</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {payments
                      .filter(p => p.subscriptionId === selectedSubscription.id && p.status === 'succeeded')
                      .reduce((acc, p) => acc + p.amount, 0)
                      .toLocaleString()} <span className="text-sm text-slate-400">ETB</span>
                  </p>
                </div>
                <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95">
                  Generate Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compliance Warning */}
      <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-colors duration-700" />
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-12 transition-transform duration-500">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3 relative z-10">
          <h4 className="text-2xl font-black tracking-tight">Access Control Protocol Enforcement</h4>
          <p className="text-indigo-100 font-medium leading-relaxed opacity-90 max-w-2xl">
            Modifying tiers triggers immediate system-wide permissions updates. Downgrading an account will restrict HR, Parking, and Accounting modules for all associated property managers and employees instantly.
          </p>
        </div>
        <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-xl active:scale-95 shrink-0">
          Review Legal Terms
        </button>
      </div>
    </div>
  );
};