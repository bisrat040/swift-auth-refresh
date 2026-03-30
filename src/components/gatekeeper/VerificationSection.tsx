import React, { useState } from 'react';
import { UserCheck, UserX, Building2, Fingerprint, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { VerificationRequest } from '../../types';
import { toast } from 'sonner';
import { supabase, grantUserApproval } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';

interface VerificationSectionProps {
  requests: VerificationRequest[];
  onRefresh: () => void;
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({ requests, onRefresh }) => {
  const { currentUser, isSuperAdmin } = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (request: VerificationRequest, action: 'approve' | 'deny' | 'grant') => {
    setProcessingId(request.id);
    try {
      if (action === 'approve') {
        // Update verification request status to Approved
        const { error: reqError } = await supabase
          .from('verification_queue')
          .update({ status: 'Approved' })
          .eq('id', request.id);

        if (reqError) throw reqError;

        // Log action
        await supabase.from('audit_logs').insert({
          admin_name: currentUser?.name || 'Admin',
          admin_email: currentUser?.email || '',
          action_type: 'Approval',
          details: `Approved Verification for ${request.fullName}. Status moved to Approved.`,
          user_email: request.email,
          timestamp: new Date().toISOString()
        });

        toast.success(`Verification approved for ${request.fullName}`);
      } else if (action === 'grant') {
        if (!isSuperAdmin) {
          toast.error('Only Super Admins can grant final access');
          return;
        }

        await grantUserApproval(request.id, request.email, currentUser?.id || '');

        // Log action
        await supabase.from('audit_logs').insert({
          admin_name: currentUser?.name || 'Super Admin',
          admin_email: currentUser?.email || '',
          action_type: 'Granting',
          details: `Granted full access for ${request.fullName}. User added to confirmed list.`,
          user_email: request.email,
          timestamp: new Date().toISOString()
        });

        toast.success(`Access fully granted for ${request.fullName}`);
      } else {
        // Delete the request
        const { error } = await supabase
          .from('verification_queue')
          .delete()
          .eq('id', request.id);

        if (error) throw error;

        // Log action
        await supabase.from('audit_logs').insert({
          admin_name: currentUser?.name || 'Admin',
          admin_email: currentUser?.email || '',
          action_type: 'Denial',
          details: `Denied Access for ${request.fullName}.`,
          user_email: request.email,
          timestamp: new Date().toISOString()
        });

        toast.error(`Access request denied for ${request.fullName}`);
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Verification Queue</h3>
          <p className="text-sm text-slate-500">Users waiting for platform access approval.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
            {requests.filter(r => r.status === 'Pending').length} Pending
          </span>
          <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            {requests.filter(r => r.status === 'Approved').length} Approved
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-slate-900 font-bold mb-1">Queue Empty</h4>
            <p className="text-slate-500 text-sm">No new registrants awaiting approval.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Registrant</th>
                <th className="px-6 py-4">Building Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Requested On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900">{req.fullName}</p>
                      <p className="text-xs text-slate-500">{req.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Fingerprint className="w-3 h-3 text-slate-400" />
                        <code className="text-[10px] font-mono text-slate-500">{req.tinNumber}</code>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{req.buildingName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      req.status === 'Granted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'Pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(req, 'deny')}
                            disabled={processingId === req.id}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 h-8"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(req, 'approve')}
                            disabled={processingId === req.id}
                            className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </>
                      )}
                      {req.status === 'Approved' && isSuperAdmin && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(req, 'grant')}
                          disabled={processingId === req.id}
                          className="bg-indigo-600 hover:bg-indigo-700 h-8"
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Grant Access
                        </Button>
                      )}
                      {req.status === 'Granted' && (
                        <span className="text-xs text-slate-400 italic">Access Confirmed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};