import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { 
  Target, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  GraduationCap, 
  Heart, 
  ShieldCheck, 
  Landmark, 
  TrendingUp, 
  PiggyBank, 
  Sprout, 
  Activity, 
  Home, 
  Briefcase,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GoalFeasibilitySimulator } from '../components/financial/GoalFeasibilitySimulator';

const GOAL_CATEGORY_DEFAULTS = {
  education: { target: 1500000, years: 10, deposit: 50000 },
  retirement: { target: 5000000, years: 20, deposit: 100000 },
  emergency: { target: 300000, years: 2, deposit: 25000 },
  tax: { target: 150000, years: 3, deposit: 10000 },
  marriage: { target: 2000000, years: 12, deposit: 50000 },
  wealth: { target: 2500000, years: 15, deposit: 50000 },
  farming: { target: 500000, years: 5, deposit: 20000 },
  health: { target: 500000, years: 5, deposit: 25000 },
  housing: { target: 3000000, years: 8, deposit: 200000 },
  business: { target: 1000000, years: 5, deposit: 50000 },
};

export const GoalPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const savedGoal = JSON.parse(sessionStorage.getItem('sanchay_goal') || '{}');
  const [selectedGoal, setSelectedGoal] = useState(savedGoal.goal || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  // Read separate goal simulation plan if previously stored
  const savedGoalPlan = JSON.parse(sessionStorage.getItem('sanchay_goal_plan') || 'null');
  const [activeGoalPlan, setActiveGoalPlan] = useState(savedGoalPlan);
  const [showSimulator, setShowSimulator] = useState(() => !!savedGoalPlan);

  const goals = [
    { id: 'education', name: t('goals.education', 'Child Education'), desc: t('goals.educationDesc', 'Higher education & college tuition fund'), icon: GraduationCap },
    { id: 'retirement', name: t('goals.retirement', 'Retirement & Pension'), desc: t('goals.retirementDesc', 'Guaranteed monthly income post age 60'), icon: Landmark },
    { id: 'emergency', name: t('goals.emergency', 'Emergency Fund'), desc: t('goals.emergencyDesc', 'High liquidity safety buffer for unexpected needs'), icon: PiggyBank },
    { id: 'tax', name: t('goals.tax', 'Tax Saving (80C / 80CCD)'), desc: t('goals.taxDesc', 'Reduce annual tax liability legally under IT Act'), icon: ShieldCheck },
    { id: 'marriage', name: t('goals.marriage', 'Child Marriage'), desc: t('goals.marriageDesc', 'Long-term corpus for daughter/son wedding'), icon: Heart },
    { id: 'wealth', name: t('goals.wealth', 'Long-term Wealth Creation'), desc: t('goals.wealthDesc', 'Disciplined sovereign compound growth'), icon: TrendingUp },
    { id: 'farming', name: t('goals.farming', 'Farming & Agriculture'), desc: t('goals.farmingDesc', 'Crop security, Kisan credit & farm inputs'), icon: Sprout },
    { id: 'health', name: t('goals.health', 'Healthcare Assurance'), desc: t('goals.healthDesc', 'Sovereign protection against medical expenses'), icon: Activity },
    { id: 'housing', name: t('goals.housing', 'Home Ownership'), desc: t('goals.housingDesc', 'Pucca home construction & interest subsidy'), icon: Home },
    { id: 'business', name: t('goals.business', 'Business & Livelihood'), desc: t('goals.businessDesc', 'Collateral-free micro-loans & enterprise growth'), icon: Briefcase },
  ];

  const selectedGoalObj = goals.find(g => g.id === selectedGoal);

  // Safely assemble goal context for Sakhi only when available and valid
  const goalPlanContext = useMemo(() => {
    if (!activeGoalPlan || (activeGoalPlan.goalCategory && activeGoalPlan.goalCategory !== selectedGoal)) {
      return null;
    }
    return {
      goal_category: activeGoalPlan.goalCategory || selectedGoal,
      goal_name: activeGoalPlan.goalName || selectedGoalObj?.name || 'Financial Milestone',
      target_amount: Number(activeGoalPlan.targetAmount) || 0,
      horizon_years: Number(activeGoalPlan.years) || 0,
      initial_amount: Number(activeGoalPlan.initialAmount) || 0,
      proposed_monthly_contribution: Number(activeGoalPlan.proposedContribution) || 0,
      required_monthly_contribution: Number(activeGoalPlan.requiredMonthlyContribution) || 0,
      projected_future_value: Number(activeGoalPlan.projectedFutureValue) || 0,
      feasibility_status: activeGoalPlan.feasibilityStatus,
      sub_status: activeGoalPlan.subStatus,
      monthly_shortfall: activeGoalPlan.monthlyShortfall !== undefined ? Number(activeGoalPlan.monthlyShortfall) : undefined,
      surplus_remaining: activeGoalPlan.surplusRemainingAfterContribution !== undefined ? activeGoalPlan.surplusRemainingAfterContribution : undefined
    };
  }, [activeGoalPlan, selectedGoal, selectedGoalObj]);

  const handleNext = () => {
    if (!selectedGoal) {
      setErrorMessage(t('goals.errorSelection', 'Please select a primary financial goal to continue.'));
      return;
    }
    setErrorMessage('');
    sessionStorage.setItem('sanchay_goal', JSON.stringify({ goal: selectedGoal }));
    sessionStorage.removeItem('sanchay_recommendation_result');
    
    const searchParams = new URLSearchParams(window.location.search);
    const schemeId = searchParams.get('schemeId');
    navigate('/preferences' + (schemeId ? `?schemeId=${schemeId}` : ''));
  };

  return (
    <div className="min-h-screen bg-[#060b08] text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Step Indicator Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
              <span className="text-emerald-400 uppercase tracking-widest">{t('goals.stepIndicator', 'STEP 2 OF 3')}</span>
              <span className="uppercase tracking-widest text-slate-400">{t('goals.title', 'Primary Financial Goal')}</span>
            </div>
            <div className="w-full h-2 bg-emerald-950/60 rounded-full overflow-hidden border border-emerald-500/20">
              <div className="w-2/3 h-full bg-emerald-500 rounded-full transition-all duration-300" />
            </div>
          </div>

          {/* Page Card Container */}
          <div className="bg-[#0c1611]/90 rounded-3xl p-6 sm:p-10 shadow-2xl border border-emerald-500/20 space-y-8 backdrop-blur-sm">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <Target className="w-3.5 h-3.5" />
                <span>{t('goals.stepIndicator', 'Step 2: Select Financial Goal')}</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-white">
                {t('goals.title', 'What is your primary financial goal?')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                {t('goals.subtitle', 'Choose the milestone you want to achieve. Sanchay will rank schemes that directly satisfy this objective.')}
              </p>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {goals.map((g) => {
                const Icon = g.icon;
                const isSelected = selectedGoal === g.id;

                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGoal(g.id)}
                    className={`p-5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-emerald-500/20 bg-[#08120d] hover:border-emerald-400/50 hover:bg-[#101e17]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-[#060b08] text-emerald-400 border border-emerald-500/25'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>

                      <h3 className="font-serif font-bold text-base text-white mb-1">
                        {g.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {g.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Progressive Step: Goal Feasibility Simulator */}
            {selectedGoal && (
              <div className="pt-4 border-t border-emerald-500/15 space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#08120d] border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>{t('goals.feasibilityTitle', 'Detailed Goal Feasibility (Optional)')}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Simulate target amount, investment horizon, and cashflow surplus feasibility for <strong className="text-white">{goals.find(g => g.id === selectedGoal)?.name}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSimulator(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer shrink-0 ${
                      showSimulator 
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-sm' 
                        : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 hover:text-white'
                    }`}
                  >
                    <span>{showSimulator ? t('goals.hideSimulator', 'Hide Feasibility Simulator') : t('goals.showSimulator', 'Simulate Goal Feasibility')}</span>
                    {showSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showSimulator && (
                  <div className="pt-2 animate-in fade-in duration-300">
                    <GoalFeasibilitySimulator
                      goalName={goals.find(g => g.id === selectedGoal)?.name || 'Financial Milestone'}
                      goalCategory={selectedGoal}
                      initialTarget={(GOAL_CATEGORY_DEFAULTS[selectedGoal] || { target: 1000000 }).target}
                      initialYears={(GOAL_CATEGORY_DEFAULTS[selectedGoal] || { years: 10 }).years}
                      initialDeposit={(GOAL_CATEGORY_DEFAULTS[selectedGoal] || { deposit: 50000 }).deposit}
                      onSaveGoal={(plan) => setActiveGoalPlan(plan)}
                    />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

            {/* Bottom Actions: Back to Profile & Continue to Preferences */}
            <div className="flex items-center justify-between pt-4 border-t border-emerald-500/15">
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('goals.backBtn', '← Back to Profile')}</span>
              </Link>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>{t('goals.continueBtn', 'Continue to Preferences →')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
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
          page: 'Goal',
          goal: selectedGoal || undefined,
          goal_name: selectedGoalObj?.name || undefined,
          monthly_budget: goalPlanContext?.proposed_monthly_contribution || undefined,
          horizon_years: goalPlanContext?.horizon_years || (GOAL_CATEGORY_DEFAULTS[selectedGoal]?.years) || undefined,
          goal_plan: goalPlanContext
        }}
      />

    </div>
  );
};
