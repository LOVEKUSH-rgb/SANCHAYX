import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  Percent, 
  Clock, 
  CheckCircle2, 
  Info, 
  Award,
  Sparkles,
  HeartPulse,
  CreditCard,
  FileQuestion
} from 'lucide-react';

export const FinancialHealthGauge = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="bg-white border border-[#E7ECE8] rounded-3xl p-8 text-center text-[#66736C] shadow-card">
        Enter your financial details to generate your Financial Resilience Score.
      </div>
    );
  }

  const {
    total_health_score = 0,
    score_grade = 'CRITICAL',
    pillars = {},
    data_completeness = {},
    insights = [],
    disclaimer = ''
  } = calculationResult;

  const {
    savings_score = 0,
    savings_rate_pct = 0,
    emergency_score = 0,
    emergency_runway_months = 0,
    emi_score = 0,
    emi_ratio_pct = 0,
    protection_score = 0,
    life_insurance_status = 'UNSPECIFIED',
    health_insurance_status = 'UNSPECIFIED',
    is_protection_complete = false
  } = pillars;

  const isProvisional = Boolean(data_completeness?.is_provisional_score);
  const unspecifiedFields = data_completeness?.unspecified_fields || [];

  // Grade metadata
  const gradeConfig = {
    EXCELLENT: {
      label: 'EXCELLENT RESILIENCE',
      badgeBg: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
      color: '#176B50',
      desc: 'Balanced cashflows, adequate liquidity buffer, manageable debt, and active protection.'
    },
    STABLE: {
      label: 'STABLE DISCIPLINE',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      color: '#0d9488',
      desc: 'Sound financial habits with manageable opportunities to optimize emergency or protection buffers.'
    },
    NEEDS_ATTENTION: {
      label: 'NEEDS ATTENTION',
      badgeBg: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
      color: '#d97706',
      desc: 'One or more key pillars (emergency cushion, debt ratio, or insurance) require strengthening.'
    },
    CRITICAL: {
      label: 'CRITICAL ATTENTION',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      color: '#e11d48',
      desc: 'Elevated debt obligations, negative monthly cashflow, or absence of emergency reserves.'
    }
  };

  const hasIncome = (calculationResult?.monthly_income || 0) > 0;
  const currentGrade = gradeConfig[score_grade] || gradeConfig.CRITICAL;

  // Circular gauge math (radius = 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for gauge (dasharray = 439.82 * (270/360) = 329.87)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = hasIncome
    ? arcLength - (arcLength * Math.min(100, Math.max(0, total_health_score))) / 100
    : arcLength;

  return (
    <div className="bg-white border border-[#E7ECE8] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden flex flex-col justify-between">
      {/* Background glow */}
      <div 
        className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: hasIncome ? currentGrade.color : '#E7ECE8' }}
      />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E7ECE8]">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#176B50]" />
            <h2 className="text-lg sm:text-xl font-bold text-[#202B26] tracking-tight font-serif">
              Financial Resilience Score
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
            hasIncome ? currentGrade.badgeBg : 'bg-slate-100 text-[#66736C] border-slate-200'
          }`}>
            {hasIncome ? currentGrade.label : 'PENDING INPUTS'}
          </span>
        </div>

        {/* Provisional Score Warning Banner */}
        {isProvisional && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
            <AlertTriangle className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono uppercase tracking-wider block text-[#92400E]">
                Provisional Evaluation
              </span>
              <p className="text-[11px] text-[#92400E]/90 mt-0.5">
                Certain data points ({unspecifiedFields.join(', ')}) are unconfirmed.
                Missing entries are treated as unverified rather than confirmed absent. Declare full figures for verified scoring.
              </p>
            </div>
          </div>
        )}

        {/* Circular Gauge and Total Score */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 p-6 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
          {/* Radial Meter */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-135" viewBox="0 0 180 180">
              {/* Background Arc */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#E7ECE8"
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Active Value Arc */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={hasIncome ? currentGrade.color : '#94a3b8'}
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>

            {/* Score in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#202B26] tracking-tight">
                {hasIncome ? Math.round(total_health_score) : '—'}
              </span>
              <span className="text-[11px] font-mono text-[#66736C] uppercase tracking-widest mt-0.5">
                {hasIncome ? 'out of 100' : 'pending inputs'}
              </span>
            </div>
          </div>

          {/* Grade Narrative */}
          <div className="text-center sm:text-left max-w-xs">
            <div className="text-xs font-mono uppercase tracking-wider text-[#66736C]">Composite Health Grade</div>
            <div className="text-xl sm:text-2xl font-bold mt-1" style={{ color: hasIncome ? currentGrade.color : '#66736C' }}>
              {hasIncome ? currentGrade.label : 'PENDING INCOME DECLARATION'}
            </div>
            <p className="text-xs text-[#66736C] mt-2 leading-relaxed">
              {hasIncome
                ? currentGrade.desc
                : 'Enter your monthly take-home income and expenses in the Budget Planner to calculate your verified Financial Resilience Score.'}
            </p>
          </div>
        </div>

        {/* Four Pillar Scorecards */}
        <div className="mt-6">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#66736C] mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Four Resilience Pillars (25 Points Each)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pillar 1: Savings & Surplus Rate */}
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#202B26]">1. Surplus Capacity</span>
                  <span className="text-[#176B50] font-bold">{hasIncome ? `${savings_score.toFixed(1)} / 25` : '— / 25'}</span>
                </div>
                <div className="w-full bg-[#E7ECE8] rounded-full h-1.5 overflow-hidden my-2">
                  <div
                    className="h-full bg-[#176B50] rounded-full transition-all duration-500"
                    style={{ width: `${hasIncome ? (savings_score / 25) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#66736C] flex items-center justify-between">
                <span>Surplus Rate: <strong className="text-[#202B26] font-mono">{hasIncome ? `${savings_rate_pct.toFixed(1)}%` : 'Undeclared'}</strong></span>
                <span className="text-[10px] text-[#66736C] font-mono">Target: ≥ 20%</span>
              </div>
            </div>

            {/* Pillar 2: Essential-Expense Buffer */}
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#202B26]">2. Emergency Runway</span>
                  <span className="text-teal-700 font-bold">{emergency_runway_months > 0 ? `${emergency_score.toFixed(1)} / 25` : '— / 25'}</span>
                </div>
                <div className="w-full bg-[#E7ECE8] rounded-full h-1.5 overflow-hidden my-2">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${emergency_runway_months > 0 ? (emergency_score / 25) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#66736C] flex items-center justify-between">
                <span>Runway: <strong className="text-[#202B26] font-mono">{emergency_runway_months > 0 ? `${emergency_runway_months.toFixed(1)} mo` : 'Undeclared'}</strong></span>
                <span className="text-[10px] text-[#66736C] font-mono">Essentials only (excl. EMIs)</span>
              </div>
            </div>

            {/* Pillar 3: Debt & EMI Burden */}
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#202B26]">3. EMI Debt Ratio</span>
                  <span className="text-amber-700 font-bold">{hasIncome ? `${emi_score.toFixed(1)} / 25` : '— / 25'}</span>
                </div>
                <div className="w-full bg-[#E7ECE8] rounded-full h-1.5 overflow-hidden my-2">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${hasIncome ? (emi_score / 25) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#66736C] flex items-center justify-between">
                <span>EMI Ratio: <strong className="text-[#202B26] font-mono">{hasIncome ? `${emi_ratio_pct.toFixed(1)}%` : 'Undeclared'}</strong></span>
                <span className="text-[10px] text-[#66736C] font-mono">Safe: ≤ 30%</span>
              </div>
            </div>

            {/* Pillar 4: Insurance Protection */}
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#202B26]">4. Protection Buffer</span>
                  <span className="text-sky-700 font-bold">{protection_score.toFixed(1)} / 25</span>
                </div>
                <div className="w-full bg-[#E7ECE8] rounded-full h-1.5 overflow-hidden my-2">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${(protection_score / 25) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#66736C] flex items-center justify-between font-mono text-[10px]">
                <span className={life_insurance_status === 'CONFIRMED_COVERED' ? 'text-[#176B50] font-bold' : (life_insurance_status === 'CONFIRMED_UNINSURED' ? 'text-rose-600 font-bold' : 'text-[#66736C]')}>
                  Life: {life_insurance_status === 'CONFIRMED_COVERED' ? '✓' : (life_insurance_status === 'CONFIRMED_UNINSURED' ? '✗' : '?')}
                </span>
                <span className={health_insurance_status === 'CONFIRMED_COVERED' ? 'text-[#176B50] font-bold' : (health_insurance_status === 'CONFIRMED_UNINSURED' ? 'text-rose-600 font-bold' : 'text-[#66736C]')}>
                  Health: {health_insurance_status === 'CONFIRMED_COVERED' ? '✓' : (health_insurance_status === 'CONFIRMED_UNINSURED' ? '✗' : '?')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Diagnostic Insights */}
        {insights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#E7ECE8]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#66736C] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Transparent Diagnostic Observations</span>
            </div>
            <div className="space-y-2.5">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E7ECE8] text-xs text-[#202B26] flex items-start gap-2.5 leading-relaxed"
                >
                  <Info className="w-4 h-4 text-[#176B50] shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sovereign / Non-Underwriting Disclaimer */}
      <div className="mt-6 pt-4 border-t border-[#E7ECE8] text-[10px] text-[#66736C] leading-relaxed">
        {disclaimer || 'These calculations are transparent educational indicators designed to guide financial discipline and planning; they do not constitute regulated financial, legal, or investment advice.'}
      </div>
    </div>
  );
};
