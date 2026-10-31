/**
 * src/services/goalCalculations.js
 * 
 * Pure mathematical engine for Financial Goal Planning, Milestone Simulation,
 * and Surplus Feasibility Analysis.
 * 
 * KEY PRINCIPLES:
 * 1. Deterministic & Zero-Cost: Pure client-side calculations with zero API latency or token usage.
 * 2. Mathematical Consistency: Matches `src/components/markets/IllustrativeSimulator.jsx`
 *    and standard financial annuity formulas.
 * 3. Timing Convention: Standard Ordinary Annuity (End-of-Period contributions).
 * 4. Surplus Feasibility: Evaluates whether proposed contributions and target goals are
 *    supported by the user's unallocated monthly surplus.
 * 5. Educational Neutrality: Illustrative mathematical projections; zero guaranteed return claims
 *    or product sales recommendations.
 */

export const GOAL_FEASIBILITY_STATUS = {
  ACHIEVABLE: 'ACHIEVABLE',
  SURPLUS_SHORTFALL: 'SURPLUS_SHORTFALL',
  TARGET_ALREADY_FUNDED: 'TARGET_ALREADY_FUNDED',
  IMMEDIATE_FUNDING_REQUIRED: 'IMMEDIATE_FUNDING_REQUIRED',
  INVALID_INPUT: 'INVALID_INPUT'
};

export const ILLUSTRATIVE_RATES = {
  CONSERVATIVE: 7.0,   // Fixed-income style illustrative benchmark (e.g. PPF, Debt, SGB)
  BALANCED: 10.0,      // Moderate balanced growth illustrative benchmark (e.g. Hybrid, NPS)
  GROWTH: 12.0         // Long-term disciplined equity growth illustrative benchmark
};

/**
 * Checks if a value is explicitly provided as non-finite or invalid (NaN, Infinity, -Infinity, null, string NaN).
 * Omitted values (undefined) are permitted to fall back to default values.
 * 
 * @param {*} val 
 * @returns {boolean} True if the value is explicitly supplied but not a finite number
 */
export const isExplicitlyNonFinite = (val) => {
  if (val === undefined) return false;
  if (val === null) return true;
  if (typeof val === 'boolean') return true;
  const num = Number(val);
  return !Number.isFinite(num);
};

/**
 * Calculates projected future value of an initial principal and recurring monthly contribution.
 * 
 * TIMING CONVENTION:
 * Standard Ordinary Annuity (End-of-Month Compounding).
 * Matches `src/components/markets/IllustrativeSimulator.jsx`.
 * In this convention, contributions (M) occur at the end of each monthly compounding period,
 * accumulating interest via: FV = P*(1+r)^n + M*((1+r)^n - 1)/r
 * 
 * @param {number} [initialAmount=0] - Starting lump-sum deposit (P)
 * @param {number} [monthlyContribution=0] - Recurring monthly investment (M)
 * @param {number} [years=0] - Investment horizon in years (y)
 * @param {number} [annualRate=0] - Assumed annual interest/growth rate in percent (e.g., 7 for 7%)
 * @returns {number} Projected Future Value rounded to 2 decimals
 */
export const calculateGoalFutureValue = (initialAmount = 0, monthlyContribution = 0, years = 0, annualRate = 0) => {
  if (
    isExplicitlyNonFinite(initialAmount) ||
    isExplicitlyNonFinite(monthlyContribution) ||
    isExplicitlyNonFinite(years) ||
    isExplicitlyNonFinite(annualRate)
  ) {
    return 0.0;
  }

  const p = Number(initialAmount);
  const m = Number(monthlyContribution);
  const y = Number(years);
  const rate = Number(annualRate);

  if (p < 0 || m < 0 || y < 0 || rate < 0) {
    return 0.0;
  }

  // Edge case: 0 years horizon
  if (y === 0) {
    return Math.round(p * 100) / 100;
  }

  const n = y * 12;

  // Edge case: 0% interest rate (pure sum of deposits)
  if (rate === 0) {
    const total = p + (m * n);
    return Math.round(total * 100) / 100;
  }

  const r = (rate / 100.0) / 12.0;

  // Future value of initial principal
  const fvPrincipal = p * Math.pow(1 + r, n);

  // Future value of monthly contributions (Ordinary Annuity)
  const fvMonthly = m * (Math.pow(1 + r, n) - 1.0) / r;

  const totalFV = fvPrincipal + fvMonthly;
  return Math.round(totalFV * 100) / 100;
};

/**
 * Calculates the monthly contribution required to reach a specific target corpus.
 * Solves for M in: FV = P*(1+r)^n + M*((1+r)^n - 1)/r
 * => M = (FV - P*(1+r)^n) / [((1+r)^n - 1) / r]
 * 
 * If years === 0, returns 0.0 because an immediate-funding scenario has no monthly contribution periods.
 * The lump-sum shortfall is handled via calculateGoalFeasibility.
 * 
 * @param {number} targetAmount - Target corpus desired in INR (FV)
 * @param {number} years - Investment horizon in years
 * @param {number} [annualRate=0] - Assumed annual growth rate in percent
 * @param {number} [initialAmount=0] - Starting lump-sum already available (P, default 0)
 * @returns {number} Required monthly contribution in INR rounded to 2 decimals
 */
export const calculateRequiredMonthlyContribution = (targetAmount, years, annualRate = 0, initialAmount = 0) => {
  if (
    isExplicitlyNonFinite(targetAmount) ||
    isExplicitlyNonFinite(years) ||
    isExplicitlyNonFinite(annualRate) ||
    isExplicitlyNonFinite(initialAmount)
  ) {
    return 0.0;
  }

  const target = Number(targetAmount);
  const y = Number(years);
  const p = Number(initialAmount);
  const rate = Number(annualRate);

  if (target <= 0 || y < 0 || p < 0 || rate < 0) {
    return 0.0;
  }

  // Already funded: Initial amount meets or exceeds target
  if (p >= target) {
    return 0.0;
  }

  // Horizon is zero: Immediate horizon has 0 monthly contribution periods
  if (y === 0) {
    return 0.0;
  }

  const n = y * 12;

  // Zero interest: Linear shortfall divided by months
  if (rate === 0) {
    const requiredLinear = (target - p) / n;
    return Math.round(Math.max(0, requiredLinear) * 100) / 100;
  }

  const r = (rate / 100.0) / 12.0;
  const growthFactor = Math.pow(1 + r, n);
  const fvPrincipal = p * growthFactor;

  // If initial principal compounds alone to reach or exceed target
  if (fvPrincipal >= target) {
    return 0.0;
  }

  const remainingCorpusNeeded = target - fvPrincipal;
  const annuityFactor = (growthFactor - 1.0) / r;

  if (annuityFactor <= 0) {
    return 0.0;
  }

  const requiredMonthly = remainingCorpusNeeded / annuityFactor;
  return Math.round(Math.max(0, requiredMonthly) * 100) / 100;
};

/**
 * Evaluates whether a proposed monthly contribution and available monthly surplus
 * can achieve a target financial goal within the specified horizon.
 * 
 * Supports both named object inputs and positional arguments.
 * 
 * @param {object|number} inputOrTarget - Input object or targetAmount
 * @param {number} [years]
 * @param {number} [initialAmount]
 * @param {number} [monthlyContribution]
 * @param {number} [monthlySurplus]
 * @param {number} [annualRate]
 * @returns {object} Detailed feasibility evaluation object
 */
export const calculateGoalFeasibility = (
  inputOrTarget = {},
  argYears,
  argInitial,
  argContribution,
  argSurplus,
  argRate
) => {
  // Normalize parameters: accept object or positional arguments
  let rawTarget, rawYears, rawInitial, rawContrib, rawSurplus, rawRate;

  if (typeof inputOrTarget === 'object' && inputOrTarget !== null) {
    rawTarget = inputOrTarget.targetAmount ?? inputOrTarget.target_amount;
    rawYears = inputOrTarget.years ?? inputOrTarget.horizon_years;
    rawInitial = inputOrTarget.initialAmount ?? inputOrTarget.initial_amount;
    rawContrib = inputOrTarget.monthlyContribution ?? inputOrTarget.monthly_contribution;
    rawSurplus = inputOrTarget.monthlySurplus ?? inputOrTarget.monthly_surplus;
    rawRate = inputOrTarget.annualRate ?? inputOrTarget.annual_rate;
  } else {
    rawTarget = inputOrTarget;
    rawYears = argYears;
    rawInitial = argInitial;
    rawContrib = argContribution;
    rawSurplus = argSurplus;
    rawRate = argRate;
  }

  // 1. Validate explicitly supplied non-finite inputs
  // If explicitly provided as NaN, Infinity, -Infinity, null, or boolean -> INVALID_INPUT
  if (
    isExplicitlyNonFinite(rawTarget) ||
    isExplicitlyNonFinite(rawYears) ||
    isExplicitlyNonFinite(rawInitial) ||
    isExplicitlyNonFinite(rawContrib) ||
    isExplicitlyNonFinite(rawSurplus) ||
    isExplicitlyNonFinite(rawRate)
  ) {
    return {
      targetAmount: 0,
      years: 0,
      initialAmount: 0,
      monthlyContribution: 0,
      monthlySurplus: 0,
      requiredMonthlyContribution: 0,
      projectedFutureValue: 0,
      totalInvested: 0,
      monthlyShortfall: 0,
      immediateShortfall: 0,
      lumpSumShortfall: 0,
      surplusRemainingAfterContribution: 0,
      isAchievableWithContribution: false,
      isWithinAvailableSurplus: false,
      feasibilityStatus: GOAL_FEASIBILITY_STATUS.INVALID_INPUT,
      subStatus: 'INVALID_INPUT',
      message: 'Explicitly supplied non-finite or invalid input detected.'
    };
  }

  // Check required inputs: targetAmount and years must be defined
  if (rawTarget === undefined || rawYears === undefined) {
    return {
      targetAmount: 0,
      years: 0,
      initialAmount: 0,
      monthlyContribution: 0,
      monthlySurplus: 0,
      requiredMonthlyContribution: 0,
      projectedFutureValue: 0,
      totalInvested: 0,
      monthlyShortfall: 0,
      immediateShortfall: 0,
      lumpSumShortfall: 0,
      surplusRemainingAfterContribution: 0,
      isAchievableWithContribution: false,
      isWithinAvailableSurplus: false,
      feasibilityStatus: GOAL_FEASIBILITY_STATUS.INVALID_INPUT,
      subStatus: 'MISSING_REQUIRED_INPUT',
      message: 'Target amount and horizon (years) are required fields.'
    };
  }

  // Permitted defaults for optional inputs
  const target = Number(rawTarget);
  const y = Number(rawYears);
  const init = rawInitial !== undefined ? Number(rawInitial) : 0;
  const contrib = rawContrib !== undefined ? Number(rawContrib) : 0;
  const surplus = rawSurplus !== undefined ? Number(rawSurplus) : 0;
  const rate = rawRate !== undefined ? Number(rawRate) : ILLUSTRATIVE_RATES.CONSERVATIVE;

  // Validate bounds
  if (target <= 0 || y < 0 || init < 0 || contrib < 0 || rate < 0) {
    return {
      targetAmount: Math.max(0, target) || 0,
      years: Math.max(0, y) || 0,
      initialAmount: Math.max(0, init),
      monthlyContribution: Math.max(0, contrib),
      monthlySurplus: surplus,
      requiredMonthlyContribution: 0,
      projectedFutureValue: 0,
      totalInvested: 0,
      monthlyShortfall: 0,
      immediateShortfall: 0,
      lumpSumShortfall: 0,
      surplusRemainingAfterContribution: surplus,
      isAchievableWithContribution: false,
      isWithinAvailableSurplus: false,
      feasibilityStatus: GOAL_FEASIBILITY_STATUS.INVALID_INPUT,
      subStatus: 'OUT_OF_BOUNDS',
      message: 'Input values must be non-negative, and targetAmount must be strictly positive.'
    };
  }

  // 2. Check if target is already fully funded by initial capital (applies to both y === 0 and y > 0)
  if (init >= target) {
    const projectedFV = calculateGoalFutureValue(init, contrib, y, rate);
    const totalInvested = init + (contrib * y * 12);
    const surplusRemaining = Math.round((surplus - contrib) * 100) / 100;
    const isWithinSurplus = contrib <= surplus && surplus >= 0;

    return {
      targetAmount: target,
      years: y,
      initialAmount: init,
      monthlyContribution: contrib,
      monthlySurplus: surplus,
      requiredMonthlyContribution: 0,
      projectedFutureValue: projectedFV,
      totalInvested: Math.round(totalInvested * 100) / 100,
      monthlyShortfall: 0,
      immediateShortfall: 0,
      lumpSumShortfall: 0,
      surplusRemainingAfterContribution: surplusRemaining,
      isAchievableWithContribution: true,
      isWithinAvailableSurplus: isWithinSurplus,
      feasibilityStatus: GOAL_FEASIBILITY_STATUS.TARGET_ALREADY_FUNDED,
      subStatus: 'TARGET_ALREADY_FUNDED',
      message: 'Target corpus is already met or exceeded by existing initial capital.'
    };
  }

  // 3. ZERO-YEAR GOAL SEMANTICS (Immediate-funding scenario where init < target)
  if (y === 0) {
    const immediateShortfall = Math.round(Math.max(0, target - init) * 100) / 100;

    return {
      targetAmount: target,
      years: 0,
      initialAmount: init,
      monthlyContribution: contrib,
      monthlySurplus: surplus,
      requiredMonthlyContribution: 0, // Not represented as monthly contribution
      projectedFutureValue: init,     // No time to grow or contribute
      totalInvested: init,
      monthlyShortfall: 0,            // Not represented in monthlyShortfall
      immediateShortfall: immediateShortfall,
      lumpSumShortfall: immediateShortfall,
      surplusRemainingAfterContribution: surplus,
      isAchievableWithContribution: false, // Target is not already funded and there are 0 contribution periods
      isWithinAvailableSurplus: false,
      feasibilityStatus: GOAL_FEASIBILITY_STATUS.IMMEDIATE_FUNDING_REQUIRED,
      subStatus: 'IMMEDIATE_FUNDING_REQUIRED',
      message: `Immediate milestone (0-year horizon) requires an upfront lump-sum funding of ₹${immediateShortfall.toLocaleString('en-IN')}. Monthly recurring contributions cannot fund a zero-duration horizon.`
    };
  }

  // 4. NORMAL MULTI-PERIOD CALCULATION (y > 0)
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(target, y, rate, init);
  const projectedFutureValue = calculateGoalFutureValue(init, contrib, y, rate);
  const totalInvested = Math.round((init + (contrib * y * 12)) * 100) / 100;
  
  // A goal is achievable ONLY if projected future value reaches the target (within rounding margin of ₹0.50)
  const isAchievableWithContribution = projectedFutureValue >= (target - 0.50);

  // A proposed contribution is within available surplus ONLY if surplus is positive and covers the contribution
  const isWithinAvailableSurplus = (contrib <= surplus) && (surplus > 0);

  // Shortfall: How much more monthly contribution is needed to hit the target
  const monthlyShortfall = Math.max(0, Math.round((requiredMonthlyContribution - contrib) * 100) / 100);

  // Surplus buffer remaining after paying the proposed contribution
  const surplusRemainingAfterContribution = Math.round((surplus - contrib) * 100) / 100;

  // 5. Resolve Feasibility Status
  let feasibilityStatus;
  let subStatus;
  let message;

  if (isAchievableWithContribution && isWithinAvailableSurplus) {
    feasibilityStatus = GOAL_FEASIBILITY_STATUS.ACHIEVABLE;
    subStatus = 'ACHIEVABLE_WITH_SURPLUS';
    message = `Goal achievable! Proposed contribution of ₹${contrib.toLocaleString('en-IN')}/mo reaches target corpus of ₹${target.toLocaleString('en-IN')} and fits within available surplus.`;
  } else if (contrib > surplus || requiredMonthlyContribution > surplus || surplus <= 0) {
    feasibilityStatus = GOAL_FEASIBILITY_STATUS.SURPLUS_SHORTFALL;
    if (surplus <= 0) {
      subStatus = 'ZERO_OR_NEGATIVE_SURPLUS';
      message = 'Zero or negative monthly cashflow surplus. Balance monthly cashflow before committing to long-term monthly goals.';
    } else if (requiredMonthlyContribution > surplus) {
      subStatus = 'SURPLUS_LESS_THAN_REQUIRED';
      message = `Required monthly contribution (₹${requiredMonthlyContribution.toLocaleString('en-IN')}/mo) exceeds total available surplus (₹${surplus.toLocaleString('en-IN')}/mo). Extend horizon or adjust target.`;
    } else {
      subStatus = 'PROPOSED_EXCEEDS_SURPLUS';
      message = `Proposed contribution (₹${contrib.toLocaleString('en-IN')}/mo) exceeds available monthly surplus (₹${surplus.toLocaleString('en-IN')}/mo).`;
    }
  } else {
    // The contribution is affordable within surplus (contrib <= surplus),
    // BUT the contribution is too low to reach the target corpus (projectedFV < target)!
    // Per strict prompt rule: Do not claim a goal is achievable merely because proposed contribution is affordable.
    feasibilityStatus = GOAL_FEASIBILITY_STATUS.SURPLUS_SHORTFALL;
    subStatus = 'CONTRIBUTION_INSUFFICIENT';
    message = `Contribution of ₹${contrib.toLocaleString('en-IN')}/mo is affordable within surplus, but insufficient to reach ₹${target.toLocaleString('en-IN')}. Increase monthly contribution by ₹${monthlyShortfall.toLocaleString('en-IN')} to hit target.`;
  }

  return {
    targetAmount: target,
    years: y,
    initialAmount: init,
    monthlyContribution: contrib,
    monthlySurplus: surplus,
    requiredMonthlyContribution,
    projectedFutureValue,
    totalInvested,
    monthlyShortfall,
    immediateShortfall: 0,
    lumpSumShortfall: 0,
    surplusRemainingAfterContribution,
    isAchievableWithContribution,
    isWithinAvailableSurplus,
    feasibilityStatus,
    subStatus,
    message
  };
};

/**
 * Runs goal simulation across standard illustrative scenario benchmarks:
 * - 7% Conservative (Fixed-Income style benchmark)
 * - 10% Balanced (Moderate market-linked benchmark)
 * - 12% Illustrative Aggressive Growth Benchmark (or user-specified custom rate)
 * 
 * If customRate is explicitly supplied by the caller, it is labeled as a Custom Assumption.
 * If omitted, it defaults to 12% and is strictly labeled as "Illustrative Aggressive Growth (12% p.a.)".
 * 
 * @param {object} params - Input parameters matching calculateGoalFeasibility
 * @param {number|null} [customRate=null] - Optional user-defined rate assumption
 * @returns {Array<object>} Array of scenario evaluation results
 */
export const simulateGoalScenarios = (params, customRate = null) => {
  const isCustomProvided = customRate !== null && customRate !== undefined && !isNaN(Number(customRate));
  const thirdRate = isCustomProvided ? Number(customRate) : ILLUSTRATIVE_RATES.GROWTH;

  const scenarios = [
    {
      id: 'conservative_7',
      name: 'Fixed Income Style Benchmark',
      rate: ILLUSTRATIVE_RATES.CONSERVATIVE,
      description: 'Illustrative stable return assumption (7% p.a., e.g., PPF, Senior Citizen, Sovereign Bonds)'
    },
    {
      id: 'balanced_10',
      name: 'Moderate Balanced Benchmark',
      rate: ILLUSTRATIVE_RATES.BALANCED,
      description: 'Illustrative moderate growth assumption (10% p.a., e.g., NPS, Hybrid portfolios)'
    },
    {
      id: isCustomProvided ? 'custom_rate' : 'aggressive_12',
      name: isCustomProvided
        ? `Custom Assumption (${thirdRate}% p.a.)`
        : 'Illustrative Aggressive Growth (12% p.a.)',
      rate: thirdRate,
      description: isCustomProvided
        ? `User-specified illustrative growth assumption (${thirdRate}% p.a.)`
        : 'Illustrative equity-style growth assumption (12% p.a., e.g., diversified equity benchmarks)'
    }
  ];

  return scenarios.map(sc => ({
    ...sc,
    result: calculateGoalFeasibility({
      ...params,
      annualRate: sc.rate
    })
  }));
};
