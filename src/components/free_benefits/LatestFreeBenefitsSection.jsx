import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLatestFreeBenefits } from '../../services/api';
import { FALLBACK_FREE_BENEFITS } from '../../data/freeBenefitsFallback';
import { FreeBenefitDetailsModal } from './FreeBenefitDetailsModal';
import { FreeBenefitEligibilityModal } from './FreeBenefitEligibilityModal';
import { useLanguage } from '../../context/LanguageContext';
import { localizeFreeBenefit } from '../../utils/contentLocalizer';

export const LatestFreeBenefitsSection = () => {
  const { t, currentLang } = useLanguage();
  const [benefits, setBenefits] = useState(FALLBACK_FREE_BENEFITS.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [eligibilityBenefit, setEligibilityBenefit] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getLatestFreeBenefits(10).then(data => {
      if (isMounted && data && Array.isArray(data) && data.length > 0) {
        setBenefits(data);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  if (!loading && benefits.length === 0) return null;

  // Duplicate items for continuous seamless loop without gap
  const tickerItems = benefits.length > 0 ? [...benefits, ...benefits] : [];

  return (
    <section id="latest-free-benefits" className="py-4 sm:py-5 bg-white border-b border-slate-200/90 overflow-hidden relative selection:bg-emerald-600 selection:text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Live indicator badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>{t('ticker.liveNewsFeed', 'Live News Feed')}</span>
            </div>

            <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-sanchay-navy-950 tracking-tight">
              {t('ticker.latestFreeBenefits', 'Latest Free Benefits')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-[11px] font-mono text-slate-400">
              {t('ticker.hoverPause', 'Hover to pause • Click item to review gazette details')}
            </span>

            <Link
              to="/free-benefits"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-950 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
            >
              <span>{t('ticker.viewAllFreeBenefits', 'View All Free Benefits')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
          </div>
        </div>

      </div>

      {/* Horizontal Continuous News Ticker Strip */}
      <div 
        className="w-full relative overflow-hidden ticker-wrapper py-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left & Right subtle edge fade gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div 
          className="animate-ticker-flow flex items-center gap-4 px-4"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {tickerItems.map((item, idx) => {
            const locItem = localizeFreeBenefit(item, currentLang);
            const displayName = locItem.displayName || item.name;
            const displayBenefit = locItem.displayBenefit || item.benefit;

            return (
              <div
                key={`${item.benefit_id}-${idx}`}
                onClick={() => setSelectedBenefit(item)}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-[#FAFAFC] hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shrink-0 max-w-[480px] sm:max-w-[540px] group"
              >
                {/* 1. Status Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 font-mono font-bold text-[10px] uppercase tracking-wider shrink-0 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>{t('ticker.newBadge', 'NEW')}</span>
                </span>

                {/* 2. Benefit Name & State Tag */}
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs sm:text-sm text-sanchay-navy-950 truncate group-hover:text-emerald-800 transition-colors">
                      {displayName}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-slate-200/70 text-slate-700 font-mono text-[9.5px] font-bold uppercase shrink-0">
                      {item.state === 'All India' ? t('ticker.central', 'Central') : item.state}
                    </span>
                  </div>

                  {/* 3. Short Benefit Summary */}
                  <p className="text-[11px] sm:text-xs text-slate-600 truncate mt-0.5 max-w-[240px] sm:max-w-[300px]">
                    {displayBenefit}
                  </p>
                </div>

                {/* 4. Check Eligibility CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEligibilityBenefit(item);
                  }}
                  className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-[10.5px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-xs hover:border-emerald-500"
                >
                  <Sparkles className="w-3 h-3 text-sanchay-gold-600" />
                  <span className="hidden sm:inline">{t('ticker.checkEligibility', 'Check Eligibility')}</span>
                  <span className="sm:hidden">{t('ticker.checkShort', 'Check')}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
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
    </section>
  );
};
