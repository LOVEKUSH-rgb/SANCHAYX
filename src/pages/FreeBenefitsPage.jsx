import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Filter, ShieldCheck, CheckCircle2, Gift, Building2, MapPin, ExternalLink, ArrowRight, RefreshCw, SlidersHorizontal, Bookmark } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { getFreeBenefits } from '../services/api';
import { FALLBACK_FREE_BENEFITS, filterLocalFreeBenefits } from '../data/freeBenefitsFallback';
import { FreeBenefitDetailsModal } from '../components/free_benefits/FreeBenefitDetailsModal';
import { FreeBenefitEligibilityModal } from '../components/free_benefits/FreeBenefitEligibilityModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { localizeFreeBenefit, getLocalizedCommonText, getLocalizedBenefitType } from '../utils/contentLocalizer';

export const FreeBenefitsPage = () => {
  const { t, currentLang } = useLanguage();
  const { savedPlanIds, addToMyPlans, removeFromMyPlans, isAuthenticated, openAuthModal } = useAuth();
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  const [benefits, setBenefits] = useState(FALLBACK_FREE_BENEFITS);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBenefitType, setSelectedBenefitType] = useState('all');
  const [activeOnly, setActiveOnly] = useState(true);

  // Modals
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [eligibilityBenefit, setEligibilityBenefit] = useState(null);

  const fetchBenefits = async () => {
    setLoading(true);
    const params = {
      level: selectedLevel !== 'all' ? selectedLevel : undefined,
      state: selectedState !== 'all' ? selectedState : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      benefit_type: selectedBenefitType !== 'all' ? selectedBenefitType : undefined,
      status: activeOnly ? 'active_listed' : undefined,
      q: searchQuery.trim() || undefined
    };

    try {
      const data = await getFreeBenefits(params);
      if (data && Array.isArray(data) && data.length > 0) {
        setBenefits(data);
      } else {
        setBenefits(filterLocalFreeBenefits(params));
      }
    } catch (err) {
      console.warn('Free Benefits fetch notice, using verified local dataset:', err);
      setBenefits(filterLocalFreeBenefits(params));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, [selectedLevel, selectedState, selectedCategory, selectedBenefitType, activeOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBenefits();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedState('all');
    setSelectedCategory('all');
    setSelectedBenefitType('all');
    setActiveOnly(true);
  };

  return (
    <div className="min-h-screen bg-[#060b08] text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Sticky Sanchay Header / Navbar Banner */}
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 w-full">
        
        {/* Page Hero Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-emerald-500/30 shadow-2xs">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Verified Sovereign Free Benefits & Assistance</span>
          </div>
          
          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Free Benefits & Direct Assistance
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Discover 100% free food grains, zero-cost skill development with stipends, and state educational scholarships without middleman commissions.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#0c1611]/90 rounded-3xl p-6 shadow-2xl border border-emerald-500/20 mb-10">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            
            {/* Search row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by benefit name, free coaching, PMGKAY, state, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#060b08] border border-emerald-500/25 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-hidden transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Search Benefits
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#060b08] hover:bg-[#12221a] text-slate-300 border border-emerald-500/20 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              
              {/* 1. Level / Authority */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Jurisdiction / Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060b08] border border-emerald-500/25 font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                >
                  <option value="all" className="bg-[#0c1611] text-white">All Levels (Central + State + UT)</option>
                  <option value="central" className="bg-[#0c1611] text-white">Central Government Only</option>
                  <option value="state" className="bg-[#0c1611] text-white">State Governments Only</option>
                  <option value="ut" className="bg-[#0c1611] text-white">Union Territories (UT) Only</option>
                </select>
              </div>

              {/* 2. State */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  State / UT
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060b08] border border-emerald-500/25 font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                >
                  <option value="all" className="bg-[#0c1611] text-white">All States & All India</option>
                  <option value="All India" className="bg-[#0c1611] text-white">All India (Central Schemes)</option>
                  <option value="Assam" className="bg-[#0c1611] text-white">Assam</option>
                  <option value="Delhi" className="bg-[#0c1611] text-white">Delhi</option>
                  <option value="Gujarat" className="bg-[#0c1611] text-white">Gujarat</option>
                  <option value="Haryana" className="bg-[#0c1611] text-white">Haryana</option>
                  <option value="Maharashtra" className="bg-[#0c1611] text-white">Maharashtra</option>
                  <option value="Nagaland" className="bg-[#0c1611] text-white">Nagaland</option>
                  <option value="Puducherry" className="bg-[#0c1611] text-white">Puducherry</option>
                  <option value="Rajasthan" className="bg-[#0c1611] text-white">Rajasthan</option>
                </select>
              </div>

              {/* 3. Category */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060b08] border border-emerald-500/25 font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                >
                  <option value="all" className="bg-[#0c1611] text-white">All Categories</option>
                  <option value="food" className="bg-[#0c1611] text-white">Food & Essential Rations</option>
                  <option value="education" className="bg-[#0c1611] text-white">Education & Scholarships</option>
                  <option value="skill_employment" className="bg-[#0c1611] text-white">Skill & Employment</option>
                  <option value="health" className="bg-[#0c1611] text-white">Health & Healthcare</option>
                  <option value="energy_utility" className="bg-[#0c1611] text-white">Energy & Utility</option>
                </select>
              </div>

              {/* 4. Benefit Type */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Benefit Type
                </label>
                <select
                  value={selectedBenefitType}
                  onChange={(e) => setSelectedBenefitType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060b08] border border-emerald-500/25 font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                >
                  <option value="all" className="bg-[#0c1611] text-white">All Benefit Types</option>
                  <option value="completely_free" className="bg-[#0c1611] text-white">Completely Free (100% Free)</option>
                  <option value="free_training" className="bg-[#0c1611] text-white">Free Training & Stipend</option>
                  <option value="free_coaching" className="bg-[#0c1611] text-white">Free Coaching</option>
                  <option value="scholarship" className="bg-[#0c1611] text-white">Scholarship & Allowance</option>
                  <option value="tuition_fee_assistance" className="bg-[#0c1611] text-white">Tuition Fee Assistance</option>
                  <option value="financial_assistance" className="bg-[#0c1611] text-white">Financial Incentive</option>
                  <option value="subsidy" className="bg-[#0c1611] text-white">Direct Subsidy & Financial Assistance</option>
                </select>
              </div>

            </div>

            {/* Active Only Switch */}
            <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-emerald-500/30 bg-[#060b08] focus:ring-emerald-500"
                />
                <span className="text-emerald-300">Show Only Active & Verified Listed Benefits</span>
              </label>

              <span className="text-xs font-mono font-bold text-slate-400">
                {benefits.length} verified benefit(s) found
              </span>
            </div>

          </form>
        </div>

        {/* Benefits Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="font-mono text-xs font-bold text-slate-400 uppercase">Loading verified Free Benefits...</p>
          </div>
        ) : benefits.length === 0 ? (
          <div className="bg-[#0c1611] rounded-3xl p-12 text-center border border-emerald-500/20 shadow-2xl">
            <Gift className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-xl text-white">No matching Free Benefits found</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Try adjusting your filter criteria or clear the search keyword to browse all active verified schemes.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((item) => {
              const locItem = localizeFreeBenefit(item, currentLang);
              const displayName = locItem.displayName || item.name;
              const displayBenefit = locItem.displayBenefit || item.benefit;
              const displayElig = locItem.displayEligibility || item.eligibility_text || item.eligibility;
              const displayType = locItem.displayBenefitType || getLocalizedBenefitType(item.benefit_type, currentLang);
              const isCompletelyFree = item.benefit_type === 'completely_free';

              return (
                <div
                  key={item.benefit_id}
                  className="bg-[#0c1611]/90 rounded-3xl border border-emerald-500/20 shadow-card hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] hover:border-emerald-400/50 hover:bg-[#101e17] transition-all p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isCompletelyFree ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-[10.5px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                          ★ 100% FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/30 text-[10.5px] font-mono font-bold uppercase">
                          {displayType}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#060b08] text-slate-300 border border-emerald-500/20 text-[10.5px] font-mono font-bold">
                          {item.state === 'All India' ? getLocalizedCommonText('central_govt', currentLang) : item.state}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              openAuthModal('login');
                              return;
                            }
                            const isSaved = savedPlanIds?.has(item.benefit_id);
                            if (isSaved) {
                              removeFromMyPlans(item.benefit_id);
                            } else {
                              addToMyPlans(item.benefit_id);
                            }
                          }}
                          title={savedPlanIds?.has(item.benefit_id) ? "Remove from My Plans" : "Save to My Plans"}
                          className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                            savedPlanIds?.has(item.benefit_id)
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400 shadow-2xs'
                              : 'bg-[#060b08] border-emerald-500/20 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${savedPlanIds?.has(item.benefit_id) ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-extrabold text-xl text-white leading-snug">
                      {displayName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      ID: {item.benefit_id}
                    </span>

                    {/* Benefit summary box */}
                    <div className="mt-3 p-3 rounded-2xl bg-[#08120d] border border-emerald-500/20 text-xs text-slate-300">
                      <strong className="font-mono text-[10px] uppercase text-emerald-400 block mb-0.5">
                        {getLocalizedCommonText('what_you_get', currentLang)}:
                      </strong>
                      <p className="leading-relaxed line-clamp-3 font-medium">
                        {displayBenefit}
                      </p>
                    </div>

                    {/* Who can apply */}
                    <div className="mt-3 text-xs text-slate-300 line-clamp-2">
                      <strong className="text-white">{getLocalizedCommonText('who_can_apply', currentLang)}: </strong>
                      <span>{displayElig}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEligibilityBenefit(item)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Eligibility</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedBenefit(item)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {(item.application_url || item.official_source) && (
                        <a
                          href={item.application_url || item.official_source}
                          target="_blank"
                          rel="noreferrer"
                          title="Apply on Official Government Portal"
                          className="p-2 rounded-xl bg-[#060b08] hover:bg-[#12221a] text-slate-300 border border-emerald-500/20 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Editorial Footer */}
      <Footer />

      {/* Persistent Sakhi AI Floating Assistant */}
      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
      />

      {/* Details & Eligibility Modals */}
      <FreeBenefitDetailsModal
        benefit={selectedBenefit}
        isOpen={Boolean(selectedBenefit)}
        onClose={() => setSelectedBenefit(null)}
        onCheckEligibility={(b) => setEligibilityBenefit(b)}
      />

      <FreeBenefitEligibilityModal
        benefit={eligibilityBenefit}
        isOpen={Boolean(eligibilityBenefit)}
        onClose={() => setEligibilityBenefit(null)}
        onViewDetails={(b) => setSelectedBenefit(b)}
      />
    </div>
  );
};
