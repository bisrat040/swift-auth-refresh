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
import { Employee } from '../../types';
import { supabase } from '../../lib/supabase';
import { toSnake } from '../../lib/utils';
import { toast } from 'sonner';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: '',
    department: 'Administration',
    email: '',
    phone: '',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    tinNumber: '',
    pensionNumber: '',
    status: 'Active'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        role: '',
        department: 'Administration',
        email: '',
        phone: '',
        salary: 0,
        hireDate: new Date().toISOString().split('T')[0],
        tinNumber: '',
        pensionNumber: '',
        status: 'Active'
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        salary: Number(formData.salary)
      });
      
      let error;
      if (employee?.id) {
        const { error: updateError } = await supabase
          .from('employees')
          .update(dataToSave)
          .eq('id', employee.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('employees')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(employee ? 'Staff details updated' : 'Staff member added');
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
          <DialogTitle>{employee ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
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
              <Label htmlFor="role">Job Title / Role *</Label>
              <Input 
                id="role" 
                required 
                value={formData.role || ''} 
                onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(val: any) => setFormData({ ...formData, department: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email || ''} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Gross Salary (ETB)</Label>
              <Input 
                id="salary" 
                type="number" 
                value={formData.salary || 0} 
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input 
                id="hireDate" 
                type="date" 
                value={formData.hireDate || ''} 
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tinNumber">TIN Number</Label>
              <Input 
                id="tinNumber" 
                value={formData.tinNumber || ''} 
                onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pensionNumber">Pension Number</Label>
              <Input 
                id="pensionNumber" 
                value={formData.pensionNumber || ''} 
                onChange={(e) => setFormData({ ...formData, pensionNumber: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};