import React, { useState, useEffect } from 'react';
import { X, Shield, Save, Loader2, Check, X as XIcon, LayoutDashboard, Building2, Users2, FileKey, Wrench, DollarSign, UserRound, Car, BarChart3, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

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

const MODULE_ICONS: Record<PermissionModule, any> = {
  'Dashboard': LayoutDashboard,
  'Properties': Building2,
  'Tenants': Users2,
  'Leases': FileKey,
  'Maintenance': Wrench,
  'Financials': DollarSign,
  'HR & Payroll': UserRound,
  'Parking': Car,
  'Reports': BarChart3,
  'Settings': Settings2
};

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: { id: string; label: string; description: string } | null;
  modules: { module: PermissionModule; description: string; permissions: Record<string, boolean> }[];
  onUpdate: (roleId: string, updatedPermissions: Record<PermissionModule, boolean>, roleData: { label: string; description: string }) => Promise<void>;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({ 
  isOpen, 
  onClose,
  role,
  modules,
  onUpdate
}) => {
  const [roleLabel, setRoleLabel] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Record<PermissionModule, boolean>>({} as any);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setRoleLabel(role.label);
      setRoleDescription(role.description);
      
      const permissions: any = {};
      modules.forEach(m => {
        permissions[m.module] = m.permissions[role.id] || false;
      });
      setRolePermissions(permissions);
    }
  }, [role, modules]);

  const togglePermission = (module: PermissionModule) => {
    setRolePermissions(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setIsSaving(true);
    try {
      await onUpdate(role.id, rolePermissions, { label: roleLabel, description: roleDescription });
      onClose();
    } catch (err: any) {
      toast.error('Failed to update role: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Edit Role: {role.label}</h2>
                <p className="text-sm text-slate-500 font-medium">Customize role identity and permissions</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSave} className="space-y-8">
              {/* Role Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Role Label
                  </label>
                  <input
                    type="text"
                    required
                    value={roleLabel}
                    onChange={(e) => setRoleLabel(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                    placeholder="e.g. Property Manager"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                    placeholder="Brief description of responsibilities"
                  />
                </div>
              </div>

              {/* Module Permissions */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  Module Access
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((m) => {
                    const Icon = MODULE_ICONS[m.module];
                    const isActive = rolePermissions[m.module];
                    return (
                      <button
                        key={m.module}
                        type="button"
                        onClick={() => togglePermission(m.module)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          isActive 
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-100" 
                            : "border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          isActive ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-100"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold", isActive ? "text-emerald-900" : "text-slate-900")}>
                            {m.module}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                          isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-white"
                        )}>
                          {isActive ? <Check className="w-4 h-4" strokeWidth={3} /> : <XIcon className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Role...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Role Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};