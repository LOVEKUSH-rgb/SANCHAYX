import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { postRecommendation } from '../services/api';
import { Sliders, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FindMySchemesGateModal } from '../components/auth/FindMySchemesGateModal';

export const PreferencesPage = () => {
  const navigate = useNavigate();
  const { t, currentLang } = useLanguage();
  const { canUseFindMySchemes, recordFindMySchemesUsage } = useAuth();
  const [isGateOpen, setIsGateOpen] = useState(false);

  const savedPref = JSON.parse(sessionStorage.getItem('sanchay_preferences') || '{}');
  const [monthlyBudget, setMonthlyBudget] = useState(savedPref.monthlyBudget || savedPref.monthly_budget || 2000);
  const [horizonYears, setHorizonYears] = useState(savedPref.horizonYears || savedPref.horizon_years || 10);
  const [liquidityNeed, setLiquidityNeed] = useState(savedPref.liquidityNeed || savedPref.liquidity_preference || 'medium');
  const [taxPriority, setTaxPriority] = useState(savedPref.taxPriority !== undefined ? savedPref.taxPriority : true);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  // Loading state with multi-step progressive messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(t('preferences.analyzing', 'Finding schemes that fit your goals...'));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canUseFindMySchemes()) {
      setIsGateOpen(true);
      return;
    }

    recordFindMySchemesUsage();
    setIsSubmitting(true);

    const prefData = {
      monthlyBudget: Number(monthlyBudget),
      monthly_budget: Number(monthlyBudget),
      horizonYears: Number(horizonYears),
      horizon_years: Number(horizonYears),
      liquidityNeed,
      liquidity_preference: liquidityNeed,
      taxPriority,
      tax_preference: taxPriority
    };
    sessionStorage.setItem('sanchay_preferences', JSON.stringify(prefData));

    const profile = JSON.parse(sessionStorage.getItem('sanchay_profile') || '{"persona":"young_professional","age":25,"gender":"any","residency_status":"resident"}');
    const goal = JSON.parse(sessionStorage.getItem('sanchay_goal') || '{"goal":"wealth"}');

    // Multi-stage visual trust progress
    setTimeout(() => setLoadingStep(currentLang === 'hi' ? 'आयु और निवास की वैधानिक पात्रता जांची जा रही है...' : 'Checking statutory age & residency eligibility...'), 400);
    setTimeout(() => setLoadingStep(currentLang === 'hi' ? 'मासिक बजट और निवेश अवधि का मिलान हो रहा है...' : 'Matching your monthly budget & lock-in horizon...'), 900);
    setTimeout(() => setLoadingStep(currentLang === 'hi' ? 'Fit Score के अनुसार शीर्ष योजनाओं की रैंकिंग जारी है...' : 'Ranking top verified options by Fit Score...'), 1400);

    const searchParams = new URLSearchParams(window.location.search);
    const schemeId = searchParams.get('schemeId');
    const dest = '/recommendations' + (schemeId ? `?schemeId=${schemeId}` : '');

    try {
      const res = await postRecommendation(profile, goal, prefData, 'all', schemeId);
      sessionStorage.setItem('sanchay_recommendation_result', JSON.stringify(res));
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(dest);
      }, 1800);
    } catch (err) {
      console.warn('API error during recommendation calculation:', err);
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(dest);
      }, 1800);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white relative">
      <Navbar />

      {/* Progressive Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-sanchay-emerald-600/20 border border-sanchay-emerald-500/40 flex items-center justify-center mb-6 shadow-floating animate-pulse">
            <Sparkles className="w-10 h-10 text-sanchay-gold-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-white mb-2">
            {t('preferences.title', 'Evaluating Verified Schemes')}
          </h2>
          <p className="font-mono text-sm text-sanchay-emerald-400 font-bold max-w-md animate-pulse">
            {loadingStep}
          </p>
          <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-sanchay-emerald-500 rounded-full animate-indeterminate" />
          </div>
        </div>
      )}

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Step Indicator Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
              <span className="text-sanchay-emerald-700 uppercase tracking-widest">{t('preferences.stepIndicator', 'STEP 3 OF 3')}</span>
              <span className="uppercase tracking-widest">{t('preferences.title', 'Savings Capacity & Preferences')}</span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div className="w-full h-full bg-sanchay-emerald-600 rounded-full transition-all duration-300" />
            </div>
          </div>

          {/* Page Card Container */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-editorial border border-slate-200/90 space-y-8">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-sanchay-emerald-200">
                <Sliders className="w-3.5 h-3.5" />
                <span>{t('preferences.stepIndicator', 'Step 3: Financial Capacity')}</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950">
                {t('preferences.title', 'What are your budget and time preferences?')}
              </h1>
              <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-2 leading-relaxed">
                {t('preferences.subtitle', 'Set your monthly contribution capacity, timeframe, and liquidity requirements.')}
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Monthly Contribution Slider */}
              <div className="p-6 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-sanchay-navy-950 block">
                      {t('preferences.budgetLabel', 'Monthly Contribution Capacity')}
                    </label>
                    <span className="text-[11px] text-slate-500">{t('preferences.budgetHint', 'Amount you can comfortably deposit each month')}</span>
                  </div>
                  <span className="font-serif font-extrabold text-sanchay-emerald-700 text-2xl">
                    ₹{Number(monthlyBudget).toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="250"
                  max="50000"
                  step="250"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className="w-full sanchay-slider cursor-pointer h-2.5 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase mt-2">
                  <span>Min ₹250/mo (SSY/APY)</span>
                  <span>₹10,000</span>
                  <span>₹25,000</span>
                  <span>₹50,000+/mo</span>
                </div>
              </div>

              {/* Time Horizon Slider */}
              <div className="p-6 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-sanchay-navy-950 block">
                      {t('preferences.horizonLabel', 'Planned Time Horizon')}
                    </label>
                    <span className="text-[11px] text-slate-500">{t('preferences.horizonHint', 'How many years can you stay invested?')}</span>
                  </div>
                  <span className="font-serif font-extrabold text-sanchay-navy-950 text-2xl">
                    {horizonYears} {currentLang === 'hi' ? 'वर्ष' : currentLang === 'mr' ? 'वर्षे' : currentLang === 'bn' ? 'বছর' : currentLang === 'te' ? 'సంవత్సరాలు' : 'Years'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(Number(e.target.value))}
                  className="w-full sanchay-slider cursor-pointer h-2.5 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase mt-2">
                  <span>1 Year</span>
                  <span>5 Years (NSC)</span>
                  <span>15 Years (PPF)</span>
                  <span>21+ Years (SSY/NPS)</span>
                </div>
              </div>

              {/* Liquidity Need & Tax Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Liquidity */}
                <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-sanchay-navy-950 block mb-1.5">
                    {t('preferences.liquidityLabel', 'Liquidity Preference')}
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">Partial premature withdrawal required?</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {['high', 'medium', 'low'].map((mode) => {
                      const isSelected = liquidityNeed === mode;
                      return (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => setLiquidityNeed(mode)}
                          className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sanchay-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-sanchay-navy-950 hover:bg-slate-50'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tax Priority */}
                <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-sanchay-navy-950 block mb-1.5">
                    {t('preferences.taxLabel', 'Tax Saving Priority (80C / 80CCD)')}
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">Prioritize tax-exempt / EEE status schemes?</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxPriority(true)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        taxPriority
                          ? 'bg-sanchay-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-sanchay-navy-950 hover:bg-slate-50'
                      }`}
                    >
                      {t('preferences.taxYes', 'Yes, High Priority')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxPriority(false)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !taxPriority
                          ? 'bg-sanchay-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-sanchay-navy-950 hover:bg-slate-50'
                      }`}
                    >
                      {t('preferences.taxNo', 'No / Not Needed')}
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions: Back to Goal & Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                to="/goal"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-sanchay-navy-950 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('preferences.backBtn', '← Back to Goals')}</span>
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{t('preferences.submitBtn', 'Evaluate & Rank My Schemes →')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

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
        context={{ page: 'Preferences' }}
      />

      <FindMySchemesGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
      />

    </div>
  );
};
