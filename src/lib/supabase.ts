import { createClient } from '@supabase/supabase-js';
import { Subscription, SubscriptionPayment, SubscriptionTier, ContractTerm, Property } from '../types';
import { toSnake } from './utils';

const supabaseUrl = 'https://rohazooyxwdbtawrkswh.supabase.co';
const supabaseAnonKey = 'sb_publishable_60KgcAXq19LtuI5uBhwA3w_6LjLeHgU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TableName = 
  | 'tenants' 
  | 'leases' 
  | 'maintenance_requests' 
  | 'employees' 
  | 'financial_transactions' 
  | 'parking_slots' 
  | 'guest_parking_records' 
  | 'tax_liabilities' 
  | 'payroll_records'
  | 'financial_metrics'
  | 'reports'
  | 'profiles'
  | 'invitations'
  | 'verification_queue'
  | 'audit_logs'
  | 'confirmed_users'
  | 'role_permissions'
  | 'subscriptions'
  | 'subscription_payments'
  | 'properties';

/**
 * Signs in a user with email and password using Supabase Auth.
 */
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

/**
 * Signs out the current user.
 */
export const signOutUser = async () => {
  return await supabase.auth.signOut();
};

/**
 * Sends a password reset OTP to the user's email.
 * This triggers the 'Recovery' email template from Supabase Auth.
 */
export const sendResetOtp = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email);
};

/**
 * Verifies the password reset OTP code.
 * @param email The user's email address
 * @param token The 6-digit OTP code received via email
 */
export const verifyResetOtp = async (email: string, token: string) => {
  return await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery'
  });
};

/**
 * Updates the user's password.
 * This should be called after a successful OTP verification which creates an active session.
 */
export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({
    password: password
  });
};

/**
 * Original link-based password reset method.
 */
export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

export const subscribeToTable = <T extends { id: string }>(
  table: TableName,
  callback: (payload: { eventType: string; new: T; old: T }) => void
) => {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

/**
 * Grants access to a user in the verification queue.
 */
export const grantUserApproval = async (requestId: string, userEmail: string, adminId: string) => {
  const { error: queueError } = await supabase
    .from('verification_queue')
    .update({ 
      status: 'Granted',
      granted_at: new Date().toISOString(),
      granted_by: adminId
    })
    .eq('id', requestId);

  if (queueError) throw queueError;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (profile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_active: true,
        is_granted: true 
      })
      .eq('id', profile.id);
    
    if (profileError) throw profileError;
  }

  return { success: true };
};

// --- Subscription Management Functions ---

/**
 * Fetches all subscriptions with owner details.
 */
export const getSubscriptions = async () => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:owner_id (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(sub => ({
    id: sub.id,
    ownerId: sub.owner_id,
    ownerName: sub.profiles?.name,
    ownerEmail: sub.profiles?.email,
    planName: sub.plan_name as SubscriptionTier,
    status: sub.status,
    price: sub.price,
    billingInterval: sub.billing_interval,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelAt: sub.cancel_at,
    canceledAt: sub.canceled_at,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
    trialPeriodDays: sub.trial_period_days,
    contractTerm: sub.contract_term as ContractTerm
  })) as Subscription[];
};

/**
 * Updates a subscription.
 */
export const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
  const dbUpdates: any = {};
  if (updates.planName) dbUpdates.plan_name = updates.planName;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.billingInterval) dbUpdates.billing_interval = updates.billingInterval;
  if (updates.currentPeriodEnd) dbUpdates.current_period_end = updates.currentPeriodEnd;
  if (updates.cancelAt) dbUpdates.cancel_at = updates.cancelAt;
  if (updates.canceledAt) dbUpdates.canceled_at = updates.canceledAt;
  if (updates.trialPeriodDays !== undefined) dbUpdates.trial_period_days = updates.trialPeriodDays;
  if (updates.contractTerm !== undefined) dbUpdates.contract_term = updates.contractTerm;

  const { data, error } = await supabase
    .from('subscriptions')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Creates a new subscription for an owner.
 */
export const createSubscription = async (newSubscription: Partial<Subscription>) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      owner_id: newSubscription.ownerId,
      plan_name: newSubscription.planName,
      status: newSubscription.status || 'active',
      price: newSubscription.price || 0,
      billing_interval: newSubscription.billingInterval || 'month',
      current_period_start: new Date().toISOString(),
      current_period_end: newSubscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_period_days: newSubscription.trialPeriodDays || null,
      contract_term: newSubscription.contractTerm || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Deletes a subscription record.
 */
export const deleteSubscription = async (id: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Fetches payment records for a specific subscription or all payments.
 */
export const getSubscriptionPayments = async (subscriptionId?: string) => {
  let query = supabase
    .from('subscription_payments')
    .select(`
      *,
      profiles:owner_id (
        name,
        email
      )
    `)
    .order('payment_date', { ascending: false });

  if (subscriptionId) {
    query = query.eq('subscription_id', subscriptionId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map(pay => ({
    id: pay.id,
    subscriptionId: pay.subscription_id,
    ownerId: pay.owner_id,
    ownerName: pay.profiles?.name,
    ownerEmail: pay.profiles?.email,
    amount: pay.amount,
    status: pay.status,
    transactionReference: pay.transaction_reference,
    paymentMethod: pay.payment_method,
    paymentDate: pay.payment_date,
    createdAt: pay.created_at
  })) as SubscriptionPayment[];
};

/**
 * Cancels a subscription.
 */
export const cancelSubscription = async (id: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'cancelled',
      canceled_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Fetches all confirmed owners for the subscription dropdown.
 */
export const getConfirmedOwners = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'BUILDING_OWNER')
    .eq('is_granted', true);

  if (error) throw error;
  return data;
};

// --- Property Management Functions ---

/**
 * Updates a property including subscription details.
 */
export const updateProperty = async (id: string, updates: Partial<Property>) => {
  const dbUpdates = toSnake(updates);
  
  const { data, error } = await supabase
    .from('properties')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Creates a new property.
 */
export const createProperty = async (newProperty: Partial<Property>) => {
  const dbData = toSnake(newProperty);
  
  const { data, error } = await supabase
    .from('properties')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return data;
};