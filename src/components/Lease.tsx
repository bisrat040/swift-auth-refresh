import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  Download, 
  ArrowLeft, 
  FileSpreadsheet,
  Settings2,
  DollarSign,
  User,
  History,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Building2,
  MapPin,
  Clock,
  Trash2,
  Edit,
  Share2,
  Upload,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import { Lease as LeaseType, TenantPayment, LeaseAmendment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ExcelImport } from './ExcelImport';
import { TimeFilterSelector } from './TimeFilterSelector';
import { LeaseModal } from './modals/LeaseModal';
import { LeaseManagementForm } from './lease/LeaseManagementForm';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '../lib/supabase';

interface LeaseProps {
  onNavigateToTenant?: (id: string) => void;
}

const LeaseProfile = ({ 
  lease, 
  onBack, 
  onEdit,
  onManage,
  onNavigateToTenant
}: { 
  lease: LeaseType; 
  onBack: () => void; 
  onEdit: () => void;
  onManage: () => void;
  onNavigateToTenant: (id: string) => void;
}) => {
  const { tenants } = useData();
  const tenant = useMemo(() => tenants?.find(t => t.id === lease.tenantId), [tenants, lease.tenantId]);
  const [isDeleting, setIsDeleting] = useState(false);

  const leaseProgress = useMemo(() => {
    const start = new Date(lease.startDate).getTime();
    const end = new Date(lease.endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  }, [lease.startDate, lease.endDate]);

  const daysRemaining = useMemo(() => {
    const end = new Date(lease.endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [lease.endDate]);

  const handleTerminateLease = async () => {
    if (!confirm('Are you sure you want to terminate this lease? This action is irreversible.')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: 'Terminated' })
        .eq('id', lease.id);
      
      if (error) throw error;
      toast.success('Lease terminated successfully');
      onBack();
    } catch (err: any) {
      toast.error(err.message || 'Failed to terminate lease');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: newStatus })
        .eq('id', lease.id);
      
      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 leading-none">Agreement #{lease.id.slice(0, 8)}</h2>
              <Badge 
                variant="secondary" 
                className={cn(
                  "uppercase text-[10px] py-0 px-2 font-bold",
                  lease.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                  lease.status === 'Expired' ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"
                )}
              >
                {lease.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {lease.tenantName || 'Unknown Tenant'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => toast.info('Generating PDF export for this agreement...')} className="flex-1 md:flex-none gap-2 font-bold">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Agreement link copied to clipboard');
          }} className="flex-1 md:flex-none gap-2 font-bold">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button size="sm" onClick={onEdit} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
            Renew / Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 overflow-hidden shadow-md">
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              <img 
                src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/f6bf654b-5243-4e79-bae8-83fa6e1070e2/lease-dashboard-overview-c62351be-1774078868004.webp" 
                alt="Dashboard"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
              />
              <div className="absolute bottom-4 left-4">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Current Progress</p>
                <p className="text-white text-lg font-black">{leaseProgress}% Completed</p>
              </div>
            </div>
            <CardContent className="p-6">
              <Progress value={leaseProgress} className="h-2 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Rent</p>
                  <p className="text-lg font-black text-indigo-600">{formatCurrency(lease.rentAmount || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
                  <p className="text-lg font-black text-slate-900">{daysRemaining} Days</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Unit</p>
                    <p className="text-xs font-bold text-slate-800">{lease.unitNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Floor</p>
                    <p className="text-xs font-bold text-slate-800">Level {lease.floor || 'G'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                    <p className="text-xs font-bold text-slate-800">{lease.leaseDuration || '1 Year'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
                    <p className="text-xs font-bold text-slate-800">{lease.contractType || 'Standard'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Tenant Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                <img 
                  src={tenant?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${lease.tenantName}`} 
                  alt={lease.tenantName} 
                  className="w-10 h-10 rounded-full bg-slate-200"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">{lease.tenantName}</p>
                  <p className="text-xs text-slate-500">{tenant?.email || 'No email'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 text-xs font-bold h-9"
                  onClick={() => lease.tenantId && onNavigateToTenant(lease.tenantId)}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Full Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-xs font-bold h-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => toast.info('Redirecting to Financial reports dashboard...')}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Payment Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100/50 p-1 rounded-xl mb-6 h-auto flex-wrap sm:flex-nowrap shadow-inner">
              <TabsTrigger value="overview" className="flex-1 py-2.5 rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white text-xs font-bold gap-2">
                <FileText className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="financials" className="flex-1 py-2.5 rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white text-xs font-bold gap-2">
                <DollarSign className="w-4 h-4" /> Financials
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 py-2.5 rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white text-xs font-bold gap-2">
                <Upload className="w-4 h-4" /> Documents
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 py-2.5 rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white text-xs font-bold gap-2">
                <History className="w-4 h-4" /> History
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 py-2.5 rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white text-xs font-bold gap-2">
                <Settings2 className="w-4 h-4" /> Settings
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">Lease Terms</CardTitle>
                        <CardDescription className="text-xs">Summary of legal obligations and clauses.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{lease.terms || 'Standard commercial lease terms apply. Utilities billed separately according to consumption.'}"
                        </p>
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t border-slate-100 py-3">
                        <Button variant="ghost" size="sm" className="text-indigo-600 font-bold ml-auto gap-1" onClick={() => toast.info('Loading complete agreement text...')}> 
                          View Full Text <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">Utilities Included</CardTitle>
                        <CardDescription className="text-xs">Services covered by the base rent.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(lease.utilitiesIncluded || ['Water', 'Security', 'Garbage']).map((utility, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 font-bold border-none">
                              {utility}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardHeader className="pt-0">
                        <CardTitle className="text-sm font-bold mt-2">Termination Notice</CardTitle>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {lease.terminationNotice || '3 Months required'}
                        </p>
                      </CardHeader>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-slate-100 bg-emerald-50/20">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Total Paid to Date</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(tenant?.totalPaidAmount || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-100 bg-indigo-50/20">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Deposit Held</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(lease.depositAmount || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-100 bg-amber-50/20">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Total Contract Value</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(lease.totalRent || 0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">Payment History</CardTitle>
                        <CardDescription className="text-xs">Recent transactions for this lease.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 font-bold" onClick={() => toast.info('Preparing comprehensive financial statement for download...')}>
                        <Download className="w-4 h-4" /> Statement
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Reference</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(tenant?.paymentHistory || []).map((payment: TenantPayment) => (
                            <TableRow key={payment.id} className="group hover:bg-slate-50 transition-colors">
                              <TableCell className="text-xs font-medium">{payment.date}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-500 font-mono">{payment.receiptNumber}</TableCell>
                              <TableCell className="text-xs">{payment.method}</TableCell>
                              <TableCell className="text-xs font-black">{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] py-0 px-1.5 font-bold",
                                    payment.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                  )}
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">Agreement Documents</h4>
                        <p className="text-xs text-slate-500">Manage and view all signed lease artifacts.</p>
                      </div>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold shadow-lg shadow-indigo-100" onClick={() => toast.info('System preparing secure upload channel...')}> 
                        <Upload className="w-4 h-4" /> Add New Artifact
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                      {(lease.documents && lease.documents.length > 0) ? lease.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{doc.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Uploaded on {doc.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => toast.info('Retrieving document from secure storage...')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => toast.success(`${doc.name} removed from record.`)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="md:col-span-2 text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <p className="text-sm text-slate-500 font-medium">No archival documents found for this lease.</p>
                          <Button variant="link" className="text-indigo-600 font-bold mt-2" onClick={() => toast.info('Opening secure file picker...')}>Click here to upload</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-slate-200 overflow-hidden shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Amendments & Modifications</CardTitle>
                      <CardDescription className="text-xs">Chronological history of lease lifecycle changes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-100"></div>
                        <div className="space-y-8 p-6">
                          {(lease.amendments && lease.amendments.length > 0) ? lease.amendments.map((amendment: LeaseAmendment, i) => (
                            <div key={i} className="relative pl-10 group">
                              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-indigo-600 bg-white z-10 group-hover:scale-125 transition-transform"></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-slate-900">{amendment.description}</p>
                                  <span className="text-[10px] text-slate-400 font-bold">{amendment.date}</span>
                                </div>
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-6 group-hover:bg-white group-hover:shadow-md transition-all">
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Previous Rate</p>
                                    <p className="text-xs font-bold text-slate-500 line-through">{formatCurrency(amendment.previousRent)}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-300" />
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase">New Committed Rate</p>
                                    <p className="text-sm font-black text-indigo-600">{formatCurrency(amendment.newRent)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : <div className="pl-10 py-10 text-sm text-slate-400 italic">No historical modifications detected for this agreement.</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="grid grid-cols-1 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">Administrative Actions</CardTitle>
                        <CardDescription className="text-xs">Manage high-level agreement settings and status.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start gap-3 h-14 font-bold border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all" onClick={onManage}>
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                            <Edit className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black">Modify Structural Terms</p>
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5">Update legal clauses or rent values</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-14 font-bold border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all" onClick={onEdit}>
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                            <History className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black">Initiate Agreement Renewal</p>
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5">Roll over agreement into next term</p>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-red-100 bg-red-50/10 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-red-900">Danger Zone</CardTitle>
                        <CardDescription className="text-xs text-red-700/60">Operations that significantly impact agreement status.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold" onClick={() => handleStatusChange('Pending')}>
                          <AlertTriangle className="w-4 h-4" /> Mark as Pending Review
                        </Button>
                        <Button variant="destructive" disabled={isDeleting} className="bg-red-600 hover:bg-red-700 gap-2 font-bold shadow-lg shadow-red-100" onClick={handleTerminateLease}>
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Execute Immediate Termination
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export const Lease: React.FC<LeaseProps> = ({ onNavigateToTenant }) => {
  const { leases } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagementViewOpen, setIsManagementViewOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<LeaseType | undefined>(undefined);
  const { currentUser, isSuperAdmin } = useUser();

  const filteredLeases = useMemo(() => {
    return (leases || []).filter(lease => {
      const matchesSearch = (lease.tenantName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (lease.unitNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || statusFilter === 'All Statuses' || lease.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leases, searchTerm, statusFilter]);

  const selectedLease = useMemo(() => (leases || []).find(l => l.id === selectedLeaseId), [leases, selectedLeaseId]);

  const handleEdit = (lease: LeaseType) => {
    setEditingLease(lease);
    setIsModalOpen(true);
  };

  const handleManage = (lease?: LeaseType) => {
    setEditingLease(lease);
    setIsManagementViewOpen(true);
  };

  const handleCreate = () => {
    setEditingLease(undefined);
    handleManage();
  };

  if (isManagementViewOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsManagementViewOpen(false)} className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">Lease Agreement Management</h2>
        </div>
        <LeaseManagementForm 
          lease={editingLease} 
          onClose={() => setIsManagementViewOpen(false)} 
        />
      </div>
    );
  }

  if (selectedLease) {
    return (
      <>
        <LeaseProfile 
          lease={selectedLease} 
          onBack={() => setSelectedLeaseId(null)} 
          onEdit={() => handleEdit(selectedLease)} 
          onManage={() => handleManage(selectedLease)}
          onNavigateToTenant={(id) => onNavigateToTenant?.(id)}
        />
        <LeaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} lease={editingLease} />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lease Agreements</h2>
          <p className="text-slate-500 text-sm">Track agreements, renewals, and tenant contracts</p>
        </div>
        <div className="flex items-center gap-2">
          <TimeFilterSelector />
          <ExcelImport 
            entityType="Lease" 
            onDataImported={() => toast.success('Lease records processed successfully.')} 
            trigger={
              <Button variant="outline" className="gap-2 font-semibold bg-white border-slate-200 text-slate-600 shadow-sm">
                <FileSpreadsheet className="w-4 h-4" /> Import Data
              </Button>
            } 
          />
          {(isSuperAdmin || currentUser?.role === 'ADMIN') && (
            <Button onClick={handleCreate} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 gap-2 font-black">
              <Plus className="w-4 h-4" /> Draft New Lease
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by tenant name or unit number..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 text-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>
        <select 
          className="text-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none p-2.5 bg-white min-w-[140px] font-bold text-slate-600 shadow-sm"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Statuses</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Expired</option>
          <option>Terminated</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeases.length > 0 ? filteredLeases.map((lease) => (
          <motion.div 
            layout
            key={lease.id} 
            onClick={() => setSelectedLeaseId(lease.id)} 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "uppercase text-[9px] font-black py-0.5 px-2 rounded-full",
                  lease.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-none" : 
                  lease.status === 'Terminated' ? "bg-rose-50 text-rose-600 border-none" :
                  "bg-slate-100 text-slate-600 border-none"
                )}
              >
                {lease.status}
              </Badge>
            </div>
            
            <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{lease.tenantName}</h4>
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Unit Identity</span>
                <span className="font-bold text-slate-700">{lease.unitNumber} (Floor {lease.floor})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Rental Yield</span>
                <span className="font-bold text-indigo-600">{formatCurrency(lease.rentAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Expiration</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> {lease.endDate}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-600 uppercase">
                  {lease.tenantName?.charAt(0) || 'U'}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                Inspect Agreement <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900">No active lease agreements detected</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Try adjusting your filter parameters or search terms to find relevant records.</p>
          </div>
        )}
      </div>
      <LeaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} lease={editingLease} />
    </div>
  );
};