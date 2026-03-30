import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Property,
  Tenant, 
  Unit, 
  Lease, 
  MaintenanceRequest, 
  Employee, 
  FinancialTransaction, 
  ParkingSlot, 
  TaxLiability,
  FinancialMetric,
  PayrollRecord,
  GuestParkingRecord,
  Report,
  TimeFilter
} from '../types';
import { getDateRangeForFilter } from '../lib/utils';
import * as mockData from '../data/mockData';

export interface DataContextType {
  properties: Property[];
  tenants: Tenant[];
  units: Unit[];
  leases: Lease[];
  maintenanceRequests: MaintenanceRequest[];
  employees: Employee[];
  financialTransactions: FinancialTransaction[];
  parkingSlots: ParkingSlot[];
  taxLiabilities: TaxLiability[];
  financialMetrics: FinancialMetric[];
  payrollRecords: PayrollRecord[];
  guestParkingRecords: GuestParkingRecord[];
  reports: Report[];
  isLoading: boolean;
  isRefreshing: boolean;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  refreshData: (table: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Efficient camelCase conversion for Supabase results.
 * Handles nested objects and arrays while avoiding unnecessary object creation.
 */
const toCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/([-_][a-z])/gi, ($1) => 
        $1.toUpperCase().replace('-', '').replace('_', '')
      );
      result[camelKey] = toCamel(obj[key]);
    }
  }
  return result;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [taxLiabilities, setTaxLiabilities] = useState<TaxLiability[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetric[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [guestParkingRecords, setGuestParkingRecords] = useState<GuestParkingRecord[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  
  const isFirstLoad = useRef(true);
  const fetchInProgress = useRef(false);

  const applyTimeFilter = useCallback((query: any, dateColumn: string) => {
    const range = getDateRangeForFilter(timeFilter);
    if (range && timeFilter !== 'all') {
      return query.gte(dateColumn, range.from).lte(dateColumn, range.to);
    }
    return query;
  }, [timeFilter]);

  const fetchData = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    if (isFirstLoad.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      // Set a safety timeout for data fetching to prevent infinite loading state
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
      );

      const fetchQueries = [
        supabase.from('properties').select('*').limit(1000),
        supabase.from('tenants').select('*').limit(1000),
        supabase.from('units').select('*').limit(1000),
        applyTimeFilter(supabase.from('leases').select('*').limit(1000), 'start_date'),
        applyTimeFilter(supabase.from('maintenance_requests').select('*').limit(1000), 'date_reported'),
        supabase.from('employees').select('*').limit(1000),
        applyTimeFilter(supabase.from('financial_transactions').select('*').limit(1000), 'date'),
        supabase.from('parking_slots').select('*').limit(1000),
        supabase.from('tax_liabilities').select('*').limit(1000),
        supabase.from('payroll_records').select('*').limit(1000),
        applyTimeFilter(supabase.from('guest_parking_records').select('*').limit(1000), 'check_in_time'),
        supabase.from('financial_metrics').select('*').limit(1000),
        supabase.from('reports').select('*').limit(1000)
      ];

      const fetchResults = await Promise.race([
        Promise.allSettled(fetchQueries),
        timeoutPromise
      ]) as PromiseSettledResult<any>[];

      const handleResult = (
        result: PromiseSettledResult<any>, 
        setter: (data: any) => void, 
        mockArray: any[]
      ) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          const data = toCamel(result.value.data);
          // If DB returned data, use it. If empty array, use mock data for better UX during development
          if (Array.isArray(data) && data.length > 0) {
            setter(data);
          } else {
            setter(mockArray);
          }
        } else {
          setter(mockArray);
          if (result.status === 'fulfilled' && result.value.error) {
            console.warn('Supabase fetch failed, using mock data:', result.value.error.message);
          } else if (result.status === 'rejected') {
            console.warn('Query rejected, using mock data');
          }
        }
      };

      handleResult(fetchResults[0], setProperties, mockData.properties);
      handleResult(fetchResults[1], setTenants, mockData.tenants);
      handleResult(fetchResults[2], setUnits, mockData.units);
      handleResult(fetchResults[3], setLeases, mockData.leases);
      handleResult(fetchResults[4], setMaintenanceRequests, mockData.maintenanceRequests);
      handleResult(fetchResults[5], setEmployees, mockData.employees);
      handleResult(fetchResults[6], setFinancialTransactions, mockData.financialTransactions);
      handleResult(fetchResults[7], setParkingSlots, mockData.parkingSlots);
      handleResult(fetchResults[8], setTaxLiabilities, mockData.taxLiabilities);
      handleResult(fetchResults[9], setPayrollRecords, mockData.payrollRecords);
      handleResult(fetchResults[10], setGuestParkingRecords, mockData.guestParkingRecords);
      handleResult(fetchResults[11], setFinancialMetrics, mockData.financialMetrics);
      handleResult(fetchResults[12], setReports, mockData.reports);

    } catch (error) {
      console.error('Error in fetchData:', error);
      // Fallback to mock data on catastrophic failure
      setProperties(mockData.properties);
      setTenants(mockData.tenants);
      setUnits(mockData.units);
      setLeases(mockData.leases);
      setMaintenanceRequests(mockData.maintenanceRequests);
      setEmployees(mockData.employees);
      setFinancialTransactions(mockData.financialTransactions);
      setParkingSlots(mockData.parkingSlots);
      setTaxLiabilities(mockData.taxLiabilities);
      setPayrollRecords(mockData.payrollRecords);
      setGuestParkingRecords(mockData.guestParkingRecords);
      setFinancialMetrics(mockData.financialMetrics);
      setReports(mockData.reports);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFirstLoad.current = false;
      fetchInProgress.current = false;
    }
  }, [applyTimeFilter, timeFilter]);

  const refreshTable = useCallback(async (table: string) => {
    try {
      let query = supabase.from(table).select('*');
      
      if (table === 'financial_transactions') query = applyTimeFilter(query, 'date');
      if (table === 'guest_parking_records') query = applyTimeFilter(query, 'check_in_time');
      if (table === 'maintenance_requests') query = applyTimeFilter(query, 'date_reported');
      if (table === 'leases') query = applyTimeFilter(query, 'start_date');

      const { data, error } = await query;
      if (error) {
        console.error(`Error refreshing table ${table}:`, error);
        return;
      }
      
      if (data) {
        const camelData = toCamel(data);
        const mockKey = table.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const mockArray = (mockData as any)[mockKey] || [];
        const finalData = camelData.length > 0 ? camelData : mockArray;

        switch (table) {
          case 'properties': setProperties(finalData); break;
          case 'tenants': setTenants(finalData); break;
          case 'units': setUnits(finalData); break;
          case 'leases': setLeases(finalData); break;
          case 'maintenance_requests': setMaintenanceRequests(finalData); break;
          case 'employees': setEmployees(finalData); break;
          case 'financial_transactions': setFinancialTransactions(finalData); break;
          case 'parking_slots': setParkingSlots(finalData); break;
          case 'tax_liabilities': setTaxLiabilities(finalData); break;
          case 'payroll_records': setPayrollRecords(finalData); break;
          case 'guest_parking_records': setGuestParkingRecords(finalData); break;
          case 'financial_metrics': setFinancialMetrics(finalData); break;
          case 'reports': setReports(finalData); break;
        }
      }
    } catch (err) {
      console.error(`Unexpected error refreshing table ${table}:`, err);
    }
  }, [applyTimeFilter]);

  useEffect(() => {
    fetchData();

    const tables = [
      'properties', 'tenants', 'units', 'leases', 
      'maintenance_requests', 'employees', 'financial_transactions', 
      'parking_slots', 'tax_liabilities', 'payroll_records', 'guest_parking_records',
      'financial_metrics', 'reports'
    ];

    const channels = tables.map(table => {
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          console.log(`Change detected in ${table}:`, payload);
          refreshTable(table);
        })
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchData, refreshTable]);

  return (
    <DataContext.Provider value={{
      properties,
      tenants,
      units,
      leases,
      maintenanceRequests,
      employees,
      financialTransactions,
      parkingSlots,
      taxLiabilities,
      financialMetrics,
      payrollRecords,
      guestParkingRecords,
      reports,
      isLoading,
      isRefreshing,
      timeFilter,
      setTimeFilter,
      refreshData: refreshTable
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};