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
import { Property, SubscriptionTier, SubscriptionStatus } from '../../types';
import { updateProperty, createProperty } from '../../lib/supabase';
import { toast } from 'sonner';
import { useUser } from '../../context/UserContext';
import { Shield, Calendar, CreditCard } from 'lucide-react';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({ isOpen, onClose, property }) => {
  const { isSuperAdmin } = useUser();
  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    address: '',
    type: 'Residential',
    status: 'Active',
    description: '',
    imageUrl: '',
    paymentTerms: ['Monthly', 'Quarterly'],
    subscriptionTier: 'BASIC',
    subscriptionStatus: 'active',
    subscriptionPrice: 0,
    subscriptionExpiry: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        subscriptionTier: property.subscriptionTier || 'BASIC',
        subscriptionStatus: property.subscriptionStatus || 'active',
        subscriptionPrice: property.subscriptionPrice || 0,
        subscriptionExpiry: property.subscriptionExpiry ? property.subscriptionExpiry.split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '',
        address: '',
        type: 'Residential',
        status: 'Active',
        description: '',
        imageUrl: '',
        paymentTerms: ['Monthly', 'Quarterly'],
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'active',
        subscriptionPrice: 0,
        subscriptionExpiry: ''
      });
    }
  }, [property, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        subscriptionExpiry: formData.subscriptionExpiry ? new Date(formData.subscriptionExpiry).toISOString() : null
      };
      
      if (property?.id) {
        await updateProperty(property.id, dataToSave);
      } else {
        await createProperty(dataToSave);
      }
      
      toast.success(property ? 'Property updated successfully' : 'Property added successfully');
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {property ? 'Edit Property' : 'Add New Property'}
            {isSuperAdmin && property && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Super Admin Mode
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-name">Property Name *</Label>
                <Input 
                  id="prop-name" 
                  required 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Harmony Heights"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-address">Address *</Label>
                <Input 
                  id="prop-address" 
                  required 
                  value={formData.address || ''} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="e.g. Bole Road, Addis Ababa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Under Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-image">Image URL (Optional)</Label>
                <Input 
                  id="prop-image" 
                  value={formData.imageUrl || ''} 
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} 
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-desc">Description</Label>
                <Textarea 
                  id="prop-desc" 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={3}
                />
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Subscription Control</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-xs">Subscription Tier</Label>
                  <Select 
                    value={formData.subscriptionTier} 
                    onValueChange={(val: SubscriptionTier) => setFormData({ ...formData, subscriptionTier: val })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEMO">Demo Plan</SelectItem>
                      <SelectItem value="BASIC">Basic Plan</SelectItem>
                      <SelectItem value="PRO">Pro Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Access Status</Label>
                  <Select 
                    value={formData.subscriptionStatus} 
                    onValueChange={(val: SubscriptionStatus) => setFormData({ ...formData, subscriptionStatus: val })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Rate (ETB)
                  </Label>
                  <Input 
                    type="number"
                    value={formData.subscriptionPrice || 0} 
                    onChange={(e) => setFormData({ ...formData, subscriptionPrice: Number(e.target.value) })} 
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expiry Date
                  </Label>
                  <Input 
                    type="date"
                    value={formData.subscriptionExpiry || ''} 
                    onChange={(e) => setFormData({ ...formData, subscriptionExpiry: e.target.value })} 
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};