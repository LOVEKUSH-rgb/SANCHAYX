import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SmartBudgetCard } from '../components/financial/SmartBudgetCard';
import { FinancialHealthGauge } from '../components/financial/FinancialHealthGauge';
import { calculateFinancialHealth } from '../services/financialCalculations';
import { fetchFinancialHealth, saveFinancialProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  HeartPulse, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Target,
  Calculator,
  ChevronDown,
  ChevronUp,
  Wallet,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoalFeasibilitySimulator } from '../components/financial/GoalFeasibilitySimulator';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';

const SESSION_STORAGE_KEY = 'sanchay_financial_health';

// Blank defaults for new visitors: undeclared values remain genuine blanks, not confirmed 0 or Yes/No
const DEFAULT_INPUTS = {
  monthly_income: '',
  annual_income: '',
  essential_expenses: '',
  lifestyle_expenses: '',
  monthly_emi: '',
  liquid_savings: '',
  has_life_insurance: null,
  has_health_insurance: null
};

// Standard demo profile populated when "Fill Sample Data" is clicked
const SAMPLE_INPUTS = {
  monthly_income: 50000,
  annual_income: '',
  essential_expenses: 20000,
  lifestyle_expenses: 10000,
  monthly_emi: 5000,
  liquid_savings: 120000,
  has_life_insurance: true,
  has_health_insurance: true
};

// Helper to identify legacy unconfirmed demo figures persisted by prior versions
const isMatchingLegacyDemoDefaults = (data) => {
  if (!data || typeof data !== 'object') return false;
  return (
    Number(data.monthly_income) === 50000 &&
    (data.annual_income === '' || !data.annual_income) &&
    Number(data.essential_expenses) === 20000 &&
    Number(data.lifestyle_expenses) === 10000 &&
    Number(data.monthly_emi) === 5000 &&
    Number(data.liquid_savings) === 120000 &&
    data.has_life_insurance === true &&
    data.has_health_insurance === true
  );
};

export const FinancialHealthPage = () => {
  const { user, token, isAuthenticated, openAuthModal } = useAuth();

  // Load from session storage or fallback to blank defaults
  const [inputs, setInputs] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read session financial health:', e);
    }
    return DEFAULT_INPUTS;
  });

  // User-controlled notification if stored data matches suspected legacy demo values
  const [showLegacyDemoBanner, setShowLegacyDemoBanner] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return isMatchingLegacyDemoDefaults(parsed);
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message: string } | null
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [showGoalSimulator, setShowGoalSimulator] = useState(false);
  const [activeTab, setActiveTab] = useState('budget'); // 'budget' (default) | 'health'
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  // Compute instant deterministic client-side calculation
  const calculationResult = useMemo(() => {
    const payload = {
      monthly_income: inputs.monthly_income !== '' ? Number(inputs.monthly_income) : undefined,
      annual_income: inputs.annual_income !== '' ? Number(inputs.annual_income) : undefined,
      essential_expenses: inputs.essential_expenses !== '' ? Number(inputs.essential_expenses) : undefined,
      lifestyle_expenses: inputs.lifestyle_expenses !== '' ? Number(inputs.lifestyle_expenses) : undefined,
      monthly_emi: inputs.monthly_emi !== '' ? Number(inputs.monthly_emi) : undefined,
      liquid_savings: inputs.liquid_savings !== '' ? Number(inputs.liquid_savings) : undefined,
      has_life_insurance: inputs.has_life_insurance,
      has_health_insurance: inputs.has_health_insurance
    };
    return calculateFinancialHealth(payload);
  }, [inputs]);

  // Prepare structured financial health context for Sakhi (strictly no invented 0 data when fields are undeclared)
  const financialHealthContext = useMemo(() => {
    const hasIncome = (inputs.monthly_income !== '' && Number(inputs.monthly_income) > 0) ||
                      (inputs.annual_income !== '' && Number(inputs.annual_income) > 0);
    const hasAnyExpense = (inputs.essential_expenses !== '' && Number(inputs.essential_expenses) > 0) ||
                          (inputs.lifestyle_expenses !== '' && Number(inputs.lifestyle_expenses) > 0) ||
                          (inputs.monthly_emi !== '' && Number(inputs.monthly_emi) > 0);
    const hasAnySavings = inputs.liquid_savings !== '' && Number(inputs.liquid_savings) >= 0;
    const hasInsurance = inputs.has_life_insurance !== null || inputs.has_health_insurance !== null;

    if (!hasIncome && !hasAnyExpense && !hasAnySavings && !hasInsurance) {
      return null;
    }

    if (!calculationResult) return null;
    const b50 = calculationResult.budget_50_30_20 || {};
    return {
      monthly_income: hasIncome ? (calculationResult.monthly_income ?? Number(inputs.monthly_income)) : undefined,
      essential_expenses: inputs.essential_expenses !== '' ? Number(inputs.essential_expenses) : undefined,
      lifestyle_expenses: inputs.lifestyle_expenses !== '' ? Number(inputs.lifestyle_expenses) : undefined,
      monthly_emi: inputs.monthly_emi !== '' ? Number(inputs.monthly_emi) : undefined,
      liquid_savings: inputs.liquid_savings !== '' ? Number(inputs.liquid_savings) : undefined,
      total_outflow: hasAnyExpense ? calculationResult.total_outflow : undefined,
      monthly_surplus: hasIncome ? calculationResult.monthly_surplus : undefined,
      is_surplus_positive: hasIncome ? Boolean(calculationResult.is_surplus_positive) : undefined,
      emergency_runway_months: (hasAnySavings && inputs.essential_expenses !== '') ? (calculationResult.pillars?.emergency_runway_months ?? 0) : undefined,
      health_score: hasIncome ? (calculationResult.total_health_score ?? 0) : undefined,
      score_grade: hasIncome ? (calculationResult.score_grade ?? 'UNSPECIFIED') : 'UNSPECIFIED',
      budget_breakdown: (hasIncome && calculationResult.budget_50_30_20) ? {
        needs_50_guideline: b50.needs_guideline_50,
        wants_30_guideline: b50.wants_guideline_30,
        savings_20_guideline: b50.savings_guideline_20,
        actual_needs: b50.actual_needs,
        actual_wants: b50.actual_wants,
        actual_savings: b50.actual_savings,
        needs_percentage: b50.needs_percentage,
        wants_percentage: b50.wants_percentage,
        savings_percentage: b50.savings_percentage
      } : null
    };
  }, [inputs, calculationResult]);

  // Persist guest inputs to dedicated session storage key
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(inputs));
    } catch (e) {
      console.warn('Could not persist financial inputs to session:', e);
    }
  }, [inputs]);

  // Load remote profile on mount if authenticated and user hasn't actively entered session data
  useEffect(() => {
    if (isAuthenticated && token && !hasLoadedRemote) {
      fetchFinancialHealth(token)
        .then((remoteData) => {
          if (remoteData?.has_data && remoteData?.financial_journey?.inputs) {
            const remoteInputs = remoteData.financial_journey.inputs;
            // Check if user already customized in session
            const hasSessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!hasSessionData) {
              setInputs({
                monthly_income: remoteInputs.monthly_income ?? '',
                annual_income: remoteInputs.annual_income ?? '',
                essential_expenses: remoteInputs.essential_expenses ?? '',
                lifestyle_expenses: remoteInputs.lifestyle_expenses ?? '',
                monthly_emi: remoteInputs.monthly_emi ?? '',
                liquid_savings: remoteInputs.liquid_savings ?? '',
                has_life_insurance: remoteInputs.has_life_insurance ?? null,
                has_health_insurance: remoteInputs.has_health_insurance ?? null
              });
            }
            if (remoteData.financial_journey.updated_at) {
              setLastSavedTime(new Date(remoteData.financial_journey.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
          }
          setHasLoadedRemote(true);
        })
        .catch((err) => {
          console.warn('Could not fetch saved financial profile:', err);
          setHasLoadedRemote(true);
        });
    }
  }, [isAuthenticated, token, hasLoadedRemote]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setSaveStatus(null);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setSaveStatus(null);
    setShowLegacyDemoBanner(false);
  };

  const handleFillSample = () => {
    setInputs(SAMPLE_INPUTS);
    setSaveStatus(null);
    setShowLegacyDemoBanner(false);
  };

  const handleSaveToProfile = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const payload = {
      monthly_income: inputs.monthly_income !== '' ? Number(inputs.monthly_income) : null,
      annual_income: inputs.annual_income !== '' ? Number(inputs.annual_income) : null,
      essential_expenses: Number(inputs.essential_expenses) || 0,
      lifestyle_expenses: Number(inputs.lifestyle_expenses) || 0,
      monthly_emi: Number(inputs.monthly_emi) || 0,
      liquid_savings: Number(inputs.liquid_savings) || 0,
      has_life_insurance: inputs.has_life_insurance,
      has_health_insurance: inputs.has_health_insurance
    };

    try {
      const res = await saveFinancialProfile(payload, token);
      setIsSaving(false);
      setSaveStatus({
        type: 'success',
        message: 'Financial profile saved to your authenticated account!'
      });
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setIsSaving(false);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Failed to save financial profile. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#202B26] flex flex-col font-sans selection:bg-[#176B50] selection:text-white relative">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Breadcrumb & Sovereignty Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-xs font-mono font-medium mb-3">
              <HeartPulse className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Sanchay Financial Intelligence</span>
              <span className="text-[#66736C]/40">|</span>
              <span className="text-[#176B50] font-semibold">Step 2: Smart Budget & Health</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202B26] tracking-tight font-serif">
              Smart Budget & Financial Resilience Engine
            </h1>
            <p className="text-sm sm:text-base text-[#66736C] mt-2 max-w-2xl leading-relaxed">
              Transparent, deterministic cashflow analysis and resilience evaluation.
              Calculate your 50/30/20 reference allocations, unallocated surplus, and 100-point Health Score.
            </p>
          </div>

          {/* Action Bar (Save / Auth Status) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-white border border-[#E7ECE8] p-2 px-3.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#202B26] flex items-center gap-1.5 justify-end">
                    <UserCheck className="w-3.5 h-3.5 text-[#176B50]" />
                    <span>{user?.full_name || 'Citizen'}</span>
                  </div>
                  <div className="text-[10px] text-[#66736C] font-mono">
                    {lastSavedTime ? `Last saved: ${lastSavedTime}` : 'Unsaved changes'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToProfile}
                  disabled={isSaving}
                  className="bg-[#176B50] hover:bg-[#125540] text-white px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save to Profile'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-white border border-[#E7ECE8] p-2 px-3 rounded-2xl shadow-sm">
                <span className="text-[11px] font-mono text-[#66736C] hidden sm:inline">
                  Guest Mode: Stored in session
                </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] hover:text-[#125540] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-[#D5E4DC] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#176B50]" />
                  <span>Sign In to Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Suspected Legacy Demo Data Migration Banner (User Controlled) */}
        {showLegacyDemoBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-[#92400E]">
              <Sparkles className="w-4 h-4 text-[#92400E] shrink-0" />
              <span>
                <strong>Sample Demo Data Loaded:</strong> Pre-existing sample figures are currently active. You can keep editing these numbers, or start fresh with a blank budget.
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                Start with Blank Budget
              </button>
              <button
                type="button"
                onClick={() => setShowLegacyDemoBanner(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#FDE68A] hover:bg-amber-100 text-[#92400E] font-mono text-xs transition-colors cursor-pointer"
              >
                Keep Sample Data
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alert Banner */}
        {saveStatus && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            saveStatus.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <div className="flex items-center gap-2">
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{saveStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveStatus(null)}
              className="text-[#66736C] hover:text-[#202B26] text-xs font-mono cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs: Budget Planner (Default) vs Financial Health */}
        <div className="flex border-b border-[#E7ECE8] mb-8 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2.5 px-6 py-3.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'budget'
                ? 'border-[#176B50] text-[#176B50] bg-[#E7F1EB]/50'
                : 'border-transparent text-[#66736C] hover:text-[#202B26] hover:border-[#D5E4DC]'
            }`}
          >
            <Wallet className="w-4 h-4 text-[#176B50]" />
            <span>1. Budget Planner</span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC]">
              Default
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2.5 px-6 py-3.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'health'
                ? 'border-[#176B50] text-[#176B50] bg-[#E7F1EB]/50'
                : 'border-transparent text-[#66736C] hover:text-[#202B26] hover:border-[#D5E4DC]'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-[#176B50]" />
            <span>2. Financial Health</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              (inputs.monthly_income === '' && inputs.annual_income === '')
                ? 'bg-slate-100 border-slate-200 text-[#66736C]'
                : calculationResult.total_health_score >= 75
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                  : (calculationResult.total_health_score >= 50
                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800')
            }`}>
              {(inputs.monthly_income === '' && inputs.annual_income === '')
                ? 'Pending'
                : `${Math.round(calculationResult.total_health_score)}/100`}
            </span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: BUDGET PLANNER (DEFAULT PRIMARY EXPERIENCE) */}
        {/* ================================================================= */}
        {activeTab === 'budget' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Full-Width Budget Planner Card */}
            <SmartBudgetCard
              values={inputs}
              onChange={handleInputChange}
              calculationResult={calculationResult}
              onReset={handleReset}
              onFillSample={handleFillSample}
              showInsurance={false}
            />

            {/* Goal Planning & Surplus Feasibility Integration */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7ECE8] shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7ECE8]">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-xs font-mono font-medium mb-2">
                    <Target className="w-3.5 h-3.5 text-[#176B50]" />
                    <span>Surplus-to-Goal Bridge</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#202B26] tracking-tight font-serif">
                    Plan a Goal with Your Surplus
                  </h2>
                  <p className="text-xs sm:text-sm text-[#66736C] mt-1 max-w-2xl leading-relaxed">
                    Connect your calculated monthly surplus directly to your milestone targets. Test how allocating a comfortable portion of your surplus accumulates toward long-term goals while preserving your emergency buffer.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGoalSimulator(prev => !prev)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      showGoalSimulator 
                        ? 'bg-[#E7F1EB] border-[#D5E4DC] text-[#176B50] shadow-sm' 
                        : 'bg-[#FAFAFC] border-[#E7ECE8] text-[#176B50] hover:bg-[#E7F1EB]'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-[#176B50]" />
                    <span>{showGoalSimulator ? 'Hide Goal Simulator' : 'Test Goal Feasibility Inline'}</span>
                    {showGoalSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <Link
                    to="/goal"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white text-xs font-mono font-bold shadow-sm transition-all"
                  >
                    <span>Select a Milestone</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Surplus Allocation Guidance Callout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
                  <span className="text-[#66736C] block text-[10px] uppercase tracking-wider">Available Monthly Surplus</span>
                  <span className="text-base font-extrabold text-[#202B26] mt-0.5 block">
                    {calculationResult.is_surplus_positive 
                      ? `₹${Math.round(calculationResult.monthly_surplus).toLocaleString('en-IN')}/mo` 
                      : (calculationResult.monthly_income > 0 ? '₹0/mo (Deficit)' : 'Undeclared')}
                  </span>
                  <span className="text-[10px] text-[#66736C]">Available cashflow headroom</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
                  <span className="text-[#66736C] block text-[10px] uppercase tracking-wider">Essential Emergency Runway</span>
                  <span className="text-base font-extrabold text-[#202B26] mt-0.5 block">
                    {inputs.liquid_savings !== '' && inputs.essential_expenses !== ''
                      ? `${calculationResult.pillars?.emergency_runway_months.toFixed(1)} Months`
                      : 'Undeclared'}
                  </span>
                  <span className="text-[10px] text-[#66736C]">Benchmark: 3–6 months liquid buffer</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
                  <span className="text-[#66736C] block text-[10px] uppercase tracking-wider">Suggested Goal Allocation</span>
                  <span className="text-base font-extrabold text-[#176B50] mt-0.5 block">
                    {calculationResult.is_surplus_positive 
                      ? `Up to ₹${Math.round(calculationResult.monthly_surplus * 0.5).toLocaleString('en-IN')}/mo (50%)` 
                      : (calculationResult.monthly_income > 0 ? 'Prioritize Cashflow Balance' : 'Declare Budget First')}
                  </span>
                  <span className="text-[10px] text-[#66736C]">Preserves cashflow cushion</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-[#E7ECE8] text-[11px] text-[#66736C] leading-relaxed">
                <strong className="text-[#202B26]">Prudent Surplus Principles:</strong> Sanchay never assumes your entire monthly surplus should be locked into long-term goals. We advise maintaining 3–6 months of essential living expenses in liquid emergency savings before committing regular monthly contributions to milestone goals.
              </div>

              {/* Inline Goal Feasibility Simulator */}
              {showGoalSimulator && (
                <div className="pt-2 animate-in fade-in duration-300">
                  <GoalFeasibilitySimulator
                    goalName="Milestone Goal"
                    overrideFinancialHealth={calculationResult.monthly_income > 0 ? calculationResult : null}
                  />
                </div>
              )}

              {/* Quick Navigation Footer to Tab 2 */}
              <div className="pt-4 border-t border-[#E7ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#66736C]">
                  <HeartPulse className="w-4 h-4 text-[#176B50] shrink-0" />
                  <span>
                    {(inputs.monthly_income === '' && inputs.annual_income === '')
                      ? 'Declare your monthly budget above to generate your composite Financial Resilience Score.'
                      : (
                        <>
                          Your current composite Financial Resilience Score is <strong className="text-[#202B26] font-mono">{Math.round(calculationResult.total_health_score)}/100</strong>.
                        </>
                      )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('health')}
                  className="inline-flex items-center gap-1 text-[#176B50] hover:text-[#125540] font-mono font-bold cursor-pointer transition-colors self-start sm:self-auto"
                >
                  <span>View Full Health Breakdown & Pillars →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: FINANCIAL HEALTH (DETAILED 100-POINT EVALUATION) */}
        {/* ================================================================= */}
        {activeTab === 'health' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Financial Health Gauge & Pillars */}
              <div className="lg:col-span-7">
                <FinancialHealthGauge
                  calculationResult={calculationResult}
                />
              </div>

              {/* Right Column: Insurance Protection Indicators & Resilience Cards */}
              <div className="lg:col-span-5 space-y-6">
                {/* Insurance Protection Status Card */}
                <div className="bg-white border border-[#E7ECE8] rounded-3xl p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7ECE8]">
                    <span className="text-xs font-mono font-bold text-[#202B26] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#176B50]" />
                      <span>Insurance Protection Indicators</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#66736C]">
                      Pillar 4 (0–25 pts)
                    </span>
                  </div>
                  <p className="text-xs text-[#66736C] leading-relaxed">
                    Active life and health insurance protect your savings from catastrophic health events or loss of family income.
                  </p>

                  {/* Life Insurance */}
                  <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#202B26]">Life Insurance (Term / LIC)</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        inputs.has_life_insurance === true
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : (inputs.has_life_insurance === false ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-[#66736C] border-slate-200')
                      }`}>
                        {inputs.has_life_insurance === true ? 'Covered' : (inputs.has_life_insurance === false ? 'Uninsured' : 'Unspecified')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_life_insurance', true)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_life_insurance === true
                            ? 'bg-[#ECFDF5] border-[#176B50] text-[#176B50] font-bold shadow-sm'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Covered
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_life_insurance', false)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_life_insurance === false
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-sm'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Uninsured
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_life_insurance', null)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_life_insurance === null
                            ? 'bg-slate-200 border-slate-300 text-[#202B26] font-bold'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Unspecified
                      </button>
                    </div>
                  </div>

                  {/* Health Insurance */}
                  <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#202B26]">Health Insurance (Mediclaim)</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        inputs.has_health_insurance === true
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : (inputs.has_health_insurance === false ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-[#66736C] border-slate-200')
                      }`}>
                        {inputs.has_health_insurance === true ? 'Covered' : (inputs.has_health_insurance === false ? 'Uninsured' : 'Unspecified')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_health_insurance', true)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_health_insurance === true
                            ? 'bg-[#ECFDF5] border-[#176B50] text-[#176B50] font-bold shadow-sm'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Covered
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_health_insurance', false)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_health_insurance === false
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-sm'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Uninsured
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_health_insurance', null)}
                        className={`py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                          inputs.has_health_insurance === null
                            ? 'bg-slate-200 border-slate-300 text-[#202B26] font-bold'
                            : 'border-[#E7ECE8] text-[#66736C] hover:border-[#D5E4DC] hover:text-[#202B26] bg-white'
                        }`}
                      >
                        Unspecified
                      </button>
                    </div>
                  </div>
                </div>

                {/* Emergency Runway Resilience Card */}
                <div className="p-5 rounded-3xl bg-white border border-[#E7ECE8] shadow-card space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-teal-700" />
                      <span>Emergency Runway</span>
                    </span>
                    <span>Pillar 2 (0–25 pts)</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-[#202B26]">
                    {inputs.liquid_savings !== '' && inputs.essential_expenses !== '' && calculationResult.pillars?.emergency_runway_months !== undefined && calculationResult.pillars?.emergency_runway_months !== null
                      ? `${calculationResult.pillars.emergency_runway_months.toFixed(1)} Months`
                      : 'Undeclared'}
                  </div>
                  <p className="text-xs text-[#66736C] leading-relaxed">
                    Calculated against essential living expenses {inputs.essential_expenses !== '' ? `(₹${Number(inputs.essential_expenses || 0).toLocaleString('en-IN')}/mo)` : '(undeclared)'}, excluding EMIs. Target: 3–6 months liquid buffer.
                  </p>
                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                      inputs.liquid_savings === '' || inputs.essential_expenses === ''
                        ? 'bg-slate-100 text-[#66736C] border-slate-200'
                        : (calculationResult.pillars?.emergency_runway_months || 0) >= 6
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : ((calculationResult.pillars?.emergency_runway_months || 0) >= 3
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200')
                    }`}>
                      {inputs.liquid_savings === '' || inputs.essential_expenses === ''
                        ? 'Buffer Undeclared'
                        : (calculationResult.pillars?.emergency_runway_months || 0) >= 6
                          ? 'Target Buffer Met (≥6 mo)'
                          : ((calculationResult.pillars?.emergency_runway_months || 0) >= 3
                              ? 'Moderate Buffer (3–6 mo)'
                              : 'Under-buffered (<3 mo)')}
                    </span>
                  </div>
                </div>

                {/* Debt & EMI Burden Card */}
                <div className="p-5 rounded-3xl bg-white border border-[#E7ECE8] shadow-card space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      <span>EMI Debt Ratio</span>
                    </span>
                    <span>Pillar 3 (0–25 pts)</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-[#202B26]">
                    {calculationResult.monthly_income > 0 && calculationResult.pillars?.emi_ratio_pct !== undefined && calculationResult.pillars?.emi_ratio_pct !== null
                      ? `${calculationResult.pillars.emi_ratio_pct.toFixed(1)}% of Income`
                      : 'Undeclared'}
                  </div>
                  <p className="text-xs text-[#66736C] leading-relaxed">
                    Monthly loan EMIs {inputs.monthly_emi !== '' ? `(₹${Number(inputs.monthly_emi || 0).toLocaleString('en-IN')}/mo)` : '(undeclared)'} measured against take-home income. Safe threshold: ≤ 30%.
                  </p>
                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                      calculationResult.monthly_income === 0
                        ? 'bg-slate-100 text-[#66736C] border-slate-200'
                        : (calculationResult.pillars?.emi_ratio_pct || 0) <= 30
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {calculationResult.monthly_income === 0
                        ? 'Awaiting Income'
                        : (calculationResult.pillars?.emi_ratio_pct || 0) <= 30
                          ? 'Safe Debt Ratio (≤30%)'
                          : 'High Debt Burden (>30%)'}
                    </span>
                  </div>
                </div>

                {/* Next Steps / Navigation Card */}
                <div className="p-5 rounded-3xl bg-white border border-[#E7ECE8] shadow-card flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#176B50] font-bold">
                    <Sparkles className="w-4 h-4 text-[#176B50]" />
                    <span>Next Steps</span>
                  </div>
                  <p className="text-xs text-[#66736C] leading-relaxed">
                    Optimize your budget to improve your resilience score, or discover verified statutory schemes matching your profile.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('budget')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] text-xs font-mono font-bold border border-[#D5E4DC] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Budget Planner</span>
                    </button>
                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white text-xs font-mono font-bold shadow-sm transition-colors"
                    >
                      <span>Find My Schemes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{
          page: 'FinancialHealth',
          monthly_budget: calculationResult?.monthly_surplus > 0 ? calculationResult.monthly_surplus : undefined,
          financial_health: financialHealthContext
        }}
      />
    </div>
  );
};
