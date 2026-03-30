import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ArrowRight, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface RestrictedModuleProps {
  children: React.ReactNode;
  moduleName: string;
  onUpgrade: () => void;
}

export const RestrictedModule: React.FC<RestrictedModuleProps> = ({ children, moduleName, onUpgrade }) => {
  const { currentUser, isSuperAdmin, isAdmin } = useUser();

  const isBasic = currentUser?.subscriptionTier === 'BASIC';
  const isBuildingOwner = currentUser?.role === 'BUILDING_OWNER';
  
  // Restricted modules for BASIC Building Owners
  const restrictedModules = ['parking', 'hr', 'financials'];
  const isRestricted = (isSuperAdmin || isAdmin) ? false : (isBuildingOwner && isBasic && restrictedModules.includes(moduleName.toLowerCase()));

  if (!isRestricted) return <>{children}</>;

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center animate-in fade-in duration-500">
      {/* Blurred background version of children for a peek effect */}
      <div className="absolute inset-0 opacity-20 blur-xl pointer-events-none overflow-hidden select-none">
        {children}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-indigo-100 max-w-xl w-full text-center"
      >
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-indigo-600 shadow-inner group">
          <Crown className="w-10 h-10 group-hover:scale-110 transition-transform" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          Premium Feature
        </h2>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          The <span className="text-indigo-600 font-black uppercase tracking-widest text-xs">{moduleName}</span> module is exclusively available to <span className="font-bold text-slate-900">Pro Tier</span> subscribers. Upgrade your plan to unlock full HR management, Parking inventory, and Financial automation.
        </p>

        <div className="space-y-4">
          <button
            onClick={onUpgrade}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Upgrade to Pro <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 justify-center text-slate-400">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Corporate Security Protocols Active</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div className="text-left">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
            <p className="text-sm font-bold text-slate-900">Basic Tier</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pro Pricing</p>
            <p className="text-sm font-black text-indigo-600">20,000 ETB /mo</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};