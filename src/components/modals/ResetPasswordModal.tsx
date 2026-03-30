import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Loader2, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { sendResetOtp, verifyResetOtp, updatePassword } from '../../lib/supabase';
import { toast } from 'sonner';
import { ResetStep } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<ResetStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetModalState = () => {
    setStep('EMAIL');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await sendResetOtp(email);
      if (error) throw error;
      
      toast.success('A verification code has been sent to your email.');
      setStep('OTP');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyResetOtp(email, otp);
      if (error) throw error;
      
      toast.success('OTP verified successfully!');
      setStep('PASSWORD');
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid or expired OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setStep('SUCCESS');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderErrorMessage = () => {
    if (!errorMessage) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs font-semibold text-rose-600 mt-2 bg-rose-50 p-2 rounded-md border border-rose-100"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{errorMessage}</span>
      </motion.div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'EMAIL':
        return (
          <form onSubmit={handleSendOtp} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-slate-400 w-4 h-4" />
                </div>
                <Input 
                  id="reset-email" 
                  type="email" 
                  required 
                  placeholder="name@company.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`pl-10 ${errorMessage ? 'border-rose-500 ring-rose-500/10 ring-2' : ''}`}
                />
              </div>
              {renderErrorMessage()}
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 flex-1 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </DialogFooter>
          </form>
        );

      case 'OTP':
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reset-otp">Verification Code</Label>
                <button 
                  type="button"
                  onClick={() => { setStep('EMAIL'); setErrorMessage(null); }}
                  className="text-xs text-indigo-600 hover:underline flex items-center"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Change Email
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="text-slate-400 w-4 h-4" />
                </div>
                <Input 
                  id="reset-otp" 
                  type="text" 
                  maxLength={6}
                  required 
                  placeholder="000000"
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))} 
                  className={`pl-10 tracking-[0.5em] font-mono text-center ${errorMessage ? 'border-rose-500 ring-rose-500/10 ring-2' : ''}`}
                />
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                We've sent a code to <span className="font-semibold">{email}</span>
              </p>
              {renderErrorMessage()}
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setStep('EMAIL'); setErrorMessage(null); }} 
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 flex-1 text-white" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </DialogFooter>
          </form>
        );

      case 'PASSWORD':
        return (
          <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 w-4 h-4" />
                </div>
                <Input 
                  id="new-password" 
                  type={showNewPassword ? 'text' : 'password'} 
                  required 
                  placeholder="••••••••"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className={`pl-10 pr-10 ${errorMessage && (newPassword.length < 6 || newPassword !== confirmPassword) ? 'border-rose-500 ring-rose-500/10 ring-2' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 w-4 h-4" />
                </div>
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className={`pl-10 pr-10 ${errorMessage && newPassword !== confirmPassword ? 'border-rose-500 ring-rose-500/10 ring-2' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {renderErrorMessage()}
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 w-full text-white" 
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                ) : (
                  'Update Password'
                )}
              </Button>
            </DialogFooter>
          </form>
        );

      case 'SUCCESS':
        return (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Password Reset Complete</h3>
              <p className="text-slate-500">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <Button 
              type="button" 
              onClick={handleClose}
              className="bg-indigo-600 hover:bg-indigo-700 w-full mt-4 text-white"
            >
              Back to Sign In
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'EMAIL':
        return "Enter your email address and we'll send you a verification code to reset your password.";
      case 'OTP':
        return "Check your inbox and enter the 6-digit code we sent you.";
      case 'PASSWORD':
        return "Enter your new password below. Make sure it's secure.";
      case 'SUCCESS':
        return null;
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'SUCCESS' ? '' : 'Reset Password'}
          </DialogTitle>
          {getStepDescription() && (
            <DialogDescription>
              {getStepDescription()}
            </DialogDescription>
          )}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};