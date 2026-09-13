import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EDITORIAL_FEATURE_IMAGES } from '../../data/schemeImages';
import { useLanguage } from '../../context/LanguageContext';

export const EditorialFeatureSection = ({ onSelectGoal }) => {
  const { t } = useLanguage();

  const smallCards = [
    {
      id: 'education',
      title: t('goals.education', "Saving for your child's future"),
      desc: t('goals.educationDesc', 'SSY & Minor PPF options providing 100% tax-free maturity for higher education.'),
      image: EDITORIAL_FEATURE_IMAGES.child.url,
      badge: 'GOAL 01',
    },
    {
      id: 'retirement',
      title: t('goals.retirement', 'Planning retirement'),
      desc: t('goals.retirementDesc', 'Guaranteed pension schemes like APY & NPS for lifetime monthly cashflow.'),
      image: EDITORIAL_FEATURE_IMAGES.retirement_card.url,
      badge: 'GOAL 02',
    },
    {
      id: 'emergency',
      title: t('goals.emergency', 'Building emergency savings'),
      desc: t('goals.emergencyDesc', 'Sovereign-backed liquid post office savings and term deposit options.'),
      image: EDITORIAL_FEATURE_IMAGES.emergency.url,
      badge: 'GOAL 03',
    },
    {
      id: 'tax',
      title: t('goals.tax', 'Tax Saving (80C / 80CCD)'),
      desc: t('goals.taxDesc', 'Maximize legal tax deductions under Income Tax Act.'),
      image: EDITORIAL_FEATURE_IMAGES.protection.url,
      badge: 'GOAL 04',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Label & Heading */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-navy-950 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4 shadow-xs">
            <span className="text-sanchay-gold-500">03</span>
            <span className="text-slate-500">/</span>
            <span>{t('goals.title', 'GOAL DISCOVERY')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
            {t('goals.subtitle', 'Which scheme is right for your goal?')}
          </h2>
          <p className="text-base sm:text-lg text-sanchay-navy-700 mt-3 leading-relaxed">
            Select your primary objective to explore officially verified financial pathways tailored to your timeline.
          </p>
        </div>

        {/* Bento Magazine Grid: Large Card Left (55% Image) + 4 Smaller Cards Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Large Featured Card (Left Column, Span 7) */}
          <div
            onClick={() => onSelectGoal && onSelectGoal('wealth')}
            className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
          >
            {/* Image covering ~55% height */}
            <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src={EDITORIAL_FEATURE_IMAGES.wealth.url}
                alt="Long-term wealth & retirement"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/schemes/_fallback.svg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-sanchay-navy-950/80 backdrop-blur-xs text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm">
                FEATURED EDITORIAL GUIDANCE
              </div>
            </div>

            {/* Content Text Overlay/Adjacent */}
            <div className="p-8 bg-white flex-1 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-sanchay-emerald-700 uppercase tracking-widest block mb-2">
                  01 / PRIMARY WEALTH OBJECTIVE
                </span>
                <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 transition-colors">
                  {t('goals.wealth', 'Long-term wealth & retirement')}
                </h3>
                <p className="text-sm text-sanchay-navy-700 mt-3 leading-relaxed">
                  {t('goals.wealthDesc', 'Discover schemes designed for disciplined long-term saving. Harness compound interest with 100% sovereign guarantees and zero market risk.')}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase">
                  Includes PPF, NPS & Sovereign Gold Bonds
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-extrabold text-sanchay-emerald-700 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                  <span>{t('explore.viewDetails', 'Explore Pathway')}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* 4 Smaller Complementary Goal Cards (Right Column, Span 5) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {smallCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onSelectGoal && onSelectGoal(card.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-editorial hover:border-sanchay-emerald-500/40 transition-all duration-300 flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative flex items-center justify-center">
                  <img
                    src={card.image}
                    alt={card.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/schemes/_fallback.svg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[8px] font-mono font-bold text-white uppercase">
                    {card.badge}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-base text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 transition-colors leading-snug truncate">
                    {card.title}
                  </h4>
                  <p className="text-xs text-sanchay-navy-700 mt-1 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sanchay-emerald-700 uppercase tracking-wider mt-2 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore Goal</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
