import React, { useState } from 'react';
import { 
  Wallet, 
  Home, 
  ShoppingBag, 
  CreditCard, 
  PiggyBank, 
  ShieldCheck, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  RotateCcw,
  PieChart
} from 'lucide-react';

export const SmartBudgetCard = ({ values, onChange, calculationResult, onReset, onFillSample, showInsurance = true }) => {
  const [incomeMode, setIncomeMode] = useState('monthly'); // 'monthly' | 'annual'

  const {
    monthly_income = '',
    annual_income = '',
    essential_expenses = '',
    lifestyle_expenses = '',
    monthly_emi = '',
    liquid_savings = '',
    has_life_insurance = null,
    has_health_insurance = null
  } = values;

  const budget = calculationResult?.budget_50_30_20 || {
    needs_guideline_50: 0,
    wants_guideline_30: 0,
    savings_guideline_20: 0,
    actual_needs: 0,
    actual_wants: 0,
    potential_savings: 0,
    needs_percentage: 0,
    wants_percentage: 0,
    savings_percentage: 0
  };

  const monthlySurplus = calculationResult?.monthly_surplus ?? 0;
  const isSurplusPositive = calculationResult?.is_surplus_positive ?? true;
  const effectiveMonthlyIncome = calculationResult?.monthly_income ?? 0;
  const totalOutflow = calculationResult?.total_outflow ?? 0;
  const runwayMonths = calculationResult?.pillars?.emergency_runway_months ?? 0;

  const formatINR = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const handleIncomeChange = (val) => {
    if (incomeMode === 'monthly') {
      onChange('monthly_income', val);
      onChange('annual_income', '');
    } else {
      onChange('annual_income', val);
      onChange('monthly_income', '');
    }
  };

  return (
    <div className="bg-white border border-[#E7ECE8] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#176B50]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7ECE8]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-xs font-mono font-medium mb-2">
            <Wallet className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Monthly Budget Planner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#202B26] tracking-tight font-serif">
            Plan Your Monthly Cashflow
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-1">
            Organize your monthly income, living expenses, and loan EMIs to uncover your available savings capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onFillSample && (
            <button
              type="button"
              onClick={onFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] hover:text-[#125540] text-xs font-medium border border-[#D5E4DC] transition-colors cursor-pointer shadow-sm"
              title="Populate demo sample data"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Fill Sample Data</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#66736C] hover:text-[#202B26] text-xs font-medium border border-[#E7ECE8] transition-colors cursor-pointer shadow-sm"
              title="Reset fields to empty"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fields</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Financial Inputs */}
      <div className="mt-6 space-y-5">
        {/* Income Input with Toggle */}
        <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
              <span>Take-Home Household Income</span>
            </label>
            <div className="inline-flex bg-white p-0.5 rounded-lg border border-[#E7ECE8] text-[11px] font-mono shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setIncomeMode('monthly');
                  if (annual_income) {
                    onChange('monthly_income', Math.round(Number(annual_income) / 12));
                    onChange('annual_income', '');
                  }
                }}
                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                  incomeMode === 'monthly' ? 'bg-[#176B50] text-white font-bold' : 'text-[#66736C] hover:text-[#202B26]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  setIncomeMode('annual');
                  if (monthly_income) {
                    onChange('annual_income', Math.round(Number(monthly_income) * 12));
                    onChange('monthly_income', '');
                  }
                }}
                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                  incomeMode === 'annual' ? 'bg-[#176B50] text-white font-bold' : 'text-[#66736C] hover:text-[#202B26]'
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#176B50] font-mono font-bold text-base">₹</span>
            <input
              type="number"
              min="0"
              step="500"
              placeholder={incomeMode === 'monthly' ? '50000' : '600000'}
              value={incomeMode === 'monthly' ? monthly_income : annual_income}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-base font-semibold placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[11px] font-mono text-[#66736C]">
            <span>
              {incomeMode === 'annual' && annual_income
                ? `Derived Monthly: ${formatINR(effectiveMonthlyIncome)}/mo`
                : 'Net in-hand take-home after statutory taxes'}
            </span>
          </div>
        </div>

        {/* Expenses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Essential Expenses */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider mb-1.5">
              <Home className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Basic Monthly Expenses</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="20000"
                value={essential_expenses}
                onChange={(e) => onChange('essential_expenses', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <p className="text-[10px] text-[#66736C] mt-1">Rent, groceries, electricity, school fees and other daily necessities.</p>
          </div>

          {/* Lifestyle Expenses */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider mb-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
              <span>Personal & Fun Expenses</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="10000"
                value={lifestyle_expenses}
                onChange={(e) => onChange('lifestyle_expenses', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <p className="text-[10px] text-[#66736C] mt-1">Shopping, eating out, entertainment, travel and hobbies.</p>
          </div>

          {/* Monthly EMI Obligations */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider mb-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>Loan & EMI Payments</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="5000"
                value={monthly_emi}
                onChange={(e) => onChange('monthly_emi', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <p className="text-[10px] text-[#66736C] mt-1">Home loans, vehicle loans, personal loans and credit card payments.</p>
          </div>

          {/* Liquid Emergency Savings */}
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider mb-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-sky-600" />
              <span>Emergency Savings</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736C] font-mono text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="120000"
                value={liquid_savings}
                onChange={(e) => onChange('liquid_savings', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white text-[#202B26] rounded-xl border border-[#E7ECE8] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 focus:outline-none font-mono text-sm placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <p className="text-[10px] text-[#66736C] mt-1">Money you have kept aside for unexpected expenses, such as medical bills or urgent repairs.</p>
          </div>
        </div>

        {/* Income Distribution Visualizer */}
        {effectiveMonthlyIncome > 0 && (
          <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#176B50]" />
                <span>How Your Monthly Income is Allocated</span>
              </span>
              <span className="text-[11px] text-[#66736C] font-semibold">
                Total: {formatINR(effectiveMonthlyIncome)}
              </span>
            </div>

            {/* Stacked allocation bar */}
            <div className="w-full h-3.5 bg-[#E7ECE8] rounded-full overflow-hidden flex border border-[#D5E4DC]">
              <div 
                style={{ width: `${Math.min(100, Math.round((Number(essential_expenses || 0) / effectiveMonthlyIncome) * 100))}%` }} 
                className="bg-[#176B50] transition-all duration-300"
                title={`Needs: ${formatINR(essential_expenses)}`}
              />
              <div 
                style={{ width: `${Math.min(100, Math.round((Number(lifestyle_expenses || 0) / effectiveMonthlyIncome) * 100))}%` }} 
                className="bg-teal-500 transition-all duration-300"
                title={`Wants: ${formatINR(lifestyle_expenses)}`}
              />
              <div 
                style={{ width: `${Math.min(100, Math.round((Number(monthly_emi || 0) / effectiveMonthlyIncome) * 100))}%` }} 
                className="bg-amber-500 transition-all duration-300"
                title={`EMIs: ${formatINR(monthly_emi)}`}
              />
              {monthlySurplus > 0 && (
                <div 
                  style={{ width: `${Math.min(100, Math.round((monthlySurplus / effectiveMonthlyIncome) * 100))}%` }} 
                  className="bg-emerald-400 transition-all duration-300"
                  title={`Available Surplus: ${formatINR(monthlySurplus)}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[#66736C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#176B50] inline-block" />
                Essentials ({Math.round((Number(essential_expenses || 0) / effectiveMonthlyIncome) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#66736C]">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                Lifestyle ({Math.round((Number(lifestyle_expenses || 0) / effectiveMonthlyIncome) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#66736C]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                EMIs ({Math.round((Number(monthly_emi || 0) / effectiveMonthlyIncome) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#66736C]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Surplus ({Math.max(0, Math.round((monthlySurplus / effectiveMonthlyIncome) * 100))}%)
              </span>
            </div>
          </div>
        )}

        {/* User-entered amounts disclaimer */}
        <div className="flex items-center gap-2 text-[11px] text-[#92400E] bg-[#FFFBEB] p-3 rounded-xl border border-[#FDE68A]">
          <Info className="w-3.5 h-3.5 text-[#92400E] shrink-0" />
          <span>
            <strong>Planned Estimates:</strong> These are user-entered monthly budget targets. Sanchay does not connect to bank accounts or automatically track transactions.
          </span>
        </div>

        {/* Protection / Insurance Status (3-way selector) */}
        {showInsurance && (
        <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-[#E7ECE8] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Insurance Protection Status</span>
            </span>
            <span className="text-[10px] font-mono text-[#66736C]">
              {has_life_insurance !== null && has_health_insurance !== null ? 'Status Declared' : 'Provisional (Unconfirmed)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Life Insurance */}
            <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
              <div className="text-xs font-semibold text-[#202B26] mb-2">Life Insurance (Term / LIC)</div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => onChange('has_life_insurance', true)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_life_insurance === true
                      ? 'bg-[#ECFDF5] border-[#176B50] text-[#176B50] font-bold shadow-sm'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Covered
                </button>
                <button
                  type="button"
                  onClick={() => onChange('has_life_insurance', false)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_life_insurance === false
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-sm'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Uninsured
                </button>
                <button
                  type="button"
                  onClick={() => onChange('has_life_insurance', null)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_life_insurance === null
                      ? 'bg-slate-200 border-slate-300 text-[#202B26] font-bold'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Unspecified
                </button>
              </div>
            </div>

            {/* Health Insurance */}
            <div className="p-3 rounded-xl bg-white border border-[#E7ECE8] shadow-sm">
              <div className="text-xs font-semibold text-[#202B26] mb-2">Health Insurance (Mediclaim)</div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => onChange('has_health_insurance', true)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_health_insurance === true
                      ? 'bg-[#ECFDF5] border-[#176B50] text-[#176B50] font-bold shadow-sm'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Covered
                </button>
                <button
                  type="button"
                  onClick={() => onChange('has_health_insurance', false)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_health_insurance === false
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-sm'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Uninsured
                </button>
                <button
                  type="button"
                  onClick={() => onChange('has_health_insurance', null)}
                  className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                    has_health_insurance === null
                      ? 'bg-slate-200 border-slate-300 text-[#202B26] font-bold'
                      : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                  }`}
                >
                  Unspecified
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Section 2: Cashflow Outflow & Surplus Output */}
      <div className="mt-6 pt-6 border-t border-[#E7ECE8]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Monthly Income Summary */}
          <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">Monthly Inflow</span>
            <span className="text-lg font-bold font-mono text-[#202B26] mt-0.5 block">
              {effectiveMonthlyIncome > 0 ? formatINR(effectiveMonthlyIncome) : '—'}
            </span>
            <span className="text-[10px] text-[#66736C]">
              {effectiveMonthlyIncome > 0 ? 'Total net household income' : 'Awaiting income input'}
            </span>
          </div>

          {/* Total Outflow */}
          <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#66736C] block">Total Outflows</span>
            <span className="text-lg font-bold font-mono text-[#202B26] mt-0.5 block">
              {totalOutflow > 0 ? formatINR(totalOutflow) : (effectiveMonthlyIncome > 0 ? '₹0' : '—')}
            </span>
            <span className="text-[10px] text-[#66736C]">Essentials + Wants + EMIs</span>
          </div>

          {/* Monthly Surplus / Deficit */}
          <div className={`p-3.5 rounded-2xl border ${
            effectiveMonthlyIncome === 0 && totalOutflow === 0
              ? 'bg-slate-50 border-slate-200 text-[#66736C]'
              : isSurplusPositive
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider block">
                {effectiveMonthlyIncome === 0 && totalOutflow === 0
                  ? 'Unallocated Surplus'
                  : isSurplusPositive
                    ? 'Unallocated Surplus'
                    : 'Monthly Deficit'}
              </span>
              {effectiveMonthlyIncome === 0 && totalOutflow === 0 ? (
                <Info className="w-3.5 h-3.5 text-[#66736C]" />
              ) : isSurplusPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-[#065F46]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <span className="text-lg font-bold font-mono mt-0.5 block">
              {effectiveMonthlyIncome === 0 && totalOutflow === 0
                ? '—'
                : formatINR(monthlySurplus)}
            </span>
            <span className="text-[10px] opacity-80">
              {effectiveMonthlyIncome === 0 && totalOutflow === 0
                ? 'Enter income & expenses above'
                : isSurplusPositive
                  ? 'Potential savings capacity'
                  : 'Outflow exceeds income'}
            </span>
          </div>
        </div>

        {/* Semantic Note */}
        <div className="mt-3 flex items-start gap-2 text-[11px] text-[#66736C] bg-[#FAFAFC] p-2.5 rounded-xl border border-[#E7ECE8]">
          <Info className="w-3.5 h-3.5 text-[#176B50] shrink-0 mt-0.5" />
          <span>
            <strong>Semantic Note:</strong> Monthly surplus represents unallocated cashflow capacity available for future savings and investments; it is an indicator of budgetary headroom, not confirmed historical savings.
          </span>
        </div>
      </div>

      {/* Section 3: 50/30/20 Reference Guidelines */}
      <div className="mt-6 pt-6 border-t border-[#E7ECE8]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#176B50]" />
            <h3 className="text-sm font-bold text-[#202B26] uppercase tracking-wider font-mono">
              50 / 30 / 20 Reference Guidelines
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#176B50] bg-[#E7F1EB] px-2 py-0.5 rounded-full border border-[#D5E4DC]">
            Educational Benchmark
          </span>
        </div>

        <p className="text-xs text-[#66736C] mb-4">
          The 50/30/20 framework is an illustrative guideline to gauge balanced cashflow. It is an educational reference, not a mandatory rule.
        </p>

        <div className="space-y-3.5">
          {/* Needs: 50% */}
          <div className="bg-[#FAFAFC] p-3.5 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-[#202B26] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#176B50] inline-block" />
                Needs (Essentials + EMIs)
              </span>
              <span className="text-[#66736C]">
                {effectiveMonthlyIncome > 0
                  ? `Target: ${formatINR(budget.needs_guideline_50)} (50%) | Actual: ${formatINR(budget.actual_needs)} (${budget.needs_percentage}%)`
                  : 'Target: 50% of Income (Enter income to calculate)'}
              </span>
            </div>
            <div className="w-full bg-[#E7ECE8] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.needs_percentage > 60 ? 'bg-amber-500' : 'bg-[#176B50]'
                }`}
                style={{ width: `${Math.min(100, budget.needs_percentage)}%` }}
              />
            </div>
          </div>

          {/* Wants: 30% */}
          <div className="bg-[#FAFAFC] p-3.5 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-[#202B26] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                Wants (Lifestyle Spending)
              </span>
              <span className="text-[#66736C]">
                {effectiveMonthlyIncome > 0
                  ? `Target: ${formatINR(budget.wants_guideline_30)} (30%) | Actual: ${formatINR(budget.actual_wants)} (${budget.wants_percentage}%)`
                  : 'Target: 30% of Income (Enter income to calculate)'}
              </span>
            </div>
            <div className="w-full bg-[#E7ECE8] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.wants_percentage > 35 ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(100, budget.wants_percentage)}%` }}
              />
            </div>
          </div>

          {/* Savings & Surplus Capacity: 20% */}
          <div className="bg-[#FAFAFC] p-3.5 rounded-2xl border border-[#E7ECE8]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-[#202B26] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Potential Savings / Surplus
              </span>
              <span className="text-[#66736C]">
                {effectiveMonthlyIncome > 0
                  ? `Target: ${formatINR(budget.savings_guideline_20)} (20%) | Actual: ${formatINR(budget.potential_savings)} (${budget.savings_percentage}%)`
                  : 'Target: 20% of Income (Enter income to calculate)'}
              </span>
            </div>
            <div className="w-full bg-[#E7ECE8] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.savings_percentage >= 20 ? 'bg-[#176B50]' : (budget.savings_percentage > 0 ? 'bg-emerald-500' : 'bg-rose-500')
                }`}
                style={{ width: `${Math.max(0, Math.min(100, budget.savings_percentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Essential-Expense Runway Callout */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#E7F1EB] border border-[#D5E4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-[#176B50] block">
              Essential-Expense Emergency Coverage: {liquid_savings !== '' && essential_expenses !== '' ? `${runwayMonths.toFixed(1)} months` : 'Undeclared'}
            </span>
            <span className="text-[#66736C] text-[11px]">
              Coverage strictly measures essential living expense needs {essential_expenses !== '' ? `(₹${formatINR(values.essential_expenses)}/mo)` : '(undeclared)'} and explicitly excludes loan/EMI obligations.
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white text-[#176B50] font-mono text-[11px] font-semibold border border-[#D5E4DC] whitespace-nowrap self-start sm:self-auto shadow-sm">
            {liquid_savings === '' || essential_expenses === ''
              ? 'Undeclared'
              : runwayMonths >= 6 ? 'Target Met (≥6 mo)' : (runwayMonths >= 3 ? 'Moderate Buffer' : 'Under-buffered (<3 mo)')}
          </div>
        </div>
      </div>
    </div>
  );
};
