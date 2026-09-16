import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Sparkles, Award, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeLICPlan } from '../../utils/contentLocalizer';

export const LICHomeSection = () => {
  const { t, currentLang } = useLanguage();

  const categories = [
    {
      id: 'child',
      title: t('lic.childPlans', 'Child Plans'),
      count: `4 ${t('lic.plans', 'Plans')}`,
      tag: t('lic.educationMilestones', 'Education & Milestones'),
      description: t('lic.childPlansDesc', 'Guaranteed higher education corpus & milestone funds (Amritbaal, Jeevan Tarun).'),
      accent: 'border-sky-200 bg-sky-50/70 text-sky-950',
      badgeClass: 'bg-sky-100 text-sky-800'
    },
    {
      id: 'term',
      title: t('lic.termInsurance', 'Term Insurance'),
      count: `8 ${t('lic.plans', 'Plans')}`,
      tag: t('lic.pureFamilyProtection', 'Pure Family Protection'),
      description: t('lic.termInsuranceDesc', 'High-value pure risk life assurance with online discounts (Digi Term, Yuva Term).'),
      accent: 'border-blue-200 bg-blue-50/70 text-blue-950',
      badgeClass: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'pension',
      title: t('lic.pensionAnnuity', 'Pension & Annuity'),
      count: `5 ${t('lic.plans', 'Plans')}`,
      tag: t('lic.lifelongRetirement', 'Lifelong Retirement'),
      description: t('lic.pensionAnnuityDesc', 'Immediate & deferred annuities with guaranteed lifelong cashflow (Saral Pension, Jeevan Shanti).'),
      accent: 'border-rose-200 bg-rose-50/70 text-rose-950',
      badgeClass: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'endowment',
      title: t('lic.endowmentPlans', 'Endowment Plans'),
      count: `9 ${t('lic.plans', 'Plans')}`,
      tag: t('lic.disciplinedSavings', 'Disciplined Savings'),
      description: t('lic.endowmentPlansDesc', 'Participating life assurance combining family protection with lump-sum bonus payouts.'),
      accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
      badgeClass: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'whole-life',
      title: t('lic.wholeLife', 'Protection & Whole Life'),
      count: `2 ${t('lic.plans', 'Plans')}`,
      tag: t('lic.lifelongIncome', 'Lifelong 8-10% Income'),
      description: t('lic.wholeLifeDesc', 'Lifelong income benefits and complete family security up to age 100 (Jeevan Umang, Jeevan Utsav).'),
      accent: 'border-amber-200 bg-amber-50/70 text-amber-950',
      badgeClass: 'bg-amber-100 text-amber-900'
    }
  ];

  const featuredPlans = [
    {
      plan_number: '734',
      name: "LIC's Jeevan Tarun",
      category: 'Child Education',
      uin: '512N299V03',
      benefit: 'Flexible survival payouts from age 20 to 24 for college + maturity at 25.',
      entry_age: '90 Days - 12 Yrs',
      min_cover: '₹75,000'
    },
    {
      plan_number: '876',
      name: "LIC's Digi Term",
      category: 'Term Assurance',
      uin: '512N356V01',
      benefit: 'Online pure life protection up to age 80 with special non-smoker rates.',
      entry_age: '18 - 65 Yrs',
      min_cover: '₹50,00,000'
    },
    {
      plan_number: '862',
      name: "LIC's Saral Pension",
      category: 'Pension / Annuity',
      uin: '512N342V03',
      benefit: 'Standardized immediate lifelong annuity with 100% return of purchase price.',
      entry_age: '40 - 80 Yrs',
      min_cover: '₹1,00,000'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-t border-slate-200/80 relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          
          <div className="max-w-3xl">
            {/* Verification Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold uppercase tracking-wider mb-3.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{t('lic.officialIntegration', 'Official LIC Integration • IRDAI Reg. 512')}</span>
            </div>

            {/* Section Title */}
            <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
              {t('lic.title', 'LIC Plans')}
            </h2>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-sanchay-navy-700 font-normal mt-2 leading-relaxed">
              {t('lic.subtitle', 'Explore verified LIC insurance, pension, protection, child and investment plans.')}
            </p>

            {/* Dual Pillars Clarity Banner */}
            <div className="flex items-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap text-xs font-mono font-bold">
              <span className="text-slate-400 uppercase tracking-wider">{t('lic.sourcingPillars', 'SANCHAY SOURCING PILLARS:')}</span>
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {t('lic.pillarGovt', '🏛️ 1. Government Schemes (184+)')}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                {t('lic.pillarLic', '🛡️ 2. LIC Plans (38 Active)')}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0">
            <Link
              to="/lic"
              className="inline-flex items-center justify-center gap-2.5 h-13 px-8 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span>{t('lic.exploreLicPlans', 'EXPLORE LIC PLANS →')}</span>
              <ArrowRight className="w-4 h-4 text-sanchay-gold-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

        {/* 1. Five Key Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/lic"
              className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between group ${cat.accent}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-wider ${cat.badgeClass}`}>
                    {cat.count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <h3 className="font-serif font-bold text-lg text-sanchay-navy-950 group-hover:text-amber-800 transition-colors">
                  {cat.title}
                </h3>
                
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {cat.tag}
                </span>

                <p className="text-xs text-sanchay-navy-800 leading-relaxed font-sans">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-black/5 text-[11px] font-mono font-bold text-amber-900 group-hover:underline flex items-center gap-1">
                <span>{t('lic.viewPlans', 'View Plans')}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 2. Highlighted Active LIC Sample Cards Row */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAFAFC] border border-slate-200/90 shadow-2xs">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
            <div>
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                {t('lic.statutorySnapshot', 'STATUTORY SNAPSHOT')}
              </span>
              <h3 className="font-serif font-bold text-xl text-sanchay-navy-950 mt-0.5">
                {t('lic.featuredVerifiedPlans', 'Featured Verified LIC Plans')}
              </h3>
            </div>

            <Link
              to="/lic"
              className="text-xs font-mono font-bold text-sanchay-gold-700 hover:text-sanchay-gold-800 uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>{t('lic.seeAllVerifiedPlans', 'See all 38 verified plans')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredPlans.map((plan, idx) => {
              const locPlan = localizeLICPlan(plan, currentLang);
              return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-mono font-bold text-[10px] tracking-wider">
                      {t('lic.plan', 'Plan')} {plan.plan_number}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">
                      UIN: {plan.uin}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-sanchay-navy-950 mb-1">
                    {locPlan.name || plan.name}
                  </h4>

                  <p className="text-xs text-sanchay-navy-800 leading-relaxed line-clamp-2 mb-4 font-sans">
                    {locPlan.benefit || plan.benefit}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] mb-3">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">{t('lic.entryAge', 'Entry Age')}</span>
                      <span className="font-bold text-sanchay-navy-950">{plan.entry_age}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">{t('lic.minCover', 'Min Cover')}</span>
                      <span className="font-bold text-sanchay-navy-950">{plan.min_cover}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/lic"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 hover:bg-sanchay-navy-950 hover:text-white text-sanchay-navy-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>{t('lic.viewDetails', 'View Details')}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
