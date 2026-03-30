import React, { useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Financial',
    format: 'PDF'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        generatedDate: new Date().toISOString().split('T')[0]
      });
      
      const { error } = await supabase
        .from('reports')
        .insert(dataToSave);

      if (error) throw error;
      
      toast.success('Report generation started');
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
          <DialogTitle>Generate New Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input 
              id="title" 
              required 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Q1 Financial Performance"
            />
          </div>
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(val: any) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Financial">Financial Summary</SelectItem>
                <SelectItem value="Occupancy">Occupancy Trends</SelectItem>
                <SelectItem value="Maintenance">Maintenance Log</SelectItem>
                <SelectItem value="Tenant">Tenant Directory</SelectItem>
                <SelectItem value="Parking">Parking Inventory</SelectItem>
                <SelectItem value="Tax">Tax Liability Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select 
              value={formData.format} 
              onValueChange={(val: any) => setFormData({ ...formData, format: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">Adobe PDF (.pdf)</SelectItem>
                <SelectItem value="Excel">Microsoft Excel (.xlsx)</SelectItem>
                <SelectItem value="CSV">Comma Separated (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              Generate Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};