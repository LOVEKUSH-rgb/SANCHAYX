import React from 'react';
import { X, Check, ShieldCheck, ExternalLink, PlusCircle, ArrowLeftRight, Bookmark, Calculator } from 'lucide-react';
import { SchemeCalculatorModal } from '../calculator/SchemeCalculatorModal';
import { getSchemeImage } from '../../data/schemeImages';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { localizeScheme, getLocalizedCommonText, getLocalizedCategory } from '../../utils/contentLocalizer';

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border border-[#E7ECE8] rounded-2xl overflow-hidden mb-3 bg-white shadow-2xs">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-white hover:bg-[#FAFAFC] flex items-center justify-between transition-colors font-bold text-sm text-[#202B26] cursor-pointer"
      >
        <span>{title}</span>
        <span className={`transform transition-transform text-[#176B50] ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="p-5 bg-white border-t border-[#E7ECE8] text-[#66736C]">
          {children}
        </div>
      )}
    </div>
  );
};

export const ProductDetailsModal = ({ item, onClose, onCompare }) => {
  const { t, currentLang } = useLanguage();
  const { isPlanSaved, addToMyPlans, removeFromMyPlans } = useAuth();
  const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#202B26]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white text-[#202B26] w-full max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl shadow-floating border border-[#E7ECE8] overflow-hidden max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Compact Hero Image Banner */}
        <div className="relative h-40 sm:h-48 w-full bg-[#FAFAFC] shrink-0 overflow-hidden border-b border-[#E7ECE8]">
          <img
            src={imgData?.url || '/schemes/_fallback.svg'}
            alt={item.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/schemes/_fallback.svg';
            }}
            className="w-full h-full object-contain p-2 sm:p-3"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white border border-[#E7ECE8] text-[#202B26] hover:text-[#176B50] transition-colors shadow-2xs z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges Over Image */}
          <div className="absolute top-3 left-3 right-12 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D5E4DC] text-[#176B50] font-semibold text-[10px] uppercase tracking-wider shadow-2xs">
              {displayCategory}
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-[#176B50] text-white font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{getLocalizedCommonText('verified_source', currentLang)}</span>
            </span>
          </div>

          {/* Title & Authority at bottom of image */}
          <div className="absolute bottom-3 left-4 right-4 text-[#202B26]">
            <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-[#202B26] leading-snug line-clamp-1">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-1 mt-0.5 text-[11px] text-[#66736C]">
              <span className="truncate max-w-[280px]">{getLocalizedCommonText('authority', currentLang)}: {authority}</span>
              <span className="font-semibold text-[10px] text-[#176B50]">{getLocalizedCommonText('verified_date', currentLang)}: {lastVerified}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F8FAF8]">
          
          <Accordion title="Overview" defaultOpen={true}>
            <p className="text-xs sm:text-sm text-[#66736C] leading-relaxed">
              {displayDesc}
            </p>
          </Accordion>

          <Accordion title="Financial Details" defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infoCards.map((card, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    card.highlight
                      ? 'bg-[#E7F1EB] border-[#D5E4DC]'
                      : 'bg-[#FAFAFC] border-[#E7ECE8]'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                    card.highlight ? 'text-[#176B50]' : 'text-[#66736C]'
                  }`}>
                    {card.title}
                  </span>
                  <span className={`font-serif font-extrabold text-xs block leading-snug ${
                    card.highlight ? 'text-[#176B50] text-sm' : 'text-[#202B26]'
                  }`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="Official Source" defaultOpen={false}>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#176B50] shrink-0" />
                <span className="font-bold text-[#202B26]">{t('featuredSchemes.authority', 'Authority')}:</span>
                <span className="text-[#66736C]">{authority}</span>
              </div>
              <div className="flex flex-col gap-1 text-[#66736C]">
                <span className="font-bold text-[#202B26] font-sans">URL:</span>
                <span className="truncate max-w-full block bg-[#FAFAFC] p-2 rounded-lg border border-[#E7ECE8] text-[#66736C]">{officialUrl}</span>
              </div>
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-xs w-max cursor-pointer"
                >
                  <span>{t('featuredSchemes.officialPortal', 'Visit Official Details')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </Accordion>
        </div>

        {/* Modal Sticky Footer CTAs */}
        <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-[#E7ECE8] flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer border border-[#D5E4DC] shadow-2xs mr-auto"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t('calculator.buttonText', 'Calculate Benefit')}</span>
          </button>

          <button
            onClick={() => isSaved ? removeFromMyPlans(schemeId) : addToMyPlans(schemeId)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
              isSaved
                ? 'bg-[#E7F1EB] text-[#176B50] border-[#D5E4DC]'
                : 'bg-[#FAFAFC] hover:bg-[#F8FAF8] text-[#202B26] border-[#E7ECE8] shadow-2xs'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-[#176B50] fill-[#176B50]' : 'text-[#66736C]'}`} />
            <span>{isSaved ? t('myPlans.saved', 'Saved to Plans') : t('myPlans.addToMyPlans', 'Add to My Plans')}</span>
          </button>

          <Link
            to={`/compare?scheme1=${schemeId}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F8FAF8] text-[#202B26] font-semibold text-xs uppercase tracking-wider border border-[#E7ECE8] shadow-2xs transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#176B50]" />
            <span>{t('explore.compare', 'Compare')}</span>
          </Link>

          <Link
            to={`/profile${schemeId ? `?schemeId=${schemeId}` : ''}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('nav.findMySchemes', 'Find My Schemes')}</span>
          </Link>
        </div>

      </div>

      {isCalculatorOpen && (
        <SchemeCalculatorModal
          scheme={item}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}
    </div>
  );
};
