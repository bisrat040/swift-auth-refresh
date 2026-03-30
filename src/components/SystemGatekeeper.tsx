import React, { useState, useEffect } from 'react';
import { Shield, Users, History, CheckCircle2 } from 'lucide-react';
import { InvitationSection } from './gatekeeper/InvitationSection';
import { UserManagementSection } from './gatekeeper/UserManagementSection';
import { VerificationSection } from './gatekeeper/VerificationSection';
import { LogSection } from './gatekeeper/LogSection';
import { supabase } from '../lib/supabase';
import { User, Invitation, VerificationRequest, AuditLog } from '../types';
import { toast } from 'sonner';

interface SystemGatekeeperProps {
  onNavigateToProfile?: (userId: string) => void;
}

export const SystemGatekeeper: React.FC<SystemGatekeeperProps> = ({ onNavigateToProfile }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'verification' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Profiles
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      if (pError) throw pError;
      setUsers(profiles.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        avatarUrl: p.avatar_url,
        isActive: p.is_active,
        isGranted: p.is_granted
      })));

      // Fetch Invitations
      const { data: invs, error: iError } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
      if (iError) throw iError;
      setInvitations(invs.map(i => ({
        id: i.id,
        email: i.email,
        token: i.token,
        role: i.role,
        expiresAt: i.expires_at,
        status: i.status,
        createdAt: i.created_at
      })));

      // Fetch Verification Queue
      const { data: queue, error: qError } = await supabase.from('verification_queue').select('*').order('created_at', { ascending: false });
      if (qError) throw qError;
      setVerificationQueue(queue.map(q => ({
        id: q.id,
        fullName: q.full_name,
        email: q.email,
        buildingName: q.building_name,
        tinNumber: q.tin_number,
        status: q.status,
        createdAt: q.created_at,
        grantedAt: q.granted_at,
        grantedBy: q.granted_by
      })));

      // Fetch Audit Logs
      const { data: logs, error: lError } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (lError) throw lError;
      setAuditLogs(logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        adminName: l.admin_name,
        adminEmail: l.admin_email,
        actionType: l.action_type,
        details: l.details,
        userEmail: l.user_email
      })));

    } catch (err: any) {
      toast.error("Failed to load gatekeeper data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Gatekeeper</h2>
            <p className="text-sm text-slate-500 font-medium">Manage user access, invitations, and system security.</p>
          </div>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'invitations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Invitations
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'verification' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Verification
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Logs
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'users' && (
          <UserManagementSection users={users} onRefresh={fetchData} onNavigateToProfile={onNavigateToProfile} />
        )}
        {activeTab === 'invitations' && (
          <InvitationSection invitations={invitations} onRefresh={fetchData} />
        )}
        {activeTab === 'verification' && (
          <VerificationSection requests={verificationQueue} onRefresh={fetchData} />
        )}
        {activeTab === 'logs' && (
          <LogSection logs={auditLogs} />
        )}
      </div>
    </div>
  );
};