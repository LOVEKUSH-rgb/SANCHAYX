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
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      {/* Sticky Sanchay Header / Navbar Banner */}
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 w-full">
        
        {/* Page Hero Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-sanchay-emerald-200 shadow-2xs">
            <Gift className="w-4 h-4 text-sanchay-emerald-600" />
            <span>Verified Sovereign Free Benefits & Assistance</span>
          </div>
          
          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
            Free Benefits & Direct Assistance
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Discover 100% free food grains, zero-cost skill development with stipends, and state educational scholarships without middleman commissions.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200/90 mb-10">
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
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-sanchay-navy-950 focus:bg-white focus:border-sanchay-navy-900 focus:outline-hidden transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Search Benefits
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              
              {/* 1. Level / Authority */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Jurisdiction / Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                >
                  <option value="all">All Levels (Central + State + UT)</option>
                  <option value="central">Central Government Only</option>
                  <option value="state">State Governments Only</option>
                  <option value="ut">Union Territories (UT) Only</option>
                </select>
              </div>

              {/* 2. State */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  State / UT
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                >
                  <option value="all">All States & All India</option>
                  <option value="All India">All India (Central Schemes)</option>
                  <option value="Assam">Assam</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>

              {/* 3. Category */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="food">Food & Essential Rations</option>
                  <option value="education">Education & Scholarships</option>
                  <option value="skill_employment">Skill & Employment</option>
                  <option value="health">Health & Healthcare</option>
                  <option value="energy_utility">Energy & Utility</option>
                </select>
              </div>

              {/* 4. Benefit Type */}
              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Benefit Type
                </label>
                <select
                  value={selectedBenefitType}
                  onChange={(e) => setSelectedBenefitType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                >
                  <option value="all">All Benefit Types</option>
                  <option value="completely_free">Completely Free (100% Free)</option>
                  <option value="free_training">Free Training & Stipend</option>
                  <option value="free_coaching">Free Coaching</option>
                  <option value="scholarship">Scholarship & Allowance</option>
                  <option value="tuition_fee_assistance">Tuition Fee Assistance</option>
                  <option value="financial_assistance">Financial Incentive</option>
                  <option value="subsidy">Direct Subsidy & Financial Assistance</option>
                </select>
              </div>

            </div>

            {/* Active Only Switch */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show Only Active & Verified Listed Benefits</span>
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
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="font-mono text-xs font-bold text-slate-500 uppercase">Loading verified Free Benefits...</p>
          </div>
        ) : benefits.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card">
            <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-xl text-sanchay-navy-950">No matching Free Benefits found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try adjusting your filter criteria or clear the search keyword to browse all active verified schemes.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 rounded-xl bg-sanchay-navy-950 text-white font-mono font-bold text-xs uppercase cursor-pointer"
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
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isCompletelyFree ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10.5px] font-mono font-bold uppercase tracking-wider border border-emerald-200">
                          ★ 100% FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-mono font-bold uppercase">
                          {displayType}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-mono font-bold">
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
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${savedPlanIds?.has(item.benefit_id) ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-extrabold text-xl text-sanchay-navy-950 leading-snug">
                      {displayName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 block mt-1">
                      ID: {item.benefit_id}
                    </span>

                    {/* Benefit summary box */}
                    <div className="mt-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950">
                      <strong className="font-mono text-[10px] uppercase text-emerald-800 block mb-0.5">
                        {getLocalizedCommonText('what_you_get', currentLang)}:
                      </strong>
                      <p className="leading-relaxed line-clamp-3 font-medium">
                        {displayBenefit}
                      </p>
                    </div>

                    {/* Who can apply */}
                    <div className="mt-3 text-xs text-slate-600 line-clamp-2">
                      <strong className="text-sanchay-navy-900">{getLocalizedCommonText('who_can_apply', currentLang)}: </strong>
                      <span>{displayElig}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEligibilityBenefit(item)}
                      className="px-3.5 py-2 rounded-xl bg-sanchay-gold-50 hover:bg-sanchay-gold-100 text-sanchay-gold-800 border border-sanchay-gold-300 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-600" />
                      <span>Eligibility</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedBenefit(item)}
                        className="px-4 py-2 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
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
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-950 border border-slate-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
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
