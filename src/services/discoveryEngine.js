/**
 * Pure Discovery Engine Component
 * Takes in a user profile and an array of normalized financial products.
 * Calculates deterministic scores (0-100) based purely on properties.
 */

const goalNames = {
  emergency: 'Emergency Fund',
  retirement: 'Retirement',
  education: 'Child Education',
  home: 'Home',
  wealth: 'Wealth Building',
  short_term: 'Short-Term Goal'
};

const userHorizonToYears = (horizonStr) => {
  switch (horizonStr) {
    case '<1': return { min: 0, max: 1 };
    case '1-3': return { min: 1, max: 3 };
    case '3-5': return { min: 3, max: 5 };
    case '5-10': return { min: 5, max: 10 };
    case '10+': return { min: 10, max: 99 };
    default: return { min: 0, max: 99 };
  }
};

export const calculateCompatibility = (userProfile, products) => {
  const { goal, amount, horizon, risk } = userProfile;
  const initialAmount = Number(amount) || 0;
  const userYears = userHorizonToYears(horizon);
  
  const results = products.map(product => {
    let components = {
      goal: 0,
      horizon: 0,
      risk: 0,
      amount: 0
    };
    
    const reasons = [];
    let hardFail = false;
    
    // 1. Goal Alignment (+25)
    if (goal && product.goals.includes(goal)) {
      components.goal = 25;
      reasons.push(`Goal: Highly suited for ${goalNames[goal] || 'this objective'}.`);
    } else if (goal) {
      components.goal = 10;
    } else {
      components.goal = 15;
    }

    // 2. Horizon Alignment (+25)
    let horizonText = horizon === '<1' ? 'less than 1 year' : `${horizon} years`;
    const { strictLockInYears, maturityYears, idealMinYears } = product.horizon;
    
    if (strictLockInYears > userYears.max) {
      // Hard Lock-in Trap
      hardFail = true;
      reasons.push(`Disqualified: Strict lock-in of ${strictLockInYears} years exceeds your ${horizon} year horizon.`);
    } else if (product.marketLinked && idealMinYears > userYears.max) {
      // Market Volatility Trap (e.g. Stocks for <1 year)
      hardFail = true;
      reasons.push(`Disqualified: Too volatile or illiquid for short-term horizons.`);
    } else {
      // Scoring based on maturity and liquidity
      if ((maturityYears !== null && maturityYears <= userYears.max) || product.liquidityType === 'high') {
        components.horizon = 25;
        reasons.push(`Horizon: Perfectly matches your timeline of ${horizonText}.`);
      } else if (maturityYears !== null && maturityYears > userYears.max && product.liquidityType === 'partial' && strictLockInYears <= userYears.max) {
        components.horizon = 15;
        reasons.push(`Horizon: Matures in ${maturityYears} years, but allows partial withdrawals earlier.`);
      } else {
        components.horizon = 10;
      }
    }

    // 3. Risk Alignment (+25)
    if (product.riskToleranceAcceptance && product.riskToleranceAcceptance.includes(risk)) {
      components.risk = 25;
      reasons.push(`Risk: Aligns perfectly with your ${risk} risk tolerance.`);
    } else if (product.riskProfile === risk) {
      // Fallback if riskToleranceAcceptance missing
      components.risk = 25;
      reasons.push(`Risk: Aligns perfectly with your ${risk} risk tolerance.`);
    } else {
      if (risk === 'low' && product.riskProfile === 'high') {
        components.risk = 0;
        hardFail = true;
        reasons.push(`Disqualified: Risk level is too high for a conservative profile.`);
      } else if (risk === 'high' && product.riskProfile === 'low') {
        components.risk = 15; // Safe but not ideal for growth seeker
      } else {
        components.risk = 10;
      }
    }

    // 4. Amount Compatibility (+25)
    if (initialAmount > 0 && product.financialLimits) {
      const { minimumInvestment, maximumInvestment } = product.financialLimits;
      if (minimumInvestment && initialAmount < minimumInvestment) {
        components.amount = 0;
        hardFail = true;
        reasons.push(`Disqualified: Minimum required is ₹${minimumInvestment.toLocaleString()}.`);
      } else if (maximumInvestment && initialAmount > maximumInvestment) {
        components.amount = 15;
        reasons.push(`Amount: Deposits are capped at ₹${maximumInvestment.toLocaleString()} per year.`);
      } else {
        components.amount = 25;
      }
    } else {
      components.amount = 25;
    }

    const totalScore = hardFail ? 0 : components.goal + components.horizon + components.risk + components.amount;

    let matchLevel = '';
    if (totalScore >= 90) matchLevel = 'Excellent Match';
    else if (totalScore >= 75) matchLevel = 'Strong Match';
    else if (totalScore >= 50) matchLevel = 'Good Alternative';
    else matchLevel = 'Low Compatibility';
    
    if (hardFail) matchLevel = 'Not Recommended';

    if (reasons.length === 0 && !hardFail) {
      reasons.push('Provides an alternative option for diversification.');
    }

    return {
      title: product.name,
      isGov: product.category === 'Government Schemes',
      score: totalScore,
      components,
      matchLevel,
      reasons
    };
  });
  
  const viableOptions = results.filter(r => r.score >= 50);
  viableOptions.sort((a, b) => b.score - a.score);
  
  return viableOptions.slice(0, 4);
};
