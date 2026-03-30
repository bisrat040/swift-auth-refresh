import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Car, 
  User, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  LogIn,
  ClipboardList,
  Phone,
  Info,
  X,
  Trash2,
  Loader2,
  Edit,
  Building,
  ShieldCheck,
  Users
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import { TimeFilterSelector } from './TimeFilterSelector';
import { ParkingSlotModal } from './modals/ParkingSlotModal';
import { supabase } from '../lib/supabase';
import { toSnake } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ParkingTab = 'slots' | 'guests';

export const Parking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<ParkingTab>('slots');
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(undefined);
  const { currentUser, isSuperAdmin } = useUser();
  const { parkingSlots, guestParkingRecords, isLoading: dataLoading } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newGuest, setNewGuest] = useState({ 
    guestName: '', 
    vehiclePlate: '', 
    contactNumber: '', 
    unitVisiting: '', 
    purpose: 'Personal' 
  });

  const filteredSlots = useMemo(() => 
    (parkingSlots || []).filter(slot => 
      (slot.slotNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
      (statusFilter === 'All' || statusFilter === 'All Status' || slot.status === statusFilter)
    ), 
  [parkingSlots, searchTerm, statusFilter]);

  const filteredGuests = useMemo(() => 
    (guestParkingRecords || []).filter(record => 
      (record.guestName || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
      (statusFilter === 'All' || statusFilter === 'All Status' || record.status === statusFilter)
    ), 
  [guestParkingRecords, searchTerm, statusFilter]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('guest_parking_records').insert(toSnake({ 
        ...newGuest, 
        checkInTime: new Date().toISOString(), 
        status: 'Active' 
      }));
      if (error) throw error;
      toast.success('Guest checked in successfully');
      setShowCheckInModal(false);
      setNewGuest({ guestName: '', vehiclePlate: '', contactNumber: '', unitVisiting: '', purpose: 'Personal' });
    } catch (err: any) { 
      toast.error(err.message || 'Failed to check in guest'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (recordId: string) => {
    if (!confirm('Are you sure you want to check out this guest?')) return;
    try {
      const { error } = await supabase
        .from('guest_parking_records')
        .update({ 
          status: 'Departed',
          checkOutTime: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) throw error;
      toast.success('Guest checked out successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to check out guest');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this parking slot?')) return;
    try {
      const { error } = await supabase.from('parking_slots').delete().eq('id', slotId);
      if (error) throw error;
      toast.success('Parking slot removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete slot');
    }
  };

  const handleAddSlot = () => { setEditingSlot(undefined); setIsSlotModalOpen(true); };
  const handleEditSlot = (slot: any) => { setEditingSlot(slot); setIsSlotModalOpen(true); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Management</h2>
          <p className="text-slate-500 text-sm font-medium">Manage inventory and visitor vehicle tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilterSelector />
          {activeTab === 'guests' && (
            <button 
              onClick={() => setShowCheckInModal(true)} 
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] hover:bg-emerald-700"
            >
              <LogIn className="w-4 h-4" /> Guest Check-In
            </button>
          )}
          {(isSuperAdmin || currentUser?.role === 'ADMIN' || currentUser?.role === 'PARKING_MANAGER') && activeTab === 'slots' && (
            <button 
              onClick={handleAddSlot} 
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
        </div>
      </div>

      <div className="flex p-1 bg-white border border-slate-200 rounded-[1.5rem] w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('slots')} 
          className={cn(
            "px-8 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2", 
            activeTab === 'slots' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Car className="w-4 h-4" /> Parking Inventory
        </button>
        <button 
          onClick={() => setActiveTab('guests')} 
          className={cn(
            "px-8 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2", 
            activeTab === 'guests' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <User className="w-4 h-4" /> Guest Registry
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'slots' ? "Search slot numbers..." : "Search guest name or plate..."}
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3.5 text-sm border-none bg-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
        </div>
        <select 
          className="text-sm border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none p-3.5 bg-white min-w-[160px] font-bold text-slate-600 appearance-none shadow-sm"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>Available</option>
          <option>Occupied</option>
          <option>Reserved</option>
          <option>Active</option>
          <option>Departed</option>
        </select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {dataLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Live Inventory...</p>
            </div>
          ) : activeTab === 'slots' ? (
            filteredSlots.length > 0 ? filteredSlots.map(slot => (
              <motion.div 
                layout
                key={slot.id} 
                className="bg-white p-7 rounded-[2.5rem] border border-slate-200 hover:border-indigo-400 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    <Car className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider", 
                    slot.status === 'Available' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                  )}>
                    {slot.status}
                  </span>
                </div>
                
                <h4 className="font-black text-xl text-slate-900 tracking-tight">Slot {slot.slotNumber}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.1em] mt-2">{slot.type} Class</p>
                
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                      <p className="text-sm font-black text-indigo-600">{formatCurrency(slot.monthlyFee)}</p>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditSlot(slot)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
                        <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                </div>
              </motion.div>
            )) : <div className="col-span-full py-20 text-center">
                <Car className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-20" />
                <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No parking inventory found matching filters.</p>
            </div>
          ) : (
            filteredGuests.length > 0 ? filteredGuests.map(record => (
              <motion.div 
                layout
                key={record.id} 
                className="bg-white p-7 rounded-[2.5rem] border border-slate-200 hover:border-emerald-400 transition-all relative overflow-hidden shadow-sm hover:shadow-xl group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <User className="w-6 h-6" />
                  </div>
                  <span className={cn("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider", record.status === 'Active' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-100 text-slate-600 border border-slate-200")}>
                    {record.status}
                  </span>
                </div>
                
                <h4 className="font-black text-xl text-slate-900 tracking-tight">{record.guestName}</h4>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle ID</span>
                     </div>
                     <span className="text-xs font-black text-slate-900 uppercase">{record.vehiclePlate}</span>
                  </div>
                  <div className="flex items-center justify-between px-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-In Time</span>
                     <span className="text-xs font-bold text-slate-700">{new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center justify-between px-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visiting Unit</span>
                     <span className="text-xs font-bold text-indigo-600">Unit {record.unitVisiting || 'N/A'}</span>
                  </div>
                </div>
                
                {record.status === 'Active' && (
                  <button 
                    onClick={() => handleCheckOut(record.id)}
                    className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                  >
                    <LogOut className="w-4 h-4" /> Finalize Check-Out
                  </button>
                )}
                {record.status !== 'Active' && (
                   <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Closed</p>
                   </div>
                )}
              </motion.div>
            )) : <div className="col-span-full py-20 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-20" />
                <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No guest records found in registry.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ParkingSlotModal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} slot={editingSlot} />

      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shadow-lg">
              <div>
                <h3 className="text-2xl font-black">Visitor Registry</h3>
                <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest mt-1">Security Checkpoint</p>
              </div>
              <button onClick={() => setShowCheckInModal(false)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCheckIn} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={newGuest.guestName} 
                    onChange={(e) => setNewGuest({...newGuest, guestName: e.target.value})} 
                    className="w-full pl-11 pr-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Plate *</label>
                  <input 
                    type="text" 
                    required 
                    value={newGuest.vehiclePlate} 
                    onChange={(e) => setNewGuest({...newGuest, vehiclePlate: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    placeholder="AA-00000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visiting Unit</label>
                  <input 
                    type="text" 
                    value={newGuest.unitVisiting} 
                    onChange={(e) => setNewGuest({...newGuest, unitVisiting: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Unit No."
                  />
                </div>
              </div>
              
              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCheckInModal(false)} 
                  className="flex-1 py-4 border-2 border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {isSubmitting ? 'Verifying...' : 'Authorize'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};