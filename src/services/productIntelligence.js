import { MOCK_SCHEMES } from '../data/mockSchemes';

/**
 * Product Intelligence Layer
 * This service acts as the central source of truth for financial characteristics of both
 * private market categories and government schemes, normalized into a unified structure.
 */

const GENERAL_CATEGORIES = [
  {
    id: 'mf_equity',
    name: 'Mutual Funds (Equity/Hybrid)',
    category: 'Market Investments',
    riskProfile: 'moderate', // For broad compatibility, treated as moderate-high by engine
    riskToleranceAcceptance: ['moderate', 'high'],
    goals: ['wealth', 'retirement', 'education', 'home'],
    horizon: {
      idealMinYears: 3,
      maturityYears: null, // Perpetual
      strictLockInYears: 0
    },
    liquidityType: 'high',
    financialLimits: {
      minimumInvestment: 500,
      maximumInvestment: null
    },
    marketLinked: true,
    sourceType: 'educational',
    dataStatus: 'illustrative'
  },
  {
    id: 'etf_index',
    name: 'ETFs',
    category: 'Market Investments',
    riskProfile: 'moderate',
    riskToleranceAcceptance: ['moderate', 'high'],
    goals: ['wealth', 'retirement', 'education'],
    horizon: {
      idealMinYears: 3,
      maturityYears: null,
      strictLockInYears: 0
    },
    liquidityType: 'high',
    financialLimits: {
      minimumInvestment: 500, // typically cost of one unit
      maximumInvestment: null
    },
    marketLinked: true,
    sourceType: 'educational',
    dataStatus: 'illustrative'
  },
  {
    id: 'stocks_direct',
    name: 'Stocks',
    category: 'Market Investments',
    riskProfile: 'high',
    riskToleranceAcceptance: ['high'],
    goals: ['wealth', 'retirement'],
    horizon: {
      idealMinYears: 5,
      maturityYears: null,
      strictLockInYears: 0
    },
    liquidityType: 'high',
    financialLimits: {
      minimumInvestment: 0,
      maximumInvestment: null
    },
    marketLinked: true,
    sourceType: 'educational',
    dataStatus: 'illustrative'
  },
  {
    id: 'fixed_income',
    name: 'Fixed Income',
    category: 'Market Investments',
    riskProfile: 'low',
    riskToleranceAcceptance: ['low', 'moderate'], // Generally fine for moderate too
    goals: ['emergency', 'short_term', 'home'],
    horizon: {
      idealMinYears: 1,
      maturityYears: 5, // Illustrative average
      strictLockInYears: 1
    },
    liquidityType: 'partial',
    financialLimits: {
      minimumInvestment: 1000,
      maximumInvestment: null
    },
    marketLinked: false,
    sourceType: 'educational',
    dataStatus: 'illustrative'
  },
  {
    id: 'liquid_funds',
    name: 'Liquid Mutual Funds',
    category: 'Market Investments',
    riskProfile: 'low',
    riskToleranceAcceptance: ['low', 'moderate'],
    goals: ['emergency', 'short_term'],
    horizon: {
      idealMinYears: 0,
      maturityYears: null,
      strictLockInYears: 0
    },
    liquidityType: 'high',
    financialLimits: {
      minimumInvestment: 500,
      maximumInvestment: null
    },
    marketLinked: true,
    sourceType: 'educational',
    dataStatus: 'illustrative'
  }
];

const parseGovSchemesToNormalized = () => {
  const savingsSchemes = MOCK_SCHEMES.filter(s => 
    s.category === 'Savings' || 
    s.category === 'Pension' ||
    s.category === 'Women & Girls' ||
    s.category === 'Financial Inclusion'
  );

  return savingsSchemes.map(s => {
    // 1. Normalize Goals
    const normGoals = (s.goals || []).map(g => g.toLowerCase());
    const mappedGoals = [];
    if (normGoals.some(g => g.includes('wealth') || g.includes('savings'))) mappedGoals.push('wealth');
    if (normGoals.some(g => g.includes('retirement') || g.includes('pension'))) mappedGoals.push('retirement');
    if (normGoals.some(g => g.includes('education'))) mappedGoals.push('education');
    if (normGoals.some(g => g.includes('home'))) mappedGoals.push('home');
    if (normGoals.some(g => g.includes('emergency') || g.includes('inclusion'))) mappedGoals.push('emergency', 'short_term');

    // 2. Base values
    let maturity = s.financial?.lock_in_years || 0;
    let strictLockIn = maturity; // Default to maturity if no specific data exists
    let liquidityType = 'none';

    // 3. Flagship Knowledge Overrides
    if (s.id === 'ppf') {
      maturity = 15;
      strictLockIn = 6; // Partial withdrawal from 7th year
      liquidityType = 'partial';
    } else if (s.id === 'scss') {
      maturity = 5;
      strictLockIn = 1; // Premature closure after 1 yr with penalty
      liquidityType = 'partial';
    } else if (s.id === 'ssy') {
      maturity = 21;
      strictLockIn = 18; // Partial withdrawal after girl turns 18
      liquidityType = 'partial';
    } else if (maturity === 0 && s.liquidity?.toLowerCase().includes('high')) {
      strictLockIn = 0;
      liquidityType = 'high';
    }

    return {
      id: s.id,
      name: s.name,
      category: 'Government Schemes',
      riskProfile: 'low',
      riskToleranceAcceptance: ['low', 'moderate', 'high'], // Everyone can invest in low risk
      goals: mappedGoals,
      horizon: {
        idealMinYears: strictLockIn, // At least hold until it unlocks
        maturityYears: maturity,
        strictLockInYears: strictLockIn
      },
      liquidityType,
      financialLimits: {
        minimumInvestment: s.financial?.minimum_contribution || 0,
        maximumInvestment: s.financial?.maximum_contribution || null
      },
      marketLinked: false,
      sourceType: 'official',
      dataStatus: 'verified'
    };
  });
};

/**
 * Returns a complete array of normalized financial products & categories.
 */
export const getNormalizedProducts = () => {
  return [
    ...GENERAL_CATEGORIES,
    ...parseGovSchemesToNormalized()
  ];
};
