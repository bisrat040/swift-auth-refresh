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
import { ParkingSlot } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';

interface ParkingSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot?: ParkingSlot;
}

export const ParkingSlotModal: React.FC<ParkingSlotModalProps> = ({ isOpen, onClose, slot }) => {
  const [formData, setFormData] = useState<Partial<ParkingSlot>>({
    slotNumber: '',
    type: 'Standard',
    status: 'Available',
    monthlyFee: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (slot) {
      setFormData(slot);
    } else {
      setFormData({
        slotNumber: '',
        type: 'Standard',
        status: 'Available',
        monthlyFee: 0
      });
    }
  }, [slot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        monthlyFee: Number(formData.monthlyFee)
      });
      
      let error;
      if (slot?.id) {
        const { error: updateError } = await supabase
          .from('parking_slots')
          .update(dataToSave)
          .eq('id', slot.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('parking_slots')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(slot ? 'Slot updated' : 'Slot added');
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
          <DialogTitle>{slot ? 'Edit Parking Slot' : 'Add Parking Slot'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slotNumber">Slot Number *</Label>
            <Input 
              id="slotNumber" 
              required 
              value={formData.slotNumber || ''} 
              onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })} 
              placeholder="e.g. P-101"
            />
          </div>
          <div className="space-y-2">
            <Label>Slot Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(val: any) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Handicap">Handicap</SelectItem>
                <SelectItem value="EV Charging">EV Charging</SelectItem>
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
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyFee">Monthly Fee (ETB)</Label>
            <Input 
              id="monthlyFee" 
              type="number" 
              value={formData.monthlyFee || 0} 
              onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })} 
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              Save Slot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};