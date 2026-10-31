import React, { useEffect } from 'react';
import { X, ShieldCheck, ExternalLink, Bookmark, CheckCircle2, AlertCircle, Sparkles, Award, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeLICPlan, getLocalizedCategory, getLocalizedCommonText } from '../../utils/contentLocalizer';

export const LICPlanDetailsModal = ({ plan, onClose }) => {
  const { isPlanSaved, addToMyPlans, removeFromMyPlans, isAuthenticated, openAuthModal } = useAuth();
  const { t, currentLang } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!plan) return null;

  const locPlan = localizeLICPlan(plan, currentLang);
  const planId = plan.plan_id || `LIC-${plan.plan_number}`;
  const isSaved = isPlanSaved ? isPlanSaved(planId) : false;

  const handleBookmarkToggle = () => {
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
  const displayDesc = locPlan.displayDescription || plan.detailed_description || plan.short_description;
  const displayPurpose = locPlan.displayPurpose || plan.main_purpose;
  const officialUrl = plan.official_lic_url || 'https://www.licindia.in/';
  const docUrl = plan.official_document_url || officialUrl;

  const ageRules = plan.age_rules || {};
  const childRules = plan.child_age_rules || {};
  const premRules = plan.premium_rules || {};
  const polTerm = plan.policy_term || {};
  const ppt = plan.premium_payment_term || {};
  const benefits = plan.benefits || {};
  const eligRules = plan.eligibility_rules || {};
  const loanRules = plan.loan_availability || {};
  const surrenderRules = plan.surrender_rules || {};

  const deathBenefit = plan.death_benefit || benefits.death_benefit_summary || 'Sum Assured on Death with applicable bonuses.';
  const maturityBenefit = plan.maturity_benefit || benefits.maturity_benefit_summary || 'Basic Sum Assured along with vested simple reversionary bonuses.';
  const survivalBenefit = plan.survival_benefit || benefits.survival_benefits || 'Not applicable (Lump-sum endowment/term assurance structure)';
  const bonusType = benefits.bonus_type || benefits.guaranteed_additions || 'Simple Reversionary Bonus + Final Additional Bonus';

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#202B26]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-3xl sm:max-w-4xl rounded-3xl shadow-floating border border-[#E7ECE8] overflow-hidden max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="bg-[#FAFAFC] text-[#202B26] p-5 sm:p-6 shrink-0 relative border-b border-[#E7ECE8]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-[#E7F1EB] text-[#66736C] hover:text-[#176B50] border border-[#E7ECE8] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-0.5 rounded-full bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC] text-[10.5px] font-mono font-bold uppercase tracking-wider">
              {category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-white text-[#202B26] border border-[#E7ECE8] font-mono font-bold text-[10.5px]">
              {t('lic.plan', 'PLAN')} {planNumber}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#176B50]" />
              {t('lic.gazetteBadge', '100% Official LIC Gazette')}
            </span>
          </div>

          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#202B26] pr-10">
            {displayName}
          </h2>

          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#66736C] flex-wrap">
            <span>UIN: <strong className="text-[#176B50]">{uin}</strong></span>
            <span>•</span>
            <span>{t('lic.irdaiReg', 'IRDAI Registration')}: <strong className="text-[#202B26]">512</strong></span>
            <span>•</span>
            <span>{t('featuredSchemes.verifiedDate', 'Last Verified')}: <strong className="text-[#202B26]">{plan.last_verified || '2026-08-31'}</strong></span>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-[#202B26] bg-[#F8FAF8]">
          
          {/* Main Purpose & Detailed Description */}
          <div className="space-y-3">
            {displayPurpose && (
              <div className="p-3.5 rounded-2xl bg-[#E7F1EB] border border-[#D5E4DC] text-xs sm:text-sm text-[#176B50] leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#176B50] shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-0.5 text-[#176B50]">{getLocalizedCommonText('what_you_get', currentLang)}:</strong>
                  {displayPurpose}
                </div>
              </div>
            )}

            <p className="text-xs sm:text-sm text-[#66736C] leading-relaxed">
              {displayDesc}
            </p>
          </div>

          {/* Section 1: Statutory Eligibility & Age Rules */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-[#202B26] flex items-center gap-2 border-b border-[#E7ECE8] pb-1.5">
              <Clock className="w-4 h-4 text-[#176B50]" />
              <span>{getLocalizedCommonText('lic_eligibility_rules', currentLang)}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="font-mono font-bold text-[10px] text-[#66736C] uppercase tracking-wider block">{t('lic.entryAgeWindow', 'Entry Age Window')}</span>
                <span className="font-bold text-[#202B26] text-sm mt-1 block">
                  {ageRules.entry_age_text || `${ageRules.min_entry_age_years || 0} to ${ageRules.max_entry_age_years || 65} Years`}
                </span>
                <span className="text-[11px] text-[#66736C] mt-1 block">
                  Min Maturity Age: {ageRules.min_maturity_age_years || 18} Yrs | Max Maturity Age: {ageRules.max_maturity_age_years || 75} Yrs
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="font-mono font-bold text-[10px] text-[#66736C] uppercase tracking-wider block">{t('lic.allowedGender', 'Allowed Gender & Lives')}</span>
                <span className="font-bold text-[#202B26] text-sm mt-1 block">
                  {plan.gender_rules?.allowed || 'All Genders (Male / Female / Other)'}
                </span>
                <span className="text-[11px] text-[#66736C] mt-1 block">
                  {plan.gender_rules?.notes || 'Standard rates apply under IRDAI underwriting norms.'}
                </span>
              </div>
            </div>

            {/* Child Plan Special Box if applicable */}
            {childRules.is_child_plan && (
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                <strong className="font-bold block mb-1 text-[#202B26]">👶 Child-Specific Plan Conditions:</strong>
                <p className="leading-relaxed">
                  • <strong>Child Entry Age:</strong> {childRules.min_child_age === 0.08 ? '30 Days' : `${childRules.min_child_age || 0} Years`} to {childRules.max_child_age || 12} Years.<br />
                  • <strong>Risk Commencement:</strong> {childRules.risk_commencement_rule || 'Immediate risk cover commences as per official policy schedule.'}<br />
                  • <strong>Premium Waiver Benefit (PWB):</strong> {childRules.proposer_pwb_available ? 'Available for proposer parent on disability/death.' : 'Not standard.'}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Premium & Policy Terms */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-[#202B26] flex items-center gap-2 border-b border-[#E7ECE8] pb-1.5">
              <DollarSign className="w-4 h-4 text-[#176B50]" />
              <span>{t('lic.premiumPolicyTerms', 'Premium & Policy Terms')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="font-mono font-bold text-[10px] text-[#66736C] uppercase tracking-wider block">{t('lic.sumAssured', 'Sum Assured')}</span>
                <span className="font-bold text-[#202B26] text-sm mt-1 block">{premRules.min_sum_assured_text || '₹1,00,000'}</span>
                <span className="text-[10px] text-[#66736C] mt-0.5 block">{premRules.max_sum_assured_text || 'No upper limit'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="font-mono font-bold text-[10px] text-[#66736C] uppercase tracking-wider block">{t('lic.policyTerm', 'Policy Term')}</span>
                <span className="font-bold text-[#202B26] text-sm mt-1 block">{polTerm.available_terms || '10 to 25 Years'}</span>
                <span className="text-[10px] text-[#66736C] mt-0.5 block">{polTerm.rule_description || 'Flexible term choices'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <span className="font-mono font-bold text-[10px] text-[#66736C] uppercase tracking-wider block">{t('lic.paymentTerm', 'Payment Term (PPT)')}</span>
                <span className="font-bold text-[#202B26] text-sm mt-1 block">{ppt.options ? ppt.options.join(', ') : 'Equal to Policy Term'}</span>
                <span className="text-[10px] text-[#66736C] mt-0.5 block">{ppt.rule_description || 'Regular / Limited premium options'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] text-xs flex items-center justify-between gap-2 flex-wrap shadow-card">
              <div>
                <span className="font-bold text-[#202B26]">{t('lic.allowedPaymentModes', 'Allowed Payment Modes:')}</span>{' '}
                <span className="text-[#66736C] font-medium">{premRules.premium_payment_modes ? premRules.premium_payment_modes.join(', ') : 'Yearly, Half-Yearly, Quarterly, Monthly (NACH)'}</span>
              </div>
              {premRules.high_sum_assured_rebate && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC] font-mono font-bold text-[10px]">
                  High Sum Assured Rebates Applicable
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Verified Benefits Breakdown */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-[#202B26] flex items-center gap-2 border-b border-[#E7ECE8] pb-1.5">
              <Award className="w-4 h-4 text-[#176B50]" />
              <span>{t('lic.verifiedStatutoryBenefits', 'Verified Statutory Benefits')}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <strong className="font-bold text-[#176B50] block mb-0.5">{t('lic.deathBenefit', '🛡️ Death Benefit:')}</strong>
                <p className="text-slate-200 leading-relaxed">{deathBenefit}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] shadow-card">
                <strong className="font-bold text-[#176B50] block mb-0.5">{t('lic.maturityBenefit', '🏆 Maturity Benefit:')}</strong>
                <p className="text-slate-200 leading-relaxed">{maturityBenefit}</p>
              </div>

              {survivalBenefit && survivalBenefit !== 'Not applicable (Lump-sum endowment/term assurance structure)' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-card">
                  <strong className="font-bold text-amber-800 block mb-0.5">{t('lic.survivalPayouts', '💵 Survival Payouts:')}</strong>
                  <p className="text-slate-200 leading-relaxed">{survivalBenefit}</p>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] text-[11.5px] text-[#202B26] shadow-card">
                <strong className="font-bold text-[#202B26]">{t('lic.bonusParticipation', 'Bonus Participation & Yield Structure:')}</strong> {bonusType}
              </div>
            </div>
          </div>

          {/* Section 4: Important Conditions, Riders & Liquidity */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-[#202B26] flex items-center gap-2 border-b border-[#E7ECE8] pb-1.5">
              <AlertCircle className="w-4 h-4 text-[#176B50]" />
              <span>{t('lic.conditionsLiquidity', 'Important Conditions & Liquidity')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] space-y-1 shadow-card">
                <strong className="font-bold text-[#202B26] block">{t('lic.loanFacility', 'Loan Facility:')}</strong>
                <p className="text-[#66736C]">
                  {loanRules.allowed ? `Allowed after ${loanRules.waiting_period_months || 12} months. ${loanRules.max_loan_percentage || 'Up to 90% of surrender value.'}` : 'Loan facility is not permitted under this plan structure.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7ECE8] space-y-1 shadow-card">
                <strong className="font-bold text-[#202B26] block">{t('lic.surrenderRevival', 'Surrender & Revival:')}</strong>
                <p className="text-[#66736C]">
                  {surrenderRules.guaranteed_surrender_value_rule || 'Guaranteed surrender value available after policy acquires paid-up status.'} Revival permitted within {plan.revival_rules?.within_years || 5} years.
                </p>
              </div>
            </div>

            {plan.riders && plan.riders.length > 0 && (
              <div className="p-3 rounded-2xl bg-white border border-[#E7ECE8] text-xs shadow-card">
                <strong className="font-bold text-[#202B26] block mb-1">{t('lic.optionalRiders', 'Optional LIC Riders Available:')}</strong>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {plan.riders.map((r, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-[#060b08] border border-emerald-500/20 text-[#66736C] font-mono text-[10.5px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="bg-[#FAFAFC] p-4 sm:p-5 shrink-0 border-t border-[#E7ECE8] flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            onClick={handleBookmarkToggle}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl border font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 hover:bg-emerald-500 text-[#202B26] border-emerald-500 shadow-xs'
                : 'bg-[#0c1611] hover:bg-emerald-950/60 text-[#66736C] hover:text-[#202B26] border-emerald-500/25'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white stroke-white' : ''}`} />
            <span>{isSaved ? t('myPlans.saved', 'Saved in My Plans') : t('myPlans.addToMyPlans', 'Save to My Plans')}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={officialUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[#202B26] font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <span>{t('lic.viewOfficialSource', 'View Official LIC Source')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 h-11 rounded-2xl bg-white hover:bg-[#FAFAFC] border border-[#E7ECE8] text-[#202B26] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
            >
              {t('common.close', 'Close')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

