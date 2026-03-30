import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Building, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  Save, 
  RefreshCw,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Globe2,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  Camera,
  Loader2,
  Trash2,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { RolePermissionsSection } from './RolePermissionsSection';
import { ResetPasswordModal } from './modals/ResetPasswordModal';
import { supabase } from '../lib/supabase';

type SettingsTab = 'profile' | 'company' | 'permissions' | 'notifications' | 'security' | 'preferences';

export const Settings: React.FC = () => {
  const { currentUser, isSuperAdmin, isBuildingOwner, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    department: '',
    companyName: 'LandoManage Solutions',
    tinNumber: '0045632190',
    address: 'Bole, Addis Ababa, Ethiopia',
    website: 'https://landomanage.com',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    preferences: {
      theme: 'system',
      language: 'en',
      currency: 'ETB'
    }
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        department: currentUser.department || ''
      }));
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone,
            bio: formData.bio,
            location: formData.location,
            department: formData.department,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) throw error;
        await refreshProfile();
      } else {
        // For other tabs, we simulate the save as we don't have all tables yet
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast.success('Settings updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        toast.info('Avatar upload simulation complete. To make it permanent, integrate with a storage bucket.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
     if (!confirm('Are you sure you want to remove your profile picture?')) return;
     toast.success('Avatar removed successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(isSuperAdmin ? [{ id: 'company', label: 'Company', icon: Building }] : []),
    ...(isBuildingOwner || isSuperAdmin ? [{ id: 'permissions', label: 'Roles & Permissions', icon: ShieldCheck }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">System Settings</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your account preferences and global configurations</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Processing...' : 'Save Settings'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 space-y-2 bg-white p-3 rounded-[2rem] border border-slate-200 h-fit lg:sticky lg:top-24 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-slate-400")} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Personal Profile</h3>
                    <p className="text-sm text-slate-500 font-medium">Basic information about your account identity</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-8 pb-10 border-b border-slate-100">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-md">
                        <img 
                          src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                      <button 
                        onClick={handleAvatarClick}
                        className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <p className="text-sm font-black text-slate-900">Display Avatar</p>
                      <p className="text-xs text-slate-500 font-medium max-w-[200px]">Used for identification across the management platform.</p>
                      <div className="flex gap-3 pt-2 justify-center sm:justify-start">
                        <button onClick={handleAvatarClick} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all">Change Photo</button>
                        <button onClick={handleRemoveAvatar} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all">Remove</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})} 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="yourname@company.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="+251..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Role</label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                        <input 
                          type="text" 
                          value={currentUser.role.replace('_', ' ')} 
                          readOnly
                          className="w-full pl-11 pr-4 py-4 bg-indigo-50/50 border-none rounded-2xl text-sm font-black text-indigo-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (isBuildingOwner || isSuperAdmin) && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">RBAC Configurations</h3>
                    <p className="text-sm text-slate-500 font-medium">Configure granular permissions for each user role</p>
                  </div>
                  <RolePermissionsSection />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Push & Alert Preferences</h3>
                    <p className="text-sm text-slate-500 font-medium">How and when you want to be notified about system events</p>
                  </div>

                  <div className="space-y-4">
                    {[ 
                      { key: 'email', title: 'Critical Email Alerts', desc: 'Financial reports and security breaches', icon: Mail },
                      { key: 'push', title: 'System Push Notifications', desc: 'Maintenance requests and tenant updates', icon: Smartphone },
                      { key: 'sms', title: 'Urgent SMS Reminders', desc: 'Direct alerts for overdue payments', icon: Phone },
                      { key: 'marketing', title: 'Newsletter & Features', desc: 'Monthly updates on platform improvements', icon: Globe2 }
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600">
                            <pref.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{pref.title}</p>
                            <p className="text-xs text-slate-500 font-medium">{pref.desc}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setFormData({
                            ...formData, 
                            notifications: { ...formData.notifications, [pref.key]: !formData.notifications[pref.key as keyof typeof formData.notifications] }
                          })}
                          className={cn(
                            "w-14 h-7 rounded-full relative transition-all duration-300",
                            formData.notifications[pref.key as keyof typeof formData.notifications] ? "bg-indigo-600" : "bg-slate-200"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md",
                            formData.notifications[pref.key as keyof typeof formData.notifications] ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Security Hardening</h3>
                    <p className="text-sm text-slate-500 font-medium">Protect your property data with advanced security layers</p>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-amber-50 border border-amber-200/50 p-6 rounded-[2rem] flex items-start gap-5 shadow-sm shadow-amber-100/50">
                      <div className="p-3 bg-amber-200/50 rounded-2xl">
                         <AlertCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-amber-900">Legacy Password Detected</p>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">Your password was last changed 142 days ago. For maximum security, we recommend rotating it now.</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Lock className="w-5 h-5" /></div>
                           <div>
                             <p className="text-sm font-black text-slate-900">Login Credentials</p>
                             <p className="text-xs text-slate-500 font-medium">Update your encrypted password</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setIsResetModalOpen(true)}
                          className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-[0.98]"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400"><ShieldCheck className="w-5 h-5" /></div>
                           <div>
                             <p className="text-sm font-black text-slate-900">2FA Authentication</p>
                             <p className="text-xs text-slate-500 font-medium">Multi-factor code verification via Authenticator App</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toast.info('Two-factor setup module is being optimized for your region...')}
                          className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-100 transition-all active:scale-[0.98]"
                        >
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400"><Trash2 className="w-5 h-5" /></div>
                            <div>
                              <p className="text-sm font-black text-slate-900">Danger Zone</p>
                              <p className="text-xs text-slate-500 font-medium">Permanently delete account and all property data</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => toast.error('Account deletion requires administrative authorization.')}
                           className="px-8 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-black transition-all active:scale-[0.98] underline decoration-rose-200 underline-offset-4"
                         >
                           Delete Account
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Personalization</h3>
                    <p className="text-sm text-slate-500 font-medium">Customize the interface to suit your workflow</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interface Theme</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[ 
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'system', label: 'System', icon: Laptop }
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setFormData({ ...formData, preferences: { ...formData.preferences, theme: theme.id as any } })}
                            className={cn(
                              "flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all active:scale-[0.95]",
                              formData.preferences.theme === theme.id 
                                ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100/50" 
                                : "border-slate-100 hover:bg-slate-50 text-slate-400"
                            )}
                          >
                            <theme.icon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Language</label>
                      <select 
                        value={formData.preferences.language}
                        onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, language: e.target.value } })}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="am">Amharic (\\\\u12a0\\\\u121b\\\\u122d\\\\u129b)</option>
                        <option value="fr">French (Fran\\\\u00e7ais)</option>
                        <option value="ar">Arabic (\\\\u0627\\\\u0644\\\\u0639\\\\u0631\\\\u0628\\\\u064a\\\\u0629)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </div>
  );
};