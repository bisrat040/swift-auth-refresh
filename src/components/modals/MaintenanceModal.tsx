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
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { useData } from '../../context/DataContext';
import { MaintenanceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';
import { Wrench, User, Building2, AlertTriangle, Loader2 } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: MaintenanceRequest;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ isOpen, onClose, request }) => {
  const { tenants, units } = useData();
  const [formData, setFormData] = useState<Partial<MaintenanceRequest>>({
    tenantId: '',
    unitId: '',
    issue: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    dateReported: new Date().toISOString().split('T')[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setFormData(request);
    } else {
      setFormData({
        tenantId: '',
        unitId: '',
        issue: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        dateReported: new Date().toISOString().split('T')[0]
      });
    }
  }, [request, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedTenant = tenants.find(t => t.id === formData.tenantId);
      const selectedUnit = units.find(u => u.id === formData.unitId);
      
      const dataToSave = toSnake({
        ...formData,
        tenantName: selectedTenant?.name || 'Unknown',
        unit: selectedUnit?.number || 'N/A'
      });
      
      let error;
      if (request?.id) {
        const { error: updateError } = await supabase
          .from('maintenance_requests')
          .update(dataToSave)
          .eq('id', request.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('maintenance_requests')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(request ? 'Maintenance ticket updated' : 'Maintenance ticket issued');
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 border-none">
        <div className="bg-indigo-600 p-8 text-white flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{request ? 'Update Ticket' : 'New Maintenance'}</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Technical Support Request</p>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Tenant</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Select 
                  value={formData.tenantId} 
                  onValueChange={(val) => setFormData({ ...formData, tenantId: val })}
                >
                  <SelectTrigger className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl">
                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacted Unit</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Select 
                  value={formData.unitId} 
                  onValueChange={(val) => setFormData({ ...formData, unitId: val })}
                >
                  <SelectTrigger className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl">
                    {units.map(u => <SelectItem key={u.id} value={u.id}>{u.number} — {u.type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="issue">Problem Summary *</Label>
            <Input 
              id="issue" 
              required 
              value={formData.issue || ''} 
              className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })} 
              placeholder="e.g. Electrical failure in living room"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="description">Context & Details</Label>
            <Textarea 
              id="description" 
              value={formData.description || ''} 
              className="min-h-[120px] bg-slate-50 border-none rounded-3xl p-5 focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-inner"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Please provide specific details to help the maintenance crew..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Low">Low Priority</SelectItem>
                  <SelectItem value="Medium">Medium Standard</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Urgent">Urgent / Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Lifecycle</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Open">Open (New)</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved (Done)</SelectItem>
                  <SelectItem value="Closed">Closed (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-10 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="h-14 px-8 border-2 border-slate-100 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all">Discard</Button>
            <Button type="submit" className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all flex items-center gap-3" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
              {isSaving ? 'Issuing...' : 'Save Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};