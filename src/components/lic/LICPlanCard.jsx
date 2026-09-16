import React from 'react';
import { ShieldCheck, ExternalLink, ArrowRight, Bookmark, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeLICPlan, getLocalizedCategory, getLocalizedCommonText } from '../../utils/contentLocalizer';

export const LICPlanCard = ({ plan, onViewDetails }) => {
  const { isPlanSaved, addToMyPlans, removeFromMyPlans, isAuthenticated, openAuthModal } = useAuth();
  const { t, currentLang } = useLanguage();

  if (!plan) return null;

  const locPlan = localizeLICPlan(plan, currentLang);
  const planId = plan.plan_id || `LIC-${plan.plan_number}`;
  const isSaved = isPlanSaved ? isPlanSaved(planId) : false;

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isSaved) {
      removeFromMyPlans(planId);
    } else {
      addToMyPlans(planId);
    }
  };

  const planNumber = plan.plan_number || '';
  const uin = plan.uin || '';
  const category = locPlan.displayCategory || getLocalizedCategory(plan.category, currentLang) || 'Life Insurance';
  const displayName = locPlan.displayName || plan.plan_name;
  const shortDesc = locPlan.displayDescription || plan.short_description || plan.description || 'Verified LIC insurance & savings plan.';
  const mainPurpose = locPlan.displayPurpose || plan.main_purpose || '';
  const officialUrl = plan.official_lic_url || 'https://www.licindia.in/';

  // Category badge colors
  const getCategoryBadgeClass = (cat) => {
    const c = String(cat).toLowerCase();
    if (c.includes('endowment')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (c.includes('term')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (c.includes('whole life')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    if (c.includes('money back')) return 'bg-amber-50 text-amber-900 border-amber-200';
    if (c.includes('pension') || c.includes('annuity')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (c.includes('unit linked') || c.includes('ulip')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (c.includes('micro')) return 'bg-teal-50 text-teal-800 border-teal-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const minAgeText = plan.age_rules?.min_entry_age_years !== undefined
    ? `${plan.age_rules.min_entry_age_years === 0.08 ? '30 Days' : `${plan.age_rules.min_entry_age_years} Yrs`}`
    : (plan.min_entry_age ? `${plan.min_entry_age} Yrs` : 'Eligible Ages');

  const maxAgeText = plan.age_rules?.max_entry_age_years !== undefined
    ? `${plan.age_rules.max_entry_age_years} Yrs`
    : (plan.max_entry_age ? `${plan.max_entry_age} Yrs` : '70 Yrs');

  const minSumAssured = plan.premium_rules?.min_sum_assured_text || plan.min_sum_assured_text || '₹1,00,000';
  const policyTermText = plan.policy_term?.available_terms || plan.policy_term_text || '10 to 25 Years';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-editorial border border-slate-200/90 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1">
      
      {/* Top Header: Category Badge + Plan No + Save Bookmark Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10.5px] uppercase tracking-wider border ${getCategoryBadgeClass(category)} flex items-center gap-1`}>
              <ShieldCheck className="w-3 h-3" />
              <span>{category}</span>
            </span>

            {planNumber && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/90 font-mono font-bold text-[10px] tracking-wider">
                {t('lic.plan', 'Plan')} {planNumber}
              </span>
            )}
          </div>

          <button
            onClick={handleBookmarkToggle}
            title={isSaved ? t('myPlans.saved', 'Saved in My Plans') : t('myPlans.addToMyPlans', 'Add to My Plans')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-sanchay-navy-950 border-slate-200'
            }`}
            aria-label="Bookmark plan"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white stroke-white' : ''}`} />
          </button>
        </div>

        {/* Plan Title & UIN */}
        <h3 className="font-serif font-bold text-lg sm:text-xl text-sanchay-navy-950 leading-snug group-hover:text-amber-800 transition-colors">
          {displayName}
        </h3>

        <div className="flex items-center gap-2 mt-1 mb-3">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            UIN: {uin || 'Official LIC'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">
            {t('lic.officialBadge', '100% Official')}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-sanchay-navy-800 leading-relaxed line-clamp-3 mb-4">
          {shortDesc}
        </p>

        {/* Main Purpose Highlight */}
        {mainPurpose && (
          <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-950 leading-snug mb-4 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-medium">{mainPurpose}</span>
          </div>
        )}

        {/* Key Plan Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">{t('lic.entryAge', 'Entry Age')}</span>
            <span className="font-bold text-sanchay-navy-950 mt-0.5 block truncate">{minAgeText} - {maxAgeText}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">{t('lic.minCover', 'Min Cover')}</span>
            <span className="font-bold text-sanchay-navy-950 mt-0.5 block truncate">{minSumAssured}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">{t('lic.term', 'Term')}</span>
            <span className="font-bold text-sanchay-navy-950 mt-0.5 block truncate">{policyTermText}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-2">
        <button
          onClick={() => onViewDetails(plan)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs group-hover:shadow-card"
        >
          <span>{t('lic.viewDetails', 'View Details')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          title="Open Official LIC Portal"
          className="p-2.5 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-900 border border-slate-200 transition-colors shrink-0 cursor-pointer"
          aria-label="Official LIC URL"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
