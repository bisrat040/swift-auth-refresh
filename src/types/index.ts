export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'BUILDING_OWNER' 
  | 'SENIOR_MANAGER' 
  | 'PROPERTY_MANAGER' 
  | 'HR_MANAGER' 
  | 'HR' 
  | 'MAINTENANCE_CREW' 
  | 'ACCOUNT_MANAGER' 
  | 'PARKING_MANAGER' 
  | 'EMPLOYEE';

export type SubscriptionTier = 'DEMO' | 'BASIC' | 'PRO';

export type TimeFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

export type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export interface DateRange {
  from: string;
  to: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionTier?: SubscriptionTier;
  avatarUrl?: string;
  isActive?: boolean;
  isGranted?: boolean;
  phone?: string;
  bio?: string;
  location?: string;
  department?: string;
  joinedAt?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  expiresAt: string;
  status: 'Pending' | 'Accepted' | 'Expired';
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  fullName: string;
  email: string;
  buildingName: string;
  tinNumber: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Granted';
  createdAt: string;
  grantedAt?: string;
  grantedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  actionType: 'Invitation' | 'Approval' | 'Denial' | 'RoleChange' | 'FailedLogin' | 'Granting';
  details: string;
  userEmail?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'Residential' | 'Commercial' | 'Mixed-Use' | 'Industrial';
  status: 'Active' | 'Under Maintenance' | 'Sold' | 'Pending';
  totalUnits: number;
  imageUrl?: string;
  managerId?: string;
  description?: string;
  paymentTerms?: string[];
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiry?: string;
  subscriptionPrice?: number;
}

export interface Unit {
  id: string;
  propertyId: string;
  number: string;
  type: string;
  status: 'Vacant' | 'Occupied' | 'Maintenance';
  rentAmount: number;
  sqm?: number;
  floor?: number;
  features?: string[];
}

export interface TenantPayment {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Late' | 'Pending';
  method: 'Bank Transfer' | 'Telebirr' | 'Cash' | 'Cheque';
  vatAmount: number;
  whtAmount?: number;
  receiptNumber: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  idNumber?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  unitId?: string;
  propertyId?: string;
  status: 'Active' | 'Late' | 'Notice';
  rentAmount: number;
  totalPaidAmount: number;
  leaseEnd: string;
  leaseStart: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  idNumber?: string;
  taxId?: string;
  businessType?: string;
  familyMembers?: FamilyMember[];
  paymentHistory?: TenantPayment[];
  notes?: string;
  avatarUrl?: string;
  documents?: { name: string; type: string; date: string }[];
}

export interface MaintenanceRequest {
  id: string;
  propertyId?: string;
  unitId?: string;
  unit?: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  dateReported: string;
  tenantId?: string;
  tenantName: string;
  cost?: number;
  assignedStaff?: string;
  completionDate?: string;
  description?: string;
}

export interface FinancialMetric {
  id: string;
  month: string;
  revenue: number;
  expenses: number;
}

export interface LeaseAmendment {
  id: string;
  date: string;
  description: string;
  previousRent: number;
  newRent: number;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName?: string;
  unitId?: string;
  unitNumber?: string;
  propertyId?: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  totalRent: number;
  depositAmount: number;
  status: 'Active' | 'Expired' | 'Pending' | 'Terminated';
  terms: string;
  sqm: number;
  pricePerSqm: number;
  floor: number;
  paymentPlan: number;
  leaseDuration: string;
  contractType: 'Standard' | 'Commercial' | 'Short-term';
  vatRate: number;
  discountRate?: number;
  utilitiesIncluded: string[];
  paymentFrequency: string; // Changed to string for flexibility (1-12 months)
  amendments?: LeaseAmendment[];
  terminationNotice: string;
  documents?: { name: string; type: string; date: string }[];
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  propertyId?: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
  assignedTo?: string;
  type: 'Standard' | 'Premium' | 'Handicap' | 'EV Charging';
  monthlyFee: number;
}

export interface GuestParkingRecord {
  id: string;
  guestName: string;
  vehiclePlate: string;
  contactNumber: string;
  unitVisiting: string;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'Active' | 'Completed';
  totalFee?: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'Occupancy' | 'Financial' | 'Maintenance' | 'Tenant' | 'Parking' | 'HR' | 'Tax';
  generatedDate: string;
  format: 'PDF' | 'Excel' | 'CSV';
}

export interface PerformanceReview {
  id: string;
  date: string;
  rating: number;
  reviewer: string;
  comments: string;
}

export interface AssetAllocation {
  id: string;
  itemName: string;
  assignedDate: string;
  condition: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Maintenance' | 'Administration' | 'Security' | 'Management' | 'Cleaning';
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  salary: number;
  hireDate: string;
  tinNumber?: string;
  pensionNumber?: string;
  educationLevel?: string;
  emergencyContact?: { name: string; phone: string };
  performanceReviews?: PerformanceReview[];
  employmentHistory?: { company: string; role: string; period: string }[];
  avatarUrl?: string;
  assets?: AssetAllocation[];
  documents?: { name: string; type: string; date: string }[];
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  period?: string;
  grossSalary: number;
  baseSalary: number;
  bonus: number;
  overtime?: number;
  taxableAllowance?: number;
  nonTaxableAllowance?: number;
  pensionEmployee: number;
  pensionEmployer: number;
  incomeTax: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending' | 'Processing';
  paymentDate?: string;
}

export interface TaxLiability {
  id: string;
  type: 'VAT' | 'PIT' | 'Pension' | 'Rental Income' | 'WHT';
  period: string;
  amount: number;
  dueDate: string;
  status: 'Due' | 'Paid' | 'Overdue';
  reference?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  category: 'Income' | 'Expense' | 'Tax' | 'Payroll';
  amount: number;
  type: 'Debit' | 'Credit';
  referenceId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'User' | 'Bot';
  text: string;
  timestamp: string;
  status?: 'Sent' | 'Delivered' | 'Read';
}

export type UIComponentType = 'stat-card' | 'data-field' | 'status-badge' | 'avatar-header' | 'action-button' | 'section-divider';

export interface UIConfiguration {
  id: string;
  type: UIComponentType;
  label?: string;
  dataKey?: string;
  icon?: string;
  className?: string;
  props?: Record<string, any>;
  children?: UIConfiguration[];
  formatter?: 'currency' | 'date' | 'phone' | 'email' | 'tax-id' | 'id-number';
} 

export interface TenantProfileConfig {
  header: UIConfiguration[];
  stats: UIConfiguration[];
  details: UIConfiguration[];
  actions: UIConfiguration[];
}

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded';
export type ContractTerm = '6 months' | '1 year';

export interface Subscription {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  planName: SubscriptionTier;
  status: SubscriptionStatus;
  price: number;
  billingInterval: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
  trialPeriodDays?: number;
  contractTerm?: ContractTerm;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  excluded?: string[];
  trialPeriodDays?: number;
  contractTermOptions?: ContractTerm[];
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId?: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  amount: number;
  status: PaymentStatus;
  transactionReference?: string;
  paymentMethod?: string;
  paymentDate: string;
  createdAt: string;
}