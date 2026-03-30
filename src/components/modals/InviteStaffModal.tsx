import React, { useState } from 'react';
import { X, Mail, Shield, Send, CheckCircle2, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: { id: string; label: string; description: string }[];
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({ 
  isOpen, 
  onClose,
  availableRoles 
}) => {
  const { currentUser } = useUser();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(availableRoles[0]?.id || 'PROPERTY_MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
      // 1. Create invitation
      const { error: inviteError } = await supabase.from('invitations').insert({
        email,
        role: selectedRole,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'Pending',
        created_at: new Date().toISOString(),
        invited_by: currentUser?.id
      });

      if (inviteError) throw inviteError;

      // 2. Log audit
      await supabase.from('audit_logs').insert({
        admin_name: currentUser?.name || 'System',
        admin_email: currentUser?.email || '',
        action_type: 'Invitation',
        details: `Building Owner invited ${email} as ${selectedRole.replace('_', ' ')}.`,
        user_email: email,
        timestamp: new Date().toISOString()
      });

      setIsSuccess(true);
      toast.success(`Invitation sent to ${email}`);
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedRole(availableRoles[0]?.id || 'PROPERTY_MANAGER');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Invite Staff Member</h2>
                <p className="text-sm text-slate-500 font-medium">Add a new person to your property team</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            </button>
          </div>

          <div className="p-8">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Invitation Sent!</h3>
                <p className="text-slate-500 max-w-xs">
                  We've sent an invitation link to <span className="font-bold text-slate-900">{email}</span>.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Employee Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    placeholder="staff@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Assign Access Role
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          selectedRole === role.id 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-100' 
                            : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedRole === role.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                        }`}>
                          {selectedRole === role.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${selectedRole === role.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {role.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {role.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Invited employees will receive an email with a unique signup link. Once they complete their profile, they will have access based on the role permissions defined in your settings.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      Send Invitation Link
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};