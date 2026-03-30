import React, { useState, useEffect } from 'react';
import { supabase, signInWithEmail } from '../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Mail, Lock, Loader2, ArrowRight, Building2, Fingerprint, ShieldCheck, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { ResetPasswordModal } from './modals/ResetPasswordModal';

export const SignIn: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    if (token) {
      setInviteToken(token);
      checkInvite(token);
    }
  }, []);

  const checkInvite = async (token: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'Pending')
        .single();

      if (error || !data) {
        toast.error('Invalid or expired invitation token');
        
        await supabase.from('audit_logs').insert({
          admin_name: 'System',
          admin_email: 'system@landomanage.com',
          action_type: 'FailedLogin',
          details: `Failed signup attempt (Invalid Token: ${token.substring(0, 8)}...).`,
          timestamp: new Date().toISOString()
        });
        
        return;
      }

      setEmail(data.email);
      setAssignedRole(data.role as UserRole);
      setIsSignUp(true);
      toast.info(`Completing registration for ${data.email} as ${data.role.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error checking invite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Profile not found for signed in user:', profileError);
        }

        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          toast.error('Your account is awaiting approval. You will be notified once access is granted.');
        } else {
          toast.success('Successfully signed in!');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: assignedRole || 'BUILDING_OWNER'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Determine initial status
        // Invited staff are usually active/granted immediately by the owner who invited them
        const isInvited = !!inviteToken;
        
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email,
          name: fullName,
          role: assignedRole || 'BUILDING_OWNER',
          is_active: isInvited || (assignedRole === 'SUPER_ADMIN'),
          is_granted: isInvited
        });

        if (!isInvited) {
          await supabase.from('verification_queue').insert({
            full_name: fullName,
            email,
            building_name: buildingName,
            tin_number: tinNumber,
            status: 'Pending',
            created_at: new Date().toISOString()
          });
          toast.success('Registration request submitted! A Super Admin will review your details.');
        } else {
          await supabase
            .from('invitations')
            .update({ status: 'Accepted' })
            .eq('token', inviteToken);
          toast.success('Account created successfully! You can now sign in.');
        }

        setIsSignUp(false);
        setInviteToken(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 xl:px-32 bg-white relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LandoManage</h1>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Property Intelligence</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">{isSignUp ? 'Join the Platform' : 'Welcome back'}</h2>
            <p className="mt-2 text-slate-600">
              {isSignUp 
                ? (inviteToken ? `Setting up your staff account for ${email}` : 'Complete your details to request access to the property management system.')
                : 'Enter your credentials to manage your property portfolio.'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {!inviteToken && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Building Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          </div>
                          <input
                            type="text"
                            required
                            value={buildingName}
                            onChange={(e) => setBuildingName(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                            placeholder="Sky Tower"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">TIN Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Fingerprint className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          </div>
                          <input
                            type="text"
                            required
                            value={tinNumber}
                            onChange={(e) => setTinNumber(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                            placeholder="0012345678"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {assignedRole && (
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">Assigned Role: </span>
                        <span className="font-bold text-indigo-600">{assignedRole.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Work Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  readOnly={!!inviteToken}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all ${inviteToken ? 'opacity-70 bg-slate-50' : ''}`}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={() => setIsResetModalOpen(true)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? (inviteToken ? 'Complete Setup' : 'Request Access') : 'Sign in'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-sm text-slate-500">
              {isSignUp ? (inviteToken ? "Need to sign in?" : "Already have an invitation?") : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isSignUp ? 'Sign in instead' : 'Contact your administrator'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply z-10" />
        <img
          src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/f6bf654b-5243-4e79-bae8-83fa6e1070e2/sign-in-background-ba3f1220-1773842356666.webp"
          alt="Property backdrop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-20" />
        
        <div className="absolute bottom-0 left-0 right-0 p-12 z-30">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <div className="h-1 w-12 bg-indigo-500 rounded-full" />
              <span className="text-sm font-bold uppercase tracking-widest">System Control Room</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-4 leading-tight">
              {isSignUp ? (inviteToken ? 'Join your property team' : 'Apply to join the most') : 'Manage your properties'} <br />
              {isSignUp ? (inviteToken ? 'and start managing.' : 'advanced platform.') : 'with precision and ease.'}
            </h3>
            <div className="flex gap-8 mt-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">99.9%</span>
                <span className="text-slate-400 text-sm">Uptime</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">2.4k+</span>
                <span className="text-slate-400 text-sm">Active Units</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">24/7</span>
                <span className="text-slate-400 text-sm">Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ResetPasswordModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
      />
    </div>
  );
};