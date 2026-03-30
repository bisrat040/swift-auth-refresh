import React, { useState } from 'react';
import { Users, Shield, ArrowRightLeft, Search, CheckCircle2, Eye } from 'lucide-react';
import { Input } from '../ui/input';
import { User, UserRole } from '../../types';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/button';

interface UserManagementSectionProps {
  users: User[];
  onRefresh: () => void;
  onNavigateToProfile?: (userId: string) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({ users, onRefresh, onNavigateToProfile }) => {
  const { currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log action
      const targetUser = users.find(u => u.id === userId);
      await supabase.from('audit_logs').insert({
        admin_name: currentUser?.name || 'Admin',
        admin_email: currentUser?.email || '',
        action_type: 'RoleChange',
        details: `Changed role for ${targetUser?.name} to ${newRole}.`,
        user_email: targetUser?.email || '',
        timestamp: new Date().toISOString()
      });

      toast.success(`Role updated successfully`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">User & Role Management</h3>
          <p className="text-sm text-slate-500">Master list of all registered platform users.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
            id="user-search"
            name="user-search"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Current Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      {user.isGranted && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        {user.isGranted && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                            GRANTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Shield className="w-3 h-3" />
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                      user.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onNavigateToProfile?.(user.id)}
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                      <select
                        id={`role-select-${user.id}`}
                        name={`role-select-${user.id}`}
                        value={user.role}
                        disabled={updatingId === user.id || (user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN')}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-600 outline-none"
                      >
                        <optgroup label="Management">
                          <option value="BUILDING_OWNER">Building Owner</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SENIOR_MANAGER">Senior Manager</option>
                          <option value="PROPERTY_MANAGER">Property Manager</option>
                        </optgroup>
                        <optgroup label="Operational">
                          <option value="HR_MANAGER">HR Manager</option>
                          <option value="HR">HR</option>
                          <option value="ACCOUNT_MANAGER">Account Manager</option>
                          <option value="PARKING_MANAGER">Parking Manager</option>
                          <option value="MAINTENANCE_CREW">Maintenance Crew</option>
                          <option value="EMPLOYEE">Employee</option>
                        </optgroup>
                        {user.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                      </select>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};