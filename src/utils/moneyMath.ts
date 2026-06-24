/**
 * @file moneyMath.ts
 * @description High-performance utility library for safe financial calculations.
 * Avoids JavaScript floating-point errors (e.g., 0.1 + 0.2 = 0.30000000000000004)
 * by executing computations in integer cents.
 */

/**
 * Converts a floating-point money amount to integer cents (rounded).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to a floating-point money amount.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Safely adds two monetary values.
 */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Safely subtracts the second monetary value from the first.
 */
export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Safely multiplies a monetary value by a numeric factor.
 */
export function multiplyMoney(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

/**
 * Safely divides a monetary value by a numeric divisor.
 */
export function divideMoney(amount: number, divisor: number): number {
  if (divisor === 0) return 0;
  return fromCents(Math.round(toCents(amount) / divisor));
}

/**
 * Sums an array of monetary values safely.
 */
export function sumMoney(amounts: number[]): number {
  const totalCents = amounts.reduce((sum, amt) => sum + toCents(amt), 0);
  return fromCents(totalCents);
}

/**
 * Calculates what percentage of total is part, avoiding floating-point issues,
 * and returning it rounded to the specified scale of decimal places.
 */
export function percentOf(part: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0;
  const factor = Math.pow(10, decimals);
  const partCents = toCents(part);
  const totalCents = toCents(total);
  return Math.round((partCents / totalCents) * 100 * factor) / factor;
}
