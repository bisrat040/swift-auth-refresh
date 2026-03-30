import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { useData } from '../../context/DataContext';
import { Lease } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';
import { FileText, Calendar, DollarSign, Loader2, Building2, User } from 'lucide-react';

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease?: Lease;
}

export const LeaseModal: React.FC<LeaseModalProps> = ({ isOpen, onClose, lease }) => {
  const { tenants, units } = useData();
  const [formData, setFormData] = useState<Partial<Lease>>({
    tenantId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
    status: 'Active',
    sqm: 0,
    pricePerSqm: 0,
    floor: 0,
    paymentPlan: 1,
    contractType: 'Standard',
    paymentFrequency: 'Monthly',
    terminationNotice: '30 days'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lease) {
      setFormData(lease);
    } else {
      setFormData({
        tenantId: '',
        unitId: '',
        startDate: '',
        endDate: '',
        rentAmount: 0,
        depositAmount: 0,
        status: 'Active',
        sqm: 0,
        pricePerSqm: 0,
        floor: 0,
        paymentPlan: 1,
        contractType: 'Standard',
        paymentFrequency: 'Monthly',
        terminationNotice: '30 days'
      });
    }
  }, [lease, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedTenant = tenants.find(t => t.id === formData.tenantId);
      const selectedUnit = units.find(u => u.id === formData.unitId);
      
      const dataToSave = toSnake({
        ...formData,
        tenantName: selectedTenant?.name || '',
        unitNumber: selectedUnit?.number || '',
        rentAmount: Number(formData.rentAmount),
        depositAmount: Number(formData.depositAmount),
        sqm: Number(formData.sqm),
        pricePerSqm: Number(formData.pricePerSqm),
        floor: Number(formData.floor),
        paymentPlan: Number(formData.paymentPlan),
        totalRent: Number(formData.rentAmount) * Number(formData.paymentPlan)
      });
      
      let error;
      if (lease?.id) {
        const { error: updateError } = await supabase
          .from('leases')
          .update(dataToSave)
          .eq('id', lease.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('leases')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(lease ? 'Lease agreement updated' : 'Lease agreement finalized');
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none">
        <div className="bg-indigo-600 p-8 text-white flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{lease ? 'Edit Lease' : 'Draft New Lease'}</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Compliance & Financial Entry</p>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Tenant *</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Select 
                  value={formData.tenantId} 
                  onValueChange={(val) => setFormData({ ...formData, tenantId: val })}
                >
                  <SelectTrigger className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select Registered Tenant" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl">
                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Unit *</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Select 
                  value={formData.unitId} 
                  onValueChange={(val) => setFormData({ ...formData, unitId: val })}
                >
                  <SelectTrigger className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select Building Unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl">
                    {units.map(u => <SelectItem key={u.id} value={u.id}>{u.number} — {u.type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Classification</Label>
              <Select 
                value={formData.contractType} 
                onValueChange={(val: any) => setFormData({ ...formData, contractType: val })}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Standard">Standard Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial Office</SelectItem>
                  <SelectItem value="Short-term">Short-term Residency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activation Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Active">Active (Ongoing)</SelectItem>
                  <SelectItem value="Pending">Pending Approval</SelectItem>
                  <SelectItem value="Expired">Expired / Lapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="date" 
                  required 
                  value={formData.startDate || ''} 
                  className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="date" 
                  required 
                  value={formData.endDate || ''} 
                  className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Monthly Rent *</Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="number" 
                  required 
                  value={formData.rentAmount || 0} 
                  className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Deposit</Label>
              <Input 
                type="number" 
                value={formData.depositAmount || 0} 
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan (Months)</Label>
              <Input 
                type="number" 
                value={formData.paymentPlan || 1} 
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, paymentPlan: Number(e.target.value) })} 
              />
            </div>
          </div>

          <DialogFooter className="pt-10 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="h-14 px-8 border-2 border-slate-100 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all">Cancel Request</Button>
            <Button type="submit" className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all flex items-center gap-3" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isSaving ? 'Finalizing...' : 'Save Agreement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};