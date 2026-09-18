import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark, Trash2, ExternalLink, ShieldCheck, ArrowRight,
  TrendingUp, PlusCircle, CheckCircle2, AlertCircle, Info, Sparkles, RefreshCw, Award
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { LICPlanDetailsModal } from '../components/lic/LICPlanDetailsModal';
import { FreeBenefitDetailsModal } from '../components/free_benefits/FreeBenefitDetailsModal';
import { UserAvatar } from '../components/common/UserAvatar';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchSavedPlans } from '../services/api';
import { getSchemeImage } from '../data/schemeImages';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { FALLBACK_LIC_PLANS } from '../data/licPlansFallback';
import { FALLBACK_FREE_BENEFITS } from '../data/freeBenefitsFallback';
import { localizeScheme, localizeLICPlan, localizeFreeBenefit } from '../utils/contentLocalizer';

export const MyPlansPage = () => {
  const { user, token, isAuthenticated, removeFromMyPlans, openAuthModal, savedPlanIds } = useAuth();
  const { t, currentLang } = useLanguage();

  const [savedSchemes, setSavedSchemes] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'GOV' | 'LIC' | 'FREE'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedLicPlan, setSelectedLicPlan] = useState(null);
  const [selectedFreeBenefit, setSelectedFreeBenefit] = useState(null);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const savedIdsKey = Array.from(savedPlanIds || user?.saved_plans || []).sort().join(',');

  const loadPlans = async () => {
    const currentSavedIds = Array.from(savedPlanIds || user?.saved_plans || []);
    if (!token && currentSavedIds.length === 0) {
      setIsLoading(false);
      setSavedSchemes([]);
      return;
    }
    setIsLoading(true);
    try {
      let data = [];
      if (token) {
        data = await fetchSavedPlans(token);
      }

      const existingIds = new Set((data || []).map(s => String(s.scheme_id || s.id || s.plan_id || s.benefit_id || '').toLowerCase()));
      const enriched = [...(data || [])];

      currentSavedIds.forEach(rawId => {
        const idStr = String(rawId).toLowerCase();
        if (!existingIds.has(idStr)) {
          // 1. Look up in MOCK_SCHEMES (Sovereign Government Schemes)
          const govMatch = MOCK_SCHEMES.find(s => {
            const sId = String(s.scheme_id || s.id || '').toLowerCase();
            const sShort = String(s.short_name || s.shortName || '').toLowerCase();
            return sId === idStr || 
                   sShort === idStr || 
                   idStr.startsWith(sId) || 
                   sId.startsWith(idStr) ||
                   (sShort && idStr.includes(sShort));
          });

          if (govMatch) {
            enriched.push({
              ...govMatch,
              scheme_id: govMatch.scheme_id || govMatch.id || rawId,
              id: govMatch.scheme_id || govMatch.id || rawId,
              is_lic_plan: false,
              is_free_benefit: false
            });
            existingIds.add(idStr);
            return;
          }

          // 2. Look up in FALLBACK_LIC_PLANS
          const numMatch = idStr.match(/\d+/);
          const num = numMatch ? numMatch[0] : null;
          const licMatch = FALLBACK_LIC_PLANS.find(p => 
            String(p.plan_id).toLowerCase() === idStr ||
            (num && String(p.plan_number) === num) ||
            (num && `lic-${p.plan_number}` === idStr) ||
            `lic-${p.plan_id}`.toLowerCase() === idStr
          );

          if (licMatch) {
            enriched.push({
              scheme_id: licMatch.plan_id || rawId,
              id: licMatch.plan_id || rawId,
              plan_id: licMatch.plan_id,
              is_lic_plan: true,
              is_free_benefit: false,
              name: licMatch.plan_name,
              plan_name: licMatch.plan_name,
              plan_number: licMatch.plan_number,
              uin: licMatch.uin,
              category: `LIC — ${licMatch.category || 'Life Insurance'}`,
              description: licMatch.short_description || licMatch.main_purpose,
              authority: 'Life Insurance Corporation of India (LIC)',
              official_url: licMatch.official_lic_url || 'https://www.licindia.in/',
              last_verified_date: licMatch.last_verified || '2026-08-30',
              benefits: {
                summary: licMatch.short_description,
                interest_rate: licMatch.death_benefit || 'Sum Assured + Bonuses'
              },
              financial: {
                minimum_contribution: licMatch.min_sum_assured_text || '₹1,00,000',
                lock_in_years: licMatch.policy_term_text || '10-25 Yrs'
              },
              raw_plan: licMatch
            });
            existingIds.add(idStr);
            return;
          }

          // 3. Look up in FALLBACK_FREE_BENEFITS
          const fbMatch = FALLBACK_FREE_BENEFITS.find(b =>
            String(b.benefit_id).toLowerCase() === idStr ||
            String(b.benefit_id).toLowerCase() === `fb_${idStr}` ||
            idStr === `fb_${String(b.benefit_id).toLowerCase()}`
          );
          if (fbMatch) {
            enriched.push({
              scheme_id: fbMatch.benefit_id,
              id: fbMatch.benefit_id,
              benefit_id: fbMatch.benefit_id,
              is_free_benefit: true,
              is_lic_plan: false,
              name: fbMatch.name,
              category: fbMatch.category || 'Free Benefit',
              description: fbMatch.description || fbMatch.benefit,
              benefit: fbMatch.benefit,
              eligibility: fbMatch.eligibility,
              benefit_type: fbMatch.benefit_type || 'completely_free',
              state: fbMatch.state || 'All India',
              level: fbMatch.level || 'National',
              authority: 'Government of India',
              official_url: fbMatch.application_url || fbMatch.official_source || 'https://india.gov.in',
              last_verified_date: fbMatch.last_verified || '2026-08-30',
              benefits: {
                summary: fbMatch.benefit,
                interest_rate: '100% Free / Direct Benefit',
                tax_benefit: 'Full Subsidy'
              },
              financial: {
                interest_rate: '100% Free',
                minimum_contribution: 0
              },
              raw_benefit: fbMatch
            });
            existingIds.add(idStr);
            return;
          }

          // 4. Clean fallback if ID was not matched
          enriched.push({
            scheme_id: rawId,
            id: rawId,
            name: String(rawId).toUpperCase().replace(/[_-]/g, ' '),
            category: t('myPlans.tabGovt', 'Sovereign Schemes'),
            description: t('myPlans.subtitle', 'Statutory government welfare scheme.'),
            authority: 'Government of India',
            official_url: 'https://www.myscheme.gov.in',
            last_verified_date: '2026-08-30',
            benefits: {
              interest_rate: t('myPlans.statutoryBenefit', 'Statutory Benefit')
            },
            is_lic_plan: false,
            is_free_benefit: false
          });
          existingIds.add(idStr);
        }
      });

      setSavedSchemes(enriched);
    } catch (err) {
      console.error('Failed to load saved plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPlans();
    } else {
      setIsLoading(false);
      setSavedSchemes([]);
    }
  }, [isAuthenticated, token, savedIdsKey]);

  const handleRemove = async (schemeId, e) => {
    e.stopPropagation();
    setRemovingId(schemeId);
    try {
      await removeFromMyPlans(schemeId);
      setSavedSchemes(prev => prev.filter(s => (s.scheme_id || s.id || s.plan_id || s.benefit_id) !== schemeId));
    } catch (err) {
      console.error('Failed to remove plan:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const getItemType = (s) => {
    if (s.is_free_benefit || s.raw_benefit || s.benefit_id || String(s.scheme_id || s.id || '').toLowerCase().startsWith('fb_')) {
      return 'FREE';
    }
    if (s.is_lic_plan || s.raw_plan || s.plan_number || String(s.category || '').toLowerCase().includes('lic') || String(s.scheme_id || s.id || '').toLowerCase().startsWith('lic')) {
      return 'LIC';
    }
    return 'GOV';
  };

  const handleCardClick = (item) => {
    const type = getItemType(item);
    if (type === 'FREE') {
      setSelectedFreeBenefit(item.raw_benefit || item);
    } else if (type === 'LIC') {
      const planObj = item.raw_plan || item;
      setSelectedLicPlan(planObj);
    } else {
      setSelectedScheme(item);
    }
  };

  // Filter tabs
  const filteredList = savedSchemes.filter(s => {
    const type = getItemType(s);
    if (activeTab === 'GOV') return type === 'GOV';
    if (activeTab === 'LIC') return type === 'LIC';
    if (activeTab === 'FREE') return type === 'FREE';
    return true;
  });

  const govCount = savedSchemes.filter(s => getItemType(s) === 'GOV').length;
  const licCount = savedSchemes.filter(s => getItemType(s) === 'LIC').length;
  const freeCount = savedSchemes.filter(s => getItemType(s) === 'FREE').length;

  const getProfessionDisplay = (prof) => {
    if (!prof) return '';
    const key = String(prof).toLowerCase().trim();
    const loc = t(`myPlans.professions.${key}`);
    if (loc && !loc.startsWith('myPlans.professions.')) {
      return loc;
    }
    return prof;
  };

  const getAuthorityDisplay = (scheme, isFree, isLic) => {
    const rawAuth = scheme.authority;
    if (rawAuth) {
      const lower = rawAuth.toLowerCase();
      if (lower.includes('government of india') || lower === 'central') {
        return t('myPlans.authorityGovIndia', 'Government of India');
      }
      if (lower.includes('life insurance corporation') || lower.includes('lic')) {
        return t('myPlans.authorityLic', 'Life Insurance Corporation of India (LIC)');
      }
      if (lower.includes('welfare department') || lower.includes('welfare')) {
        return t('myPlans.authorityGovWelfare', 'Government Welfare Department');
      }
      return rawAuth;
    }
    if (isFree) return t('myPlans.authorityGovWelfare', 'Government Welfare Department');
    if (isLic) return t('myPlans.authorityLic', 'Life Insurance Corporation of India (LIC)');
    return t('myPlans.authorityGovIndia', 'Government of India');
  };

  const getBenefitValueDisplay = (scheme, isFree, isLic) => {
    if (isFree) {
      if (!scheme.benefit || scheme.benefit === '100% Free' || scheme.benefit === '100% Free / Direct Benefit') {
        return t('myPlans.freePercent', '100% Free');
      }
      return scheme.benefit;
    }
    if (isLic) {
      const val = scheme.benefits?.interest_rate || scheme.financial?.interest_rate;
      if (!val || val === 'Sum Assured + Bonuses') {
        return t('myPlans.sumAssuredWithBonus', 'Sum Assured + Bonuses');
      }
      return val;
    }
    const val = scheme.benefits?.interest_rate || scheme.financial?.interest_rate;
    if (!val || val === 'Statutory Benefit') {
      return t('myPlans.statutoryBenefit', 'Statutory Benefit');
    }
    return val;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-sanchay-emerald-200 shadow-2xs">
              <Bookmark className="w-3.5 h-3.5 text-sanchay-emerald-600 fill-sanchay-emerald-600" />
              <span>{t('myPlans.portfolioTag', 'My Sovereign & LIC Portfolio')}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-sanchay-navy-950 tracking-tight">
                {t('myPlans.title', 'My Saved Plans')}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl font-sans leading-relaxed">
                {t('myPlans.subtitle', 'Your shortlisted statutory government schemes and verified LIC plans are saved securely to your portfolio.')}
              </p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  to="/lic"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-sanchay-navy-950 text-xs font-bold uppercase tracking-wider border border-slate-200 shadow-2xs transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t('myPlans.exploreLic', 'Explore LIC Plans')}</span>
                </Link>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white text-xs font-bold uppercase tracking-wider shadow-card transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-sanchay-gold-400" />
                  <span>{t('myPlans.findMore', 'Find More Schemes')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Summary Card (if logged in) */}
        {isAuthenticated && user && (
          <div className="mb-8 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar user={user} size="lg" className="shadow-xs" />
              <div>
                <div className="font-serif font-bold text-base text-sanchay-navy-950 flex items-center gap-2">
                  <span>{user.full_name || t('myPlans.citizen', 'Citizen')}</span>
                  {user.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {t('myPlans.verified', 'Verified')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <span>{user.email}</span>
                  {user.mobile && <span>• {user.mobile}</span>}
                  {user.profession && <span className="capitalize">• {getProfessionDisplay(user.profession)}</span>}
                  {user.age && <span>• {user.age} {t('myPlans.years', 'Yrs')}</span>}
                </div>
              </div>
            </div>

            {/* Saved Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sanchay-navy-950 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{(savedSchemes.length > 0 ? savedSchemes.length : (savedPlanIds?.size || user?.saved_plans?.length || 0))} {t('myPlans.savedTotal', 'Saved Total')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Category Tabs (All / Government / LIC / Free) */}
        {isAuthenticated && savedSchemes.length > 0 && (
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-sanchay-navy-950 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{t('myPlans.tabAll', 'All Saved')} ({savedSchemes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('GOV')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'GOV'
                  ? 'bg-sanchay-navy-950 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{t('myPlans.tabGovt', 'Sovereign Schemes')} ({govCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('LIC')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'LIC'
                  ? 'bg-sanchay-navy-950 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{t('myPlans.tabLic', 'LIC Plans')} ({licCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('FREE')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'FREE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{t('myPlans.tabFree', 'Free Benefits')} ({freeCount})</span>
            </button>
          </div>
        )}

        {/* Not Logged In State */}
        {!isAuthenticated && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-card text-center max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 border border-emerald-100">
              <Bookmark className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-sanchay-navy-950 mb-2">
              {t('myPlans.loginRequiredTitle', 'Login to View Your Saved Plans')}
            </h2>
            <p className="text-xs text-slate-600 font-sans mb-6 leading-relaxed">
              {t('myPlans.loginRequiredDesc', 'Sign in to access your saved sovereign schemes and LIC plans, track interest rates, and manage your financial discovery portfolio.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white text-xs font-extrabold uppercase tracking-wider shadow-card transition-all cursor-pointer"
              >
                {t('myPlans.citizenLogin', 'Citizen Login')}
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider shadow-card transition-all cursor-pointer"
              >
                {t('myPlans.createAccount', 'Create Free Account')}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAuthenticated && isLoading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-slate-500">
              {t('myPlans.loadingPlans', 'Loading your saved sovereign & LIC plans...')}
            </p>
          </div>
        )}

        {/* Empty Saved Plans State */}
        {isAuthenticated && !isLoading && savedSchemes.length === 0 && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-card text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-2 border border-amber-200">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-serif font-bold text-sanchay-navy-950">
              {t('myPlans.emptyTitle', 'No Saved Schemes or LIC Plans Yet')}
            </h3>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              {t('myPlans.emptyDesc', 'Click the Bookmark icon on any verified Government scheme or official LIC plan to save it to your portfolio.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/#verified-schemes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white text-xs font-bold uppercase tracking-wider shadow-card transition-all"
              >
                <span>{t('myPlans.exploreCatalog', 'Explore Catalog')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/lic"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-sanchay-navy-950 text-xs font-bold uppercase tracking-wider border border-slate-200 shadow-2xs transition-all"
              >
                <span>{t('myPlans.officialLic', 'Official LIC Plans')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Empty Filter Tab State */}
        {isAuthenticated && !isLoading && savedSchemes.length > 0 && filteredList.length === 0 && (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 max-w-md mx-auto space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-mono">
              {t('myPlans.noFilteredItems', 'No saved items under this filter.')}
            </p>
            <button
              onClick={() => setActiveTab('ALL')}
              className="text-xs font-mono font-bold text-emerald-700 underline cursor-pointer"
            >
              {t('myPlans.showAllPlans', 'Show All Saved Plans')} ({savedSchemes.length})
            </button>
          </div>
        )}

        {/* Saved Schemes Grid */}
        {isAuthenticated && !isLoading && filteredList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((scheme) => {
              const schemeId = scheme.scheme_id || scheme.id || scheme.plan_id || scheme.benefit_id;
              const itemType = getItemType(scheme);
              const isLic = itemType === 'LIC';
              const isFree = itemType === 'FREE';
              const isRemoving = removingId === schemeId;

              let cardTitle, cardDesc, cardCategory;
              if (isFree) {
                const locItem = localizeFreeBenefit(scheme.raw_benefit || scheme, currentLang);
                cardTitle = locItem.displayName || scheme.name;
                cardDesc = locItem.displayBenefit || scheme.benefit || scheme.description;
                cardCategory = scheme.benefit_type === 'completely_free'
                  ? t('myPlans.freeBadge', '★ 100% FREE')
                  : (locItem.displayBenefitType || t('myPlans.tabFree', 'Free Benefits'));
              } else if (isLic) {
                const locItem = localizeLICPlan(scheme.raw_plan || scheme, currentLang);
                cardTitle = locItem.displayName || scheme.name || scheme.plan_name;
                cardDesc = locItem.displayDescription || scheme.description || scheme.short_description;
                cardCategory = locItem.displayCategory || scheme.category || t('myPlans.tabLic', 'LIC Plans');
              } else {
                const locItem = localizeScheme(scheme, currentLang);
                cardTitle = locItem.displayName || scheme.name;
                cardDesc = locItem.displayDescription || scheme.description || scheme.short_description || scheme.benefits?.summary;
                cardCategory = locItem.displayCategory || scheme.category || t('myPlans.tabGovt', 'Sovereign Schemes');
              }

              const displayAuthority = getAuthorityDisplay(scheme, isFree, isLic);

              return (
                <div
                  key={schemeId}
                  onClick={() => handleCardClick(scheme)}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial hover:border-emerald-500 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group relative"
                >
                  {/* Card Banner Header */}
                  <div className={`p-4 flex flex-col justify-between relative overflow-hidden ${
                    isFree
                      ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950'
                      : isLic 
                        ? 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900' 
                        : 'bg-gradient-to-br from-sanchay-navy-950 to-sanchay-navy-900'
                  }`}>
                    <div className="flex items-center justify-between z-10 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isFree
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30'
                          : isLic 
                            ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30' 
                            : 'bg-white/10 text-white'
                      }`}>
                        {cardCategory}
                      </span>
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => handleRemove(schemeId, e)}
                        disabled={isRemoving}
                        title={t('myPlans.removePlan', 'Remove from My Plans')}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-red-500 text-white transition-all cursor-pointer shadow-xs"
                      >
                        {isRemoving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="z-10">
                      <h3 className="font-serif font-bold text-base text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {cardTitle}
                      </h3>
                      <p className="text-[10px] text-slate-300 font-mono truncate mt-0.5">
                        {displayAuthority}
                      </p>
                    </div>
                  </div>

                  {/* Card Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cardDesc}
                    </p>

                    {/* Highlight Box */}
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                        {isFree ? t('myPlans.welfareBenefit', 'Welfare Benefit') : isLic ? t('myPlans.sumAssured', 'Sum Assured / Benefit') : t('myPlans.interestBenefit', 'Interest / Benefit')}
                      </span>
                      <span className="font-serif font-black text-xs sm:text-sm text-emerald-800 text-right truncate max-w-[150px]">
                        {getBenefitValueDisplay(scheme, isFree, isLic)}
                      </span>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-sanchay-navy-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                        <span>{isFree ? t('myPlans.viewFreeDetails', 'View Free Benefit Details') : isLic ? t('myPlans.viewLicDetails', 'View LIC Plan Details') : t('myPlans.viewSchemeDetails', 'View Scheme Details')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      
                      <button
                        onClick={(e) => handleRemove(schemeId, e)}
                        className="text-red-600 hover:text-red-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('myPlans.remove', 'Remove')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Standard Scheme Detail Modal */}
      {selectedScheme && (
        <ProductDetailsModal
          item={selectedScheme}
          onClose={() => setSelectedScheme(null)}
        />
      )}

      {/* LIC Plan Detail Modal */}
      {selectedLicPlan && (
        <LICPlanDetailsModal
          plan={selectedLicPlan}
          onClose={() => setSelectedLicPlan(null)}
        />
      )}

      {/* Free Benefit Detail Modal */}
      {selectedFreeBenefit && (
        <FreeBenefitDetailsModal
          benefit={selectedFreeBenefit}
          isOpen={!!selectedFreeBenefit}
          onClose={() => setSelectedFreeBenefit(null)}
        />
      )}

      <Footer />

      {/* Persistent Sakhi AI Floating Assistant */}
      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{ stage: 'my-plans', savedCount: savedSchemes.length }}
      />
    </div>
  );
};
