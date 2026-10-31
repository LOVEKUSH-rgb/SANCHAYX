import React from 'react';
import { ArrowRight, ShieldCheck, Gift, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection = () => {
  const { t } = useLanguage();

  const pillars = [
    {
      id: 'schemes',
      icon: <Landmark className="w-5 h-5 text-[#176B50]" />,
      tag: `${t('howItWorks.pillar', 'PILLAR')} 01`,
      title: t('howItWorks.pillar1Title', 'Government Schemes'),
      count: `184+ ${t('featuredSchemes.schemes', 'Schemes')}`,
      desc: t('howItWorks.pillar1Desc', 'Sovereign small savings (PPF, SSY), guaranteed pensions (APY, NPS), and collateral-free enterprise credit (MUDRA).'),
      hoverBorder: 'hover:border-[#176B50]/40',
      badge: 'bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC]',
      link: '/schemes'
    },
    {
      id: 'lic',
      icon: <ShieldCheck className="w-5 h-5 text-[#92400E]" />,
      tag: `${t('howItWorks.pillar', 'PILLAR')} 02`,
      title: t('howItWorks.pillar2Title', 'LIC Life Plans'),
      count: `38 ${t('lic.activePlans', 'Active Plans')}`,
      desc: t('howItWorks.pillar2Desc', 'High-value family term cover (Digi Term), child milestone education funds (Jeevan Tarun), and lifelong guaranteed annuities.'),
      hoverBorder: 'hover:border-amber-400',
      badge: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
      link: '/lic'
    },
    {
      id: 'free_benefits',
      icon: <Gift className="w-5 h-5 text-teal-700" />,
      tag: `${t('howItWorks.pillar', 'PILLAR')} 03`,
      title: t('howItWorks.pillar3Title', 'Free Benefits & Direct Aid'),
      count: `22 ${t('freeBenefits.freeBenefitsCount', 'Free Benefits')}`,
      desc: t('howItWorks.pillar3Desc', '100% free foodgrains (PMGKAY), ₹5 Lakh cashless healthcare (PM-JAY), and accredited skill training with monthly stipends.'),
      hoverBorder: 'hover:border-teal-400',
      badge: 'bg-teal-50 text-teal-800 border border-teal-200',
      link: '/free-benefits'
    }
  ];

  const steps = [
    {
      num: '01',
      title: t('howItWorks.step1Tag', 'PROFILE'),
      desc: t('howItWorks.step1Title', '1. Share Your Profile, Budget & Needs'),
      details: t('howItWorks.step1Desc', 'Enter your age, residency, occupation, monthly savings budget, or family protection and welfare assistance needs in seconds.'),
      tag: t('howItWorks.step1Badge', 'Universal Profile')
    },
    {
      num: '02',
      title: t('howItWorks.step2Tag', 'EVALUATE'),
      desc: t('howItWorks.step2Title', '2. Rule Engine Evaluates All 3 Pillars'),
      details: t('howItWorks.step2Desc', 'Our deterministic engine cross-checks 184+ Govt Schemes, 38+ LIC Plans, and 22+ Free Benefits matching 100% of statutory rules.'),
      tag: t('howItWorks.step2Badge', 'Deterministic Matching')
    },
    {
      num: '03',
      title: t('howItWorks.step3Tag', 'RECOMMEND'),
      desc: t('howItWorks.step3Title', '3. Get Schemes, LIC Plans & Free Grants'),
      details: t('howItWorks.step2Desc', 'Review explainable Fit Scores for savings, compare official LIC policies, and claim 100% free healthcare, ration and skill assistance.'),
      tag: t('howItWorks.step3Badge', 'Ranked Recommendations')
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#F8FAF8] border-b border-[#E7ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Label & Heading */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 shadow-2xs">
            <span className="text-[#92400E] font-bold">01</span>
            <span className="text-[#D5E4DC]">/</span>
            <span>{t('howItWorks.badge', 'HOW SANCHAY WORKS')}</span>
          </div>
          
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#202B26] tracking-tight leading-tight">
            {t('howItWorks.title', 'How SANCHAY Matches Schemes, LIC Plans & Free Benefits')}
          </h2>
          
          <p className="text-base sm:text-lg text-[#66736C] mt-3 leading-relaxed">
            {t('howItWorks.subtitle', 'Deterministic rule evaluation across Government Savings Schemes, Sovereign LIC Life Solutions, and 100% Free Direct Assistance — zero guesswork, zero third-party commissions.')}
          </p>
        </div>

        {/* 3 Pillars Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {pillars.map((pillar) => (
            <Link
              key={pillar.id}
              to={pillar.link}
              className={`p-6 rounded-2xl bg-white border border-[#E7ECE8] transition-all duration-300 shadow-card hover:shadow-card-hover hover:-translate-y-1 flex flex-col justify-between group ${pillar.hoverBorder}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {pillar.icon}
                    <span className="text-[10px] font-mono font-bold text-[#66736C] uppercase tracking-widest">
                      {pillar.tag}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-wider ${pillar.badge}`}>
                    {pillar.count}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-[#202B26] group-hover:text-[#176B50] transition-colors mb-1.5">
                  {pillar.title}
                </h3>

                <p className="text-xs text-[#66736C] leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-[#E7ECE8] text-[11px] font-bold text-[#176B50] group-hover:underline flex items-center gap-1">
                <span>{t('common.exploreDetails', 'Explore Details')}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 3-Step Editorial Storytelling Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((st, idx) => (
            <div
              key={st.num}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div>
                {/* Large Oversized Number */}
                <div className="font-serif font-extrabold text-4xl sm:text-5xl text-[#176B50] mb-3 group-hover:scale-105 transition-transform origin-left">
                  {st.num}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-[#176B50]">
                    {st.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAFAFC] border border-[#E7ECE8] text-[#66736C] font-mono text-[9px] font-bold uppercase">
                    {st.tag}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-base text-[#202B26] mt-1.5 leading-snug">
                  {st.desc}
                </h4>

                <p className="text-xs text-[#66736C] mt-3 leading-relaxed">
                  {st.details}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[#E7ECE8] flex items-center justify-between text-[10px] font-mono text-[#66736C]">
                <span>{t('howItWorks.step', 'STEP')} {st.num}</span>
                {idx < 2 && <ArrowRight className="w-3.5 h-3.5 text-[#176B50] hidden md:block" />}
              </div>
            </div>
          ))}
        </div>

        {/* Action Link Banner with All 3 Pathways */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
          >
            <span>{t('nav.findMySchemes', 'Find My Schemes →')}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>

          <Link
            to="/lic"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#92400E] border border-[#FDE68A] hover:border-amber-400 font-semibold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <span>{t('howItWorks.exploreLicPlans', 'Explore 38 LIC Plans')} →</span>
          </Link>

          <Link
            to="/free-benefits"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-teal-800 border border-teal-200 hover:border-teal-300 font-semibold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5 text-teal-700" />
            <span>{t('howItWorks.discoverFreeBenefits', 'Discover 22 Free Benefits')} →</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
