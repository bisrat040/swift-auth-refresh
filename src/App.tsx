import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { Maintenance } from './components/Maintenance';
import { Financials } from './components/Financials';
import { Lease } from './components/Lease';
import { Reports } from './components/Reports';
import { Parking } from './components/Parking';
import { HR } from './components/HR';
import { Chatbot } from './components/Chatbot';
import { Settings } from './components/Settings';
import { Properties } from './components/Properties';
import { SystemGatekeeper } from './components/SystemGatekeeper';
import { UserProfile } from './components/UserProfile';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { SubscriptionManagement } from './components/SuperAdmin/SubscriptionManagement';
import { RestrictedModule } from './components/RestrictedModule';
import { SignIn } from './components/SignIn';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProvider, useUser } from './context/UserContext';
import { DataProvider, useData } from './context/DataContext';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[100]">
      <div className="relative">
        <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-200 animate-bounce">
          <LayoutDashboard className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          <span className="text-sm font-bold text-slate-900 tracking-tight">LandoManage</span>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { currentUser, isInitializing } = useUser();
  const { isLoading: isDataLoading, isRefreshing } = useData();

  const navigateToProfile = (userId?: string) => {
    setSelectedUserId(userId);
    setActiveTab('profile');
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isInitializing || !currentUser) return;

    const allowedTabs: Record<string, string[]> = {
      'SUPER_ADMIN': ['dashboard', 'properties', 'tenants', 'leases', 'maintenance', 'parking', 'hr', 'financials', 'reports', 'chatbot', 'settings', 'gatekeeper', 'profile', 'subscription'],
      'ADMIN': ['dashboard', 'properties', 'tenants', 'leases', 'maintenance', 'parking', 'hr', 'financials', 'reports', 'chatbot', 'settings', 'profile', 'subscription'],
      'BUILDING_OWNER': ['dashboard', 'properties', 'tenants', 'leases', 'maintenance', 'parking', 'hr', 'financials', 'reports', 'chatbot', 'settings', 'profile', 'subscription'],
      'SENIOR_MANAGER': ['dashboard', 'properties', 'tenants', 'leases', 'maintenance', 'parking', 'hr', 'financials', 'reports', 'chatbot', 'settings', 'profile'],
      'PROPERTY_MANAGER': ['dashboard', 'properties', 'tenants', 'leases', 'maintenance', 'parking', 'hr', 'financials', 'reports', 'chatbot', 'settings', 'profile'],
      'EMPLOYEE': ['dashboard', 'tenants', 'maintenance', 'chatbot', 'settings', 'profile']
    };

    const userRole = currentUser.role || 'EMPLOYEE';
    const roleAllowedTabs = allowedTabs[userRole] || allowedTabs['EMPLOYEE'];

    if (!roleAllowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab, isInitializing]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties />;
      case 'tenants':
        return <Tenants />;
      case 'leases':
        return <Lease onNavigateToTenant={() => handleNavigateToTab('tenants')} />;
      case 'maintenance':
        return <Maintenance />;
      case 'parking':
        return (
          <RestrictedModule moduleName="Parking" onUpgrade={() => setActiveTab('subscription')}>
            <Parking />
          </RestrictedModule>
        );
      case 'hr':
        return (
          <RestrictedModule moduleName="HR" onUpgrade={() => setActiveTab('subscription')}>
            <HR />
          </RestrictedModule>
        );
      case 'financials':
        return (
          <RestrictedModule moduleName="Financials" onUpgrade={() => setActiveTab('subscription')}>
            <Financials />
          </RestrictedModule>
        );
      case 'reports':
        return <Reports />;
      case 'chatbot':
        return <Chatbot />;
      case 'settings':
        return <Settings />;
      case 'gatekeeper':
        return <SystemGatekeeper onNavigateToProfile={navigateToProfile} />;
      case 'profile':
        return <UserProfile userId={selectedUserId} onBack={() => setActiveTab('dashboard')} />;
      case 'subscription':
        return currentUser?.role === 'SUPER_ADMIN' ? <SubscriptionManagement /> : <SubscriptionPlans />;
      default:
        return <Dashboard />;
    }
  };

  const currentTitle = useMemo(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      properties: 'Property Portfolio',
      tenants: 'Tenant Directory',
      leases: 'Lease Agreements',
      maintenance: 'Maintenance Tracker',
      parking: 'Parking Inventory',
      hr: 'HR Management',
      financials: 'Financial Analysis',
      reports: 'System Reports',
      chatbot: 'AI Assistant',
      settings: 'System Settings',
      gatekeeper: 'System Gatekeeper',
      profile: 'User Profile',
      subscription: currentUser?.role === 'SUPER_ADMIN' ? 'Subscription Controller' : 'Subscription Plans'
    };
    return titles[activeTab] || 'Dashboard';
  }, [activeTab, currentUser]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <SignIn />;
  }

  // Only show full screen loading on INITIAL load, use inline spinners for background refreshes
  if (isDataLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
      <Toaster position="top-right" expand={true} richColors />
      
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onProfileClick={() => navigateToProfile()}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          "ml-0"
        )}
      >
        <Header 
          title={currentTitle} 
          onMenuClick={toggleSidebar} 
          onProfileClick={() => navigateToProfile()}
          onSubscriptionClick={() => handleNavigateToTab('subscription')}
        />
        
        {/* Subtle top indicator for background refreshing */}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 h-1 z-[60] bg-indigo-100 overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 w-1/3"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;