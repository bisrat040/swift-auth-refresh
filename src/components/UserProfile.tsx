import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  Camera, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileProps {
  userId?: string;
  onBack?: () => void;
}

const DEFAULT_AVATAR = 'https://storage.googleapis.com/dala-prod-public-storage/generated-images/f6bf654b-5243-4e79-bae8-83fa6e1070e2/default-avatar-404ab1aa-1774073537832.webp';
const PROFILE_BG = 'https://storage.googleapis.com/dala-prod-public-storage/generated-images/f6bf654b-5243-4e79-bae8-83fa6e1070e2/profile-bg-c677134a-1774073536701.webp';

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onBack }) => {
  const { currentUser, isSuperAdmin, refreshProfile, signOut } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    location: '',
    department: '',
    avatarUrl: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.id;
  const canEdit = isOwnProfile || isSuperAdmin;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      const targetId = userId || currentUser?.id;
      
      if (!targetId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single();

        if (error) throw error;

        if (data) {
          const fetchedProfile: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            avatarUrl: data.avatar_url,
            isActive: data.is_active,
            isGranted: data.is_granted,
            phone: data.phone || '',
            bio: data.bio || '',
            location: data.location || '',
            department: data.department || '',
            joinedAt: data.created_at
          };
          setProfile(fetchedProfile);
          setFormData({
            name: fetchedProfile.name,
            phone: fetchedProfile.phone || '',
            bio: fetchedProfile.bio || '',
            location: fetchedProfile.location || '',
            department: fetchedProfile.department || '',
            avatarUrl: fetchedProfile.avatarUrl || ''
          });
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser?.id]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          location: formData.location,
          department: formData.department,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        department: formData.department,
        avatarUrl: formData.avatarUrl
      });

      if (isOwnProfile) {
        await refreshProfile();
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
        toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    // Immediate sign out for best UX
    signOut();
    toast.success("Signed out successfully");
  };

  const handleAvatarUpdate = () => {
    const newUrl = prompt("Enter a direct URL for your profile picture:", formData.avatarUrl);
    if (newUrl !== null) {
      setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading profile details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-rose-100 p-4 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-slate-500">The user profile you are looking for does not exist or has been removed.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const roleColors: Record<UserRole, string> = {
    'SUPER_ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
    'ADMIN': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'BUILDING_OWNER': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'SENIOR_MANAGER': 'bg-blue-100 text-blue-700 border-blue-200',
    'PROPERTY_MANAGER': 'bg-sky-100 text-sky-700 border-sky-200',
    'HR_MANAGER': 'bg-rose-100 text-rose-700 border-rose-200',
    'HR': 'bg-pink-100 text-pink-700 border-pink-200',
    'MAINTENANCE_CREW': 'bg-orange-100 text-orange-700 border-orange-200',
    'ACCOUNT_MANAGER': 'bg-amber-100 text-amber-700 border-amber-200',
    'PARKING_MANAGER': 'bg-slate-100 text-slate-700 border-slate-200',
    'EMPLOYEE': 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        
        <div className="flex gap-2">
          {isOwnProfile && (
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          )}
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold px-6">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="h-48 relative overflow-hidden bg-slate-100">
          <img 
            src={PROFILE_BG} 
            alt="Profile Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="px-10 pb-10 -mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative group">
                <div className="w-36 h-36 rounded-[2rem] border-8 border-white shadow-2xl overflow-hidden bg-white">
                  <img 
                    src={isEditing && formData.avatarUrl ? formData.avatarUrl : (profile.avatarUrl || DEFAULT_AVATAR)} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                  <button 
                    onClick={handleAvatarUpdate}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-10 h-10 text-white" />
                  </button>
                )}
              </div>
              
              <div className="mt-6 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isEditing ? (
                      <Input 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="text-2xl font-black h-10 px-3 min-w-[250px] bg-slate-50 border-none rounded-xl"
                        placeholder="Display Name"
                      />
                    ) : profile.name}
                  </h1>
                  {profile.isGranted && (
                    <div className="bg-indigo-50 p-1.5 rounded-full border border-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shadow-sm" />
                    </div>
                  )}
                </div>
                <p className="text-slate-500 font-bold mt-1">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3 pb-2">
              <span className={cn(
                "inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black border uppercase tracking-widest",
                roleColors[profile.role] || 'bg-slate-100 text-slate-700'
              )}>
                <Shield className="w-3.5 h-3.5" />
                {profile.role.replace('_', ' ')}
              </span>
              <span className={cn(
                "inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black border uppercase tracking-widest",
                profile.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm shadow-emerald-200 animate-pulse", profile.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500')} />
                {profile.isActive !== false ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-10">
              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Personal Statement</h3>
                {isEditing ? (
                  <Textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    placeholder="Write a short bio about yourself..." 
                    className="min-h-[140px] resize-none bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 text-sm italic font-medium">
                    {profile.bio || "No introduction provided yet."}
                  </p>
                )}
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact Channels</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Email</span>
                        <span className="text-sm font-black text-slate-900">{profile.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Phone</span>
                        {isEditing ? (
                          <Input name="phone" value={formData.phone} onChange={handleChange} className="h-8 mt-1 border-none bg-slate-100 rounded-lg text-sm font-bold" />
                        ) : (
                          <span className="text-sm font-black text-slate-900">{profile.phone || 'N/A'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Work Profile</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Department</span>
                        {isEditing ? (
                          <Input name="department" value={formData.department} onChange={handleChange} className="h-8 mt-1 border-none bg-slate-100 rounded-lg text-sm font-bold" />
                        ) : (
                          <span className="text-sm font-black text-slate-900">{profile.department || 'Not assigned'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Workspace</span>
                        {isEditing ? (
                          <Input name="location" value={formData.location} onChange={handleChange} className="h-8 mt-1 border-none bg-slate-100 rounded-lg text-sm font-bold" />
                        ) : (
                          <span className="text-sm font-black text-slate-900">{profile.location || 'Remote'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6 shadow-2xl shadow-indigo-100">
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Platform Insights</h4>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-2 font-bold uppercase">
                      <Calendar className="w-4 h-4" /> Member Since
                    </span>
                    <span className="text-sm font-black">
                      {profile.joinedAt ? new Date(profile.joinedAt).getFullYear() : '2024'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-2 font-bold uppercase">
                      <Shield className="w-4 h-4" /> Access Level
                    </span>
                    <span className="text-sm font-black text-indigo-400">
                      {profile.role === 'SUPER_ADMIN' ? 'Tier 1' : 'Tier 2'}
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-800">
                   <p className="text-[10px] text-slate-500 leading-relaxed">
                     Security ID: <span className="text-slate-400 font-mono">{profile.id.slice(0, 12)}...</span>
                   </p>
                </div>
              </div>

              {isEditing && (
                <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 border-dashed">
                  <h4 className="text-xs font-black text-indigo-900 mb-3 uppercase tracking-widest">Avatar Link</h4>
                  <Input 
                    name="avatarUrl" 
                    value={formData.avatarUrl} 
                    onChange={handleChange} 
                    placeholder="https://..." 
                    className="bg-slate-50 border-none text-[10px] font-bold h-9"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Supply a direct image URL to update your profile photo.</p>
                </div>
              )}

              {isOwnProfile && (
                <Button 
                  onClick={handleSignOut} 
                  variant="ghost"
                  className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black text-sm p-4 h-auto rounded-2xl border border-rose-100/50"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out from Account
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-12 flex items-center justify-end gap-3 pt-8 border-t border-slate-100"
              >
                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-xl font-bold">
                  Discard Changes
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] h-12 rounded-2xl font-black shadow-xl shadow-indigo-100 active:scale-[0.98]">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};