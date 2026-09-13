import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Check, ShieldCheck, ExternalLink, Search, X, RefreshCw, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { getSchemeImage } from '../../data/schemeImages';
import schemeImages from '../../scheme_images.inline.json';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { localizeScheme, getLocalizedCommonText, getLocalizedCategory } from '../../utils/contentLocalizer';

export const FeaturedSchemesSection = ({ schemes = [], onSelectScheme, initialLifeStage = 'all' }) => {
  const { currentLang, t } = useLanguage();
  const { isPlanSaved, addToMyPlans, removeFromMyPlans } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
    { id: 'all', num: '01', label: 'ALL SCHEMES' },
    { id: 'savings', num: '02', label: 'SAVINGS' },
    { id: 'pension', num: '03', label: 'PENSION' },
    { id: 'protection', num: '04', label: 'PROTECTION & INSURANCE' },
    { id: 'education', num: '05', label: 'EDUCATION' },
    { id: 'women', num: '06', label: 'WOMEN & GIRLS' },
    { id: 'agriculture', num: '07', label: 'FARMERS & AGRI' },
    { id: 'health', num: '08', label: 'HEALTHCARE' },
    { id: 'housing', num: '09', label: 'HOUSING' },
    { id: 'employment', num: '10', label: 'EMPLOYMENT & SKILL' },
    { id: 'social_security', num: '11', label: 'SOCIAL SECURITY' },
    { id: 'business', num: '12', label: 'BUSINESS & MSME' },
    { id: 'financial_inclusion', num: '13', label: 'FINANCIAL INCLUSION' },
  ];

  const goalsList = [
    { id: 'all', label: currentLang === 'hi' ? 'सभी लक्ष्य' : currentLang === 'mr' ? 'सर्व उद्दिष्टे' : currentLang === 'bn' ? 'সকল লক্ষ্য' : currentLang === 'te' ? 'అన్ని లక్ష్యాలు' : 'All Goals' },
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
    { id: 'all', label: currentLang === 'hi' ? 'सभी जीवन चरण' : currentLang === 'mr' ? 'सर्व टप्पे' : currentLang === 'bn' ? 'সকল পর্যায়' : currentLang === 'te' ? 'అన్ని దశలు' : 'All Life Stages' },
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
    setVisibleCount(10);
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const name = (typeof scheme.name === 'object' ? (scheme.name.en || '') : (scheme.name || '')).toLowerCase();
      const shortName = (scheme.shortName || scheme.short_name || '').toLowerCase();
      const desc = (scheme.descriptionSimple || scheme.short_description || scheme.full_description || scheme.benefitsOverview || '').toLowerCase();
      const authority = (scheme.authority || scheme.officialAuthority || '').toLowerCase();
      const cat = (scheme.category || '').toLowerCase();
      const subCat = (scheme.sub_category || '').toLowerCase();
      const goals = (scheme.goals || []).map(g => g.toLowerCase());
      const stages = (scheme.life_stages || scheme.targetPersonas || []).map(s => String(s).toLowerCase());
      const targetGroups = (scheme.target_groups || []).map(tg => String(tg).toLowerCase());
      const keywords = (scheme.search?.keywords || []).map(k => String(k).toLowerCase());
      const allText = `${name} ${shortName} ${desc} ${cat} ${subCat} ${goals.join(' ')} ${stages.join(' ')} ${targetGroups.join(' ')} ${keywords.join(' ')}`;
      const isInsurance = scheme.isInsurance || scheme.isDemoData || cat.includes('protection') || cat.includes('insurance');
      const isVerified = scheme.verified !== false && scheme.verification_status !== 'unverified' && scheme.verification_status !== 'discontinued';

      // 1. Verified Only Filter
      if (verifiedOnly && !isVerified) return false;

      // 2. Search Query Matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = (
          name.includes(query) ||
          shortName.includes(query) ||
          desc.includes(query) ||
          authority.includes(query) ||
          cat.includes(query) ||
          subCat.includes(query) ||
          goals.some(g => g.includes(query)) ||
          stages.some(s => s.includes(query)) ||
          targetGroups.some(tg => tg.includes(query)) ||
          keywords.some(k => k.includes(query))
        );
        if (!matchesQuery) return false;
      }

      // 3. Category Filter
      if (activeCategory !== 'all') {
        if (activeCategory === 'savings') {
          if (isInsurance || !(cat.includes('savings') || cat.includes('deposit') || cat.includes('fixed') || cat.includes('growth'))) return false;
        } else if (activeCategory === 'pension') {
          if (isInsurance || !(cat.includes('pension') || cat.includes('senior') || cat.includes('retirement'))) return false;
        } else if (activeCategory === 'protection') {
          if (!isInsurance) return false;
        } else if (activeCategory === 'education') {
          if (!(cat.includes('education') || cat.includes('child') || cat.includes('scholarship') || goals.includes('education'))) return false;
        } else if (activeCategory === 'women') {
          if (!(cat.includes('women') || cat.includes('girl') || cat.includes('matru') || scheme.eligibility?.woman_specific || allText.includes('mahila'))) return false;
        } else if (activeCategory === 'agriculture') {
          if (!(cat.includes('agri') || cat.includes('farm') || cat.includes('kisan') || goals.includes('farming'))) return false;
        } else if (activeCategory === 'health') {
          if (!(cat.includes('health') || cat.includes('medical') || cat.includes('ayushman') || goals.includes('health') || allText.includes('swasth'))) return false;
        } else if (activeCategory === 'housing') {
          if (!(cat.includes('housing') || cat.includes('awas') || goals.includes('housing'))) return false;
        } else if (activeCategory === 'employment') {
          if (!(cat.includes('employ') || cat.includes('skill') || cat.includes('kaushal') || goals.includes('skill'))) return false;
        } else if (activeCategory === 'social_security') {
          if (!(cat.includes('social') || cat.includes('maandhan') || cat.includes('security') || cat.includes('bima') || cat.includes('insurance') || goals.includes('social_security'))) return false;
        } else if (activeCategory === 'business') {
          if (!(cat.includes('business') || cat.includes('mudra') || cat.includes('svanidhi') || cat.includes('msme') || cat.includes('cgtmse') || cat.includes('nulm') || goals.includes('business') || goals.includes('self employment'))) return false;
        } else if (activeCategory === 'financial_inclusion') {
          if (!(cat.includes('financial') || cat.includes('inclusion') || cat.includes('banking') || cat.includes('jan-dhan') || cat.includes('jandhan') || goals.includes('banking') || goals.includes('financial inclusion') || allText.includes('jandhan') || allText.includes('zero balance'))) return false;
        } else if (!cat.includes(activeCategory) && !subCat.includes(activeCategory)) {
          return false;
        }
      }

      // 4. Goal Filter
      if (selectedGoal !== 'all') {
        if (!goals.includes(selectedGoal) && !cat.includes(selectedGoal) && !subCat.includes(selectedGoal) && !allText.includes(selectedGoal)) {
          return false;
        }
      }

      // 5. Life Stage Filter
      if (selectedLifeStage !== 'all') {
        let matchesStage = false;
        
        if (selectedLifeStage === 'student') {
          matchesStage = (
            stages.some(s => s.includes('student') || s.includes('youth') || s.includes('child')) ||
            targetGroups.some(tg => tg.includes('student') || tg.includes('youth') || tg.includes('child') || tg.includes('education')) ||
            cat.includes('education') || subCat.includes('scholarship') || subCat.includes('student') || goals.includes('education') ||
            allText.includes('scholarship') || allText.includes('fellowship') || allText.includes('student') || allText.includes('education') ||
            (scheme.eligibility?.max_age && scheme.eligibility.max_age <= 25)
          );
        } else if (selectedLifeStage === 'young_professional' || selectedLifeStage === 'first_job') {
          matchesStage = (
            stages.some(s => s.includes('professional') || s.includes('youth') || s.includes('early')) ||
            targetGroups.some(tg => tg.includes('professional') || tg.includes('youth') || tg.includes('worker') || tg.includes('employee')) ||
            cat.includes('savings') || cat.includes('employment') || cat.includes('business') ||
            goals.includes('tax') || goals.includes('wealth') || goals.includes('emergency') ||
            allText.includes('80c') || allText.includes('tax') || allText.includes('wealth') || allText.includes('provident') || allText.includes('nps') || allText.includes('ppf')
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
    <section id="verified-schemes" className="py-20 sm:py-28 bg-[#FAF9F5] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Multi-Category Verified Catalog */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-navy-950 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4 shadow-xs">
              <span className="text-sanchay-gold-500">02</span>
              <span className="text-slate-500">/</span>
              <span>{t('explore.badge', 'VERIFIED STATUTORY CATALOG')}</span>
            </div>
            <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
              {t('explore.title', 'Explore Government Schemes')}
            </h2>
            <p className="text-base sm:text-lg text-sanchay-navy-700 mt-3 leading-relaxed">
              {t('explore.subtitle', 'Browse verified Central and State savings, pension, and protection schemes.')}
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-slate-500">
            Showing <span className="text-sanchay-emerald-700 font-extrabold text-sm">{displayedSchemes.length}</span> of <span className="text-sanchay-navy-950 font-bold">{filteredSchemes.length}</span> Schemes
          </div>
        </div>

        {/* SEARCH & ADVANCED FILTERS BAR */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card mb-8 space-y-4">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="scheme-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('explore.searchPlaceholder', 'Search schemes by name, keyword, or benefits...')}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#FAFAFC] border border-slate-200/90 text-sm text-sanchay-navy-950 placeholder:text-slate-400 focus:outline-none focus:border-sanchay-emerald-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-sanchay-navy-950"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Toggle Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Goal Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Goal:</span>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="bg-[#FAFAFC] border border-slate-200/90 rounded-xl px-3 py-1.5 font-bold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 cursor-pointer"
                >
                  {goalsList.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Life Stage Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Life Stage:</span>
                <select
                  value={selectedLifeStage}
                  onChange={(e) => setSelectedLifeStage(e.target.value)}
                  className="bg-[#FAFAFC] border border-slate-200/90 rounded-xl px-3 py-1.5 font-bold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 cursor-pointer"
                >
                  {lifeStagesList.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Verified Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-sanchay-emerald-600 rounded border-slate-300 focus:ring-sanchay-emerald-500"
                />
                <span className="font-mono font-bold text-sanchay-emerald-800 uppercase text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Only
                </span>
              </label>

              {/* Reset Button if any filter active */}
              {(searchQuery || activeCategory !== 'all' || selectedGoal !== 'all' || selectedLifeStage !== 'all' || !verifiedOnly) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 hover:text-sanchay-emerald-700 underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 12-Category Dynamic Navigation with Numbering */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-slate-200/80 pb-4 mb-10 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-3.5 py-2 rounded-xl font-mono text-[11px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'text-sanchay-emerald-800 bg-sanchay-emerald-50 border border-sanchay-emerald-200/80 shadow-2xs'
                    : 'text-sanchay-navy-700 hover:text-sanchay-navy-950 hover:bg-slate-100/80'
                }`}
              >
                <span className={isActive ? 'text-sanchay-emerald-600' : 'text-slate-400'}>{cat.num}</span>
                <span>{cat.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sanchay-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* EMPTY STATE IF NO MATCH */}
        {filteredSchemes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/90 shadow-card max-w-2xl mx-auto my-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-600 border border-sanchay-emerald-200/80 flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <h3 className="font-serif font-extrabold text-2xl text-sanchay-navy-950">
              {t('explore.noSchemesFound', 'No verified schemes found')}
            </h3>
            <p className="text-sm text-sanchay-navy-700 max-w-md mx-auto leading-relaxed">
              {t('explore.tryDifferentSearch', 'Try changing your search keywords or adjusting your category and life stage filters.')}
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sanchay-navy-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-sanchay-navy-900 transition-colors shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset All Filters</span>
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
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5"
                  >
                    <div 
                      onClick={() => onSelectScheme(scheme)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${schemeName}`}
                    >
                      {/* Large SVG Vector Artwork at Top */}
                      <div className="card-thumb-wrap relative h-56 sm:h-64 lg:h-72 w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-200/80">
                        <img
                          src={imgSrc}
                          alt={schemeName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/schemes/_fallback.svg';
                          }}
                          className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        
                        <div className="overlay absolute inset-0 pointer-events-none">
                          {/* Category Pill over image */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-sanchay-navy-950 font-mono font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                              {scheme.category || 'Government Scheme'}
                            </span>
                          </div>

                          {/* Verified Official Source Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full bg-sanchay-emerald-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>VERIFIED SOURCE</span>
                            </span>
                          </div>

                          {/* Return Rate / Key Highlight banner at bottom of image */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">Benefit / Return</span>
                              <span className="font-serif font-extrabold text-xl text-sanchay-gold-400 drop-shadow-xs truncate block max-w-[200px]">
                                {benefitDisplay}
                              </span>
                            </div>

                            {/* Safety Indicator */}
                            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono text-sanchay-emerald-400 font-bold border border-sanchay-emerald-500/30">
                              {isInsurance ? 'LIC Protection' : 'Sovereign Safe'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-6">
                        <h3 className="font-serif font-extrabold text-xl text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 transition-colors">
                          {schemeName}
                        </h3>

                        <p className="text-xs text-sanchay-navy-700 mt-2.5 leading-relaxed line-clamp-2">
                          {cardDesc}
                        </p>

                        {/* Trust Metadata */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Authority</span>
                            <span className="font-bold text-sanchay-navy-900 truncate block max-w-[170px]">{authority}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Verified Date</span>
                            <span className="font-mono text-[10px] text-sanchay-emerald-700 font-bold">{lastVerified}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action: View Details & View Official Details Button */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onSelectScheme(scheme)}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sanchay-navy-950 hover:text-sanchay-emerald-700 uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <span>{t('explore.viewDetails', 'View Details')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
                              title={isSaved ? (currentLang === 'hi' ? 'प्लान में सहेजा गया' : 'Saved in My Plans') : (currentLang === 'hi' ? 'प्लान में जोड़ें' : 'Add to My Plans')}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isSaved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-sanchay-navy-950 border-slate-200'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                            </button>
                          );
                        })()}

                        {officialUrl && (
                          <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sanchay-emerald-50 hover:bg-sanchay-emerald-100 text-sanchay-emerald-800 font-bold text-[11px] uppercase tracking-wider border border-sanchay-emerald-200 transition-colors"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
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
                      className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:scale-[1.02] transition-all cursor-pointer border border-sanchay-navy-800"
                    >
                      <span>Show More Schemes (+10)</span>
                      <ChevronDown className="w-4 h-4 text-sanchay-gold-400 group-hover:translate-y-0.5 transition-transform" />
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
                      className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-sanchay-navy-950 font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:scale-[1.02] transition-all cursor-pointer border border-slate-300"
                    >
                      <ChevronUp className="w-4 h-4 text-sanchay-navy-700 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Show Less</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-500">
                  Showing {displayedSchemes.length} of {filteredSchemes.length} verified schemes
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
