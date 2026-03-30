import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  Printer, 
  Edit3, 
  X, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  Building2, 
  DollarSign, 
  FileCheck,
  LayoutGrid,
  Loader2,
  Lock,
  FileText,
  CreditCard,
  Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency, toSnake } from '../../lib/utils';
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
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { DocumentUploader } from './DocumentUploader';
import { Lease, Property } from '../../types';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import { calculateLeaseTotal } from '../../lib/taxCalculations';

interface LeaseManagementFormProps {
  lease?: Lease;
  onClose: () => void;
  onSave?: (leaseData: Partial<Lease>) => void;
}

// Generate flexible payment terms from 1 to 12 months
const PAYMENT_TERMS_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const months = i + 1;
  return {
    label: months === 1 ? '1 Month' : `${months} Months`,
    value: months.toString(),
    multiplier: months
  };
});

const getMultiplier = (frequency: string): number => {
  if (!frequency) return 1;
  // Support legacy string labels and new numeric strings
  const legacy: Record<string, number> = {
    'Monthly': 1,
    'Quarterly': 3,
    'Semi-Annually': 6,
    'Yearly': 12
  };
  
  if (legacy[frequency]) return legacy[frequency];
  const parsed = parseInt(frequency);
  return isNaN(parsed) ? 1 : parsed;
};

const getLabel = (frequency: string): string => {
  const multiplier = getMultiplier(frequency);
  return multiplier === 1 ? '1 Month' : `${multiplier} Months`;
};

export const LeaseManagementForm: React.FC<LeaseManagementFormProps> = ({ lease, onClose, onSave }) => {
  const { properties } = useData();
  
  const [formData, setFormData] = useState<Partial<Lease>>({
    tenantName: lease?.tenantName || '',
    status: lease?.status || 'Draft' as any,
    startDate: lease?.startDate || new Date().toISOString(),
    endDate: lease?.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    sqm: lease?.sqm || 0,
    pricePerSqm: lease?.pricePerSqm || 0,
    terms: lease?.terms || '',
    rentAmount: lease?.rentAmount || 0,
    vatRate: lease?.vatRate || 15,
    discountRate: lease?.discountRate || 0,
    propertyId: lease?.propertyId || '',
    paymentFrequency: lease?.paymentFrequency || '1',
  });

  const [tenantInfo, setTenantInfo] = useState({
    name: lease?.tenantName || '',
    contact: '',
    company: ''
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isEditing, setIsEditing] = useState(!lease);
  const [isSaving, setIsSaving] = useState(false);
  const [existingDocs, setExistingDocs] = useState(lease?.documents || []);

  // Get selected property
  const selectedProperty = useMemo(() => 
    properties.find(p => p.id === formData.propertyId), 
    [formData.propertyId, properties]
  );

  /**
   * Calculate rent whenever sqm, price, or payment frequency changes.
   * Logic: Total Square Meters * Price per Total sqm (Excluding VAT) * [Payment Term Multiplier]
   */
  useEffect(() => {
    if (isEditing) {
      const multiplier = getMultiplier(formData.paymentFrequency || '1');
      const baseRent = (formData.sqm || 0) * (formData.pricePerSqm || 0);
      const totalForTerm = baseRent * multiplier;
      setFormData(prev => ({ ...prev, rentAmount: totalForTerm }));
    }
  }, [formData.sqm, formData.pricePerSqm, formData.paymentFrequency, isEditing]);

  const financialDetails = useMemo(() => {
    return calculateLeaseTotal(
      formData.rentAmount || 0,
      formData.vatRate || 15,
      formData.discountRate || 0
    );
  }, [formData.rentAmount, formData.vatRate, formData.discountRate]);

  // Primary display: Total Gross Payable (Base + VAT), ignoring discount as per user request
  const totalPaidWithVat = financialDetails.amountWithVat;

  // Normalize frequency for Select component to handle legacy values ('Monthly' -> '1')
  const selectValue = useMemo(() => 
    getMultiplier(formData.paymentFrequency || '1').toString(),
    [formData.paymentFrequency]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = toSnake({
        ...formData,
        tenantName: tenantInfo.name,
        documents: existingDocs
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

      if (onSave) onSave({ ...formData, documents: existingDocs });
      toast.success(lease ? 'Lease agreement updated successfully' : 'Lease agreement created successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save lease');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    toast.info('Synthesizing PDF agreement for print...');
    setTimeout(() => {
       window.print();
    }, 1500);
  };

  const handleRemoveExisting = (docName: string) => {
    if (!confirm(`Are you sure you want to remove "${docName}" from this agreement permanently?`)) return;
    setExistingDocs(prev => prev.filter(d => d.name !== docName));
    toast.success(`${docName} will be removed upon saving.`);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200 p-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <FileCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lease Agreement Management</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{isEditing ? 'Editing Mode \u2022 Content Unlocked' : 'Read-only Mode \u2022 Locked'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="h-12 px-6 rounded-2xl gap-3 font-black text-sm border-2 border-slate-200 hover:bg-slate-100 transition-all">
              <Edit3 className="w-4.5 h-4.5" /> Unlock & Edit
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="h-12 px-6 rounded-2xl gap-3 font-black text-sm border-2 border-slate-200 hover:bg-slate-100 transition-all">
            <Printer className="w-4.5 h-4.5" /> Print
          </Button>
          {isEditing && (
            <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-3 font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all">
              {isSaving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
              {isSaving ? 'Processing...' : 'Commit Changes'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} size="icon" className="h-12 w-12 rounded-2xl ml-2 hover:bg-rose-50 hover:text-rose-600 transition-all">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: General Info */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Tenant Information */}
          <section className="space-y-6 bg-slate-50/30 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-xl"><User className="w-5 h-5 text-indigo-600" /></div>
              <h4 className="font-black text-lg text-slate-900">Tenant Identity</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="tenantName">Legal Full Name</Label>
                <Input 
                  id="tenantName" 
                  placeholder="Enter tenant name" 
                  value={tenantInfo.name} 
                  disabled={!isEditing}
                  className="h-12 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                  onChange={(e) => setTenantInfo({...tenantInfo, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="tenantContact">Mobile Contact</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    id="tenantContact" 
                    className="pl-12 h-12 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="+251 9..." 
                    value={tenantInfo.contact} 
                    disabled={!isEditing}
                    onChange={(e) => setTenantInfo({...tenantInfo, contact: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="tenantCompany">Organization (if applicable)</Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    id="tenantCompany" 
                    className="pl-12 h-12 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="Company Name"
                    value={tenantInfo.company} 
                    disabled={!isEditing}
                    onChange={(e) => setTenantInfo({...tenantInfo, company: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Lease Details */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-xl"><LayoutGrid className="w-5 h-5 text-indigo-600" /></div>
              <h4 className="font-black text-lg text-slate-900">Space & Financial Details</h4>
            </div>

            {/* Building Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Building</Label>
                <Select 
                  disabled={!isEditing}
                  value={formData.propertyId} 
                  onValueChange={(val) => setFormData({...formData, propertyId: val})}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold">
                    <SelectValue placeholder="Choose a building" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flexible Payment Terms (Months)</Label>
                <Select 
                  disabled={!isEditing || !formData.propertyId}
                  value={selectValue} 
                  onValueChange={(val: any) => setFormData({...formData, paymentFrequency: val})}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <SelectValue placeholder="Select term duration" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {PAYMENT_TERMS_OPTIONS.map(term => (
                      <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Floor Area (sqm)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.sqm} 
                    disabled={!isEditing}
                    className="h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    onChange={(e) => setFormData({...formData, sqm: parseFloat(e.target.value) || 0})}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">m²</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate per m² (ETB)</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    type="number" 
                    className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="0.00" 
                    value={formData.pricePerSqm} 
                    disabled={!isEditing}
                    onChange={(e) => setFormData({...formData, pricePerSqm: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lease Discount (%)</Label>
                <div className="relative">
                  <Percent className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <Input 
                    type="number" 
                    className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="0.00" 
                    min="0" 
                    max="100"
                    value={formData.discountRate} 
                    disabled={!isEditing}
                    onChange={(e) => setFormData({...formData, discountRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lease Activation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      disabled={!isEditing}
                      className={cn(
                        "w-full h-12 justify-start text-left font-bold rounded-2xl border-none bg-slate-50 transition-all shadow-inner",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                      {formData.startDate ? format(new Date(formData.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-slate-200">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={(date) => setFormData({...formData, startDate: date?.toISOString()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lease Expiration Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      disabled={!isEditing}
                      className={cn(
                        "w-full h-12 justify-start text-left font-bold rounded-2xl border-none bg-slate-50 transition-all shadow-inner",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-rose-500" />
                      {formData.endDate ? format(new Date(formData.endDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-slate-200">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={(date) => setFormData({...formData, endDate: date?.toISOString()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-xl"><FileText className="w-5 h-5 text-indigo-600" /></div>
              <h4 className="font-black text-lg text-slate-900">Contractual Obligations</h4>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="terms">Special Clauses & Conditions</Label>
              <Textarea 
                id="terms" 
                placeholder="Specify any additional agreements, maintenance responsibilities, or penalty clauses..." 
                className="min-h-[160px] bg-slate-50 border-none rounded-3xl p-6 focus:ring-2 focus:ring-indigo-500 font-medium text-sm leading-relaxed shadow-inner"
                value={formData.terms}
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, terms: e.target.value})}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Status & Calculation */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-8 text-white shadow-2xl shadow-slate-200">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agreement Lifecycle Status</Label>
              <Select 
                disabled={!isEditing}
                value={formData.status} 
                onValueChange={(val: any) => setFormData({...formData, status: val})}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-2xl font-black">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Draft">Draft (Internal)</SelectItem>
                  <SelectItem value="Active">Active (Ongoing)</SelectItem>
                  <SelectItem value="Pending">Pending (Approval)</SelectItem>
                  <SelectItem value="Expired">Expired (Lapsed)</SelectItem>
                  <SelectItem value="Terminated">Terminated (Ended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6 pt-4 border-t border-white/10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Projection</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Net Rent ({getLabel(formData.paymentFrequency || '1')})</span>
                  <span className="font-bold">{formatCurrency(formData.rentAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">VAT Amount ({formData.vatRate}%)</span>
                  <span className="font-bold">{formatCurrency(financialDetails.vatAmount)}</span>
                </div>
                {formData.discountRate ? formData.discountRate > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-400">Discount ({formData.discountRate}%)</span>
                    <span className="font-bold text-rose-400">-{formatCurrency(financialDetails.discountAmount)} (Not Applied)</span>
                  </div>
                ) : null}
                <div className="pt-6 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Gross Payable</span>
                    <span className="text-2xl font-black text-white">{formatCurrency(totalPaidWithVat)}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                    Computed for {getLabel(formData.paymentFrequency || '1')} period based on {formData.sqm}m² @ {formatCurrency(formData.pricePerSqm || 0)}/m²
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Compliance Documents</p>
            <DocumentUploader 
              onFilesChange={setFiles} 
              existingDocuments={existingDocs}
              onRemoveExisting={handleRemoveExisting}
            />
          </div>

          {!isEditing && (
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-900 font-black uppercase tracking-tight">Document Locked</p>
                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mt-1">
                  This agreement is currently in read-only mode. Unlock the record to make financial or status adjustments.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};