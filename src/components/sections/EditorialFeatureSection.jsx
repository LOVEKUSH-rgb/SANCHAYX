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
    <section className="py-20 sm:py-28 bg-[#F8FAF8] border-b border-[#E7ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Label & Heading */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 shadow-2xs">
            <span className="text-[#92400E] font-bold">03</span>
            <span className="text-[#D5E4DC]">/</span>
            <span>{t('goals.title', 'GOAL DISCOVERY')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#202B26] tracking-tight leading-tight">
            {t('goals.subtitle', 'Which scheme is right for your goal?')}
          </h2>
          <p className="text-base sm:text-lg text-[#66736C] mt-3 leading-relaxed">
            {t('goals.objectiveSubtitle', 'Select your primary objective to explore officially verified financial pathways tailored to your timeline.')}
          </p>
        </div>

        {/* Bento Magazine Grid: Large Card Left + 4 Smaller Cards Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Large Featured Card (Left Column, Span 7) */}
          <div
            onClick={() => onSelectGoal && onSelectGoal('wealth')}
            className="lg:col-span-7 bg-white rounded-3xl border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
          >
            {/* Image covering top half */}
            <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#FAFAFC] flex items-center justify-center border-b border-[#E7ECE8]">
              <img
                src={EDITORIAL_FEATURE_IMAGES.wealth.url}
                alt="Long-term wealth & retirement"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/schemes/_fallback.svg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 border border-[#D5E4DC] text-[#176B50] font-semibold text-xs uppercase tracking-wider shadow-2xs">
                {t('editorial.featuredGuidance', 'FEATURED EDITORIAL GUIDANCE')}
              </div>
            </div>

            {/* Content Text */}
            <div className="p-8 bg-white flex-1 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#176B50] uppercase tracking-widest block mb-2">
                  {t('editorial.primaryWealthObjective', '01 / PRIMARY WEALTH OBJECTIVE')}
                </span>
                <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-[#202B26] group-hover:text-[#176B50] transition-colors">
                  {t('goals.wealth', 'Long-term wealth & retirement')}
                </h3>
                <p className="text-sm text-[#66736C] mt-3 leading-relaxed">
                  {t('goals.wealthDesc', 'Discover schemes designed for disciplined long-term saving. Harness compound interest with 100% sovereign guarantees and zero market risk.')}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E7ECE8] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#66736C] uppercase">
                  {t('editorial.includesPPFNPS', 'Includes PPF, NPS & Sovereign Gold Bonds')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B50] group-hover:text-[#125540] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  <span>{t('goals.exploreGoal', 'Explore Pathways')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* 4 Smaller Goal Cards (Right Column, Span 5) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {smallCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onSelectGoal && onSelectGoal(card.id)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all duration-300 flex items-center gap-4 group cursor-pointer hover:-translate-y-0.5"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#FAFAFC] shrink-0 border border-[#E7ECE8]">
                  <img
                    src={card.image}
                    alt={card.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/schemes/_fallback.svg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-[#176B50] uppercase tracking-wider block mb-1">
                    {card.badge}
                  </span>
                  <h4 className="font-serif font-extrabold text-sm sm:text-base text-[#202B26] group-hover:text-[#176B50] transition-colors line-clamp-1">
                    {card.title}
                  </h4>
                  <p className="text-xs text-[#66736C] mt-1 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] flex items-center justify-center text-[#176B50] shrink-0 group-hover:bg-[#176B50] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
