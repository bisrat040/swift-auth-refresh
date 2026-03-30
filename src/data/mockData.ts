import { Tenant, MaintenanceRequest, FinancialMetric, Lease, ParkingSlot, Report, ChatMessage, Employee, PayrollRecord, User, TaxLiability, FinancialTransaction, GuestParkingRecord, Unit, Property, TenantProfileConfig, SubscriptionPlan } from '../types';

const PROPERTY_OWNER_EMAIL = 'bisratyyekoye@gmail.com';

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const propertyNames = ['Harmony Heights', 'Lighthouse Towers', 'Skyline Suites', 'Green Valley Plaza', 'City Center Hub', 'The Atrium', 'Emerald Park', 'Regal Residency', 'Metro Square', 'Palm Grove'];
const addresses = ['Bole Road, Addis Ababa', 'Mexico Square, Addis Ababa', 'Kazanchis, Addis Ababa', 'Piazza, Addis Ababa', 'Megenagna, Addis Ababa', 'Gerji, Addis Ababa', 'Sarbet, Addis Ababa', 'CMC, Addis Ababa', 'Summit, Addis Ababa', 'Old Airport, Addis Ababa'];
const tenantNames = ['Abel Tesfaye', 'Sara Bekele', 'Dawit Girma', 'Helen Tadesse', 'Yonas Kebede', 'Marta Alemu', 'Samuel Haile', 'Aster Aweke', 'Teddy Afro', 'Lulu Gezu', 'Salem Getachew', 'Henok Melese', 'Tizita Negusse', 'Solomon Gebre', 'Fasil Demissie'];
const employeeNames = ['Kebede Belay', 'Zewdu Tadesse', 'Almaz Gebre', 'Taye Balcha', 'Meseret Defar', 'Haile Gebrselassie', 'Derartu Tulu', 'Kenenisa Bekele', 'Tirunesh Dibaba', 'Fatuma Roba'];
const departments: ('Maintenance' | 'Administration' | 'Security' | 'Management' | 'Cleaning')[] = ['Maintenance', 'Administration', 'Security', 'Management', 'Cleaning'];
const statuses: ('Active' | 'Under Maintenance' | 'Sold' | 'Pending')[] = ['Active', 'Under Maintenance', 'Sold', 'Pending'];
const unitStatuses: ('Vacant' | 'Occupied' | 'Maintenance')[] = ['Vacant', 'Occupied', 'Maintenance'];
const priorities: ('Low' | 'Medium' | 'High' | 'Urgent')[] = ['Low', 'Medium', 'High', 'Urgent'];
const maintenanceStatuses: ('Open' | 'In Progress' | 'Resolved' | 'Closed')[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

const paymentTermOptions = [
  ['Monthly', 'Quarterly'],
  ['Monthly', 'Quarterly', 'Semi-Annually'],
  ['Monthly', 'Yearly'],
  ['Quarterly', 'Semi-Annually', 'Yearly'],
  ['Monthly', 'Quarterly', 'Semi-Annually', 'Yearly']
];

export const users: User[] = [
  {
    id: 'u1',
    name: 'Bisrat Yyekoye',
    email: PROPERTY_OWNER_EMAIL,
    role: 'BUILDING_OWNER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bisrat',
    isActive: true,
    isGranted: true
  },
  {
    id: 'u2',
    name: 'Admin Assistant',
    email: 'admin@landomanage.et',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'DEMO',
    name: 'Demo Plan',
    price: 0,
    trialPeriodDays: 30,
    description: 'Experience the full power of Landomanage today.',
    features: [
      'Full Pro Access',
      '30-Day Trial Period',
      'No Credit Card Required',
      'AI Assistant Enabled',
      'Sample Data Included'
    ]
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: 15000,
    description: 'Essential tools for small property management.',
    contractTermOptions: ['6 months', '1 year'],
    features: [
      'Dashboard Overview',
      'Property & Unit Portfolio',
      'Tenant Management',
      'Standard Lease Agreements',
      'Maintenance Ticketing',
      'AI Assistant'
    ],
    excluded: [
      'Parking Management',
      'HR & Staff Management',
      'Accounting & Taxation'
    ]
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 20000,
    description: 'The complete suite for professional management.',
    contractTermOptions: ['6 months', '1 year'],
    features: [
      'Everything in Basic',
      'Parking Slot & Guest Registry',
      'HR Management & Payroll',
      'Tax Compliance & Financials',
      'Custom System Reports',
      'Premium Priority Support'
    ]
  }
];

// Generate 50 Properties
export const properties: Property[] = Array.from({ length: 50 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `${getRandomItem(propertyNames)} ${i + 1}`,
  address: getRandomItem(addresses),
  type: getRandomItem(['Residential', 'Commercial', 'Mixed-Use', 'Industrial']),
  status: getRandomItem(statuses),
  totalUnits: Math.floor(Math.random() * 50) + 10,
  imageUrl: `https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400&h=300&seed=${i}`,
  managerId: 'u1',
  description: `Premium property located in the heart of the city, managed by ${PROPERTY_OWNER_EMAIL}.`,
  paymentTerms: getRandomItem(paymentTermOptions)
}));

// Generate 50 Units
export const units: Unit[] = Array.from({ length: 50 }, (_, i) => ({
  id: `unit${i + 1}`,
  propertyId: properties[i % properties.length].id,
  number: `${100 + i}`,
  type: getRandomItem(['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', 'Office', 'Retail']),
  status: getRandomItem(unitStatuses),
  rentAmount: Math.floor(Math.random() * 50000) + 5000,
  sqm: Math.floor(Math.random() * 200) + 30,
  floor: Math.floor(Math.random() * 15) + 1,
  features: ['Wifi', 'Parking', 'AC', 'Elevator'].slice(0, Math.floor(Math.random() * 4) + 1)
}));

// Generate 50 Tenants
export const tenants: Tenant[] = Array.from({ length: 50 }, (_, i) => ({
  id: `t${i + 1}`,
  name: getRandomItem(tenantNames),
  email: `tenant${i + 1}@example.com`,
  phone: `+251 9${Math.floor(10000000 + Math.random() * 90000000)}`,
  unit: units[i % units.length].number,
  unitId: units[i % units.length].id,
  propertyId: units[i % units.length].propertyId,
  status: getRandomItem(['Active', 'Late', 'Notice']),
  rentAmount: units[i % units.length].rentAmount,
  totalPaidAmount: Math.floor(Math.random() * 1000000),
  leaseStart: randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1)),
  leaseEnd: randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1)),
  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Tenant${i}`,
  paymentHistory: Array.from({ length: 5 }, (_, j) => ({
    id: `ph${i}-${j}`,
    date: randomDate(new Date(2023, 0, 1), new Date()),
    amount: units[i % units.length].rentAmount,
    status: 'Paid',
    method: getRandomItem(['Bank Transfer', 'Telebirr', 'Cash', 'Cheque']),
    vatAmount: units[i % units.length].rentAmount * 0.15,
    receiptNumber: `REC-${10000 + i * 10 + j}`
  }))
}));

// Generate 50 Leases
export const leases: Lease[] = Array.from({ length: 50 }, (_, i) => {
  const tenant = tenants[i % tenants.length];
  const unit = units.find(u => u.id === tenant.unitId) || units[0];
  return {
    id: `l${i + 1}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    unitId: unit.id,
    unitNumber: unit.number,
    propertyId: unit.propertyId,
    startDate: tenant.leaseStart,
    endDate: tenant.leaseEnd,
    rentAmount: tenant.rentAmount,
    totalRent: tenant.rentAmount * 12,
    depositAmount: tenant.rentAmount * 2,
    status: getRandomItem(['Active', 'Expired', 'Pending', 'Terminated']),
    terms: 'Standard commercial lease terms apply. Utilities billed separately.',
    sqm: unit.sqm || 50,
    pricePerSqm: Math.floor((unit.rentAmount || 10000) / (unit.sqm || 50)),
    floor: unit.floor || 1,
    paymentPlan: 1,
    leaseDuration: '1 Year',
    contractType: getRandomItem(['Standard', 'Commercial', 'Short-term']),
    vatRate: 15,
    utilitiesIncluded: ['Water', 'Security'],
    paymentFrequency: 'Monthly',
    terminationNotice: '3 months'
  };
});

// Generate 50 MaintenanceRequests
export const maintenanceRequests: MaintenanceRequest[] = Array.from({ length: 50 }, (_, i) => ({
  id: `mr${i + 1}`,
  propertyId: properties[i % properties.length].id,
  unitId: units[i % units.length].id,
  unit: units[i % units.length].number,
  issue: getRandomItem(['Leaking pipe', 'Broken AC', 'Electrical fault', 'Elevator issue', 'Roof leak', 'Painting needed', 'Pest control']),
  priority: getRandomItem(priorities),
  status: getRandomItem(maintenanceStatuses),
  dateReported: randomDate(new Date(2023, 6, 1), new Date()),
  tenantId: tenants[i % tenants.length].id,
  tenantName: tenants[i % tenants.length].name,
  cost: Math.floor(Math.random() * 5000),
  assignedStaff: getRandomItem(employeeNames),
  description: 'Detailed maintenance request description with photo proof attached.'
}));

// Generate 50 Employees
export const employees: Employee[] = Array.from({ length: 50 }, (_, i) => ({
  id: `e${i + 1}`,
  name: getRandomItem(employeeNames),
  role: getRandomItem(['Manager', 'Technician', 'Security Guard', 'Accountant', 'Cleaner']),
  department: getRandomItem(departments),
  email: `employee${i + 1}@landomanage.et`,
  phone: `+251 9${Math.floor(10000000 + Math.random() * 90000000)}`,
  status: getRandomItem(['Active', 'On Leave', 'Terminated']),
  salary: Math.floor(Math.random() * 30000) + 5000,
  hireDate: randomDate(new Date(2020, 0, 1), new Date(2023, 0, 1)),
  tinNumber: `TIN-${Math.floor(1000000 + Math.random() * 9000000)}`,
  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Emp${i}`
}));

// Generate 50 PayrollRecords
export const payrollRecords: PayrollRecord[] = Array.from({ length: 50 }, (_, i) => {
  const emp = employees[i % employees.length];
  const base = emp.salary;
  const bonus = Math.floor(Math.random() * 2000);
  const incomeTax = base * 0.15;
  const pensionEmployee = base * 0.07;
  const pensionEmployer = base * 0.11;
  return {
    id: `pr${i + 1}`,
    employeeId: emp.id,
    employeeName: emp.name,
    month: 'January',
    year: 2024,
    period: 'Jan 2024',
    grossSalary: base + bonus,
    baseSalary: base,
    bonus: bonus,
    pensionEmployee,
    pensionEmployer,
    incomeTax,
    deductions: 0,
    netPay: base + bonus - incomeTax - pensionEmployee,
    status: 'Paid',
    paymentDate: randomDate(new Date(2024, 0, 25), new Date(2024, 0, 31))
  };
});

// Generate 50 TaxLiabilities
export const taxLiabilities: TaxLiability[] = Array.from({ length: 50 }, (_, i) => ({
  id: `tl${i + 1}`,
  type: getRandomItem(['VAT', 'PIT', 'Pension', 'Rental Income', 'WHT']),
  period: 'January 2024',
  amount: Math.floor(Math.random() * 100000),
  dueDate: randomDate(new Date(2024, 1, 1), new Date(2024, 1, 28)),
  status: getRandomItem(['Due', 'Paid', 'Overdue']),
  reference: `TAX-REF-${1000 + i}`
}));

// Generate 50 FinancialTransactions
export const financialTransactions: FinancialTransaction[] = Array.from({ length: 50 }, (_, i) => ({
  id: `ft${i + 1}`,
  date: randomDate(new Date(2023, 0, 1), new Date()),
  description: getRandomItem(['Rent Payment', 'Maintenance Expense', 'Utility Bill', 'Payroll Disbursement', 'Security Service']),
  category: getRandomItem(['Income', 'Expense', 'Tax', 'Payroll']),
  amount: Math.floor(Math.random() * 50000) + 1000,
  type: getRandomItem(['Debit', 'Credit']),
  referenceId: `REF-${10000 + i}`
}));

// Generate 50 ParkingSlots
export const parkingSlots: ParkingSlot[] = Array.from({ length: 50 }, (_, i) => ({
  id: `ps${i + 1}`,
  slotNumber: `P-${100 + i}`,
  propertyId: properties[i % properties.length].id,
  status: getRandomItem(['Available', 'Occupied', 'Reserved', 'Maintenance']),
  assignedTo: i % 2 === 0 ? tenants[i % tenants.length].name : undefined,
  type: getRandomItem(['Standard', 'Premium', 'Handicap', 'EV Charging']),
  monthlyFee: Math.floor(Math.random() * 2000) + 500
}));

// Generate 50 GuestParkingRecords
export const guestParkingRecords: GuestParkingRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: `gpr${i + 1}`,
  guestName: `Guest ${i + 1}`,
  vehiclePlate: `AA-${Math.floor(1000 + Math.random() * 9000)}`,
  contactNumber: `+251 9${Math.floor(10000000 + Math.random() * 90000000)}`,
  unitVisiting: units[i % units.length].number,
  purpose: getRandomItem(['Personal', 'Business', 'Delivery', 'Maintenance']),
  checkInTime: randomDate(new Date(2024, 0, 1), new Date()),
  status: getRandomItem(['Active', 'Completed']),
  totalFee: Math.floor(Math.random() * 500)
}));

// Generate 50 Reports
export const reports: Report[] = Array.from({ length: 50 }, (_, i) => ({
  id: `rep${i + 1}`,
  title: `${getRandomItem(['Occupancy', 'Financial', 'Maintenance', 'Tenant'])} Report Q${(i % 4) + 1}`,
  type: getRandomItem(['Occupancy', 'Financial', 'Maintenance', 'Tenant', 'Parking', 'HR', 'Tax']),
  generatedDate: randomDate(new Date(2023, 0, 1), new Date()),
  format: getRandomItem(['PDF', 'Excel', 'CSV'])
}));

// Financial Metrics for Charts
export const financialMetrics: FinancialMetric[] = [
  { id: 'm1', month: 'Jan', revenue: 450000, expenses: 150000 },
  { id: 'm2', month: 'Feb', revenue: 520000, expenses: 180000 },
  { id: 'm3', month: 'Mar', revenue: 480000, expenses: 160000 },
  { id: 'm4', month: 'Apr', revenue: 610000, expenses: 210000 },
  { id: 'm5', month: 'May', revenue: 550000, expenses: 190000 },
  { id: 'm6', month: 'Jun', revenue: 670000, expenses: 230000 },
];

export const chatbotMessages: ChatMessage[] = [
  { id: 'msg1', sender: 'Bot', text: `Welcome back. I have loaded 50 sample entries for each feature for the owner ${PROPERTY_OWNER_EMAIL}. How can I assist you today?`, timestamp: new Date().toISOString() }
];

// UI Configuration for Tenant Profiles
export const tenantProfileUIConfig: TenantProfileConfig = {
  header: [
    { id: 'h1', type: 'avatar-header', dataKey: 'avatarUrl', className: 'w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4' },
    { id: 'h2', type: 'data-field', dataKey: 'name', className: 'text-xl font-bold text-slate-900 text-center' },
    { id: 'h3', type: 'data-field', label: 'Unit', dataKey: 'unit', className: 'text-sm text-slate-500 text-center mb-4' },
    { id: 'h4', type: 'status-badge', dataKey: 'status', className: 'flex justify-center' }
  ],
  stats: [
    { id: 's1', type: 'stat-card', label: 'Lease Period', icon: 'Calendar', className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
    { id: 's2', type: 'stat-card', label: 'Monthly Rent', dataKey: 'rentAmount', icon: 'CreditCard', formatter: 'currency', className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
    { id: 's3', type: 'stat-card', label: 'Total Paid', dataKey: 'totalPaidAmount', icon: 'Wallet', formatter: 'currency', className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' }
  ],
  details: [
    { id: 'd1', type: 'data-field', label: 'Email', dataKey: 'email', icon: 'Mail', formatter: 'email' },
    { id: 'd2', type: 'data-field', label: 'Phone', dataKey: 'phone', icon: 'Phone', formatter: 'phone' },
    { id: 'd3', type: 'data-field', label: 'TIN', dataKey: 'taxId', icon: 'ShieldCheck', formatter: 'tax-id' },
    { id: 'd4', type: 'data-field', label: 'ID Number', dataKey: 'idNumber', icon: 'FileText', formatter: 'id-number' }
  ],
  actions: [
    { id: 'a1', type: 'action-button', label: 'Message', icon: 'Mail', className: 'px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2' },
    { id: 'a2', type: 'action-button', label: 'Edit Profile', className: 'px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all' }
  ]
};

// Data for charts in DashboardCharts.tsx
export const maintenanceCategoryData = [
  { name: 'Plumbing', value: 25 },
  { name: 'Electrical', value: 20 },
  { name: 'HVAC', value: 15 },
  { name: 'Cleaning', value: 25 },
  { name: 'Other', value: 15 },
];

export const occupancyDataTrend = [
  { month: 'Jan', occupied: 85, vacant: 15 },
  { month: 'Feb', occupied: 87, vacant: 13 },
  { month: 'Mar', occupied: 86, vacant: 14 },
  { month: 'Apr', occupied: 90, vacant: 10 },
  { month: 'May', occupied: 92, vacant: 8 },
  { month: 'Jun', occupied: 95, vacant: 5 },
];

export const tenantIndustryData = [
  { name: 'Tech', value: 30 },
  { name: 'Retail', value: 25 },
  { name: 'Consulting', value: 20 },
  { name: 'Healthcare', value: 15 },
  { name: 'Education', value: 10 },
];

export const monthlyComparisonData = [
  { name: 'Week 1', income: 4000, expense: 2400 },
  { name: 'Week 2', income: 3000, expense: 1398 },
  { name: 'Week 3', income: 2000, expense: 9800 },
  { name: 'Week 4', income: 2780, expense: 3908 },
];