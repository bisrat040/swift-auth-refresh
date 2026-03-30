import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download,
  Info,
  ArrowRight
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { toast } from 'sonner';

interface ExcelImportProps {
  entityType: 'Tenant' | 'Lease';
  onDataImported: (data: any[]) => void;
  trigger: React.ReactNode;
}

interface MappingField {
  key: string;
  label: string;
  required: boolean;
  sample?: string;
}

const tenantFields: MappingField[] = [
  { key: 'name', label: 'Tenant Name', required: true, sample: 'ABC Corporation' },
  { key: 'email', label: 'Email', required: true, sample: 'info@abccorp.et' },
  { key: 'phone', label: 'Phone Number', required: true, sample: '+251 911 223 344' },
  { key: 'unit', label: 'Unit Number', required: true, sample: 'B101' },
  { key: 'status', label: 'Status', required: false, sample: 'Active' },
  { key: 'rentAmount', label: 'Rent Amount', required: true, sample: '150000' },
  { key: 'leaseStart', label: 'Lease Start Date', required: true, sample: '2024-01-01' },
  { key: 'leaseEnd', label: 'Lease End Date', required: true, sample: '2026-01-01' },
  { key: 'taxId', label: 'Tax ID (TIN)', required: false, sample: 'TIN-99001122' },
  { key: 'businessType', label: 'Business Type', required: false, sample: 'Technology' },
];

const leaseFields: MappingField[] = [
  { key: 'tenantName', label: 'Tenant Name', required: true, sample: 'ABC Corporation' },
  { key: 'unitNumber', label: 'Unit Number', required: true, sample: 'B101' },
  { key: 'startDate', label: 'Start Date', required: true, sample: '2024-01-01' },
  { key: 'endDate', label: 'End Date', required: true, sample: '2026-01-01' },
  { key: 'rentAmount', label: 'Monthly Rent Amount', required: true, sample: '150000' },
  { key: 'sqm', label: 'Area (SQM)', required: true, sample: '120' },
  { key: 'pricePerSqm', label: 'Price Per SQM', required: true, sample: '1250' },
  { key: 'floor', label: 'Floor Level', required: true, sample: '1' },
  { key: 'paymentPlan', label: 'Payment Plan (Months)', required: true, sample: '3' },
  { key: 'leaseDuration', label: 'Lease Duration', required: true, sample: '24 months' },
  { key: 'status', label: 'Status', required: true, sample: 'Active' },
];

export const ExcelImport: React.FC<ExcelImportProps> = ({ entityType, onDataImported, trigger }) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = entityType === 'Tenant' ? tenantFields : leaseFields;

  const downloadTemplate = () => {
    try {
      const templateHeaders = fields.map(f => f.label);
      const sampleRow = fields.reduce((acc, f) => {
        acc[f.label] = f.sample || '';
        return acc;
      }, {} as any);

      const ws = XLSX.utils.json_to_sheet([sampleRow], { header: templateHeaders });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${entityType} Template`);
      XLSX.writeFile(wb, `${entityType.toLowerCase()}_import_template.xlsx`);
      toast.success(`${entityType} template downloaded successfully!`);
    } catch (error) {
      console.error('Template generation error:', error);
      toast.error('Failed to generate template.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xls') && !uploadedFile.name.endsWith('.csv')) {
      toast.error('Invalid file format. Please upload an Excel or CSV file.');
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (jsonData.length > 0) {
        const fileHeaders = (jsonData[0] as string[]).map(h => h?.toString().trim());
        const fileData = jsonData.slice(1);
        
        setHeaders(fileHeaders);
        setData(fileData);
        
        const initialMapping: Record<string, string> = {};
        fields.forEach(field => {
          const match = fileHeaders.find(h => 
            h && (
              h.toLowerCase() === field.label.toLowerCase() || 
              h.toLowerCase() === field.key.toLowerCase() ||
              h.toLowerCase().includes(field.key.toLowerCase())
            )
          );
          if (match) initialMapping[field.key] = match;
        });
        setMapping(initialMapping);
        setStep(2);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImport = () => {
    const missingFields = fields.filter(f => f.required && !mapping[f.key]);
    if (missingFields.length > 0) {
      toast.error(`Please map all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    const importedData = data.map((row, index) => {
      const item: any = { id: `imported-${entityType.toLowerCase()}-${Date.now()}-${index}` };
      fields.forEach(field => {
        const headerIndex = headers.indexOf(mapping[field.key]);
        if (headerIndex !== -1) {
          item[field.key] = row[headerIndex];
        }
      });

      if (entityType === 'Tenant') {
        item.totalPaidAmount = 0;
        item.paymentHistory = [];
        item.status = item.status || 'Active';
      }

      if (entityType === 'Lease') {
        item.rentAmount = Number(item.rentAmount) || 0;
        item.totalRent = (Number(item.rentAmount) || 0) * (Number(item.paymentPlan) || 1);
        item.sqm = Number(item.sqm) || 0;
        item.pricePerSqm = Number(item.pricePerSqm) || 0;
        item.paymentPlan = Number(item.paymentPlan) || 1;
        item.floor = Number(item.floor) || 0;
        item.vatRate = 0.15;
        item.utilitiesIncluded = ['Water', 'Security'];
        item.contractType = 'Commercial';
        item.status = item.status || 'Active';
      }

      return item;
    });

    onDataImported(importedData);
    toast.success(`Successfully imported ${importedData.length} ${entityType.toLowerCase()}s!`);
    resetState();
    setIsOpen(false);
  };

  const resetState = () => {
    setFile(null);
    setData([]);
    setHeaders([]);
    setMapping({});
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Import {entityType}s from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk import your data.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div 
              className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">Excel (.xlsx, .xls) or CSV files supported</p>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
              />
            </div>

            <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-100">
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate} 
                  className="font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download {entityType} Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-indigo-900">{file?.name}</p>
                  <p className="text-[10px] text-indigo-700">{data.length} rows found in file</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState} className="text-indigo-600 hover:bg-indigo-100">
                Change File
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      {field.label} {field.required && <span className="text-rose-500 text-sm">*</span>}
                    </Label>
                    <Select 
                      value={mapping[field.key] || ""} 
                      onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val }))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={`Select column for ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h, idx) => (
                          <SelectItem key={idx} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="font-bold">
                Back
              </Button>
              <Button onClick={handleImport} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                Import Data <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};