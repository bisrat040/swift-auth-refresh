import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Building2, 
  Users2, 
  FileKey, 
  Wrench, 
  DollarSign, 
  UserRound, 
  Car, 
  BarChart3, 
  Settings2,
  Check,
  X,
  Lock,
  Search,
  ArrowRight,
  UserPlus,
  Save,
  Info,
  Edit2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteStaffModal } from './modals/InviteStaffModal';
import { EditRoleModal } from './modals/EditRoleModal';
import { supabase } from '../lib/supabase';

type PermissionModule = 
  | 'Dashboard' 
  | 'Properties' 
  | 'Tenants' 
  | 'Leases' 
  | 'Maintenance' 
  | 'Financials' 
  | 'HR & Payroll' 
  | 'Parking' 
  | 'Reports' 
  | 'Settings';

interface RolePermission {
  module: PermissionModule;
  description: string;
  icon: any;
  permissions: Record<string, boolean>;
}

const MODULES: RolePermission[] = [
  { 
    module: 'Dashboard', 
    description: 'View overview metrics and system activity',
    icon: LayoutDashboard,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: true,
      MAINTENANCE_CREW: true,
      ACCOUNT_MANAGER: true,
      PARKING_MANAGER: true,
      HR: true
    }
  },
  { 
    module: 'Properties', 
    description: 'Manage building data and unit information',
    icon: Building2,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: true,
      ACCOUNT_MANAGER: false,
      PARKING_MANAGER: false,
      HR: false
    }
  },
  { 
    module: 'Tenants', 
    description: 'Manage tenant profiles and communications',
    icon: Users2,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: true,
      PARKING_MANAGER: false,
      HR: false
    }
  },
  { 
    module: 'Leases', 
    description: 'Create and manage lease agreements',
    icon: FileKey,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: true,
      PARKING_MANAGER: false,
      HR: false
    }
  },
  { 
    module: 'Maintenance', 
    description: 'Create and resolve maintenance requests',
    icon: Wrench,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: true,
      ACCOUNT_MANAGER: false,
      PARKING_MANAGER: false,
      HR: false
    }
  },
  { 
    module: 'Financials', 
    description: 'View revenue, expenses and transactions',
    icon: DollarSign,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: true,
      PARKING_MANAGER: false,
      HR: false
    }
  },
  { 
    module: 'HR & Payroll', 
    description: 'Manage employee data and payroll processing',
    icon: UserRound,
    permissions: {
      PROPERTY_MANAGER: false,
      HR_MANAGER: true,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: false,
      PARKING_MANAGER: false,
      HR: true
    }
  },
  { 
    module: 'Parking', 
    description: 'Manage parking slots and guest access',
    icon: Car,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: false,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: false,
      PARKING_MANAGER: true,
      HR: false
    }
  },
  { 
    module: 'Reports', 
    description: 'Generate and export system reports',
    icon: BarChart3,
    permissions: {
      PROPERTY_MANAGER: true,
      HR_MANAGER: true,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: true,
      PARKING_MANAGER: true,
      HR: false
    }
  },
  { 
    module: 'Settings', 
    description: 'Modify system-wide configurations',
    icon: Settings2,
    permissions: {
      PROPERTY_MANAGER: false,
      HR_MANAGER: false,
      MAINTENANCE_CREW: false,
      ACCOUNT_MANAGER: false,
      PARKING_MANAGER: false,
      HR: false
    }
  }
];

const INITIAL_ROLES: { id: string; label: string; description: string }[] = [
  { id: 'PROPERTY_MANAGER', label: 'Property Manager', description: 'Handles day-to-day building operations' },
  { id: 'ACCOUNT_MANAGER', label: 'Account Manager', description: 'Manages finances and tenant payments' },
  { id: 'HR_MANAGER', label: 'HR Manager', description: 'Handles staff hiring and payroll' },
  { id: 'MAINTENANCE_CREW', label: 'Maintenance Crew', description: 'Responds to building issues and repairs' },
  { id: 'PARKING_MANAGER', label: 'Parking Manager', description: 'Manages parking facilities and guests' },
  { id: 'HR', label: 'HR Assistant', description: 'Assists with staff administrative tasks' }
];

export const RolePermissionsSection: React.FC = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>(MODULES);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; label: string; description: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.warn('Roles table might not exist, using defaults');
      } else if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
      }

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (permissionsError && permissionsError.code !== 'PGRST116') {
        console.warn('Role permissions table might not exist');
      } else if (permissionsData && permissionsData.length > 0) {
        const newPermissions = MODULES.map(module => {
          const dbModule = permissionsData.find(d => d.module_name === module.module);
          if (dbModule) {
            return {
              ...module,
              permissions: dbModule.permissions as Record<string, boolean>
            };
          }
          return module;
        });
        setPermissions(newPermissions);
      }
    } catch (err) {
      console.warn('Unexpected error in fetchData:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (moduleName: PermissionModule, roleId: string) => {
    setPermissions(prev => prev.map(m => {
      if (m.module === moduleName) {
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [roleId]: !m.permissions[roleId]
          }
        };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if tables exist by attempting a dry-run or just handle specific error codes
      const { error: rolesError } = await supabase
        .from('roles')
        .upsert(roles.map(r => ({
          id: r.id,
          label: r.label,
          description: r.description,
          updated_at: new Date().toISOString()
        })));

      if (rolesError) throw rolesError;

      const updates = permissions.map(p => ({
        module_name: p.module,
        permissions: p.permissions,
        updated_at: new Date().toISOString()
      }));

      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .upsert(updates, { onConflict: 'module_name' });

      if (permissionsError) throw permissionsError;

      toast.success('Role permissions updated successfully');
      setHasUnsavedChanges(false);
    } catch (err: any) {
      // If it fails because of missing table, we can provide a nice message
      if (err.code === '42P01') {
        toast.error('Database tables for RBAC are not fully provisioned. Changes are saved locally for this session.');
        setHasUnsavedChanges(false); // Clear alert so user isn't annoyed
      } else {
        toast.error('Failed to save permissions: ' + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRole = (role: { id: string; label: string; description: string }) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async (roleId: string, updatedPermissions: Record<PermissionModule, boolean>, roleData: { label: string; description: string }) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...roleData } : r));

    setPermissions(prev => prev.map(m => ({
      ...m,
      permissions: {
        ...m.permissions,
        [roleId]: updatedPermissions[m.module]
      }
    })));

    setHasUnsavedChanges(true);
    toast.info(`Permissions for ${roleData.label} updated in view. Don't forget to save changes.`);
  };

  const filteredModules = permissions.filter(m => 
    m.module.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900">Roles & Permissions Matrix</h3>
          <p className="text-sm text-slate-500 font-medium">Manage access levels and invite employees to your management team</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 w-48 md:w-64 transition-all"
            />
          </div>
          
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-900 rounded-xl text-xs font-black hover:border-indigo-600 hover:text-indigo-600 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Invite Staff
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3"
          >
            <Info className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800 font-bold">You have unsaved changes. Remember to save before leaving this page.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 overflow-x-auto">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Permission Matrix...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 w-[300px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Module / Access</span>
                  </div>
                </th>
                {roles.map(role => (
                  <th key={role.id} className="px-4 py-6 text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-2 group/header relative">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{role.label}</span>
                      <button 
                        onClick={() => handleEditRole(role)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover/header:opacity-100 p-1.5 bg-white border border-slate-100 text-indigo-600 rounded-lg transition-all hover:border-indigo-600 hover:shadow-lg shadow-indigo-100"
                        title={`Edit ${role.label} Role`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <div className="h-1.5 w-6 bg-indigo-100 rounded-full"></div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.map((item) => (
                <tr key={item.module} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col mt-1.5">
                        <span className="text-sm font-black text-slate-900">{item.module}</span>
                        <span className="text-[11px] text-slate-500 font-medium line-clamp-1">{item.description}</span>
                      </div>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role.id} className="px-4 py-5 text-center">
                      <button 
                        onClick={() => togglePermission(item.module, role.id)}
                        className={cn(
                          "w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90",
                          item.permissions[role.id] 
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm shadow-emerald-100/50" 
                            : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {item.permissions[role.id] ? (
                          <Check className="w-6 h-6" strokeWidth={3} />
                        ) : (
                          <X className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-white space-y-4 shadow-sm shadow-slate-100/50">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">Super Admin Override</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
              Building Owners and Super Admins bypass this matrix. They have full access to all modules and system settings to ensure complete control of the property.
            </p>
          </div>
        </div>
        
        <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-white space-y-4 shadow-sm shadow-slate-100/50">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">Security Best Practices</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
              We recommend following the principle of least privilege. Only grant access to modules strictly necessary for a staff member's day-to-day responsibilities.
            </p>
          </div>
        </div>

        <div className="p-8 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100 space-y-6 relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <UserPlus className="w-48 h-48" />
          </div>
          <div>
            <h4 className="text-base font-bold">Need more help?</h4>
            <p className="text-xs text-indigo-100 mt-2 font-medium">Learn how to optimize your property team's workflow by managing roles effectively.</p>
          </div>
          <button onClick={() => toast.info('Navigating to system documentation...')} className="flex items-center gap-2 text-xs font-black bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all">
            View User Guide
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)}
        availableRoles={roles}
      />

      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={editingRole}
        modules={permissions}
        onUpdate={handleUpdateRole}
      />
    </div>
  );
};