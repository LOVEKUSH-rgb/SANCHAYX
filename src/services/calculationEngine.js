export const CALCULATION_TYPES = {
  LUMP_SUM_COMPOUND: 'lump_sum_compound',
  RECURRING_CONTRIBUTION: 'recurring_contribution',
  MONTHLY_INCOME: 'monthly_income',
  INSURANCE_BENEFIT: 'insurance_benefit',
  EXACT_SCHEME: 'exact_scheme',
  NONE: 'none'
};

function extractNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return null;
  const match = String(str).match(/[\d]*\.?[\d]+/);
  return match ? parseFloat(match[0]) : null;
}

export function getCalculationConfig(scheme) {
  const fin = scheme.financial || {};
  const ben = scheme.benefits || {};
  
  const interestRateStr = scheme.currentInterestRate || fin.interest_rate || null;
  const interestRate = extractNumber(interestRateStr);

  const minCont = extractNumber(fin.minimum_contribution) || extractNumber(scheme.minimumContribution) || 0;
  const maxCont = extractNumber(fin.maximum_contribution) || extractNumber(scheme.maximumContribution) || 150000;
  
  const durationStr = String(fin.maturity || fin.lock_in_years || fin.lock_in || scheme.policyTerm || '').toLowerCase();
  let explicitDuration = extractNumber(durationStr);
  let isMonths = durationStr.includes('month');
  let durationInYears = isMonths && explicitDuration ? explicitDuration / 12 : explicitDuration;

  const isOneTime = String(fin.contribution_frequency || '').toLowerCase().includes('one-time');
  const isMonthlyPaid = String(fin.interest_rate || '').toLowerCase().includes('paid monthly') || String(ben.summary || '').toLowerCase().includes('monthly interest');
  
  const schemeId = scheme.scheme_id || '';

  // 1. Exact Scheme Mechanisms
  if (schemeId === 'kvp_001') {
    return {
      type: CALCULATION_TYPES.EXACT_SCHEME,
      title: 'Kisan Vikas Patra Calculator',
      confidence: 'Exact Scheme Rule',
      inputs: [
        { id: 'amount', label: 'One-Time Deposit (₹)', type: 'number', min: Math.max(minCont, 1000), max: maxCont, defaultValue: 10000 }
      ],
      params: { durationInYears, durationStr },
      calculate: (inputs, params) => {
        const p = inputs.amount || 0;
        if (p <= 0) return null;
        return {
          totalContribution: p,
          estimatedBenefit: p * 2,
          estimatedGain: p,
          explanation: `Calculation: KVP doubles the invested amount over its maturity period (${params.durationStr || 'currently 115 months'}). This is a one-time lump sum deposit.`
        };
      }
    };
  }

  if (schemeId === 'ssy_001') {
    // SSY lacks full contribution period rules in the JSON, making an accurate maturity calc impossible without assumptions.
    return {
      type: CALCULATION_TYPES.NONE,
      title: 'Calculation Not Available',
      message: 'SSY requires a 15-year deposit phase and matures in 21 years. This specific deposit structure is not fully detailed in the current dataset, preventing an accurate calculation.',
      inputs: [], calculate: () => null
    };
  }

  if (schemeId === 'pomis_001' || isMonthlyPaid) {
    if (!durationInYears) {
      return { type: CALCULATION_TYPES.NONE, title: 'Calculation Not Available', message: 'Maturity duration is not available in the dataset for this monthly income scheme.', inputs: [], calculate: () => null };
    }
    return {
      type: CALCULATION_TYPES.MONTHLY_INCOME,
      title: 'Monthly Income Calculator',
      confidence: 'Dataset-Based Calculation',
      inputs: [
        { id: 'amount', label: 'One-Time Deposit (₹)', type: 'number', min: Math.max(minCont, 1000), max: maxCont, defaultValue: Math.max(minCont, 100000) }
      ],
      params: { interestRate, durationInYears },
      calculate: (inputs, params) => {
        const p = inputs.amount || 0;
        if (p <= 0) return null;
        const r = params.interestRate / 100;
        const monthlyIncome = (p * r) / 12;
        const totalInterest = monthlyIncome * 12 * params.durationInYears;
        return {
          totalContribution: Math.round(p),
          monthlyIncome: Math.round(monthlyIncome),
          estimatedBenefit: Math.round(p),
          estimatedGain: Math.round(totalInterest),
          explanation: `Calculation: One-time deposit of ₹${p.toLocaleString('en-IN')}. Monthly income is calculated at ${params.interestRate}% p.a. (simple interest) over ${params.durationInYears} years. Maturity amount is the return of the original principal.`
        };
      }
    };
  }

  if (schemeId === 'ppf_001') {
    return {
      type: CALCULATION_TYPES.EXACT_SCHEME,
      title: 'PPF Estimate Calculator',
      confidence: 'Estimated Calculation',
      inputs: [
        { id: 'amount', label: 'Yearly Contribution (₹)', type: 'number', min: Math.max(minCont, 500), max: maxCont, defaultValue: 10000 }
      ],
      params: { interestRate, durationInYears: 15 },
      calculate: (inputs, params) => {
        const p = inputs.amount || 0;
        if (p <= 0) return null;
        const r = params.interestRate / 100;
        const t = params.durationInYears;
        const futureValue = p * ((Math.pow(1 + r, t) - 1) / r);
        const totalContribution = p * t;
        return {
          totalContribution: Math.round(totalContribution),
          estimatedBenefit: Math.round(futureValue),
          estimatedGain: Math.round(futureValue - totalContribution),
          isEstimate: true,
          explanation: `Estimate Only: Illustrative projection based on an annual annuity approximation of ${params.interestRate}% p.a. over ${t} years. Actual PPF interest is calculated monthly on the lowest balance between the 5th and end of the month.`
        };
      }
    };
  }

  // 2. Generic Schemes (Only if exact interest rate AND duration exist)
  if (interestRate !== null && interestRate > 0) {
    if (!durationInYears) {
      return {
        type: CALCULATION_TYPES.NONE,
        title: 'Calculation Not Available',
        message: 'A reliable maturity duration is not available in the dataset, preventing an accurate calculation. The calculator does not invent assumptions.',
        inputs: [], calculate: () => null
      };
    }

    if (isOneTime) {
      return {
        type: CALCULATION_TYPES.LUMP_SUM_COMPOUND,
        title: 'Lump Sum Savings Calculator',
        confidence: 'Dataset-Based Calculation',
        inputs: [
          { id: 'amount', label: 'One-Time Deposit (₹)', type: 'number', min: Math.max(minCont, 1), max: maxCont, defaultValue: Math.max(minCont, 10000) }
        ],
        params: { interestRate, durationInYears },
        calculate: (inputs, params) => {
          const p = inputs.amount || 0;
          if (p <= 0) return null;
          const r = params.interestRate / 100;
          const futureValue = p * Math.pow(1 + r, params.durationInYears);
          return {
            totalContribution: Math.round(p),
            estimatedBenefit: Math.round(futureValue),
            estimatedGain: Math.round(futureValue - p),
            explanation: `Calculation: One-time deposit compounded annually at ${params.interestRate}% p.a. for the exact dataset duration of ${params.durationInYears} years.`
          };
        }
      };
    } else {
      return {
        type: CALCULATION_TYPES.RECURRING_CONTRIBUTION,
        title: 'Recurring Savings Calculator',
        confidence: 'Dataset-Based Calculation',
        inputs: [
          { id: 'amount', label: 'Yearly Contribution (₹)', type: 'number', min: Math.max(minCont, 1), max: maxCont, defaultValue: Math.max(minCont, 10000) }
        ],
        params: { interestRate, durationInYears },
        calculate: (inputs, params) => {
          const p = inputs.amount || 0;
          if (p <= 0) return null;
          const r = params.interestRate / 100;
          const futureValue = p * ((Math.pow(1 + r, params.durationInYears) - 1) / r);
          const totalContribution = p * params.durationInYears;
          return {
            totalContribution: Math.round(totalContribution),
            estimatedBenefit: Math.round(futureValue),
            estimatedGain: Math.round(futureValue - totalContribution),
            explanation: `Calculation: Yearly recurring contribution at ${params.interestRate}% p.a. over the exact dataset duration of ${params.durationInYears} years.`
          };
        }
      };
    }
  }

  // 3. Fallback
  return {
    type: CALCULATION_TYPES.NONE,
    title: 'Calculation Not Available',
    message: 'Personalized calculation is not available because the scheme information lacks enough deterministic parameters (e.g., exact interest rates, dynamic subsidy formulas) for a reliable monetary calculation.',
    inputs: [], calculate: () => null
  };
}
