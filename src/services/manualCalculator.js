/**
 * src/services/manualCalculator.js
 * 
 * Provides pure utility functions for the Manual Calculator feature.
 * Strictly isolated from Scheme Benefit calculations.
 */

/**
 * Safely evaluates a basic mathematical expression.
 * @param {string} expression 
 * @returns {object} { result: number } or { error: string }
 */
export const evaluateBasicMath = (expression) => {
  if (!expression || typeof expression !== 'string') return { error: 'Invalid expression' };
  
  // Strip spaces
  const expr = expression.replace(/\s+/g, '');
  
  // Allow only digits, basic operators, decimal point, percentages, and parentheses
  if (!/^[0-9+\-*/().%]+$/.test(expr)) {
    return { error: 'Invalid characters in expression' };
  }

  try {
    // Convert percentages (e.g. 50% -> (50/100)) safely.
    // Note: Handling cases like "500 * 10%" -> "500 * (10/100)"
    const sanitizedExpr = expr.replace(/([0-9.]+)(%)/g, '($1/100)');
    
    // Protect against obvious empty parentheses or hanging operators before eval
    if (sanitizedExpr.includes('()') || /[+\-*/]$/.test(sanitizedExpr)) {
      return { error: 'Incomplete expression' };
    }

    // Evaluate safely using Function
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return ${sanitizedExpr}`);
    const result = fn();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return { error: 'Math Error (e.g., Division by Zero)' };
    }
    
    // Fix floating point precision issues
    return { result: Number(result.toFixed(4)) };
  } catch (err) {
    return { error: 'Invalid mathematical expression' };
  }
};

/**
 * Simple Interest: SI = (P * R * T) / 100
 */
export const calculateSimpleInterest = (principal, rate, timeYears) => {
  const p = parseFloat(principal);
  const r = parseFloat(rate);
  const t = parseFloat(timeYears);

  if (isNaN(p) || isNaN(r) || isNaN(t) || p < 0 || r < 0 || t <= 0) {
    return { error: 'Invalid inputs. Values must be positive and Time > 0.' };
  }

  const si = (p * r * t) / 100;
  const total = p + si;
  return { si: Math.round(si), total: Math.round(total) };
};

/**
 * Compound Interest: A = P(1 + r/n)^(nt)
 * frequency = compounding frequency per year (1 = Annual, 12 = Monthly, etc.)
 */
export const calculateCompoundInterest = (principal, rate, timeYears, frequency = 1) => {
  const p = parseFloat(principal);
  const r = parseFloat(rate);
  const t = parseFloat(timeYears);
  const n = parseInt(frequency);

  if (isNaN(p) || isNaN(r) || isNaN(t) || isNaN(n) || p < 0 || r < 0 || t <= 0 || n <= 0) {
    return { error: 'Invalid inputs. Values must be positive.' };
  }

  const rDecimal = r / 100;
  const amount = p * Math.pow(1 + rDecimal / n, n * t);
  const ci = amount - p;

  return { ci: Math.round(ci), total: Math.round(amount) };
};

/**
 * EMI Calculator
 * tenureMonths: total months of the loan
 */
export const calculateEMI = (principal, rateAnnual, tenureMonths) => {
  const p = parseFloat(principal);
  const rAnnual = parseFloat(rateAnnual);
  const n = parseInt(tenureMonths);

  if (isNaN(p) || isNaN(rAnnual) || isNaN(n) || p <= 0 || rAnnual < 0 || n <= 0) {
    return { error: 'Invalid inputs. Principal and Tenure must be > 0.' };
  }

  if (rAnnual === 0) {
    const emi = p / n;
    return { emi: Math.round(emi), totalPayment: Math.round(p), totalInterest: 0 };
  }

  const rMonthly = rAnnual / 12 / 100;
  const emi = (p * rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - p;

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest)
  };
};
