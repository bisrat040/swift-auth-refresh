import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Filter
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useData } from '../context/DataContext';
import { 
  FinancialPerformanceComposedChart, 
  MaintenanceDistributionChart, 
  OccupancyRadialChart,
  PortfolioPerformanceRadarChart,
  TenantIndustryChart
} from './DashboardCharts';
import { TimeFilterSelector } from './TimeFilterSelector';

const StatCard = ({ title, value, change, icon: Icon, trend, color = "indigo" }: any) => {
  const bgColors: Record<string, string> = {
    indigo: 'bg-indigo-50',
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    rose: 'bg-rose-50',
  };
  
  const textColors: Record<string, string> = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    rose: 'text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${bgColors[color] || 'bg-indigo-50'} rounded-lg`}>
          <Icon className={`w-6 h-6 ${textColors[color] || 'text-indigo-600'}`} />
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { tenants, maintenanceRequests, financialTransactions, isLoading, units } = useData();

  const activeMaintenance = (maintenanceRequests || []).filter(r => r.status !== 'Closed').length;
  
  const totalUnits = (units || []).length;
  const occupiedUnits = (units || []).filter(u => u.status === 'Occupied').length;
  const totalOccupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  
  const currentRevenue = useMemo(() => {
    const incomeTransactions = (financialTransactions || []).filter(t => t.category === 'Income');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return totalIncome;
  }, [financialTransactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
          <p className="text-slate-500 text-sm">Advanced performance analytics for your management portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilterSelector />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Active Tenants" 
              value={(tenants || []).length} 
              icon={Users} 
              color="indigo"
            />
            <StatCard 
              title="Portfolio Occupancy" 
              value={`${totalOccupancy}%`} 
              icon={Activity} 
              color="emerald"
            />
            <StatCard 
              title="Revenue in Period" 
              value={formatCurrency(currentRevenue)} 
              icon={TrendingUp} 
              color="blue"
            />
            <StatCard 
              title="Active Maintenance" 
              value={activeMaintenance} 
              icon={AlertCircle} 
              color="rose"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      Advanced Financial Analytics
                    </h3>
                    <p className="text-xs text-slate-500">Composed view of Revenue, Expenses, and Occupancy Correlation</p>
                  </div>
                </div>
                <FinancialPerformanceComposedChart />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Performance Radar
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Multi-dimensional health score vs market average</p>
                  <PortfolioPerformanceRadarChart />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                    Tenant Industry Mix
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Distribution of business types within your portfolio</p>
                  <TenantIndustryChart />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Real-time Occupancy
                  </h3>
                  <p className="text-xs text-slate-500">Current portfolio utilization against target</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <OccupancyRadialChart value={totalOccupancy} />
                  <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Available</p>
                      <p className="text-lg font-bold text-emerald-900">{totalUnits - occupiedUnits} Units</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Target</p>
                      <p className="text-lg font-bold text-indigo-900">95%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                  Maintenance Distribution
                </h3>
                <MaintenanceDistributionChart />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};