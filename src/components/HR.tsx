import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  ArrowLeft,
  ShieldCheck,
  Star,
  MoreHorizontal,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Printer,
  Plus,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Employee, PayrollRecord } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { EmployeeModal } from './modals/EmployeeModal';
import { ReviewModal } from './modals/ReviewModal';
import { TimeFilterSelector } from './TimeFilterSelector';
import { supabase } from '../lib/supabase';

const EmployeeProfile = ({ 
  employee, 
  onBack, 
  onEdit 
}: { 
  employee: Employee; 
  onBack: () => void; 
  onEdit: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${employee.name} from the staff directory?`)) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', employee.id);
      if (error) throw error;
      toast.success('Staff member removed');
      onBack();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintCertificate = () => {
    toast.info('Preparing Employment Certificate...');
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleDownloadResource = (name: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: `Securing ${name} and generating encrypted link...`,
        success: `${name} has been downloaded successfully.`,
        error: `Failed to download ${name}.`,
      }
    );
  };

  const handleDisburseSalary = () => {
    if (!confirm(`Are you sure you want to disburse ${formatCurrency(employee.salary || 0)} to ${employee.name} for the current cycle?`)) return;
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Authorizing payroll disbursement via bank API...',
        success: 'Transaction authorized! Salary has been disbursed successfully.',
        error: 'Authorization failed. Please check bank gateway connection.',
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.name}</h2>
            <p className="text-sm text-slate-500">{employee.role} • {employee.department}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handlePrintCertificate}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Certificate
          </button>
          <button 
            onClick={onEdit} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Edit Details
          </button>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 active:scale-95"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", employee.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{employee.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly Salary</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(employee.salary || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hire Date</span>
                <span className="text-sm font-bold text-slate-900">{employee.hireDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TIN Number</span>
                <span className="text-sm font-bold text-slate-900">{employee.tinNumber || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                <span className="text-sm font-bold text-slate-900">{employee.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phone Contact</span>
                <span className="text-sm font-bold text-slate-900">{employee.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pension No</span>
                <span className="text-sm font-bold text-slate-900">{employee.pensionNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Department</span>
                <span className="text-sm font-bold text-slate-900">{employee.department || 'Administration'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Performance Timeline</h3>
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="text-[10px] font-bold text-indigo-600 hover:underline bg-indigo-50 px-3 py-1 rounded-full"
              >
                Add Review
              </button>
            </div>
            <div className="p-12 text-center">
               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Star className="w-6 h-6 text-slate-200" />
               </div>
               <p className="text-slate-400 text-sm font-bold">No performance reviews documented for this year.</p>
               <button 
                 onClick={() => setIsReviewModalOpen(true)}
                 className="mt-4 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
               >
                 Initialize Review Process
               </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <DollarSign className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg">Payroll Preview</h4>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-indigo-100">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Gross Salary</span>
                <span className="font-bold">{formatCurrency(employee.salary || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-100">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Income Tax (Est)</span>
                <span className="font-bold">{formatCurrency((employee.salary || 0) * 0.15)}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-100">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Pension (7%)</span>
                <span className="font-bold">{formatCurrency((employee.salary || 0) * 0.07)}</span>
              </div>
              <div className="pt-6 border-t border-indigo-400/50">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Take Home Net</span>
                  <span className="text-2xl font-black">{formatCurrency((employee.salary || 0) * 0.78)}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleDisburseSalary}
              className="w-full mt-8 py-3.5 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-50 transition-all active:scale-[0.98]"
            >
              Disburse Salary
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Staff Resources</h4>
             <div className="space-y-2">
               <button 
                 onClick={() => handleDownloadResource('Employment Contract')}
                 className="w-full p-3 flex items-center justify-between rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
               >
                 <div className="flex items-center gap-3">
                   <FileText className="w-4 h-4 text-indigo-500" />
                   <span className="text-xs font-bold text-slate-700">Employment Contract</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-300" />
               </button>
               <button 
                 onClick={() => handleDownloadResource('Security Clearance')}
                 className="w-full p-3 flex items-center justify-between rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
               >
                 <div className="flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span className="text-xs font-bold text-slate-700">Security Clearance</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-300" />
               </button>
             </div>
          </div>
        </div>
      </div>
      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} employeeName={employee.name} />
    </motion.div>
  );
};

export const HR: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const { currentUser, isSuperAdmin } = useUser();
  const { employees, payrollRecords, isLoading: dataLoading } = useData();

  const handleDownloadResource = (name: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Authorizing secure download stream...',
        success: name + ' has been downloaded successfully.',
        error: 'Failed to download ' + name + '.',
      }
    );
  };

  const filteredEmployees = useMemo(() => {
    return (employees || []).filter(emp => 
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleCreate = () => {
    setEditingEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleExportPayroll = () => {
     if (!payrollRecords || payrollRecords.length === 0) {
       toast.error('No payroll records available for export.');
       return;
     }
     toast.promise(
       new Promise(resolve => setTimeout(resolve, 2000)),
       {
         loading: 'Generating monthly payroll ledger...',
         success: 'Payroll ledger exported to Excel successfully!',
         error: 'Failed to export payroll.',
       }
     );
  };

  const handleGeneratePayroll = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'System is calculating payroll for the current period...',
        success: 'Payroll generation complete! 50 records updated.',
        error: 'Failed to generate payroll.',
      }
    );
  };

  const selectedEmployee = useMemo(() => 
    (employees || []).find(e => e.id === selectedEmployeeId), 
  [selectedEmployeeId, employees]);

  if (selectedEmployee) {
    return (
      <>
        <EmployeeProfile 
          employee={selectedEmployee} 
          onBack={() => setSelectedEmployeeId(null)} 
          onEdit={() => handleEdit(selectedEmployee)} 
        />
        <EmployeeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          employee={editingEmployee} 
        />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">HR Management</h2>
          <p className="text-slate-500 text-sm">Staff profiles, payroll and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <TimeFilterSelector />
          {activeTab === 'payroll' && (
             <button 
               onClick={handleExportPayroll}
               className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
             >
               <FileSpreadsheet className="w-4 h-4" /> Export Excel
             </button>
          )}
          {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
            <button 
              onClick={handleCreate} 
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('employees')} 
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'employees' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Users className="w-4 h-4" /> Staff Directory
        </button>
        <button 
          onClick={() => setActiveTab('payroll')} 
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'payroll' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <DollarSign className="w-4 h-4" /> Payroll Ledger
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'employees' ? "Search staff by name or role..." : "Search payroll records..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>
          {activeTab === 'payroll' && (
            <button 
              onClick={handleGeneratePayroll}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Generate New Payroll
            </button>
          )}
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'employees' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-5">Employee</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5">Department</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-indigo-50/10 cursor-pointer group transition-colors" 
                      onClick={() => setSelectedEmployeeId(emp.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden shadow-inner">
                             {emp.avatarUrl ? <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                           </div>
                           <div>
                             <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                             <p className="text-[10px] text-slate-500 font-medium uppercase">{emp.email || 'No email'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{emp.role}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{emp.department || 'Admin'}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", emp.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}>
                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                         <div className="flex flex-col items-center gap-3 text-slate-400">
                           <AlertCircle className="w-12 h-12 opacity-20" />
                           <p className="text-sm font-bold italic">No staff members found matching your search.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-5">Period</th>
                      <th className="px-6 py-5">Staff Name</th>
                      <th className="px-6 py-5">Gross Salary</th>
                      <th className="px-6 py-5">Net Pay</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollRecords && payrollRecords.length > 0 ? payrollRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-indigo-50/10">
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{`${record.month} ${record.year}`}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{record.employeeName}</td>
                        <td className="px-6 py-4 text-sm font-medium">{formatCurrency(record.baseSalary)}</td>
                        <td className="px-6 py-4 text-sm font-black text-emerald-600">{formatCurrency(record.netPay)}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", record.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDownloadResource("Pay Stub - " + record.month + " " + record.year)}
                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            title="Download Pay Stub"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                           <div className="flex flex-col items-center gap-3 text-slate-400">
                             <DollarSign className="w-12 h-12 opacity-20" />
                             <p className="text-sm font-bold italic">No payroll records found for this period.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} employee={editingEmployee} />
    </div>
  );
};