import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  Info, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Wallet,
  PiggyBank,
  Percent,
  HelpCircle,
  Save
} from 'lucide-react';
import { 
  calculateGoalFeasibility, 
  GOAL_FEASIBILITY_STATUS, 
  ILLUSTRATIVE_RATES 
} from '../../services/goalCalculations';
import { calculateFinancialHealth } from '../../services/financialCalculations';

export const GoalFeasibilitySimulator = ({ 
  goalName = 'Financial Milestone',
  goalCategory = null,
  initialTarget = 1000000,
  initialYears = 10,
  initialDeposit = 50000,
  onSaveGoal = null,
  overrideFinancialHealth = null
}) => {
  // 1. Read available monthly surplus and emergency cushion from sessionStorage (or live override)
  // If data is missing, malformed, or does not contain a declared income, do NOT substitute a positive default.
  const financialHealthContext = useMemo(() => {
    // If live calculation result is supplied by parent (e.g. FinancialHealthPage)
    if (overrideFinancialHealth && typeof overrideFinancialHealth === 'object') {
      const isSurplusNumeric = typeof overrideFinancialHealth?.monthly_surplus === 'number' && !isNaN(overrideFinancialHealth.monthly_surplus);
      if (isSurplusNumeric) {
        const runway = overrideFinancialHealth.pillars?.emergency_runway_months;
        const isRunwayValid = typeof runway === 'number' && !isNaN(runway) && isFinite(runway);

        return {
          hasData: true,
          monthlySurplus: overrideFinancialHealth.monthly_surplus,
          isSurplusPositive: overrideFinancialHealth.is_surplus_positive ?? (overrideFinancialHealth.monthly_surplus > 0),
          emergencyRunwayMonths: isRunwayValid ? runway : null,
          statusLabel: null
        };
      }
    }

    try {
      const raw = typeof window !== 'undefined' && window.sessionStorage 
        ? sessionStorage.getItem('sanchay_financial_health') 
        : null;

      if (!raw) {
        return {
          hasData: false,
          monthlySurplus: null,
          isSurplusPositive: false,
          emergencyRunwayMonths: null,
          statusLabel: 'Monthly surplus not available'
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          hasData: false,
          monthlySurplus: null,
          isSurplusPositive: false,
          emergencyRunwayMonths: null,
          statusLabel: 'Monthly surplus not available'
        };
      }

      // Check if user has explicitly declared income
      const hasDeclaredIncome = (
        (parsed.monthly_income !== undefined && parsed.monthly_income !== null && parsed.monthly_income !== '' && !isNaN(Number(parsed.monthly_income))) ||
        (parsed.annual_income !== undefined && parsed.annual_income !== null && parsed.annual_income !== '' && !isNaN(Number(parsed.annual_income)))
      );

      if (!hasDeclaredIncome) {
        return {
          hasData: false,
          monthlySurplus: null,
          isSurplusPositive: false,
          emergencyRunwayMonths: null,
          statusLabel: 'Monthly surplus not available'
        };
      }

      const healthRes = calculateFinancialHealth(parsed);
      const isSurplusNumeric = typeof healthRes?.monthly_surplus === 'number' && !isNaN(healthRes.monthly_surplus);

      if (!isSurplusNumeric) {
        return {
          hasData: false,
          monthlySurplus: null,
          isSurplusPositive: false,
          emergencyRunwayMonths: null,
          statusLabel: 'Monthly surplus not available'
        };
      }

      // Validate emergency runway: unknown is not zero and must not trigger a false liquidity warning.
      // Only consider runway valid if liquid savings was explicitly declared by the user.
      const hasDeclaredLiquidSavings = (
        parsed.liquid_savings !== undefined &&
        parsed.liquid_savings !== null &&
        parsed.liquid_savings !== '' &&
        !isNaN(Number(parsed.liquid_savings))
      );
      const runway = healthRes.pillars?.emergency_runway_months;
      const isRunwayValid = hasDeclaredLiquidSavings && typeof runway === 'number' && !isNaN(runway) && isFinite(runway);

      return {
        hasData: true,
        monthlySurplus: healthRes.monthly_surplus,
        isSurplusPositive: healthRes.is_surplus_positive ?? (healthRes.monthly_surplus > 0),
        emergencyRunwayMonths: isRunwayValid ? runway : null,
        statusLabel: null
      };
    } catch (e) {
      console.warn('Could not read financial health context:', e);
      return {
        hasData: false,
        monthlySurplus: null,
        isSurplusPositive: false,
        emergencyRunwayMonths: null,
        statusLabel: 'Monthly surplus not available'
      };
    }
  }, [overrideFinancialHealth]);

  // 1b. Safely read separate saved goal simulation plan (sanchay_goal_plan)
  const savedGoalPlan = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' && window.sessionStorage 
        ? sessionStorage.getItem('sanchay_goal_plan') 
        : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Could not parse sanchay_goal_plan:', e);
    }
    return null;
  }, []);

  // 2. Goal Simulation Inputs
  const [targetAmount, setTargetAmount] = useState(() => {
    if (savedGoalPlan?.targetAmount !== undefined && !isNaN(Number(savedGoalPlan.targetAmount))) {
      if (!goalCategory || savedGoalPlan.goalCategory === goalCategory) {
        return Number(savedGoalPlan.targetAmount);
      }
    }
    return initialTarget;
  });

  const [years, setYears] = useState(() => {
    if (savedGoalPlan?.years !== undefined && !isNaN(Number(savedGoalPlan.years))) {
      if (!goalCategory || savedGoalPlan.goalCategory === goalCategory) {
        return Number(savedGoalPlan.years);
      }
    }
    return initialYears;
  });

  const [initialAmount, setInitialAmount] = useState(() => {
    if (savedGoalPlan?.initialAmount !== undefined && !isNaN(Number(savedGoalPlan.initialAmount))) {
      if (!goalCategory || savedGoalPlan.goalCategory === goalCategory) {
        return Number(savedGoalPlan.initialAmount);
      }
    }
    return initialDeposit;
  });

  const [rateMode, setRateMode] = useState(() => {
    if (savedGoalPlan?.rateMode && ['7', '10', '12', 'custom'].includes(savedGoalPlan.rateMode)) {
      return savedGoalPlan.rateMode;
    }
    return '7';
  });

  const [customRate, setCustomRate] = useState(() => {
    if (savedGoalPlan?.customRate !== undefined && !isNaN(Number(savedGoalPlan.customRate))) {
      return Number(savedGoalPlan.customRate);
    }
    return 14;
  });
  
  // Proposed monthly contribution:
  // If surplus is unknown or missing, do NOT substitute a positive default. Default to 0.
  const [proposedContribution, setProposedContribution] = useState(() => {
    if (savedGoalPlan?.proposedContribution !== undefined && !isNaN(Number(savedGoalPlan.proposedContribution))) {
      if (!goalCategory || savedGoalPlan.goalCategory === goalCategory) {
        return Number(savedGoalPlan.proposedContribution);
      }
    }
    if (financialHealthContext.hasData && typeof financialHealthContext.monthlySurplus === 'number' && financialHealthContext.monthlySurplus > 0) {
      return Math.round(financialHealthContext.monthlySurplus * 0.5);
    }
    return 0;
  });

  const [planSavedNotice, setPlanSavedNotice] = useState(false);

  // Update inputs if goalCategory prop changes (when user toggles categories)
  React.useEffect(() => {
    if (goalCategory) {
      if (!savedGoalPlan || savedGoalPlan.goalCategory !== goalCategory) {
        setTargetAmount(initialTarget);
        setYears(initialYears);
        setInitialAmount(initialDeposit);
      }
    }
  }, [goalCategory, initialTarget, initialYears, initialDeposit, savedGoalPlan]);

  const activeRate = useMemo(() => {
    if (rateMode === '7') return ILLUSTRATIVE_RATES.CONSERVATIVE;
    if (rateMode === '10') return ILLUSTRATIVE_RATES.BALANCED;
    if (rateMode === '12') return ILLUSTRATIVE_RATES.GROWTH;
    return Number(customRate) || 12;
  }, [rateMode, customRate]);

  // 3. Compute Goal Feasibility
  // When surplus is unknown (hasData: false), pass monthlySurplus: 0 to engine so it does not falsely claim affordability.
  const feasibility = useMemo(() => {
    return calculateGoalFeasibility({
      targetAmount,
      years,
      initialAmount,
      monthlyContribution: proposedContribution,
      monthlySurplus: financialHealthContext.hasData ? financialHealthContext.monthlySurplus : 0,
      annualRate: activeRate
    });
  }, [targetAmount, years, initialAmount, proposedContribution, financialHealthContext, activeRate]);

  // 4. Compute Neutral Multi-Scenario Projections
  const scenarios = useMemo(() => {
    if (feasibility.feasibilityStatus === GOAL_FEASIBILITY_STATUS.INVALID_INPUT) {
      return [];
    }
    const isCustom = rateMode === 'custom';
    const thirdRate = isCustom ? (Number(customRate) || 12) : 12;

    const scenarioConfigs = [
      {
        id: 'lower_7',
        name: '7% — Lower illustrative scenario',
        rate: 7,
        description: '7% p.a. illustrative assumption'
      },
      {
        id: 'moderate_10',
        name: '10% — Moderate illustrative scenario',
        rate: 10,
        description: '10% p.a. illustrative assumption'
      },
      {
        id: isCustom ? 'custom' : 'higher_12',
        name: isCustom 
          ? `Custom — User-defined assumption (${thirdRate}% p.a.)`
          : '12% — Higher illustrative scenario',
        rate: thirdRate,
        description: isCustom 
          ? `${thirdRate}% p.a. user-defined assumption`
          : '12% p.a. illustrative assumption'
      }
    ];

    return scenarioConfigs.map(sc => ({
      ...sc,
      result: calculateGoalFeasibility({
        targetAmount,
        years,
        initialAmount,
        monthlyContribution: proposedContribution,
        monthlySurplus: financialHealthContext.hasData ? financialHealthContext.monthlySurplus : 0,
        annualRate: sc.rate
      })
    }));
  }, [targetAmount, years, initialAmount, proposedContribution, financialHealthContext, rateMode, customRate, feasibility.feasibilityStatus]);

  const formatINR = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // 5. Status Presentation Configuration with Unverified Surplus Handling
  const statusConfig = useMemo(() => {
    // If surplus is unknown, never claim verified affordability
    if (!financialHealthContext.hasData) {
      if (feasibility.feasibilityStatus === GOAL_FEASIBILITY_STATUS.TARGET_ALREADY_FUNDED) {
        return {
          label: 'Target Already Funded',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
          borderClass: 'border-teal-200',
          icon: Award,
          headline: 'Milestone Fully Covered by Initial Capital',
          message: feasibility.message
        };
      }
      if (feasibility.feasibilityStatus === GOAL_FEASIBILITY_STATUS.IMMEDIATE_FUNDING_REQUIRED) {
        return {
          label: 'Immediate Funding Required',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          borderClass: 'border-blue-200',
          icon: Clock,
          headline: 'Zero-Year Horizon Requires Upfront Capital',
          message: feasibility.message
        };
      }
      if (feasibility.feasibilityStatus === GOAL_FEASIBILITY_STATUS.INVALID_INPUT) {
        return {
          label: 'Invalid Inputs',
          badgeClass: 'bg-slate-100 text-[#66736C] border-slate-200',
          borderClass: 'border-slate-200',
          icon: Info,
          headline: 'Enter Valid Target Amount and Horizon',
          message: feasibility.message
        };
      }
      if (feasibility.isAchievableWithContribution) {
        return {
          label: 'Target Achievable (Affordability Unverified)',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
          borderClass: 'border-sky-200',
          icon: HelpCircle,
          headline: 'Target Met • Monthly Surplus Unverified',
          message: `A proposed contribution of ₹${(Number(proposedContribution) || 0).toLocaleString('en-IN')}/mo accumulates your target of ₹${(Number(targetAmount) || 0).toLocaleString('en-IN')}, but cashflow affordability is unverified because your monthly surplus is undeclared. Visit Smart Budget to confirm affordability.`
        };
      }
      return {
        label: 'Contribution Insufficient (Affordability Unverified)',
        badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
        borderClass: 'border-[#FDE68A]',
        icon: AlertCircle,
        headline: 'Proposed Contribution Below Required Rate',
        message: `Proposed contribution of ₹${(Number(proposedContribution) || 0).toLocaleString('en-IN')}/mo falls short of your target by ₹${feasibility.monthlyShortfall.toLocaleString('en-IN')}/mo. Monthly surplus is undeclared.`
      };
    }

    // Normal status handling when financial health data is known
    switch (feasibility.feasibilityStatus) {
      case GOAL_FEASIBILITY_STATUS.ACHIEVABLE:
        return {
          label: 'Goal Achievable with Contribution',
          badgeClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
          borderClass: 'border-[#A7F3D0]',
          icon: CheckCircle2,
          headline: 'Target Fully Supported by Monthly Surplus',
          message: feasibility.message
        };
      case GOAL_FEASIBILITY_STATUS.SURPLUS_SHORTFALL:
        if (feasibility.subStatus === 'CONTRIBUTION_INSUFFICIENT') {
          return {
            label: 'Contribution Insufficient',
            badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
            borderClass: 'border-[#FDE68A]',
            icon: AlertCircle,
            headline: 'Contribution is Affordable, but Below Required Rate',
            message: feasibility.message
          };
        }
        return {
          label: 'Surplus Shortfall',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          borderClass: 'border-rose-200',
          icon: AlertTriangle,
          headline: 'Goal Exceeds Available Monthly Surplus',
          message: feasibility.message
        };
      case GOAL_FEASIBILITY_STATUS.TARGET_ALREADY_FUNDED:
        return {
          label: 'Target Already Funded',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
          borderClass: 'border-teal-200',
          icon: Award,
          headline: 'Milestone Fully Covered by Initial Capital',
          message: feasibility.message
        };
      case GOAL_FEASIBILITY_STATUS.IMMEDIATE_FUNDING_REQUIRED:
        return {
          label: 'Immediate Funding Required',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          borderClass: 'border-blue-200',
          icon: Clock,
          headline: 'Zero-Year Horizon Requires Upfront Capital',
          message: feasibility.message
        };
      case GOAL_FEASIBILITY_STATUS.INVALID_INPUT:
      default:
        return {
          label: 'Invalid Inputs',
          badgeClass: 'bg-slate-100 text-[#66736C] border-slate-200',
          borderClass: 'border-slate-200',
          icon: Info,
          headline: 'Enter Valid Target Amount and Horizon',
          message: feasibility.message
        };
    }
  }, [financialHealthContext.hasData, feasibility, proposedContribution, targetAmount]);

  const handleSavePlan = () => {
    try {
      const planData = {
        goalCategory,
        goalName,
        targetAmount: Number(targetAmount) || 0,
        years: Number(years) || 0,
        initialAmount: Number(initialAmount) || 0,
        proposedContribution: Number(proposedContribution) || 0,
        rateMode,
        customRate: Number(customRate) || 12,
        requiredMonthlyContribution: feasibility.requiredMonthlyContribution,
        projectedFutureValue: feasibility.projectedFutureValue,
        monthlyShortfall: feasibility.monthlyShortfall,
        surplusRemainingAfterContribution: feasibility.surplusRemainingAfterContribution,
        feasibilityStatus: feasibility.feasibilityStatus,
        subStatus: feasibility.subStatus,
        updatedAt: new Date().toISOString()
      };
      sessionStorage.setItem('sanchay_goal_plan', JSON.stringify(planData));
      setPlanSavedNotice(true);
      if (typeof onSaveGoal === 'function') {
        onSaveGoal(planData);
      }
      setTimeout(() => setPlanSavedNotice(false), 2500);
    } catch (e) {
      console.warn('Could not save sanchay_goal_plan:', e);
    }
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white border border-[#E7ECE8] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#176B50]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7ECE8]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-xs font-mono font-medium mb-2">
            <Target className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Goal Feasibility & Surplus Simulator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#202B26] tracking-tight font-serif">
            {goalName} Planning
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-1">
            Simulate your target milestone against your verified unallocated monthly cashflow surplus.
          </p>
        </div>

        {/* Actions & Status Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSavePlan}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
              planSavedNotice
                ? 'bg-[#176B50] border-[#176B50] text-white shadow-sm'
                : 'bg-[#E7F1EB] border-[#D5E4DC] text-[#176B50] hover:bg-[#D5E4DC] hover:text-[#125540]'
            }`}
          >
            {planSavedNotice ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Plan Saved to Session</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Simulation Plan</span>
              </>
            )}
          </button>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Emergency Liquidity Awareness Callout */}
      {/* Only shown when emergency runway is known/verified AND strictly below 3 months */}
      {financialHealthContext.hasData && financialHealthContext.emergencyRunwayMonths !== null && financialHealthContext.emergencyRunwayMonths < 3 && (
        <div className="mt-6 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3 text-xs text-[#92400E]">
          <ShieldAlert className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#92400E] font-mono uppercase tracking-wider block mb-0.5">
              Liquidity Awareness: Under-buffered Reserve ({financialHealthContext.emergencyRunwayMonths.toFixed(1)} mo)
            </strong>
            <span className="text-[#92400E]/90">
              Your liquid emergency buffer covers less than 3 months of essential living expenses. Financial hygiene principles suggest establishing a 3–6 month essential liquid buffer before committing surplus aggressively into long-term lock-in goals.
            </span>
          </div>
        </div>
      )}

      {/* Grid: Inputs (Left) and Feasibility Results (Right) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Simulation Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Goal Parameters</span>
          </div>

          {/* Target Amount */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider block mb-1.5">
              Target Corpus Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="10000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-base font-semibold placeholder:text-slate-400 shadow-sm"
                placeholder="1000000"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500000, 1000000, 2500000, 5000000].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetAmount(preset)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer ${
                    Number(targetAmount) === preset 
                      ? 'bg-[#176B50] border-[#176B50] text-white font-bold' 
                      : 'bg-white border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26]'
                  }`}
                >
                  {preset >= 10000000 ? `${preset / 10000000}Cr` : `${preset / 100000}L`}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon & Initial Savings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#FAFAFC] p-3.5 rounded-2xl border border-[#E7ECE8]">
              <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider block mb-1">
                Time Horizon (Years)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={years}
                onChange={e => setYears(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-1.5 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm font-semibold placeholder:text-slate-400 shadow-sm"
                placeholder="10"
              />
              <span className="text-[10px] text-[#66736C] mt-1 block">0 = Immediate milestone</span>
            </div>

            <div className="bg-[#FAFAFC] p-3.5 rounded-2xl border border-[#E7ECE8]">
              <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider block mb-1">
                Initial Capital (₹)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={initialAmount}
                onChange={e => setInitialAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-1.5 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm font-semibold placeholder:text-slate-400 shadow-sm"
                placeholder="50000"
              />
              <span className="text-[10px] text-[#66736C] mt-1 block">Starting lump-sum</span>
            </div>
          </div>

          {/* Illustrative Return Assumption (Neutral Scenarios) */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#176B50]" />
                <span>Illustrative Rate Assumption</span>
              </label>
              <span className="text-[10px] font-mono text-[#176B50] font-semibold">
                Active: {activeRate}% p.a.
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setRateMode('7')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                  rateMode === '7'
                    ? 'bg-[#176B50] border-[#176B50] text-white font-bold shadow-sm'
                    : 'bg-white border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26]'
                }`}
                title="7% — Lower illustrative scenario"
              >
                7% (Lower)
              </button>
              <button
                type="button"
                onClick={() => setRateMode('10')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                  rateMode === '10'
                    ? 'bg-teal-700 border-teal-700 text-white font-bold shadow-sm'
                    : 'bg-white border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26]'
                }`}
                title="10% — Moderate illustrative scenario"
              >
                10% (Moderate)
              </button>
              <button
                type="button"
                onClick={() => setRateMode('12')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                  rateMode === '12'
                    ? 'bg-sky-700 border-sky-700 text-white font-bold shadow-sm'
                    : 'bg-white border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26]'
                }`}
                title="12% — Higher illustrative scenario"
              >
                12% (Higher)
              </button>
              <button
                type="button"
                onClick={() => setRateMode('custom')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                  rateMode === 'custom'
                    ? 'bg-amber-600 border-amber-600 text-white font-bold shadow-sm'
                    : 'bg-white border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26]'
                }`}
                title="Custom — User-defined assumption"
              >
                Custom
              </button>
            </div>

            {rateMode === 'custom' && (
              <div className="mt-3 pt-3 border-t border-[#E7ECE8] flex items-center gap-3">
                <span className="text-xs text-[#66736C] font-mono">Custom Annual Rate:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={customRate}
                  onChange={e => setCustomRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-24 px-3 py-1 bg-white text-[#202B26] rounded-lg border border-amber-400 font-mono text-xs focus:outline-none shadow-sm"
                  placeholder="14"
                />
                <span className="text-xs text-[#66736C] font-mono">% p.a.</span>
              </div>
            )}
          </div>

          {/* Proposed Monthly Contribution & Surplus Context */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#176B50]" />
                <span>Proposed Monthly Investment</span>
              </label>
              
              {/* Financial Surplus Context Header */}
              {financialHealthContext.hasData ? (
                <span className="text-[11px] font-mono text-[#66736C]">
                  Surplus: <strong className="text-[#202B26]">{formatINR(financialHealthContext.monthlySurplus)}/mo</strong>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[#66736C] italic">
                  Monthly surplus not available
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                value={proposedContribution}
                onChange={e => setProposedContribution(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-base font-semibold placeholder:text-slate-400 shadow-sm"
                placeholder="5000"
              />
            </div>

            {/* Quick Surplus Allocation Buttons (Shown ONLY when surplus is verified and positive) */}
            {financialHealthContext.hasData && financialHealthContext.monthlySurplus > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#E7ECE8] text-[10px] font-mono text-[#66736C]">
                <span>Allocate Surplus:</span>
                {[0.25, 0.50, 0.75, 1.0].map(pct => {
                  const val = Math.round(financialHealthContext.monthlySurplus * pct);
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setProposedContribution(val)}
                      className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        Number(proposedContribution) === val
                          ? 'bg-[#176B50] border-[#176B50] text-white font-bold'
                          : 'bg-white border-[#E7ECE8] hover:border-[#D5E4DC] text-[#66736C] hover:text-[#202B26]'
                      }`}
                    >
                      {pct * 100}% ({formatINR(val)})
                    </button>
                  );
                })}

                {feasibility.requiredMonthlyContribution > 0 && feasibility.requiredMonthlyContribution <= financialHealthContext.monthlySurplus && (
                  <button
                    type="button"
                    onClick={() => setProposedContribution(Math.ceil(feasibility.requiredMonthlyContribution))}
                    className="px-2 py-0.5 rounded-lg border border-[#D5E4DC] bg-[#E7F1EB] text-[#176B50] font-bold hover:bg-[#D5E4DC] transition-colors ml-auto cursor-pointer"
                  >
                    Set to Required ({formatINR(feasibility.requiredMonthlyContribution)})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feasibility Results */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Feasibility & Surplus Evaluation</span>
          </div>

          {/* Primary Feasibility Output Card */}
          <div className={`p-6 rounded-2xl bg-[#FAFAFC] border ${statusConfig.borderClass} space-y-4`}>
            
            {/* Status Title & Message */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#66736C] mb-1">
                Evaluation Verdict
              </div>
              <h3 className="text-lg font-bold text-[#202B26] flex items-center gap-2">
                <StatusIcon className="w-5 h-5 shrink-0" />
                <span>{statusConfig.headline}</span>
              </h3>
              <p className="text-xs text-[#66736C] mt-1.5 leading-relaxed">
                {statusConfig.message}
              </p>
            </div>

            {/* Zero-Year Immediate Shortfall Callout */}
            {feasibility.feasibilityStatus === GOAL_FEASIBILITY_STATUS.IMMEDIATE_FUNDING_REQUIRED && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold">Immediate Lump-Sum Shortfall</div>
                <div className="text-2xl font-extrabold font-mono text-[#202B26] mt-0.5">
                  {formatINR(feasibility.immediateShortfall)}
                </div>
                <div className="text-[11px] text-blue-800/80 mt-1">
                  Required upfront to bridge the gap between initial capital ({formatINR(feasibility.initialAmount)}) and target ({formatINR(feasibility.targetAmount)}).
                </div>
              </div>
            )}

            {/* Multi-Period Metrics Grid (When years > 0) */}
            {feasibility.feasibilityStatus !== GOAL_FEASIBILITY_STATUS.INVALID_INPUT && feasibility.feasibilityStatus !== GOAL_FEASIBILITY_STATUS.IMMEDIATE_FUNDING_REQUIRED && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E7ECE8]">
                <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">Required Monthly</span>
                  <span className="text-base font-extrabold font-mono text-[#202B26] mt-0.5 block">
                    {formatINR(feasibility.requiredMonthlyContribution)}/mo
                  </span>
                  <span className="text-[10px] text-[#66736C] font-mono">Needed to hit target</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">Proposed Monthly</span>
                  <span className={`text-base font-extrabold font-mono mt-0.5 block ${
                    feasibility.monthlyContribution >= feasibility.requiredMonthlyContribution ? 'text-[#176B50]' : 'text-amber-700'
                  }`}>
                    {formatINR(feasibility.monthlyContribution)}/mo
                  </span>
                  <span className="text-[10px] text-[#66736C] font-mono">Your commitment</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">Projected Future Value</span>
                  <span className="text-base font-extrabold font-mono text-[#176B50] mt-0.5 block">
                    {formatINR(feasibility.projectedFutureValue)}
                  </span>
                  <span className="text-[10px] text-[#66736C] font-mono">Target: {formatINR(feasibility.targetAmount)}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">
                    {financialHealthContext.hasData 
                      ? (feasibility.monthlyShortfall > 0 ? 'Monthly Shortfall' : 'Surplus Remaining')
                      : (feasibility.monthlyShortfall > 0 ? 'Monthly Shortfall' : 'Surplus Remaining')
                    }
                  </span>
                  <span className={`text-base font-extrabold font-mono mt-0.5 block ${
                    financialHealthContext.hasData 
                      ? (feasibility.monthlyShortfall > 0 ? 'text-rose-600' : 'text-[#176B50]')
                      : (feasibility.monthlyShortfall > 0 ? 'text-rose-600' : 'text-[#66736C]')
                  }`}>
                    {financialHealthContext.hasData
                      ? (feasibility.monthlyShortfall > 0 ? formatINR(feasibility.monthlyShortfall) : formatINR(feasibility.surplusRemainingAfterContribution))
                      : (feasibility.monthlyShortfall > 0 ? formatINR(feasibility.monthlyShortfall) : '—')
                    }
                  </span>
                  <span className="text-[10px] text-[#66736C] font-mono">
                    {financialHealthContext.hasData
                      ? (feasibility.monthlyShortfall > 0 ? 'Gap to target' : 'Free cashflow buffer')
                      : (feasibility.monthlyShortfall > 0 ? 'Gap to target' : 'Monthly surplus not available')
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Quick Action when Affordable but Insufficient */}
            {financialHealthContext.hasData && feasibility.subStatus === 'CONTRIBUTION_INSUFFICIENT' && feasibility.requiredMonthlyContribution <= financialHealthContext.monthlySurplus && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setProposedContribution(Math.ceil(feasibility.requiredMonthlyContribution))}
                  className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#92400E] font-mono text-xs font-bold border border-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Increase Contribution to ₹{Math.ceil(feasibility.requiredMonthlyContribution).toLocaleString('en-IN')}/mo to Achieve Goal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Neutral Illustrative Scenario Sensitivity Table */}
          {scenarios.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#66736C]">
                <span>Illustrative Scenario Sensitivity ({years}y horizon)</span>
                <span>Required / mo</span>
              </div>

              {scenarios.map((sc) => (
                <div 
                  key={sc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E7ECE8] text-xs font-mono shadow-sm"
                >
                  <div>
                    <div className="font-semibold text-[#202B26]">{sc.name}</div>
                    <div className="text-[10px] text-[#66736C]">{sc.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#176B50]">
                      {formatINR(sc.result.requiredMonthlyContribution)}/mo
                    </div>
                    <div className="text-[10px] text-[#66736C]">
                      FV: {formatINR(sc.result.projectedFutureValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimers & Financial Safety */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-[#66736C] leading-relaxed space-y-1">
            <div className="font-semibold text-[#202B26] flex items-center gap-1">
              <Info className="w-3 h-3 text-[#176B50]" />
              <span>Illustrative Mathematical Modeling Notice:</span>
            </div>
            <p>
              These percentage rates are neutral mathematical benchmarks used to illustrate the mechanics of compound accumulation. They do not represent expected returns, statutory promises, or returns offered by any specific financial product. Sovereign instruments carry statutory rates declared by the Government of India.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
