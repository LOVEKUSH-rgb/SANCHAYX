import React from 'react';
import { ArrowRight, ShieldCheck, Gift, Landmark, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection = () => {
  const { t, currentLang } = useLanguage();

  const pillars = [
    {
      id: 'schemes',
      icon: <Landmark className="w-5 h-5 text-emerald-700" />,
      tag: 'PILLAR 01',
      title: 'Government Schemes',
      count: '184+ Schemes',
      desc: 'Sovereign small savings (PPF, SSY), guaranteed pensions (APY, NPS), and collateral-free enterprise credit (MUDRA).',
      accent: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950',
      badge: 'bg-emerald-100 text-emerald-800',
      link: '/#verified-schemes'
    },
    {
      id: 'lic',
      icon: <ShieldCheck className="w-5 h-5 text-amber-700" />,
      tag: 'PILLAR 02',
      title: 'LIC Life Plans',
      count: '38 Active Plans',
      desc: 'High-value family term cover (Digi Term), child milestone education funds (Jeevan Tarun), and lifelong guaranteed annuities.',
      accent: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
      badge: 'bg-amber-100 text-amber-800',
      link: '/lic'
    },
    {
      id: 'free_benefits',
      icon: <Gift className="w-5 h-5 text-teal-700" />,
      tag: 'PILLAR 03',
      title: 'Free Benefits & Direct Aid',
      count: '22 Free Benefits',
      desc: '100% free foodgrains (PMGKAY), ₹5 Lakh cashless healthcare (PM-JAY), and accredited skill training with monthly stipends.',
      accent: 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-950',
      badge: 'bg-teal-100 text-teal-800',
      link: '/free-benefits'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'PROFILE',
      desc: t('howItWorks.step1Title', '1. Share Your Profile, Budget & Needs'),
      details: 'Enter your age, residency, occupation, monthly savings budget, or family protection and welfare assistance needs in seconds.',
      tag: 'Universal Profile'
    },
    {
      num: '02',
      title: 'EVALUATE',
      desc: t('howItWorks.step2Title', '2. Rule Engine Evaluates All 3 Pillars'),
      details: 'Our deterministic engine cross-checks 184+ Govt Schemes, 38+ LIC Plans, and 22+ Free Benefits matching 100% of statutory rules.',
      tag: 'Deterministic Matching'
    },
    {
      num: '03',
      title: 'RECOMMEND',
      desc: t('howItWorks.step3Title', '3. Get Schemes, LIC Plans & Free Grants'),
      details: 'Review explainable Fit Scores for savings, compare official LIC policies, and claim 100% free healthcare, ration and skill assistance.',
      tag: 'Ranked Recommendations'
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#FAF9F5] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Label & Heading */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-navy-950 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4 shadow-xs">
            <span className="text-sanchay-gold-500">01</span>
            <span className="text-slate-500">/</span>
            <span>{t('howItWorks.badge', 'HOW SANCHAY WORKS')}</span>
          </div>
          
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
            How SANCHAY Matches Schemes, LIC Plans & Free Benefits
          </h2>
          
          <p className="text-base sm:text-lg text-sanchay-navy-700 mt-3 leading-relaxed">
            Deterministic rule evaluation across Government Savings Schemes, Sovereign LIC Life Solutions, and 100% Free Direct Assistance — zero guesswork, zero third-party commissions.
          </p>
        </div>

        {/* 3 Pillars Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {pillars.map((pillar) => (
            <Link
              key={pillar.id}
              to={pillar.link}
              className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between group ${pillar.accent}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    {pillar.icon}
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      {pillar.tag}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-wider ${pillar.badge}`}>
                    {pillar.count}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-sanchay-navy-950 group-hover:text-emerald-800 transition-colors mb-1.5">
                  {pillar.title}
                </h3>

                <p className="text-xs text-sanchay-navy-800 leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-black/5 text-[11px] font-mono font-bold text-sanchay-navy-950 group-hover:underline flex items-center gap-1">
                <span>Explore Details</span>
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
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-card hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div>
                {/* Large Oversized Number */}
                <div className="font-serif font-extrabold text-4xl sm:text-5xl text-sanchay-emerald-700/90 mb-3 group-hover:scale-105 transition-transform origin-left">
                  {st.num}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-sanchay-navy-950">
                    {st.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[9px] font-bold uppercase">
                    {st.tag}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-base text-sanchay-navy-950 mt-1.5 leading-snug">
                  {st.desc}
                </h4>

                <p className="text-xs text-sanchay-navy-700 mt-3 leading-relaxed">
                  {st.details}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STEP {st.num}</span>
                {idx < 2 && <ArrowRight className="w-3.5 h-3.5 text-sanchay-emerald-600 hidden md:block" />}
              </div>
            </div>
          ))}
        </div>

        {/* Action Link Banner with All 3 Pathways */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial transition-all"
          >
            <span>{t('nav.findMySchemes', 'Find My Schemes →')}</span>
            <ArrowRight className="w-4 h-4 text-sanchay-gold-500" />
          </Link>

          <Link
            to="/lic"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-mono font-bold text-xs uppercase tracking-wider transition-all"
          >
            <span>Explore 38 LIC Plans →</span>
          </Link>

          <Link
            to="/free-benefits"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-mono font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>Discover 22 Free Benefits →</span>
          </Link>
        </div>

      </div>
    </section>
  );
};

