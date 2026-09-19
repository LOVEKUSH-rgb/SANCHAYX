import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { Target, ArrowRight, ArrowLeft, CheckCircle2, GraduationCap, Heart, ShieldCheck, Landmark, TrendingUp, PiggyBank, Sprout, Activity, Home, Briefcase } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const GoalPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const savedGoal = JSON.parse(sessionStorage.getItem('sanchay_goal') || '{}');
  const [selectedGoal, setSelectedGoal] = useState(savedGoal.goal || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

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
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Step Indicator Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
              <span className="text-sanchay-emerald-700 uppercase tracking-widest">{t('goals.stepIndicator', 'STEP 2 OF 3')}</span>
              <span className="uppercase tracking-widest">{t('goals.title', 'Primary Financial Goal')}</span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-sanchay-emerald-600 rounded-full transition-all duration-300" />
            </div>
          </div>

          {/* Page Card Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-editorial border border-slate-200/90 space-y-8">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-sanchay-emerald-200">
                <Target className="w-3.5 h-3.5" />
                <span>{t('goals.stepIndicator', 'Step 2: Select Financial Goal')}</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950">
                {t('goals.title', 'What is your primary financial goal?')}
              </h1>
              <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-2 leading-relaxed">
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
                        ? 'border-sanchay-emerald-600 bg-sanchay-emerald-50/50 shadow-xs ring-2 ring-sanchay-emerald-500/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:bg-[#F8F6F0]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-sanchay-emerald-600 text-white' : 'bg-[#F8F6F0] text-sanchay-navy-950 border border-slate-200'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600" />}
                      </div>

                      <h3 className="font-serif font-bold text-base text-sanchay-navy-950 mb-1">
                        {g.name}
                      </h3>
                      <p className="text-[11px] text-sanchay-navy-700 leading-snug">
                        {g.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

            {/* Bottom Actions: Back to Profile & Continue to Preferences */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-sanchay-navy-950 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('goals.backBtn', '← Back to Profile')}</span>
              </Link>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 transition-all cursor-pointer"
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
        context={{ page: 'Goal' }}
      />

    </div>
  );
};
