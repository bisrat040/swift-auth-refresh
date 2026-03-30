import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight,
  X,
  FileText,
  Car,
  MessageSquareCode,
  Briefcase,
  ShieldCheck,
  Building2,
  Lock,
  User as UserIcon,
  ChevronLeft,
  CreditCard,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { UserRole } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onProfileClick?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'gatekeeper', label: 'Gatekeeper', icon: Lock, roles: ['SUPER_ADMIN'] },
  { id: 'properties', label: 'Properties', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'tenants', label: 'Tenants', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'leases', label: 'Leases', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'parking', label: 'Parking', icon: Car, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'hr', label: 'HR Management', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'financials', label: 'Financials', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] }, 
  { id: 'subscription', label: 'Subscription Plans', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER'] },
  { id: 'chatbot', label: 'AI Assistant', icon: MessageSquareCode, roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'BUILDING_OWNER', 'SENIOR_MANAGER', 'PROPERTY_MANAGER'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  onProfileClick,
  isCollapsed,
  setIsCollapsed
}) => {
  const { currentUser, availableUsers, setCurrentUser, signOut, isSuperAdmin } = useUser();
  const [isHovered, setIsHovered] = useState(false);

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    // Automatically trigger navigation bar retraction upon selection
    setIsCollapsed(true);
    
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // The sidebar is effectively expanded if it's not collapsed OR if it's being hovered
  // On mobile, it's always expanded if it's open
  const isExpanded = window.innerWidth < 1024 ? true : (!isCollapsed || isHovered);

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "z-50 bg-white border-r border-slate-200 flex flex-col h-screen transition-all duration-300 ease-in-out transform shadow-xl lg:shadow-none overflow-hidden",
        // Mobile behavior: fixed overlay
        "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:inset-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Width transitions: resolving overlap by being in-flow on desktop
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        {/* Header */}
        <div className={cn(
          "flex items-center mb-8 transition-all duration-300 flex-shrink-0",
          isExpanded ? "justify-between px-2" : "justify-center"
        )}>
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm flex-shrink-0">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
              >
                LandoManage
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center lg:hidden">
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className={cn(
          "mb-6 bg-slate-50 rounded-xl border border-slate-100 transition-all duration-300 overflow-hidden flex-shrink-0",
          isExpanded ? "p-4" : "p-2"
        )}>
          {isExpanded && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3" />
              Active Role
            </p>
          )}
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isExpanded ? "mb-3" : "justify-center"
          )}>
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-slate-200 font-bold flex-shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            )}
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] font-medium text-indigo-600 bg-indigo-50 w-fit px-1.5 rounded">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </motion.div>
            )}
          </div>
          
          {isSuperAdmin && availableUsers.length > 0 && isExpanded && (
            <motion.select 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-[10px] font-bold border-slate-200 rounded-lg py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={currentUser.id}
              onChange={(e) => {
                const user = availableUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
            >
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  Switch to {user.name} ({user.role.charAt(0)})
                </option>
              ))}
            </motion.select>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 flex-1 pr-1">
          {filteredNavItems.map((item) => {
            // Custom label for Subscription for Super Admin
            const itemLabel = (item.id === 'subscription' && currentUser.role === 'SUPER_ADMIN') 
              ? 'Subscription Controller' 
              : item.label;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-200 group relative",
                  activeTab === item.id 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  isExpanded ? "px-3 py-2.5 justify-between" : "p-2.5 justify-center"
                )}
                title={!isExpanded ? itemLabel : ""}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors flex-shrink-0",
                    activeTab === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-bold text-sm whitespace-nowrap"
                    >
                      {itemLabel}
                    </motion.span>
                  )}
                </div>
                {isExpanded && activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                )}
                
                {!isExpanded && activeTab === item.id && (
                  <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={cn(
          "mt-6 pt-6 border-t border-slate-100 space-y-1 transition-all duration-300 flex-shrink-0",
          isExpanded ? "" : "flex flex-col items-center"
        )}>
          <button 
            onClick={() => {
              onProfileClick?.();
              handleItemClick('profile'); // Use selection logic to retract
            }}
            className={cn(
              "w-full flex items-center rounded-lg transition-colors",
              activeTab === 'profile' 
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              isExpanded ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
            )}
            title={!isExpanded ? "My Profile" : ""}
          >
            <UserIcon className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="font-bold text-sm">My Profile</span>}
          </button>
          
          <button 
            onClick={() => handleItemClick('settings')}
            className={cn(
              "w-full flex items-center rounded-lg transition-colors",
              activeTab === 'settings' 
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              isExpanded ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
            )}
            title={!isExpanded ? "Settings" : ""}
          >
            <SettingsIcon className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="font-bold text-sm">Settings</span>}
          </button>
          
          <button 
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center rounded-lg text-red-500 hover:bg-red-50 transition-colors",
              isExpanded ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
            )}
            title={!isExpanded ? "Sign Out" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};