import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, ExternalLink, Search, X, RefreshCw, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { getSchemeImage } from '../../data/schemeImages';
import schemeImages from '../../scheme_images.inline.json';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { localizeScheme, getLocalizedCommonText, getLocalizedCategory } from '../../utils/contentLocalizer';

export const FeaturedSchemesSection = ({ schemes = [], onSelectScheme, initialLifeStage = 'all', initialCategory = 'all', initialSearch = '' }) => {
  const { currentLang, t } = useLanguage();
  const { isPlanSaved, addToMyPlans, removeFromMyPlans } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [activeCategory, _setActiveCategory] = useState(urlCategory || initialCategory || 'all');
  
  useEffect(() => {
    if (urlCategory) {
      _setActiveCategory(urlCategory);
    } else if (initialCategory && initialCategory !== 'all') {
      _setActiveCategory(initialCategory);
    } else {
      _setActiveCategory('all');
    }
  }, [urlCategory, initialCategory]);

  const setActiveCategory = (newCat) => {
    _setActiveCategory(newCat);
    setSearchParams(prev => {
      if (newCat === 'all' || !newCat) {
        prev.delete('category');
      } else {
        prev.set('category', newCat);
      }
      return prev;
    });
  };

  const [selectedGoal, setSelectedGoal] = useState('all');
  const [selectedLifeStage, setSelectedLifeStage] = useState(initialLifeStage || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (initialLifeStage && initialLifeStage !== 'all') {
      setSelectedLifeStage(initialLifeStage);
    }
  }, [initialLifeStage]);

  const categories = [
    { id: 'all', num: '01', label: t('featuredSchemes.categoryAll', 'ALL SCHEMES') },
    { id: 'savings', num: '02', label: t('featuredSchemes.savings', 'SAVINGS') },
    { id: 'pension', num: '03', label: t('featuredSchemes.pension', 'PENSION') },
    { id: 'protection', num: '04', label: t('featuredSchemes.protection', 'PROTECTION & INSURANCE') },
    { id: 'education', num: '05', label: t('featuredSchemes.education', 'EDUCATION') },
    { id: 'women', num: '06', label: t('featuredSchemes.women', 'WOMEN & GIRLS') },
    { id: 'agriculture', num: '07', label: t('featuredSchemes.agriculture', 'FARMERS & AGRI') },
    { id: 'health', num: '08', label: t('featuredSchemes.health', 'HEALTHCARE') },
    { id: 'housing', num: '09', label: t('featuredSchemes.housing', 'HOUSING') },
    { id: 'employment', num: '10', label: t('featuredSchemes.employment', 'EMPLOYMENT & SKILL') },
    { id: 'social_security', num: '11', label: t('featuredSchemes.socialSecurity', 'SOCIAL SECURITY') },
    { id: 'business', num: '12', label: t('featuredSchemes.business', 'BUSINESS & MSME') },
    { id: 'financial_inclusion', num: '13', label: t('featuredSchemes.financialInclusion', 'FINANCIAL INCLUSION') },
  ];

  const goalsList = [
    { id: 'all', label: t('featuredSchemes.allGoals', 'All Goals') },
    { id: 'education', label: t('goals.education', 'Child Education') },
    { id: 'retirement', label: t('goals.retirement', 'Retirement & Pension') },
    { id: 'emergency', label: t('goals.emergency', 'Emergency Fund') },
    { id: 'tax', label: t('goals.tax', 'Tax Saving (80C)') },
    { id: 'wealth', label: t('goals.wealth', 'Long-term Wealth') },
    { id: 'marriage', label: t('goals.marriage', 'Child Marriage') },
    { id: 'farming', label: t('goals.farming', 'Agriculture & Farming') },
    { id: 'health', label: t('goals.health', 'Health Assurance') },
    { id: 'housing', label: t('goals.housing', 'Home Ownership') },
    { id: 'business', label: t('goals.business', 'Business & Entrepreneurship') },
  ];

  const lifeStagesList = [
    { id: 'all', label: t('featuredSchemes.allLifeStages', 'All Life Stages') },
    { id: 'student', label: t('lifeStages.students', 'Students') },
    { id: 'young_professional', label: t('lifeStages.professionals', 'Young Professionals') },
    { id: 'parents', label: t('lifeStages.parents', 'Parents / Families') },
    { id: 'women', label: t('explore.women', 'Women') },
    { id: 'seniors', label: t('lifeStages.seniors', 'Senior Citizens (60+)') },
    { id: 'farmers', label: t('lifeStages.farmers', 'Farmers') },
    { id: 'unorganized_workers', label: t('lifeStages.workers', 'Unorganized Workers') },
  ];

  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, activeCategory, selectedGoal, selectedLifeStage, verifiedOnly]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSelectedGoal('all');
    setSelectedLifeStage('all');
    setVerifiedOnly(true);
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const loc = localizeScheme(scheme, currentLang);
        const nameVal = loc.displayName || (typeof scheme.name === 'object' && scheme.name !== null ? Object.values(scheme.name).join(' ') : String(scheme.name || ''));
        const nameMatch = nameVal.toLowerCase().includes(q);
        const descMatch = (loc.displayDescription || scheme.descriptionSimple || scheme.short_description || scheme.full_description || '').toLowerCase().includes(q);
        const tagMatch = (scheme.tags || []).some(t => String(t).toLowerCase().includes(q));
        const authMatch = (scheme.authority || scheme.officialAuthority || '').toLowerCase().includes(q);
        const categoryMatch = (scheme.category || '').toLowerCase().includes(q);
        
        if (!nameMatch && !descMatch && !tagMatch && !authMatch && !categoryMatch) {
          return false;
        }
      }

      // 2. Verified Only Filter
      if (verifiedOnly && !scheme.verified) {
        return false;
      }

      // 3. Category Filter
      if (activeCategory !== 'all') {
        const cat = (scheme.category || '').toLowerCase();
        const subCat = (scheme.sub_category || '').toLowerCase();
        const targetGroups = (scheme.target_groups || []).map(tg => String(tg).toLowerCase());
        const tags = (scheme.tags || []).map(t => String(t).toLowerCase());

        let matchesCategory = false;
        if (activeCategory === 'savings') {
          matchesCategory = cat === 'savings' || cat.includes('saving') || cat.includes('deposit') || subCat.includes('saving') || tags.includes('savings');
        } else if (activeCategory === 'pension') {
          matchesCategory = cat === 'pension' || cat.includes('pension') || cat.includes('retirement') || subCat.includes('pension') || tags.includes('pension');
        } else if (activeCategory === 'protection') {
          matchesCategory = cat === 'insurance' || cat.includes('protect') || cat.includes('insurance') || subCat.includes('insurance') || tags.includes('insurance');
        } else if (activeCategory === 'education') {
          matchesCategory = cat === 'education' || cat.includes('education') || cat.includes('scholarship') || subCat.includes('education') || tags.includes('education') || tags.includes('scholarship');
        } else if (activeCategory === 'women') {
          matchesCategory = cat === 'women' || cat.includes('women') || cat.includes('girl') || cat.includes('maternity') || targetGroups.some(tg => tg.includes('women') || tg.includes('girl') || tg.includes('female'));
        } else if (activeCategory === 'agriculture') {
          matchesCategory = cat === 'agriculture' || cat.includes('agri') || cat.includes('farmer') || subCat.includes('farmer') || targetGroups.some(tg => tg.includes('farmer') || tg.includes('agri'));
        } else if (activeCategory === 'health') {
          matchesCategory = cat === 'health' || cat.includes('health') || cat.includes('medical') || subCat.includes('health') || tags.includes('health');
        } else if (activeCategory === 'housing') {
          matchesCategory = cat === 'housing' || cat.includes('housing') || cat.includes('urban') || subCat.includes('housing') || tags.includes('housing');
        } else if (activeCategory === 'employment') {
          matchesCategory = cat === 'employment' || cat.includes('employ') || cat.includes('skill') || subCat.includes('skill') || tags.includes('employment');
        } else if (activeCategory === 'social_security') {
          matchesCategory = cat === 'social_security' || cat.includes('social') || subCat.includes('social') || tags.includes('social_security');
        } else if (activeCategory === 'business') {
          matchesCategory = cat === 'business' || cat.includes('msme') || cat.includes('enterprise') || cat.includes('business') || subCat.includes('business');
        } else if (activeCategory === 'financial_inclusion') {
          matchesCategory = cat === 'financial_inclusion' || cat.includes('inclusion') || cat.includes('banking') || tags.includes('banking');
        } else {
          matchesCategory = cat === activeCategory.toLowerCase();
        }

        if (!matchesCategory) return false;
      }

      // 4. Goal Filter
      if (selectedGoal !== 'all') {
        const goals = (scheme.goals || []).map(g => String(g).toLowerCase());
        const cat = (scheme.category || '').toLowerCase();
        const desc = (scheme.descriptionSimple || scheme.short_description || scheme.benefitsOverview || '').toLowerCase();
        const nameStr = (typeof scheme.name === 'object' && scheme.name !== null ? Object.values(scheme.name).join(' ') : String(scheme.name || '')).toLowerCase();

        let matchesGoal = false;
        if (selectedGoal === 'education') {
          matchesGoal = goals.includes('education') || cat.includes('education') || desc.includes('education') || desc.includes('study') || nameStr.includes('sukanya');
        } else if (selectedGoal === 'retirement') {
          matchesGoal = goals.includes('retirement') || goals.includes('pension') || cat.includes('pension') || desc.includes('pension') || desc.includes('retire');
        } else if (selectedGoal === 'emergency') {
          matchesGoal = goals.includes('emergency') || (scheme.financial && scheme.financial.liquidity && String(scheme.financial.liquidity).includes('high')) || desc.includes('liquid') || desc.includes('emergency');
        } else if (selectedGoal === 'tax') {
          matchesGoal = goals.includes('tax') || (scheme.benefits && scheme.benefits.tax_benefit) || desc.includes('80c') || desc.includes('tax');
        } else if (selectedGoal === 'wealth') {
          matchesGoal = goals.includes('wealth') || cat.includes('saving') || desc.includes('wealth') || desc.includes('growth');
        } else if (selectedGoal === 'marriage') {
          matchesGoal = goals.includes('marriage') || desc.includes('marriage') || nameStr.includes('sukanya') || nameStr.includes('kanya');
        } else if (selectedGoal === 'farming') {
          matchesGoal = goals.includes('farming') || cat.includes('agri') || desc.includes('kisan') || desc.includes('farmer');
        } else if (selectedGoal === 'health') {
          matchesGoal = goals.includes('health') || cat.includes('health') || desc.includes('health') || desc.includes('medical');
        } else if (selectedGoal === 'housing') {
          matchesGoal = goals.includes('housing') || cat.includes('housing') || desc.includes('house') || desc.includes('home');
        } else if (selectedGoal === 'business') {
          matchesGoal = goals.includes('business') || cat.includes('business') || desc.includes('mudra') || desc.includes('business') || desc.includes('enterprise');
        } else {
          matchesGoal = goals.includes(selectedGoal.toLowerCase());
        }

        if (!matchesGoal) return false;
      }

      // 5. Life Stage Filter
      if (selectedLifeStage !== 'all') {
        const stages = (scheme.life_stages || []).map(s => String(s).toLowerCase());
        const targetGroups = (scheme.target_groups || []).map(tg => String(tg).toLowerCase());
        const cat = (scheme.category || '').toLowerCase();
        const subCat = (scheme.sub_category || '').toLowerCase();
        const goals = (scheme.goals || []).map(g => String(g).toLowerCase());
        const allText = [
          typeof scheme.name === 'object' && scheme.name !== null ? Object.values(scheme.name).join(' ') : String(scheme.name || ''),
          scheme.descriptionSimple || '',
          scheme.short_description || '',
          scheme.benefitsOverview || '',
          ...(scheme.tags || [])
        ].join(' ').toLowerCase();

        let matchesStage = false;
        if (selectedLifeStage === 'student' || selectedLifeStage === 'students') {
          matchesStage = (
            stages.some(s => s.includes('student') || s.includes('youth') || s.includes('child')) ||
            targetGroups.some(tg => tg.includes('student') || tg.includes('youth') || tg.includes('children') || tg.includes('scholar')) ||
            cat.includes('education') || subCat.includes('scholarship') || subCat.includes('education') ||
            goals.includes('education') ||
            allText.includes('student') || allText.includes('scholarship') || allText.includes('education') || allText.includes('matric') || allText.includes('vidya') ||
            (scheme.eligibility?.max_age && scheme.eligibility.max_age <= 30)
          );
        } else if (selectedLifeStage === 'young_professional' || selectedLifeStage === 'professional') {
          matchesStage = (
            stages.some(s => s.includes('professional') || s.includes('employed') || s.includes('worker') || s.includes('adult') || s.includes('young')) ||
            targetGroups.some(tg => tg.includes('salaried') || tg.includes('employed') || tg.includes('professional') || tg.includes('worker') || tg.includes('citizen')) ||
            cat.includes('saving') || cat.includes('pension') || cat.includes('insurance') ||
            goals.includes('tax') || goals.includes('wealth') || goals.includes('emergency') ||
            allText.includes('salaried') || allText.includes('professional') || allText.includes('income') || allText.includes('tax') || allText.includes('80c') ||
            ((!scheme.eligibility?.min_age || scheme.eligibility.min_age <= 25) && (!scheme.eligibility?.max_age || scheme.eligibility.max_age >= 40))
          );
        } else if (selectedLifeStage === 'parents' || selectedLifeStage === 'parent') {
          matchesStage = (
            stages.some(s => s.includes('parent') || s.includes('family') || s.includes('child')) ||
            targetGroups.some(tg => tg.includes('parent') || tg.includes('family') || tg.includes('children') || tg.includes('mother') || tg.includes('girl')) ||
            goals.includes('education') || goals.includes('marriage') ||
            allText.includes('sukanya') || allText.includes('child') || allText.includes('family') || allText.includes('minor') || allText.includes('matru') || allText.includes('shishu') || allText.includes('kanya') ||
            scheme.eligibility?.guardian_required === true || scheme.eligibility?.child_age_limit !== null
          );
        } else if (selectedLifeStage === 'women') {
          matchesStage = (
            scheme.eligibility?.woman_specific ||
            scheme.eligibility?.gender === 'female' ||
            cat.includes('women') || subCat.includes('women') || subCat.includes('maternity') ||
            targetGroups.some(tg => tg.includes('women') || tg.includes('girl') || tg.includes('female') || tg.includes('mother')) ||
            allText.includes('mahila') || allText.includes('women') || allText.includes('woman') || allText.includes('kanya') || allText.includes('matritva') || allText.includes('matru') || allText.includes('sukanya') || allText.includes('mssc')
          );
        } else if (selectedLifeStage === 'seniors' || selectedLifeStage === 'retirement') {
          matchesStage = (
            stages.some(s => s.includes('senior') || s.includes('elderly') || s.includes('retiree')) ||
            targetGroups.some(tg => tg.includes('senior') || tg.includes('elderly') || tg.includes('old_age') || tg.includes('retiree')) ||
            cat.includes('pension') || subCat.includes('senior') || subCat.includes('pension') ||
            goals.includes('retirement') || goals.includes('pension') || goals.includes('old_age_support') ||
            allText.includes('senior') || allText.includes('pension') || allText.includes('retirement') || allText.includes('vridha') || allText.includes('vaya vandana') || allText.includes('scss') ||
            (scheme.eligibility?.min_age && scheme.eligibility.min_age >= 55)
          );
        } else if (selectedLifeStage === 'farmers') {
          matchesStage = (
            stages.some(s => s.includes('farmer') || s.includes('agri')) ||
            targetGroups.some(tg => tg.includes('farmer') || tg.includes('agri') || tg.includes('rural')) ||
            cat.includes('agri') || subCat.includes('agri') || subCat.includes('farmer') || subCat.includes('crop') ||
            goals.includes('farming') ||
            allText.includes('kisan') || allText.includes('farmer') || allText.includes('fasal') || allText.includes('krishi') || allText.includes('agri') || allText.includes('kcc')
          );
        } else if (selectedLifeStage === 'unorganized_workers' || selectedLifeStage === 'workers') {
          matchesStage = (
            stages.some(s => s.includes('worker') || s.includes('unorganized') || s.includes('gig')) ||
            targetGroups.some(tg => tg.includes('unorganis') || tg.includes('worker') || tg.includes('labour') || tg.includes('artisan') || tg.includes('vendor')) ||
            cat.includes('social_security') || cat.includes('employment') ||
            allText.includes('unorganised') || allText.includes('unorganized') || allText.includes('worker') || allText.includes('maandhan') || allText.includes('svanidhi') || allText.includes('shram') || allText.includes('labour') || allText.includes('artisan')
          );
        } else {
          matchesStage = stages.includes(selectedLifeStage) || allText.includes(selectedLifeStage);
        }

        if (!matchesStage) return false;
      }

      return true;
    });
  }, [schemes, searchQuery, activeCategory, selectedGoal, selectedLifeStage, verifiedOnly]);

  const displayedSchemes = useMemo(() => {
    return filteredSchemes.slice(0, visibleCount);
  }, [filteredSchemes, visibleCount]);

  return (
    <section id="verified-schemes" className="py-12 sm:py-16 bg-[#F8FAF8] border-b border-[#E7ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Multi-Category Verified Catalog */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] text-[#176B50] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 border border-[#D5E4DC]">
              <span className="text-[#176B50]">02</span>
              <span className="text-[#D5E4DC]">/</span>
              <span>{t('explore.badge', 'VERIFIED STATUTORY CATALOG')}</span>
            </div>
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#202B26] tracking-tight leading-tight">
              {t('explore.title', 'Explore Government Schemes')}
            </h1>
            <p className="text-base sm:text-lg text-[#66736C] mt-3 leading-relaxed">
              {t('explore.subtitle', 'Browse verified Central and State savings, pension, and protection schemes.')}
            </p>
          </div>

          <div className="text-xs font-semibold text-[#66736C]">
            {t('featuredSchemes.showingCount', 'Showing')} <span className="text-[#176B50] font-extrabold text-sm">{displayedSchemes.length}</span> {t('featuredSchemes.of', 'of')} <span className="text-[#202B26] font-bold">{filteredSchemes.length}</span> {t('featuredSchemes.schemes', 'Schemes')}
          </div>
        </div>

        {/* SEARCH & ADVANCED FILTERS BAR */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E7ECE8] shadow-card mb-8 space-y-4">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#176B50] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="scheme-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('featuredSchemes.searchPlaceholder', 'Search schemes by name, keyword, or benefits...')}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] text-sm text-[#202B26] placeholder:text-[#66736C] focus:outline-none focus:border-[#176B50] focus:ring-3 focus:ring-[#176B50]/12 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#66736C] hover:text-[#202B26] transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#176B50] text-white border border-[#176B50] shadow-xs'
                      : 'bg-[#FAFAFC] hover:bg-[#F8FAF8] border border-[#E7ECE8] text-[#66736C] hover:text-[#202B26]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Filter Dropdowns & Toggle Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E7ECE8] text-xs">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Goal Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#66736C] uppercase text-[10px] tracking-wider">{t('featuredSchemes.goalLabel', 'Goal:')}</span>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="bg-[#FAFAFC] border border-[#E7ECE8] rounded-xl px-3 py-1.5 font-semibold text-xs text-[#202B26] focus:outline-none focus:border-[#176B50] cursor-pointer"
                >
                  {goalsList.map(g => (
                    <option key={g.id} value={g.id} className="bg-white text-[#202B26]">{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Life Stage Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#66736C] uppercase text-[10px] tracking-wider">{t('featuredSchemes.lifeStageLabel', 'Life Stage:')}</span>
                <select
                  value={selectedLifeStage}
                  onChange={(e) => setSelectedLifeStage(e.target.value)}
                  className="bg-[#FAFAFC] border border-[#E7ECE8] rounded-xl px-3 py-1.5 font-semibold text-xs text-[#202B26] focus:outline-none focus:border-[#176B50] cursor-pointer"
                >
                  {lifeStagesList.map(s => (
                    <option key={s.id} value={s.id} className="bg-white text-[#202B26]">{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Verified Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-[#176B50] rounded border-[#D5E4DC] focus:ring-[#176B50]"
                />
                <span className="font-semibold text-[#176B50] text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B50]" />
                  {t('featuredSchemes.verifiedOnly', 'Verified Only')}
                </span>
              </label>

              {/* Reset Filters Link */}
              {(searchQuery || activeCategory !== 'all' || selectedGoal !== 'all' || selectedLifeStage !== 'all' || !verifiedOnly) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#66736C] hover:text-[#176B50] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('featuredSchemes.resetAllFilters', 'Reset')}</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Catalog Scheme Results Grid */}
        {displayedSchemes.length === 0 ? (
          /* Clean Light Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E7ECE8] shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-[#E7F1EB] border border-[#D5E4DC] flex items-center justify-center text-3xl mx-auto mb-4">
              🏛️
            </div>
            <h3 className="font-serif font-extrabold text-2xl text-[#202B26] mb-2">
              {t('explore.noSchemesFound', 'No verified schemes found')}
            </h3>
            <p className="text-sm text-[#66736C] max-w-md mx-auto leading-relaxed mb-6 font-normal">
              {t('explore.tryDifferentSearch', 'Try changing your search keywords or adjusting your category and life stage filters.')}
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('featuredSchemes.resetAllFilters', 'Reset All Filters')}</span>
            </button>
          </div>
        ) : (
          /* Scheme Grid with Top Images & Editorial Cards */
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedSchemes.map((scheme) => {
                const schemeId = scheme.scheme_id || scheme.id;
                const locScheme = localizeScheme(scheme, currentLang);
                let schemeName = locScheme.displayName || (typeof scheme.name === 'object' && scheme.name !== null
                  ? (scheme.name[currentLang] || scheme.name.en || Object.values(scheme.name)[0])
                  : scheme.name);
                const schemeImgObj = getSchemeImage(schemeId, scheme.category, schemeName);
                const imgSrc = schemeImgObj?.url || '/schemes/_fallback.svg';
                const isInsurance = scheme.isInsurance || scheme.isDemoData || (scheme.category || '').toLowerCase().includes('protection');
                const officialUrl = scheme.officialUrl || scheme.official_url || scheme.officialSourceUrl;
                const authority = scheme.authority || scheme.officialAuthority || 'Government of India';
                const lastVerified = scheme.lastVerifiedDate || scheme.last_verified_date || '2026-08-28';
                const cardDesc = locScheme.displayDescription || scheme.descriptionSimple || scheme.short_description || scheme.full_description || scheme.benefitsOverview;

                const rawInterest = scheme.currentInterestRate || scheme.financial?.interest_rate || scheme.benefits?.amount || scheme.benefits?.pension_amount || scheme.returnType || scheme.financial?.return_type || 'Statutory Benefit';
                const matchPercent = typeof rawInterest === 'string' && rawInterest.match(/^(\d+(\.\d+)?%\s*(?:p\.a\.)?)/i);
                const benefitDisplay = matchPercent 
                  ? matchPercent[0] 
                  : (typeof rawInterest === 'string' && rawInterest.length > 24 
                      ? (rawInterest.split('(')[0].trim() || 'Statutory Yield') 
                      : rawInterest);

                return (
                  <div
                    key={scheme.id || scheme.scheme_id}
                    className="bg-white rounded-3xl border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5"
                  >
                    <div 
                      onClick={() => onSelectScheme(scheme)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${schemeName}`}
                    >
                      {/* Large SVG Vector Artwork at Top */}
                      <div className="card-thumb-wrap relative h-56 sm:h-64 lg:h-72 w-full overflow-hidden bg-[#FAFAFC] flex items-center justify-center border-b border-[#E7ECE8]">
                        <img
                          src={imgSrc}
                          alt={schemeName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/schemes/_fallback.svg';
                          }}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        
                        <div className="overlay absolute inset-0 pointer-events-none">
                          {/* Category Pill over image */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 rounded-full bg-white/95 text-[#176B50] border border-[#D5E4DC] font-semibold text-[10px] uppercase tracking-wider shadow-2xs">
                              {getLocalizedCategory(scheme.category, currentLang) || scheme.category || 'Government Scheme'}
                            </span>
                          </div>

                          {/* Verified Official Source Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full bg-[#176B50] text-white font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{t('featuredSchemes.verifiedSource', 'VERIFIED SOURCE')}</span>
                            </span>
                          </div>

                          {/* Return Rate / Key Highlight banner at bottom of image */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white/95 backdrop-blur-xs border border-[#E7ECE8] rounded-xl px-3.5 py-2 shadow-2xs">
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] uppercase tracking-wider text-[#66736C] font-semibold block">
                                {t('featuredSchemes.benefitReturn', 'Benefit / Return')}
                              </span>
                              <span className="font-serif font-extrabold text-base sm:text-lg text-[#176B50] truncate block max-w-[200px]">
                                {benefitDisplay}
                              </span>
                            </div>

                            {/* Safety Indicator */}
                            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[#E7F1EB] text-[#176B50] text-[10px] font-bold border border-[#D5E4DC]">
                              {isInsurance ? t('featuredSchemes.licProtection', 'LIC Protection') : t('featuredSchemes.sovereignSafe', 'Sovereign Safe')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-6">
                        <h3 className="font-serif font-extrabold text-xl text-[#202B26] group-hover:text-[#176B50] transition-colors line-clamp-1">
                          {schemeName}
                        </h3>

                        <p className="text-xs text-[#66736C] mt-2.5 leading-relaxed line-clamp-2">
                          {cardDesc}
                        </p>

                        {/* Trust Metadata */}
                        <div className="mt-4 pt-3 border-t border-[#E7ECE8] flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-[9px] font-bold text-[#66736C] uppercase block">{t('featuredSchemes.authority', 'Authority')}</span>
                            <span className="font-bold text-[#202B26] truncate block max-w-[170px]">{authority}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-[#66736C] uppercase block">{t('featuredSchemes.verifiedDate', 'Verified Date')}</span>
                            <span className="font-semibold text-[11px] text-[#176B50]">{lastVerified}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action: View Details & View Official Details Button */}
                    <div className="px-6 py-4 border-t border-[#E7ECE8] bg-[#FAFAFC] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onSelectScheme(scheme)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B50] hover:text-[#125540] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <span>{t('explore.viewDetails', 'View Details')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#176B50]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bookmark Save to My Plans */}
                        {(() => {
                          const sid = scheme.scheme_id || scheme.id;
                          const isSaved = isPlanSaved(sid);
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                isSaved ? removeFromMyPlans(sid) : addToMyPlans(sid);
                              }}
                              title={isSaved ? t('myPlans.saved', 'Saved in My Plans') : t('myPlans.addToMyPlans', 'Add to My Plans')}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isSaved
                                  ? 'bg-[#E7F1EB] text-[#176B50] border-[#D5E4DC]'
                                  : 'bg-white hover:bg-[#F8FAF8] text-[#66736C] hover:text-[#202B26] border-[#E7ECE8]'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-[#176B50] fill-[#176B50]' : ''}`} />
                            </button>
                          );
                        })()}

                        {officialUrl && (
                          <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAF8] text-[#202B26] hover:text-[#176B50] font-semibold text-[11px] uppercase tracking-wider border border-[#E7ECE8] transition-colors shadow-2xs"
                          >
                            <span>{t('featuredSchemes.officialPortal', 'Official Portal')}</span>
                            <ExternalLink className="w-3 h-3 text-[#176B50]" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls: Show More (+10) and Show Less */}
            {filteredSchemes.length > 10 && (
              <div className="flex flex-col items-center justify-center gap-3 pt-6 pb-2">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {visibleCount < filteredSchemes.length && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <span>{t('featuredSchemes.showMore', 'Show More Schemes (+10)')}</span>
                      <ChevronDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  )}

                  {visibleCount > 10 && (
                    <button
                      onClick={() => {
                        setVisibleCount(10);
                        const el = document.getElementById('verified-schemes');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-[#FAFAFC] text-[#202B26] font-semibold text-xs uppercase tracking-wider shadow-xs hover:scale-[1.01] transition-all cursor-pointer border border-[#E7ECE8]"
                    >
                      <ChevronUp className="w-4 h-4 text-[#66736C] group-hover:-translate-y-0.5 transition-transform" />
                      <span>{t('featuredSchemes.showLess', 'Show Less')}</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-[#66736C]">
                  {t('featuredSchemes.showingCount', 'Showing')} {displayedSchemes.length} {t('featuredSchemes.of', 'of')} {filteredSchemes.length} {t('featuredSchemes.verifiedSchemes', 'verified schemes')}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
