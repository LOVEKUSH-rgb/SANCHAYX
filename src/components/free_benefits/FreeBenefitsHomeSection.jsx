import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, HeartPulse, GraduationCap, Utensils, Zap, ExternalLink } from 'lucide-react';
import { FALLBACK_FREE_BENEFITS } from '../../data/freeBenefitsFallback';
import { FreeBenefitDetailsModal } from './FreeBenefitDetailsModal';
import { FreeBenefitEligibilityModal } from './FreeBenefitEligibilityModal';
import { useLanguage } from '../../context/LanguageContext';

export const FreeBenefitsHomeSection = () => {
  const { t } = useLanguage();
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [eligibilityBenefit, setEligibilityBenefit] = useState(null);

  // Top 6 flagship sovereign free benefits to showcase on the home page
  const featuredIds = [
    'CENTRAL-PMJAY-FREE-HEALTH',
    'CENTRAL-PMGKAY',
    'CENTRAL-PMKVY-FREE-SKILL',
    'ASSAM-FREE-HEART-SURGERY',
    'CENTRAL-NAYA-SAVERA-FREE-COACHING',
    'CENTRAL-PM-SURYA-GHAR'
  ];

  const showcaseBenefits = featuredIds
    .map(id => FALLBACK_FREE_BENEFITS.find(b => b.benefit_id === id))
    .filter(Boolean);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'health':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'skill_employment':
      case 'education':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'energy_utility':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Gift className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <section id="free-benefits-home-section" className="py-16 sm:py-20 bg-[#FAF9F5] border-t border-slate-200/80 relative overflow-hidden">
      {/* Soft ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sanchay-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 border border-sanchay-emerald-200 text-xs font-mono font-bold uppercase tracking-wider mb-3.5 shadow-2xs">
              <Gift className="w-4 h-4 text-sanchay-emerald-600" />
              <span>100% Free Sovereign Benefits & Direct Assistance</span>
            </div>

            {/* Title */}
            <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
              Free Benefits & Welfare Schemes
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-sanchay-navy-700 font-normal mt-2 leading-relaxed">
              Zero-cost food rations, ₹5 Lakh cashless healthcare, free competitive coaching, and government skill stipends with no broker commissions.
            </p>

            {/* Pillar Tag */}
            <div className="flex items-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-slate-200/70 flex-wrap text-xs font-mono font-bold">
              <span className="text-slate-400 uppercase tracking-wider">SOVEREIGN DIRECT AID:</span>
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                🎁 22 Verified Free Schemes
              </span>
              <span className="inline-flex items-center gap-1 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                ⚡ 100% Free & Cashless Aid
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0">
            <Link
              to="/free-benefits"
              className="inline-flex items-center justify-center gap-2.5 h-13 px-8 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span>VIEW ALL 22 FREE BENEFITS →</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Featured Free Benefits Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseBenefits.map((item) => {
            const isCompletelyFree = item.benefit_type === 'completely_free';

            return (
              <div
                key={item.benefit_id}
                onClick={() => setSelectedBenefit(item)}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-floating hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold text-[10.5px] uppercase tracking-wider ${
                      isCompletelyFree
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      <Sparkles className="w-3 h-3 text-sanchay-gold-600" />
                      <span>{isCompletelyFree ? '100% Free Benefit' : 'Direct Subsidy Aid'}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10.5px] font-bold uppercase">
                      {item.state === 'All India' ? 'Central' : item.state}
                    </span>
                  </div>

                  {/* Benefit Title */}
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-sanchay-navy-950 group-hover:text-emerald-800 transition-colors leading-snug mb-2">
                    {item.name}
                  </h3>

                  {/* Primary Statutory Benefit Highlight */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/90 mb-3.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getCategoryIcon(item.category)}</span>
                      <p className="font-semibold text-xs sm:text-sm text-emerald-950 leading-relaxed">
                        {item.benefit}
                      </p>
                    </div>
                  </div>

                  {/* Eligibility Teaser */}
                  <div className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Eligibility: </strong>
                    {item.eligibility_text}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEligibilityBenefit(item);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-300" />
                    <span>Check Eligibility</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBenefit(item);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Details
                  </button>

                  {(item.application_url || item.official_source) && (
                    <a
                      href={item.application_url || item.official_source}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Apply on Official Government Portal"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-950 border border-slate-200 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Linking to Full Portal */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base sm:text-lg text-sanchay-navy-950">
                Looking for State-specific Free Benefits & Allowances?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Filter all 22 verified schemes across Delhi, Gujarat, Assam, Maharashtra, and Central Ministries.
              </p>
            </div>
          </div>

          <Link
            to="/free-benefits"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all"
          >
            <span>Explore All Free Benefits</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>

      </div>

      {/* Details & Eligibility Modals */}
      <FreeBenefitDetailsModal
        benefit={selectedBenefit}
        isOpen={Boolean(selectedBenefit)}
        onClose={() => setSelectedBenefit(null)}
      />

      <FreeBenefitEligibilityModal
        benefit={eligibilityBenefit}
        isOpen={Boolean(eligibilityBenefit)}
        onClose={() => setEligibilityBenefit(null)}
      />
    </section>
  );
};
