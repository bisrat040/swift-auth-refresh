import React, { useState } from 'react';
import { Mail, Shield, Plus, Clock, CheckCircle2, XCircle, Copy, Check, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Invitation, UserRole } from '../../types';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';

interface InvitationSectionProps {
  invitations: Invitation[];
  onRefresh: () => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'BUILDING_OWNER', label: 'Building Owner' },
  { value: 'SENIOR_MANAGER', label: 'Senior Manager' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
  { value: 'ACCOUNT_MANAGER', label: 'Account Manager' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'MAINTENANCE_CREW', label: 'Maintenance Crew' },
  { value: 'PARKING_MANAGER', label: 'Parking Manager' },
  { value: 'HR', label: 'HR Assistant' },
  { value: 'EMPLOYEE', label: 'Employee' }
];

export const InvitationSection: React.FC<InvitationSectionProps> = ({ invitations, onRefresh }) => {
  const { currentUser } = useUser();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('BUILDING_OWNER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
      const { error } = await supabase.from('invitations').insert({
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'Pending',
        created_at: new Date().toISOString(),
        invited_by: currentUser?.id
      });

      if (error) throw error;

      // Log action
      await supabase.from('audit_logs').insert({
        admin_name: currentUser?.name || 'Admin',
        admin_email: currentUser?.email || '',
        action_type: 'Invitation',
        details: `Invited ${email} as ${role}.`,
        user_email: email,
        timestamp: new Date().toISOString()
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}?inviteToken=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invitation link copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            New Invitation
          </h3>
          <p className="text-xs text-slate-500 font-medium">Manage system-wide access requests</p>
        </div>
        <form onSubmit={generateInvite} className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div className="w-full lg:w-72 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting Role</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-11 pr-4 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-bold text-sm text-slate-900"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Generating...' : 'Send Invitation'}
          </Button>
        </form>
      </div>

      {/* Sent Invitations Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Sent Invitations History</h3>
          <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-tighter">
            {invitations.length} Records Found
          </span>
        </div>
        <div className="overflow-x-auto">
          {invitations.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="text-slate-900 font-black mb-2">No Active Invitations</h4>
              <p className="text-slate-500 text-sm font-medium">Start by generating a new invitation for a staff member.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Recipient Profile</th>
                  <th className="px-8 py-5">Access Role</th>
                  <th className="px-8 py-5">Security Token</th>
                  <th className="px-8 py-5">Valid Until</th>
                  <th className="px-8 py-5">Current Status</th>
                  <th className="px-8 py-5 text-right">Link Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="group hover:bg-indigo-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="text-sm font-black text-slate-900">{invite.email}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
                        {invite.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-[11px] font-mono text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        {invite.token.substring(0, 10)}...
                      </code>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {invite.status === 'Pending' ? (
                        <span className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      ) : invite.status === 'Accepted' ? (
                        <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase">
                          <CheckCircle2 className="w-4 h-4" />
                          Accepted
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase">
                          <XCircle className="w-4 h-4" />
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invite.token)}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-white h-10 px-4 rounded-xl transition-all"
                      >
                        {copiedToken === invite.token ? (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span className="text-[10px] font-black">COPIED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">Copy Link</span>
                          </div>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};