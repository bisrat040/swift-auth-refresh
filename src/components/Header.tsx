import React from 'react';
import { 
  Search, 
  Bell, 
  UserCircle, 
  Menu, 
  CreditCard, 
  LogOut, 
  User as UserIconAlt,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onSubscriptionClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, onProfileClick, onSubscriptionClick }) => {
  const { currentUser, signOut } = useUser();

  const handleNotificationClick = () => {
    toast.info('You have 3 new notifications regarding maintenance and leases.');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = (e.target as HTMLInputElement).value;
      if (query.trim()) {
        toast.info(`Searching for "${query}"...`);
      }
    }
  };

  const handleSignOut = () => {
    // We don't await here to make it feel instantaneous
    // The UserContext handles the state change and the actual sign-out logic
    signOut();
    toast.success('Successfully signed out');
  };

  const showSubscriptionLink = currentUser && ['SUPER_ADMIN', 'ADMIN', 'BUILDING_OWNER'].includes(currentUser.role);
  const subscriptionLabel = currentUser?.role === 'SUPER_ADMIN' ? 'Subscription Controller' : 'Subscriptions';

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">{title}</h1>
        </div>
        
        <div className="relative max-w-md w-full ml-4 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tenants, requests, documents..."
            onKeyDown={handleSearch}
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 ml-4">
        {showSubscriptionLink && (
          <button 
            onClick={onSubscriptionClick}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-bold tracking-tight"
          >
            <CreditCard className="w-4 h-4" />
            <span>{subscriptionLabel}</span>
          </button>
        )}

        <button 
          onClick={handleNotificationClick}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 hidden xs:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-xl transition-all">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{currentUser?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{currentUser?.role.toLowerCase().replace('_', ' ') || 'Guest'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 border border-slate-200 group-hover:border-indigo-200 group-hover:shadow-md transition-all overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-7 h-7" />
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-200">
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-black text-slate-900">{currentUser?.name}</p>
                <p className="text-xs font-bold text-slate-500">{currentUser?.email}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                <Shield className="w-3 h-3 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                  {currentUser?.role.replace('_', ' ')}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem 
              onClick={onProfileClick}
              className="p-3 rounded-xl cursor-pointer font-bold text-slate-700 hover:text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600 group transition-all"
            >
              <UserIconAlt className="w-4 h-4 mr-3 text-slate-400 group-hover:text-indigo-600" />
              <span>View Profile</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </DropdownMenuItem>
            
            {showSubscriptionLink && (
              <DropdownMenuItem 
                onClick={onSubscriptionClick}
                className="p-3 rounded-xl cursor-pointer font-bold text-slate-700 hover:text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600 group transition-all"
              >
                <CreditCard className="w-4 h-4 mr-3 text-slate-400 group-hover:text-indigo-600" />
                <span>{subscriptionLabel}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="p-3 rounded-xl cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-600 group transition-all"
            >
              <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:text-rose-600" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};