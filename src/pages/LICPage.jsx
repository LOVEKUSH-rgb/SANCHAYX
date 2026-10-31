import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LICPlanCard } from '../components/lic/LICPlanCard';
import { LICPlanDetailsModal } from '../components/lic/LICPlanDetailsModal';
import { LICRecommendForm } from '../components/lic/LICRecommendForm';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { fetchLicPlans, fetchLicInfo } from '../services/api';
import { FALLBACK_LIC_PLANS } from '../data/licPlansFallback';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, Search, Sparkles, Filter, ChevronRight,
  Award, TrendingUp, Layers, HelpCircle, ExternalLink, RefreshCw
} from 'lucide-react';

export const LICPage = () => {
  const { t, currentLang } = useLanguage();
  const [plans, setPlans] = useState(FALLBACK_LIC_PLANS);
  const [licInfo, setLicInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRecommendForm, setShowRecommendForm] = useState(false);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  // Category Tabs Configuration
  const categories = [
    { id: 'ALL', label: t('lic.allPlans', 'All Plans'), count: 38 },
    { id: 'Endowment', label: t('lic.endowment', 'Endowment'), count: 9 },
    { id: 'Term Assurance', label: t('lic.termAssurance', 'Term Assurance'), count: 8 },
    { id: 'Whole Life', label: t('lic.wholeLife', 'Whole Life'), count: 2 },
    { id: 'Money Back', label: t('lic.moneyBack', 'Money Back'), count: 4 },
    { id: 'Child Plans', label: t('lic.childPlans', 'Child Plans'), count: 4 },
    { id: 'Pension', label: t('lic.pensionAnnuity', 'Pension / Annuity'), count: 5 },
    { id: 'Unit Linked', label: t('lic.unitLinked', 'Unit Linked (ULIP)'), count: 4 },
    { id: 'Micro Insurance', label: t('lic.microInsurance', 'Micro Insurance'), count: 2 },
  ];

  useEffect(() => {
    async function loadLicData() {
      try {
        const [plansData, infoData] = await Promise.all([
          fetchLicPlans(),
          fetchLicInfo()
        ]);
        if (plansData && Array.isArray(plansData) && plansData.length > 0) {
          setPlans(plansData);
        }
        if (infoData) {
          setLicInfo(infoData);
        }
      } catch (err) {
        console.warn('Using verified static LIC plans fallback:', err);
      }
    }
    loadLicData();
  }, []);

  // Filtered Plans Logic
  const filteredPlans = plans.filter((plan) => {
    // 1. Never show withdrawn plans
    const status = String(plan.active_status || plan.status || 'active').toLowerCase();
    if (status === 'withdrawn' || status === 'inactive') return false;

    // 2. Category Filter
    if (selectedCategory !== 'ALL') {
      const cat = String(plan.category || '').toLowerCase();
      const sel = selectedCategory.toLowerCase();
      if (sel === 'child plans') {
        const isChild = plan.child_age_rules?.is_child_plan || ['774', '732', '734', '733', '890'].includes(String(plan.plan_number));
        if (!isChild) return false;
      } else if (sel === 'pension') {
        if (!cat.includes('pension') && !cat.includes('annuity')) return false;
      } else if (!cat.includes(sel)) {
        return false;
      }
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = String(plan.plan_name || '').toLowerCase();
      const num = String(plan.plan_number || '').toLowerCase();
      const uin = String(plan.uin || '').toLowerCase();
      const desc = String(plan.short_description || '').toLowerCase();
      const purpose = String(plan.main_purpose || '').toLowerCase();
      const cat = String(plan.category || '').toLowerCase();

      return name.includes(q) || num.includes(q) || uin.includes(q) || desc.includes(q) || purpose.includes(q) || cat.includes(q);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#202B26] flex flex-col font-sans selection:bg-[#176B50] selection:text-white">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Banner */}
          <div className="mb-10 text-center max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] text-[#176B50] text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-[#D5E4DC] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#176B50]" />
              <span>{t('lic.statutoryActBadge', 'Life Insurance Corporation of India • Statutory Act 1956 • IRDAI Reg. 512')}</span>
            </div>

            <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-[#202B26] tracking-tight leading-tight">
              {t('lic.pageHeadline', 'Official LIC Plans & Guidance')}
            </h1>

            <p className="text-sm sm:text-base text-[#66736C] mt-3 max-w-2xl mx-auto leading-relaxed">
              {t('lic.pageSubtitle', 'Explore all 38 active, verified LIC plans across Life Assurance, Pension Annuity, ULIPs, and Micro Insurance. Grounded directly in official LIC gazettes and brochures.')}
            </p>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-6 text-left">
              <div className="p-4 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66736C] block">{t('lic.totalActive', 'Total Active')}</span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-[#202B26] block mt-0.5">38 {t('lic.plans', 'Plans')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66736C] block">{t('lic.lifeAssurance', 'Life Assurance')}</span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-[#176B50] block mt-0.5">27 {t('lic.plans', 'Plans')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66736C] block">{t('lic.pensionAnnuity', 'Pension / Annuity')}</span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-rose-700 block mt-0.5">5 {t('lic.plans', 'Plans')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66736C] block">{t('lic.ulipMicro', 'ULIP & Micro')}</span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-amber-700 block mt-0.5">6 {t('lic.plans', 'Plans')}</span>
              </div>
            </div>

            {/* CTA to Toggle Recommendation Engine Form */}
            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  const nextState = !showRecommendForm;
                  setShowRecommendForm(nextState);
                  if (nextState) {
                    setTimeout(() => {
                      document.getElementById('lic-recommend-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }}
                className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-card hover:shadow-card-hover transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{showRecommendForm ? t('lic.hideMatchFinder', 'Hide Match Finder') : t('lic.findMyLicMatch', 'Find My LIC Plan Match')}</span>
              </button>

              <a
                href="https://www.licindia.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white hover:bg-[#FAFAFC] text-[#202B26] font-mono font-bold text-xs uppercase tracking-wider border border-[#E7ECE8] shadow-card hover:border-[#D5E4DC] transition-colors"
              >
                <span>{t('lic.officialLicPortal', 'Official LIC Portal')}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#176B50]" />
              </a>
            </div>

          </div>

          {/* Interactive Recommendation Engine Drawer */}
          {showRecommendForm && (
            <div id="lic-recommend-section" className="scroll-mt-6">
              <LICRecommendForm
                onViewDetails={(plan) => setSelectedPlan(plan)}
              />
            </div>
          )}

          {/* Search & Category Filter Section */}
          <div className="space-y-4 mb-8">
            
            {/* Search Input Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="w-4 h-4 text-[#176B50] absolute left-4.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('lic.searchPlaceholder', 'Search across 38 plans by Name (e.g. Jeevan Tarun), Number (e.g. 734), UIN, or Goal...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-14 py-3.5 rounded-2xl bg-white border border-[#E7ECE8] shadow-card font-sans text-xs sm:text-sm text-[#202B26] placeholder:text-[#66736C] focus:outline-hidden focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#66736C] hover:text-[#202B26]"
                >
                  {t('common.clear', 'Clear')}
                </button>
              )}
            </div>

            {/* Category Filter Pills Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar justify-start sm:justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-[#176B50] text-white shadow-xs'
                      : 'bg-white hover:bg-[#FAFAFC] text-[#66736C] hover:text-[#202B26] border border-[#E7ECE8]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between text-xs font-mono text-[#66736C] pt-2 border-t border-[#E7ECE8]">
              <span>{t('featuredSchemes.showingCount', 'Showing')} <strong className="text-[#202B26]">{filteredPlans.length}</strong> {t('lic.verifiedActivePlansCount', 'verified active LIC plans')}</span>
              {selectedCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-[#176B50] hover:underline font-bold cursor-pointer"
                >
                  {t('lic.resetCategoryFilter', 'Reset Category Filter')}
                </button>
              )}
            </div>

          </div>

          {/* Active Plans Cards Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#176B50] animate-spin mx-auto" />
              <p className="font-mono text-xs text-[#66736C] uppercase tracking-wider">
                {t('lic.loadingPlans', 'Loading verified LIC plans database...')}
              </p>
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <LICPlanCard
                  key={plan.plan_id || plan.plan_number}
                  plan={plan}
                  onViewDetails={(p) => setSelectedPlan(p)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#E7ECE8] shadow-card p-8 max-w-xl mx-auto space-y-3">
              <HelpCircle className="w-10 h-10 text-[#66736C] mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#202B26]">
                {t('lic.noMatchingPlans', 'No matching LIC plans found')}
              </h3>
              <p className="text-xs text-[#66736C]">
                {t('lic.noMatchingDesc', 'We couldn\'t find any active LIC plans matching your criteria. Try searching by plan number (e.g. 715, 734) or clear your filter.')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="px-4 py-2 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs uppercase tracking-wider mt-2 cursor-pointer shadow-xs"
              >
                {t('lic.showAll38Plans', 'Show All 38 Plans')}
              </button>
            </div>
          )}

          {/* Official Verification Promise Box */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border border-[#E7ECE8] text-xs sm:text-sm text-[#202B26] leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
            <div className="space-y-1">
              <span className="font-serif font-bold text-[#202B26] block text-base sm:text-lg">
                {t('lic.governanceTitle', 'Official LIC Data Governance Guarantee')}
              </span>
              <p className="text-xs sm:text-sm text-[#66736C]">
                {t('lic.governanceDesc', 'All 38 plans, age rules, sum assured limits, and statutory benefits displayed on SANCHAY are 100% verified against official gazettes published by Life Insurance Corporation of India (LIC). No speculative or third-party calculations.')}
              </p>
            </div>
            <a
              href="https://www.licindia.in/"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-2xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs uppercase tracking-wider shrink-0 inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <span>{t('lic.verifyAtOfficial', 'Verify at LIC Official')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </main>

      {/* Plan Details Modal */}
      {selectedPlan && (
        <LICPlanDetailsModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      <Footer />

      {/* Grounded Sakhi Assistant with LIC Context */}
      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{ page: 'LIC' }}
      />
    </div>
  );
};
