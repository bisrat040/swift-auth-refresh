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
import { Unit } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: Unit;
  propertyId: string;
}

export const UnitModal: React.FC<UnitModalProps> = ({ isOpen, onClose, unit, propertyId }) => {
  const [formData, setFormData] = useState<Partial<Unit>>({
    number: '',
    type: '1-Bedroom',
    status: 'Vacant',
    rentAmount: 0,
    sqm: 0,
    floor: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setFormData(unit);
    } else {
      setFormData({
        number: '',
        type: '1-Bedroom',
        status: 'Vacant',
        rentAmount: 0,
        sqm: 0,
        floor: 0
      });
    }
  }, [unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        propertyId,
        rentAmount: Number(formData.rentAmount),
        sqm: Number(formData.sqm),
        floor: Number(formData.floor)
      });
      
      let error;
      if (unit?.id) {
        const { error: updateError } = await supabase
          .from('units')
          .update(dataToSave)
          .eq('id', unit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('units')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(unit ? 'Unit updated successfully' : 'Unit added successfully');
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unit-number">Unit Number *</Label>
            <Input 
              id="unit-number" 
              required 
              value={formData.number || ''} 
              onChange={(e) => setFormData({ ...formData, number: e.target.value })} 
              placeholder="e.g. 101"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="1-Bedroom">1-Bedroom</SelectItem>
                  <SelectItem value="2-Bedroom">2-Bedroom</SelectItem>
                  <SelectItem value="3-Bedroom">3-Bedroom</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
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
                  <SelectItem value="Vacant">Vacant</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-rent">Monthly Rent (ETB) *</Label>
            <Input 
              id="unit-rent" 
              type="number" 
              required 
              value={formData.rentAmount || 0} 
              onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-sqm">Square Meters</Label>
              <Input 
                id="unit-sqm" 
                type="number" 
                value={formData.sqm || 0} 
                onChange={(e) => setFormData({ ...formData, sqm: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-floor">Floor</Label>
              <Input 
                id="unit-floor" 
                type="number" 
                value={formData.floor || 0} 
                onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })} 
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};