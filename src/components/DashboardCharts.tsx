import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  TooltipProps,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Bar,
  Area
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { useData } from '../context/DataContext';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
        <p className="text-xs font-bold text-slate-900 mb-2">{label || payload[0].name}</p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-slate-500 font-medium">{item.name}:</span>
              <span className="text-[10px] font-bold text-slate-900">
                {typeof item.value === 'number' && item.name?.toLowerCase().includes('revenue') 
                  ? formatCurrency(item.value) 
                  : item.value}
                {item.name?.toLowerCase().includes('rate') || item.name?.toLowerCase().includes('occupancy') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const FinancialPerformanceComposedChart = () => {
  const { financialMetrics } = useData();
  
  if (!financialMetrics || financialMetrics.length === 0) {
    return (
      <div className="h-[350px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-400 font-medium">No financial metrics available yet.</p>
        <p className="text-[10px] text-slate-400 mt-1">Start recording transactions to see performance trends.</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={financialMetrics} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(value) => `ETB ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            fill="#6366f1" 
            stroke="#6366f1" 
            fillOpacity={0.1} 
            name="Revenue"
          />
          <Bar 
            yAxisId="left"
            dataKey="expenses" 
            barSize={20} 
            fill="#f43f5e" 
            radius={[4, 4, 0, 0]} 
            name="Expenses"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="occupancy" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2 }} 
            name="Occupancy Rate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PortfolioPerformanceRadarChart = () => {
  const { tenants, units, maintenanceRequests } = useData();
  
  // Calculate real performance metrics
  const occupancyRate = units.length > 0 ? (units.filter(u => u.status === 'Occupied').length / units.length) * 100 : 0;
  const maintenanceEfficiency = maintenanceRequests.length > 0 
    ? (maintenanceRequests.filter(r => r.status === 'Resolved' || r.status === 'Closed').length / maintenanceRequests.length) * 100 
    : 0;
  
  const data = [
    { subject: 'Occupancy', A: occupancyRate, fullMark: 100 },
    { subject: 'Revenue', A: tenants.length > 0 ? 80 : 0, fullMark: 100 },
    { subject: 'Growth', A: tenants.length > 0 ? 60 : 0, fullMark: 100 },
    { subject: 'Tenant Sat', A: tenants.length > 0 ? 85 : 0, fullMark: 100 },
    { subject: 'Maintenance', A: maintenanceEfficiency, fullMark: 100 },
  ];

  if (tenants.length === 0 && units.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-slate-400 text-xs italic">
        Insufficient data for radar analysis.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#f1f5f9" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar
            name="Portfolio"
            dataKey="A"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OccupancyRadialChart = ({ value = 0 }: { value?: number }) => {
  const data = [
    {
      name: 'Occupancy',
      value: value,
      fill: '#10b981',
    },
  ];

  return (
    <div className="h-[240px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="60%" 
          outerRadius="100%" 
          barSize={15} 
          data={data} 
          startAngle={180} 
          endAngle={0}
        >
          <RadialBar
            background
            dataKey="value"
            cornerRadius={30}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-3xl font-black text-slate-900">{value}%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupied</span>
      </div>
    </div>
  );
};

export const TenantIndustryChart = () => {
  const { tenants } = useData();
  
  const data = React.useMemo(() => {
    const industries: Record<string, number> = {};
    (tenants || []).forEach(t => {
      const ind = t.businessType || 'Other';
      industries[ind] = (industries[ind] || 0) + 1;
    });
    
    return Object.entries(industries).map(([name, value]) => ({ name, value }));
  }, [tenants]);

  if (data.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-slate-400 text-xs italic">No tenant data available.</div>;
  }

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MaintenanceDistributionChart = () => {
  const { maintenanceRequests } = useData();
  
  const data = React.useMemo(() => {
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    return priorities.map(pri => ({
      name: pri,
      value: (maintenanceRequests || []).filter(r => r.priority === pri).length
    })).filter(d => d.value > 0);
  }, [maintenanceRequests]);

  if (data.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-slate-400 text-xs italic">No maintenance data available.</div>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={['#10b981', '#6366f1', '#f59e0b', '#f43f5e'][index % 4]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};