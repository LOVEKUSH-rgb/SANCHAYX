import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
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
    <section id="latest-free-benefits" className="py-4 sm:py-5 bg-[#F8FAF8] border-b border-[#E7ECE8] overflow-hidden relative shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Live indicator badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-[11px] font-semibold uppercase tracking-wider shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#176B50] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#176B50]"></span>
              </span>
              <span>{t('ticker.liveNewsFeed', 'Live News Feed')}</span>
            </div>

            <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-[#202B26] tracking-tight">
              {t('ticker.latestFreeBenefits', 'Latest Free Benefits')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-[11px] text-[#66736C]">
              {t('ticker.hoverPause', 'Hover to pause • Click item to review gazette details')}
            </span>

            <Link
              to="/free-benefits"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#202B26] hover:text-[#176B50] border border-[#E7ECE8] hover:border-[#D5E4DC] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <span>{t('ticker.viewAllFreeBenefits', 'View All Free Benefits')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#176B50]" />
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
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#F8FAF8] via-[#F8FAF8]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#F8FAF8] via-[#F8FAF8]/80 to-transparent z-10 pointer-events-none" />

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
                className="flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-white hover:bg-[#FAFAFC] border border-[#E7ECE8] shadow-2xs hover:shadow-card hover:border-[#176B50]/30 transition-all duration-200 cursor-pointer shrink-0 max-w-[480px] sm:max-w-[540px] group"
              >
                {/* 1. Status Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F1EB] text-[#176B50] font-semibold text-[10px] uppercase tracking-wider shrink-0 border border-[#D5E4DC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B50]"></span>
                  <span>{t('ticker.newBadge', 'NEW')}</span>
                </span>

                {/* 2. Benefit Name & State Tag */}
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#202B26] truncate group-hover:text-[#176B50] transition-colors">
                      {displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAFAFC] border border-[#E7ECE8] text-[#66736C] font-mono text-[9.5px] font-bold uppercase shrink-0">
                      {item.state === 'All India' ? t('ticker.central', 'Central') : item.state}
                    </span>
                  </div>

                  {/* 3. Short Benefit Summary */}
                  <p className="text-[11px] sm:text-xs text-[#66736C] truncate mt-0.5 max-w-[240px] sm:max-w-[300px]">
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
                  className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] border border-[#D5E4DC] font-semibold text-[10.5px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
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
