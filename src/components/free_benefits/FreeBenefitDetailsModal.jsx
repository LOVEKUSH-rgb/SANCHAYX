import React from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle2, FileText, Calendar, Building2, MapPin, Sparkles, AlertCircle, ArrowRight, Bookmark } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { localizeFreeBenefit, getLocalizedCommonText, getLocalizedBenefitType } from '../../utils/contentLocalizer';

export const FreeBenefitDetailsModal = ({ benefit, isOpen, onClose, onCheckEligibility }) => {
  const { t, currentLang } = useLanguage();

  const { savedPlanIds, addToMyPlans, removeFromMyPlans, isAuthenticated, openAuthModal } = useAuth();
  const isSaved = savedPlanIds?.has(benefit?.benefit_id);

  if (!isOpen || !benefit) return null;

  const locBenefit = localizeFreeBenefit(benefit, currentLang);
  const displayName = locBenefit.displayName || benefit.name;
  const displayBenefit = locBenefit.displayBenefit || benefit.benefit;
  const displayElig = locBenefit.displayEligibility || benefit.eligibility_text || benefit.eligibility;
  const displayType = locBenefit.displayBenefitType || getLocalizedBenefitType(benefit.benefit_type, currentLang);

  const isCompletelyFree = benefit.benefit_type === 'completely_free';
  const hasOfficialApplyUrl = Boolean(benefit.application_url && benefit.application_url.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sanchay-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-editorial border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isCompletelyFree ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-mono font-bold uppercase tracking-wider">
                  ★ 100% FREE BENEFIT
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10.5px] font-mono font-bold uppercase tracking-wider">
                  {displayType}
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-sanchay-navy-900 text-[10.5px] font-mono font-bold uppercase">
                {benefit.level === 'central' ? getLocalizedCommonText('central_govt', currentLang) : benefit.level === 'ut' ? `UT • ${benefit.state}` : `${getLocalizedCommonText('state_govt', currentLang)} • ${benefit.state}`}
              </span>

              {benefit.status === 'active_listed' && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{getLocalizedCommonText('active_verified', currentLang)}</span>
                </span>
              )}
            </div>

            <h2 className="font-serif font-bold text-xl sm:text-2xl text-sanchay-navy-950 leading-snug pt-1">
              {displayName}
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Benefit ID: {benefit.benefit_id} • Verified: {benefit.last_verified}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                if (isSaved) {
                  removeFromMyPlans(benefit.benefit_id);
                } else {
                  addToMyPlans(benefit.benefit_id);
                }
              }}
              title={isSaved ? t('myPlans.removePlan', "Remove from My Plans") : t('myPlans.addToMyPlans', "Save to My Plans")}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-sanchay-navy-950 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto space-y-6 text-sm text-sanchay-navy-900">
          
          {/* What you get */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
            <h3 className="font-serif font-bold text-sm text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{getLocalizedCommonText('what_you_get', currentLang)}</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
              {displayBenefit}
            </p>
          </div>

          {/* Who can apply & Eligibility */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-sm text-sanchay-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600" />
              <span>{getLocalizedCommonText('who_can_apply', currentLang)}</span>
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {displayElig}
            </div>
          </div>

          {/* Required Documents */}
          {benefit.required_documents && benefit.required_documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-sanchay-navy-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>{getLocalizedCommonText('required_documents', currentLang)}</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {benefit.required_documents.map((doc, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Mode & Steps */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-sm text-sanchay-navy-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>{getLocalizedCommonText('application_mode_procedure', currentLang)}</span>
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold uppercase text-slate-500">Mode:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-sanchay-navy-950">
                  {benefit.application_mode ? benefit.application_mode.replace(/_/g, ' ') : 'As per official department guidelines'}
                </span>
              </div>
              {benefit.application_steps && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                  {benefit.application_steps}
                </p>
              )}
            </div>
          </div>

          {/* Important Deadline / Last Date */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAFAFC] border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Application Window / Deadline:</span>
            </div>
            <span className="font-mono font-bold text-sanchay-navy-950">
              {benefit.last_date ? benefit.last_date : 'Continuous / Active Scheme'}
            </span>
          </div>

          {/* Official Source & Verification Notice */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-[11.5px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>Sourced from verified official portal: </span>
              <a 
                href={benefit.official_source} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold underline hover:text-amber-950"
              >
                {benefit.official_source}
              </a>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onCheckEligibility) onCheckEligibility(benefit);
            }}
            className="px-4 py-2.5 rounded-xl bg-sanchay-gold-500 hover:bg-sanchay-gold-600 text-sanchay-navy-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{getLocalizedCommonText('check_eligibility_title', currentLang)}</span>
          </button>

          <div className="flex items-center gap-2">
            {hasOfficialApplyUrl ? (
              <a
                href={benefit.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-card cursor-pointer"
              >
                <span>{getLocalizedCommonText('apply_on_portal', currentLang)}</span>
                <ExternalLink className="w-3.5 h-3.5 text-sanchay-gold-400" />
              </a>
            ) : (
              <a
                href={benefit.official_source}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-sanchay-navy-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{getLocalizedCommonText('official_details', currentLang)}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
