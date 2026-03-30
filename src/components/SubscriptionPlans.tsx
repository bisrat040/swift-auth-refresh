import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, ShieldCheck, Timer, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import { ContractTerm, SubscriptionPlan } from '../types';
import { subscriptionPlans } from '../data/mockData';

interface PlanProps {
  plan: SubscriptionPlan;
  isCurrent?: boolean;
  selectedTerm?: ContractTerm;
  onTermChange?: (term: ContractTerm) => void;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanProps> = ({ 
  plan, isCurrent, selectedTerm, onTermChange, onSelect 
}) => {
  const isPro = plan.id === 'PRO';
  const isDemo = plan.id === 'DEMO';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all",
        isPro 
          ? "bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-100" 
          : isDemo
            ? "bg-amber-50/50 border-amber-200 shadow-sm"
            : "bg-white border-slate-100 shadow-sm"
      )}
    >
      {isPro && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Crown className="w-3 h-3" /> Recommended
        </div>
      )}

      {isDemo && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Timer className="w-3 h-3" /> Limited Trial
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
          Current Plan
        </div>
      )}

      <div className="mb-8">
        <h3 className={cn("text-2xl font-black mb-2", isPro ? "text-white" : "text-slate-900")}>{plan.name}</h3>
        <p className={cn("text-sm font-medium", isPro ? "text-slate-400" : isDemo ? "text-amber-700/70" : "text-slate-500")}>{plan.description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-4xl font-black", isPro ? "text-white" : "text-slate-900")}>{plan.price.toLocaleString()}</span>
          <span className={cn("text-sm font-bold", isPro ? "text-slate-500" : "text-slate-400")}>{isDemo ? "Once" : "/ month"}</span>
        </div>
        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2", isPro ? "text-indigo-400" : isDemo ? "text-amber-600" : "text-slate-400")}>
          {isDemo ? `${plan.trialPeriodDays} Days Access` : "Billed monthly in ETB"}
        </p>
      </div>

      {plan.contractTermOptions && onTermChange && (
        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Contract Term</p>
          <div className="grid grid-cols-2 gap-2">
            {plan.contractTermOptions.map((term) => (
              <button
                key={term}
                onClick={() => onTermChange(term)}
                className={cn(
                  "py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  selectedTerm === term 
                    ? isPro ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                )}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 mb-8">
        <p className={cn("text-[10px] font-black uppercase tracking-widest", isPro ? "text-slate-300" : "text-slate-500")}>What's included</p>
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className={cn(
                "p-1 rounded-full",
                isPro ? "bg-indigo-500/20 text-indigo-400" : 
                isDemo ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-600"
              )}>
                <Check className="w-3 h-3" />
              </div>
              <span className={cn("text-xs font-bold", isPro ? "text-slate-300" : "text-slate-600")}>{feature}</span>
            </li>
          ))}
          {plan.excluded?.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 opacity-40">
              <div className="p-1 rounded-full bg-slate-100 text-slate-400">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-slate-400 line-through">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={cn(
          "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]",
          isPro 
            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20" 
            : isDemo
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200"
              : "bg-slate-900 text-white hover:bg-slate-800",
          isCurrent && "bg-slate-100 text-slate-400 cursor-default"
        )}
      >
        {isCurrent ? "Active Plan" : isDemo ? "Start Trial" : isPro ? "Upgrade to Pro" : "Get Started"}
      </button>
    </motion.div>
  );
};

export const SubscriptionPlans: React.FC = () => {
  const { currentUser } = useUser();
  const [basicTerm, setBasicTerm] = useState<ContractTerm>('6 months');
  const [proTerm, setProTerm] = useState<ContractTerm>('1 year');

  const handleSelect = (planId: string, term?: ContractTerm) => {
    if (planId === 'DEMO') {
      toast.success('Demo trial activated!', {
        description: 'You now have 30 days of full access to explore the platform.'
      });
      return;
    }

    if (planId === 'PRO') {
      toast.info(`Redirecting for Pro (${term}) subscription...`, {
        description: 'Secure payment gateway for Telebirr and Bank Transfer.'
      });
    } else {
      toast.success(`Basic plan (${term}) selected.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Flexible Plans for Every Building</h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          From solo owners to massive portfolios, choose the tier that fits your management scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subscriptionPlans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            isCurrent={currentUser?.subscriptionTier === plan.id}
            selectedTerm={plan.id === 'BASIC' ? basicTerm : plan.id === 'PRO' ? proTerm : undefined}
            onTermChange={plan.id === 'BASIC' ? setBasicTerm : plan.id === 'PRO' ? setProTerm : undefined}
            onSelect={() => handleSelect(plan.id, plan.id === 'BASIC' ? basicTerm : plan.id === 'PRO' ? proTerm : undefined)}
          />
        ))}
      </div>

      <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-indigo-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">Secure Payments</h4>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Bank & Telebirr</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-emerald-600 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">Instant Activation</h4>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">No downtime required</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-amber-600 mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">Unlimited Assets</h4>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Add as many units as you need</p>
          </div>
        </div>
      </div>
    </div>
  );
};