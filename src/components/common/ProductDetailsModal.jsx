import React from 'react';
import { X, Check, ShieldCheck, ExternalLink, PlusCircle, ArrowLeftRight, Bookmark } from 'lucide-react';
import { getSchemeImage } from '../../data/schemeImages';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { localizeScheme, getLocalizedCommonText, getLocalizedCategory } from '../../utils/contentLocalizer';

export const ProductDetailsModal = ({ item, onClose, onCompare }) => {
  const { t, currentLang } = useLanguage();
  const { isPlanSaved, addToMyPlans, removeFromMyPlans } = useAuth();
  if (!item) return null;

  const locItem = localizeScheme(item, currentLang);
  const schemeId = item.scheme_id || item.id || item.shortName;
  const isSaved = isPlanSaved(schemeId);
  const displayName = locItem.displayName || (typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name);
  const displayCategory = locItem.displayCategory || getLocalizedCategory(item.category, currentLang);
  const displayDesc = locItem.displayDescription || item.descriptionSimple || item.short_description || item.full_description || item.benefitsOverview;
  const imgData = getSchemeImage(schemeId, item.category, displayName);
  const rawUrl = item.official_url || item.officialSourceUrl || item.verification?.official_url || 'https://india.gov.in';
  const officialUrl = rawUrl.includes('wcd.nic.in/bbbp-schemes') 
    ? 'https://wcd.nic.in' 
    : (rawUrl.includes('pmkmy.gov.in/schemes') ? 'https://pmkmy.gov.in' : (rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl));
  const authority = item.authority || item.officialAuthority || item.provider || 'Government of India';
  const lastVerified = item.last_verified_date || item.lastVerifiedDate || '2026-08-28';
  const fin = item.financial || {};
  const benefits = item.benefits || {};

  const notSpecified = t('common.notSpecified', 'Not specified in verified source');

  const infoCards = [
    {
      title: t('compare.interestRate', 'Interest / Return'),
      value: item.currentInterestRate || benefits.interest_rate || benefits.pension_amount || benefits.insurance_coverage || benefits.amount || item.returnType || notSpecified,
      highlight: true,
    },
    {
      title: t('compare.eligibility', 'Eligibility'),
      value: locItem.displayEligibility || item.eligibilitySummary || (item.minAge !== undefined ? `Aged ${item.minAge} to ${item.maxAge || 'No limit'} Yrs` : (item.eligibility?.min_age !== undefined ? `Aged ${item.eligibility.min_age} to ${item.eligibility.max_age || 'No limit'} Yrs` : (item.eligibility?.age_min !== undefined ? `Aged ${item.eligibility.age_min} to ${item.eligibility.age_max || 'No limit'} Yrs` : 'All Indian Residents'))),
    },
    {
      title: t('compare.minDeposit', 'Minimum Contribution'),
      value: (item.minimumContribution || fin.minimum_contribution) ? `₹${(item.minimumContribution || fin.minimum_contribution).toLocaleString('en-IN')}` : notSpecified,
    },
    {
      title: t('compare.maxDeposit', 'Maximum Contribution'),
      value: (item.maximumContribution || fin.maximum_contribution) ? (typeof (item.maximumContribution || fin.maximum_contribution) === 'number' ? `₹${(item.maximumContribution || fin.maximum_contribution).toLocaleString('en-IN')}` : (item.maximumContribution || fin.maximum_contribution)) : notSpecified,
    },
    {
      title: t('compare.lockIn', 'Lock-in Period'),
      value: (item.lockInYears || fin.lock_in_years) ? `${item.lockInYears || fin.lock_in_years} Years` : fin.lock_in || fin.lock_in_period || item.policyTerm || notSpecified,
    },
    {
      title: t('compare.liquidity', 'Liquidity'),
      value: item.partialWithdrawal || (fin.liquidity ? (typeof fin.liquidity === 'string' ? fin.liquidity : fin.liquidity.level) : null) || notSpecified,
    },
    {
      title: t('compare.taxBenefit', 'Tax Treatment'),
      value: item.taxBenefit || benefits.tax_benefit || fin.tax_treatment || notSpecified,
    },
    {
      title: t('compare.withdrawalRules', 'Withdrawal Rules'),
      value: item.partialWithdrawal || fin.withdrawal_rules || notSpecified,
    },
  ];

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl shadow-floating border border-slate-200/90 overflow-hidden max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Compact Hero Image Banner */}
        <div className="relative h-40 sm:h-48 w-full bg-sanchay-navy-950 shrink-0 overflow-hidden">
          <img
            src={imgData?.url || '/schemes/_fallback.svg'}
            alt={item.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/schemes/_fallback.svg';
            }}
            className="w-full h-full object-contain p-2 sm:p-3"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sanchay-navy-950 via-sanchay-navy-950/60 to-transparent" />

          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors backdrop-blur-xs shadow-md z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges Over Image */}
          <div className="absolute top-3 left-3 right-12 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-sanchay-navy-950 font-mono font-bold text-[10px] uppercase tracking-wider shadow-2xs">
              {displayCategory}
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-sanchay-emerald-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{getLocalizedCommonText('verified_source', currentLang)}</span>
            </span>
          </div>

          {/* Title & Authority at bottom of image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-white drop-shadow-xs leading-snug line-clamp-1">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-1 mt-0.5 text-[11px] text-slate-300">
              <span className="truncate max-w-[280px]">{getLocalizedCommonText('authority', currentLang)}: {authority}</span>
              <span className="font-mono text-[10px] text-sanchay-gold-400">{getLocalizedCommonText('verified_date', currentLang)}: {lastVerified}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-sanchay-navy-950">
          
          {/* Simple Description */}
          <p className="text-xs sm:text-sm text-sanchay-navy-700 leading-relaxed bg-[#FAFAFC] p-3.5 rounded-xl border border-slate-200/80">
            {displayDesc}
          </p>

          {/* Compact Information Cards */}
          <div>
            <h3 className="font-serif font-bold text-sm text-sanchay-navy-950 mb-2.5">
              {getLocalizedCommonText('official_scheme_parameters', currentLang)}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {infoCards.map((card, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    card.highlight
                      ? 'bg-sanchay-emerald-50/70 border-sanchay-emerald-200'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <span className={`font-serif font-extrabold text-xs mt-0.5 block leading-snug ${
                    card.highlight ? 'text-sanchay-emerald-700 text-sm' : 'text-sanchay-navy-950'
                  }`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Source Link & Authority Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-sanchay-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-serif font-bold text-xs text-sanchay-navy-950">Official Authority Source: {authority}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">{officialUrl}</div>
              </div>
            </div>

            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 shadow-2xs"
              >
                <span>Official Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

        </div>

        {/* Modal Sticky Footer CTAs */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={() => isSaved ? removeFromMyPlans(schemeId) : addToMyPlans(schemeId)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
              isSaved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                : 'bg-white hover:bg-slate-100 text-sanchay-navy-950 border-slate-200 shadow-2xs'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-600 fill-emerald-600' : 'text-slate-500'}`} />
            <span>{isSaved ? (currentLang === 'hi' ? 'प्लान में सहेजा गया' : 'Saved to Plans') : (currentLang === 'hi' ? '+ प्लान में जोड़ें' : 'Add to My Plans')}</span>
          </button>

          <Link
            to={`/compare?scheme1=${schemeId}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-sanchay-navy-950 font-bold text-xs uppercase tracking-wider border border-slate-200/90 shadow-2xs transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sanchay-emerald-600" />
            <span>{t('explore.compare', 'Compare')}</span>
          </Link>

          <Link
            to="/profile"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('nav.findMySchemes', 'Find My Schemes')}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
