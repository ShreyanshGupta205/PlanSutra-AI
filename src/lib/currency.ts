// Deterministic Currency & Arithmetic Utilities for PlanSutra AI
// Uses Indian Number System formatting and integer precision

/**
 * Formats a number in Indian Rupees (INR) using Indian grouping (lakhs & crores).
 * Example: 150000 -> "₹1,50,000"
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // Handle rounding policy: round to nearest whole rupee unless sub-rupee precision is explicitly requested
  const rounded = includeDecimals ? Math.round(amount * 100) / 100 : Math.round(amount);
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);

  const parts = absAmount.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  // Indian number formatting: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = `₹${formattedInteger}${includeDecimals && decimalPart ? decimalPart : ''}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Converts rupees to integer paise for exact financial arithmetic (avoiding IEEE 754 float drift).
 */
export function toPaise(rupees: number): number {
  return Math.round((rupees || 0) * 100);
}

/**
 * Converts integer paise back to rupees with strict 2-decimal precision.
 */
export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Deterministic sum of an array of rupee amounts, calculated via paise integers.
 */
export function sumRupees(amounts: number[]): number {
  const totalPaise = amounts.reduce((acc, curr) => acc + toPaise(curr), 0);
  return fromPaise(totalPaise);
}

/**
 * Validates whether an amount is a positive finite number.
 */
export function isValidRupeeAmount(amount: any): boolean {
  return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount >= 0;
}
