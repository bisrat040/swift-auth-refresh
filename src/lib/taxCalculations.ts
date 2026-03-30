/**
 * Ethiopian Personal Income Tax (PIT) Calculation
 * Based on the Ethiopian Income Tax Proclamation
 */

export const DEFAULT_VAT_RATE = 0.15;

export const calculatePIT = (taxableIncome: number): number => {
  if (!taxableIncome || taxableIncome <= 600) return 0;
  if (taxableIncome <= 1650) return (taxableIncome * 0.1) - 60;
  if (taxableIncome <= 3200) return (taxableIncome * 0.15) - 142.5;
  if (taxableIncome <= 5250) return (taxableIncome * 0.2) - 302.5;
  if (taxableIncome <= 7800) return (taxableIncome * 0.25) - 565;
  if (taxableIncome <= 10900) return (taxableIncome * 0.3) - 955;
  return (taxableIncome * 0.35) - 1500;
};

export const calculatePensionEmployee = (basicSalary: number): number => {
  if (!basicSalary || basicSalary <= 0) return 0;
  return basicSalary * 0.07;
};

export const calculatePensionEmployer = (basicSalary: number): number => {
  if (!basicSalary || basicSalary <= 0) return 0;
  return basicSalary * 0.11;
};

export const calculateVAT = (amount: number, rate: number = DEFAULT_VAT_RATE): number => {
  if (!amount || amount <= 0) return 0;
  return amount * rate;
};

/**
 * Calculates the total lease amount including VAT and applying a discount.
 * Sequence: 
 * 1. Base Cost (Total for the payment term)
 * 2. VAT Amount (Base Cost * VAT Rate)
 * 3. Gross Amount (Base Cost + VAT Amount)
 * 4. Discount Amount (Gross Amount * Discount Rate)
 * 5. Total Final (Gross Amount - Discount Amount)
 * 
 * Note: As per user request, the primary lease cost displayed in the form 
 * should be the Gross Amount (including VAT but before any discount).
 */
export const calculateLeaseTotal = (
  baseAmount: number,
  vatRatePercent: number,
  discountRatePercent: number = 0
): {
  baseAmount: number;
  vatAmount: number;
  amountWithVat: number;
  discountAmount: number;
  totalFinal: number;
} => {
  const vatRate = vatRatePercent / 100;
  const discountRate = discountRatePercent / 100;
  
  const vatAmount = baseAmount * vatRate;
  const amountWithVat = baseAmount + vatAmount;
  const discountAmount = amountWithVat * discountRate;
  
  // totalFinal traditionally includes discount, but for the lease form we primarily want the gross
  const totalFinal = amountWithVat - discountAmount;

  return {
    baseAmount,
    vatAmount,
    amountWithVat,
    discountAmount,
    totalFinal
  };
};

export const calculateNetSalary = (
  basicSalary: number = 0, 
  taxableAllowance: number = 0, 
  nonTaxableAllowance: number = 0,
  bonus: number = 0
): {
  grossSalary: number;
  taxableIncome: number;
  pensionEmployee: number;
  incomeTax: number;
  netSalary: number;
} => {
  if (!basicSalary || basicSalary <= 0) {
    return {
      grossSalary: 0,
      taxableIncome: 0,
      pensionEmployee: 0,
      incomeTax: 0,
      netSalary: 0
    };
  }

  const pensionEmployee = calculatePensionEmployee(basicSalary);
  const taxableIncome = Math.max(0, basicSalary + taxableAllowance + bonus - pensionEmployee);
  const incomeTax = calculatePIT(taxableIncome);
  const grossSalary = basicSalary + taxableAllowance + nonTaxableAllowance + bonus;
  const netSalary = grossSalary - pensionEmployee - incomeTax;

  return {
    grossSalary,
    taxableIncome,
    pensionEmployee,
    incomeTax,
    netSalary
  };
};