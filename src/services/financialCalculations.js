/**
 * src/services/financialCalculations.js
 * 
 * Deterministic Financial Health & Smart Budgeting calculation utility.
 * Matches backend `app.services.financial_health_engine` formulas and thresholds exactly.
 * 
 * KEY PRINCIPLES:
 * 1. Deterministic & Zero-Cost: Instant client-side feedback without network latency or AI tokens.
 * 2. Surplus vs. Savings Integrity: Unallocated surplus is never falsely described as confirmed actual savings.
 * 3. Essential Expense Runway: Liquid savings coverage strictly represents essential living expenses excluding EMIs.
 * 4. Missing Protection Handling: Unconfirmed insurance is marked UNSPECIFIED, not confirmed absent.
 * 5. Educational Diagnostics: Neutral diagnostic feedback; zero product sales or prescriptive instructions.
 */

export const calculateFinancialHealth = (input = {}) => {
  // -------------------------------------------------------------------------
  // 1. Income Resolution
  // -------------------------------------------------------------------------
  let effectiveMonthlyIncome = 0.0;
  let incomeSourceType = 'zero_income';

  if (input.monthly_income !== undefined && input.monthly_income !== null && !isNaN(Number(input.monthly_income))) {
    effectiveMonthlyIncome = Math.max(0.0, Number(input.monthly_income));
    incomeSourceType = effectiveMonthlyIncome > 0.0 ? 'explicit_monthly' : 'zero_income';
  } else if (input.annual_income !== undefined && input.annual_income !== null && !isNaN(Number(input.annual_income))) {
    const annual = Math.max(0.0, Number(input.annual_income));
    effectiveMonthlyIncome = Math.round((annual / 12.0) * 100) / 100;
    incomeSourceType = effectiveMonthlyIncome > 0.0 ? 'derived_from_annual' : 'zero_income';
  } else {
    effectiveMonthlyIncome = 0.0;
    incomeSourceType = 'zero_income';
  }

  // -------------------------------------------------------------------------
  // 2. Outflow & Surplus Calculations
  // -------------------------------------------------------------------------
  const essential = Math.max(0.0, Number(input.essential_expenses) || 0.0);
  const lifestyle = Math.max(0.0, Number(input.lifestyle_expenses) || 0.0);
  const emi = Math.max(0.0, Number(input.monthly_emi) || 0.0);
  const liquid = Math.max(0.0, Number(input.liquid_savings) || 0.0);

  const totalOutflow = Math.round((essential + lifestyle + emi) * 100) / 100;
  const monthlySurplus = Math.round((effectiveMonthlyIncome - totalOutflow) * 100) / 100;
  const isSurplusPositive = monthlySurplus > 0.0;

  // -------------------------------------------------------------------------
  // 3. 50/30/20 Guidelines
  // -------------------------------------------------------------------------
  const needsGuideline50 = Math.round(effectiveMonthlyIncome * 0.50 * 100) / 100;
  const wantsGuideline30 = Math.round(effectiveMonthlyIncome * 0.30 * 100) / 100;
  const savingsGuideline20 = Math.round(effectiveMonthlyIncome * 0.20 * 100) / 100;

  const actualNeeds = Math.round((essential + emi) * 100) / 100;
  const actualWants = Math.round(lifestyle * 100) / 100;
  const actualSavings = monthlySurplus;

  let needsPct = 0.0;
  let wantsPct = 0.0;
  let savingsPct = 0.0;

  if (effectiveMonthlyIncome > 0.0) {
    needsPct = Math.round((actualNeeds / effectiveMonthlyIncome) * 1000) / 10;
    wantsPct = Math.round((actualWants / effectiveMonthlyIncome) * 1000) / 10;
    savingsPct = Math.round((actualSavings / effectiveMonthlyIncome) * 1000) / 10;
  }

  const budgetBreakdown = {
    needs_guideline_50: needsGuideline50,
    wants_guideline_30: wantsGuideline30,
    savings_guideline_20: savingsGuideline20,
    actual_needs: actualNeeds,
    actual_wants: actualWants,
    actual_savings: actualSavings,
    potential_savings: actualSavings,
    needs_percentage: needsPct,
    wants_percentage: wantsPct,
    savings_percentage: savingsPct,
    surplus_percentage: savingsPct
  };

  // -------------------------------------------------------------------------
  // 4. Pillar 1: Savings & Surplus Rate (0 - 25 pts)
  // -------------------------------------------------------------------------
  let savingsRatePct = 0.0;
  if (effectiveMonthlyIncome > 0.0) {
    savingsRatePct = Math.round(((monthlySurplus / effectiveMonthlyIncome) * 100) * 100) / 100;
  }

  let savingsScore = 0.0;
  if (savingsRatePct <= 0.0) {
    savingsScore = 0.0;
  } else if (savingsRatePct >= 20.0) {
    savingsScore = 25.0;
  } else {
    savingsScore = Math.round(((savingsRatePct / 20.0) * 25.0) * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // 5. Pillar 2: Emergency Cushion (Essential-Expense Coverage) (0 - 25 pts)
  // -------------------------------------------------------------------------
  const baselineExpenses = essential > 0.0 ? essential : totalOutflow;
  let runwayMonths = 0.0;

  if (baselineExpenses > 0.0) {
    runwayMonths = Math.round((liquid / baselineExpenses) * 100) / 100;
  } else {
    runwayMonths = liquid > 0.0 ? 6.0 : 0.0;
  }

  let emergencyScore = 0.0;
  if (runwayMonths <= 0.0) {
    emergencyScore = 0.0;
  } else if (runwayMonths >= 6.0) {
    emergencyScore = 25.0;
  } else {
    emergencyScore = Math.round(((runwayMonths / 6.0) * 25.0) * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // 6. Pillar 3: EMI Debt Burden (0 - 25 pts)
  // -------------------------------------------------------------------------
  let emiRatioPct = 0.0;
  if (effectiveMonthlyIncome > 0.0) {
    emiRatioPct = Math.round(((emi / effectiveMonthlyIncome) * 100) * 100) / 100;
  } else {
    emiRatioPct = emi > 0.0 ? 100.0 : 0.0;
  }

  let emiScore = 0.0;
  if (emiRatioPct <= 30.0) {
    emiScore = 25.0;
  } else if (emiRatioPct >= 50.0) {
    emiScore = 0.0;
  } else {
    emiScore = Math.round((25.0 * (1.0 - (emiRatioPct - 30.0) / 20.0)) * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // 7. Pillar 4: Insurance Protection (0 - 25 pts)
  // -------------------------------------------------------------------------
  const hasLife = input.has_life_insurance === true;
  const hasHealth = input.has_health_insurance === true;

  const lifeStatus = (
    input.has_life_insurance === true ? 'CONFIRMED_COVERED' :
    input.has_life_insurance === false ? 'CONFIRMED_UNINSURED' : 'UNSPECIFIED'
  );
  const healthStatus = (
    input.has_health_insurance === true ? 'CONFIRMED_COVERED' :
    input.has_health_insurance === false ? 'CONFIRMED_UNINSURED' : 'UNSPECIFIED'
  );

  const lifePts = hasLife ? 12.5 : 0.0;
  const healthPts = hasHealth ? 12.5 : 0.0;
  const protectionScore = Math.round((lifePts + healthPts) * 100) / 100;

  const isProtectionComplete = (
    input.has_life_insurance !== undefined && input.has_life_insurance !== null &&
    input.has_health_insurance !== undefined && input.has_health_insurance !== null
  );

  const pillars = {
    savings_score: savingsScore,
    savings_max: 25.0,
    savings_rate_pct: savingsRatePct,
    potential_savings_rate_pct: savingsRatePct,
    surplus_rate_pct: savingsRatePct,
    emergency_score: emergencyScore,
    emergency_max: 25.0,
    emergency_runway_months: runwayMonths,
    essential_expense_runway_months: runwayMonths,
    emi_score: emiScore,
    emi_max: 25.0,
    emi_ratio_pct: emiRatioPct,
    protection_score: protectionScore,
    protection_max: 25.0,
    life_insurance_status: lifeStatus,
    health_insurance_status: healthStatus,
    is_protection_complete: isProtectionComplete
  };

  // -------------------------------------------------------------------------
  // 8. Composite Health Score & Grade
  // -------------------------------------------------------------------------
  const totalScore = Math.round((savingsScore + emergencyScore + emiScore + protectionScore) * 10) / 10;
  let scoreGrade = 'CRITICAL';
  if (totalScore >= 80.0) {
    scoreGrade = 'EXCELLENT';
  } else if (totalScore >= 60.0) {
    scoreGrade = 'STABLE';
  } else if (totalScore >= 40.0) {
    scoreGrade = 'NEEDS_ATTENTION';
  }

  // -------------------------------------------------------------------------
  // 9. Data Completeness
  // -------------------------------------------------------------------------
  const unspecifiedFields = [];
  if (input.has_life_insurance === undefined || input.has_life_insurance === null) {
    unspecifiedFields.push('has_life_insurance');
  }
  if (input.has_health_insurance === undefined || input.has_health_insurance === null) {
    unspecifiedFields.push('has_health_insurance');
  }
  if (input.monthly_income === undefined && input.annual_income === undefined) {
    unspecifiedFields.push('income');
  }

  const isProvisional = unspecifiedFields.length > 0 || effectiveMonthlyIncome === 0.0;

  const dataCompleteness = {
    is_complete: unspecifiedFields.length === 0,
    is_provisional_score: isProvisional,
    unspecified_fields: unspecifiedFields,
    protection_data_complete: isProtectionComplete,
    message: !isProvisional
      ? 'Complete profile: all pillars evaluated against declared financial figures.'
      : `Provisional evaluation: ${unspecifiedFields.join(', ')} not explicitly confirmed.`
  };

  // -------------------------------------------------------------------------
  // 10. Educational Diagnostic Insights
  // -------------------------------------------------------------------------
  const insights = [];
  if (monthlySurplus < 0.0) {
    insights.push(
      `Monthly cashflow deficit: Outflows exceed income by ₹${Math.abs(monthlySurplus).toLocaleString('en-IN')}/mo. ` +
      'Prioritize rationalizing discretionary lifestyle spending to balance monthly cashflow.'
    );
  } else if (savingsScore === 25.0) {
    insights.push(
      `Healthy cashflow surplus: You have an unallocated monthly surplus of ${savingsRatePct.toFixed(1)}% of income ` +
      `(₹${monthlySurplus.toLocaleString('en-IN')}/mo) available for potential savings and investments.`
    );
  } else if (savingsScore < 15.0 && monthlySurplus > 0.0) {
    insights.push(
      `Potential savings capacity: Monthly surplus is ${savingsRatePct.toFixed(1)}% of income (₹${monthlySurplus.toLocaleString('en-IN')}/mo), ` +
      `below the 20% guideline target of ₹${savingsGuideline20.toLocaleString('en-IN')}/mo. ` +
      `Review lifestyle expenses (₹${lifestyle.toLocaleString('en-IN')}/mo) to build higher unallocated cashflow.`
    );
  }

  if (emergencyScore < 15.0) {
    const targetBuffer = baselineExpenses * 3.0;
    insights.push(
      `Limited essential-expense buffer: Current liquid reserves cover ${runwayMonths.toFixed(1)} months of essential living expenses ` +
      `(excluding debt obligations). Educational guideline recommends maintaining a 3-6 month essential-expense reserve of at least ₹${targetBuffer.toLocaleString('en-IN')}.`
    );
  } else if (emergencyScore === 25.0) {
    insights.push(
      `Robust essential-expense buffer: Liquid reserves provide ${runwayMonths.toFixed(1)} months of essential living expense coverage ` +
      '(excluding debt obligations).'
    );
  }

  if (emiRatioPct > 30.0) {
    insights.push(
      `Elevated debt burden: EMIs consume ${emiRatioPct.toFixed(1)}% of income (safe threshold is ≤ 30%). ` +
      'Educational best practice recommends avoiding new debt obligations and prioritizing debt reduction.'
    );
  }

  if (input.has_life_insurance === false) {
    insights.push(
      'Protection gap: No life insurance reported. Life coverage is an educational best practice to protect dependents against income loss.'
    );
  } else if (input.has_life_insurance === undefined || input.has_life_insurance === null) {
    insights.push('Life insurance status is unconfirmed; update status to receive verified protection scoring.');
  }

  if (input.has_health_insurance === false) {
    insights.push(
      'Healthcare protection gap: No health insurance reported. Health coverage is an educational best practice to protect accumulated capital against unexpected hospitalization expenses.'
    );
  } else if (input.has_health_insurance === undefined || input.has_health_insurance === null) {
    insights.push('Health insurance status is unconfirmed; update status to receive verified protection scoring.');
  }

  return {
    monthly_income: effectiveMonthlyIncome,
    income_source_type: incomeSourceType,
    total_outflow: totalOutflow,
    monthly_surplus: monthlySurplus,
    is_surplus_positive: isSurplusPositive,
    budget_50_30_20: budgetBreakdown,
    pillars: pillars,
    total_health_score: totalScore,
    score_grade: scoreGrade,
    data_completeness: dataCompleteness,
    insights: insights,
    disclaimer: 'These calculations are transparent educational indicators designed to guide financial discipline and planning; they do not constitute regulated financial, legal, or investment advice.',
    calculated_at: new Date().toISOString()
  };
};
