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
import { Tenant } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant;
}

export const TenantModal: React.FC<TenantModalProps> = ({ isOpen, onClose, tenant }) => {
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    email: '',
    phone: '',
    unit: '',
    rentAmount: 0,
    leaseStart: '',
    leaseEnd: '',
    taxId: '',
    businessType: '',
    status: 'Active'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData(tenant);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        unit: '',
        rentAmount: 0,
        leaseStart: '',
        leaseEnd: '',
        taxId: '',
        businessType: '',
        status: 'Active'
      });
    }
  }, [tenant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        rentAmount: Number(formData.rentAmount)
      });
      
      let error;
      if (tenant?.id) {
        const { error: updateError } = await supabase
          .from('tenants')
          .update(dataToSave)
          .eq('id', tenant.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tenants')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(tenant ? 'Tenant updated successfully' : 'Tenant added successfully');
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Edit Tenant Profile' : 'Add New Tenant'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                required 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email || ''} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone" 
                required 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit Number *</Label>
              <Input 
                id="unit" 
                required 
                value={formData.unit || ''} 
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentAmount">Monthly Rent (ETB) *</Label>
              <Input 
                id="rentAmount" 
                type="number" 
                required 
                value={formData.rentAmount || 0} 
                onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="Notice">Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start Date</Label>
              <Input 
                id="leaseStart" 
                type="date" 
                value={formData.leaseStart || ''} 
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End Date</Label>
              <Input 
                id="leaseEnd" 
                type="date" 
                value={formData.leaseEnd || ''} 
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (TIN)</Label>
              <Input 
                id="taxId" 
                value={formData.taxId || ''} 
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input 
                id="businessType" 
                value={formData.businessType || ''} 
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};