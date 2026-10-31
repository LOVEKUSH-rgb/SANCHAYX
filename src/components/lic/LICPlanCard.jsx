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
    if (c.includes('endowment')) return 'bg-[#E7F1EB] text-[#176B50] border-[#D5E4DC]';
    if (c.includes('term')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (c.includes('whole life')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    if (c.includes('money back')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (c.includes('pension') || c.includes('annuity')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (c.includes('unit linked') || c.includes('ulip')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (c.includes('micro')) return 'bg-teal-50 text-teal-800 border-teal-200';
    return 'bg-[#E7F1EB] text-[#176B50] border-[#D5E4DC]';
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
    <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-[#E7ECE8] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1">
      
      {/* Top Header: Category Badge + Plan No + Save Bookmark Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10.5px] uppercase tracking-wider border ${getCategoryBadgeClass(category)} flex items-center gap-1`}>
              <ShieldCheck className="w-3 h-3" />
              <span>{category}</span>
            </span>

            {planNumber && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAFC] text-[#66736C] border border-[#E7ECE8] font-mono font-bold text-[10px] tracking-wider">
                {t('lic.plan', 'Plan')} {planNumber}
              </span>
            )}
          </div>

          <button
            onClick={handleBookmarkToggle}
            title={isSaved ? t('myPlans.saved', 'Saved in My Plans') : t('myPlans.addToMyPlans', 'Add to My Plans')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#176B50] text-white border-[#176B50] shadow-xs'
                : 'bg-[#FAFAFC] hover:bg-[#E7F1EB] text-[#66736C] hover:text-[#176B50] border border-[#E7ECE8]'
            }`}
            aria-label="Bookmark plan"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white stroke-white' : ''}`} />
          </button>
        </div>

        {/* Plan Title & UIN */}
        <h3 className="font-serif font-bold text-lg sm:text-xl text-[#202B26] leading-snug group-hover:text-[#176B50] transition-colors">
          {displayName}
        </h3>

        <div className="flex items-center gap-2 mt-1 mb-3">
          <span className="text-[11px] font-mono text-[#66736C] font-bold uppercase tracking-wider">
            UIN: {uin || 'Official LIC'}
          </span>
          <span className="text-[#D5E4DC]">•</span>
          <span className="text-[11px] font-mono text-[#176B50] font-bold">
            {t('lic.officialBadge', '100% Official')}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-[#66736C] leading-relaxed line-clamp-3 mb-4">
          {shortDesc}
        </p>

        {/* Main Purpose Highlight */}
        {mainPurpose && (
          <div className="p-2.5 rounded-2xl bg-[#E7F1EB] border border-[#D5E4DC] text-[11px] text-[#176B50] leading-snug mb-4 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#176B50] shrink-0 mt-0.5" />
            <span className="font-medium">{mainPurpose}</span>
          </div>
        )}

        {/* Key Plan Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 my-3 p-3.5 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] text-xs">
          <div>
            <span className="text-[9.5px] font-mono font-bold text-[#66736C] uppercase tracking-wider block">{t('lic.entryAge', 'Entry Age')}</span>
            <span className="font-bold text-[#202B26] mt-0.5 block truncate">{minAgeText} - {maxAgeText}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-mono font-bold text-[#66736C] uppercase tracking-wider block">{t('lic.minCover', 'Min Cover')}</span>
            <span className="font-bold text-[#202B26] mt-0.5 block truncate">{minSumAssured}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-mono font-bold text-[#66736C] uppercase tracking-wider block">{t('lic.term', 'Term')}</span>
            <span className="font-bold text-[#202B26] mt-0.5 block truncate">{policyTermText}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E7ECE8] flex items-center gap-2 mt-2">
        <button
          onClick={() => onViewDetails(plan)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
        >
          <span>{t('lic.viewDetails', 'View Details')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          title="Open Official LIC Portal"
          className="p-2.5 h-10 w-10 flex items-center justify-center rounded-xl bg-[#FAFAFC] hover:bg-[#E7F1EB] text-[#66736C] hover:text-[#176B50] border border-[#E7ECE8] transition-colors shrink-0 cursor-pointer"
          aria-label="Official LIC URL"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
