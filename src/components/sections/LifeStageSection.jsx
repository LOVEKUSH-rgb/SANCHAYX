import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LIFE_STAGE_IMAGES } from '../../data/schemeImages';
import { useLanguage } from '../../context/LanguageContext';

export const LifeStageSection = ({ onSelectLifeStage }) => {
  const { t } = useLanguage();

  const stages = [
    {
      num: '01',
      id: 'student',
      title: t('lifeStages.students', 'Students & Early Savers'),
      desc: t('lifeStages.studentsDesc', 'Start your savings journey early with scholarships, skill loans and smart savings accounts.'),
      goal: 'First Savings & Literacy',
      image: LIFE_STAGE_IMAGES.student?.url,
      suggestedScheme: 'PPF / Savings Account',
    },
    {
      num: '02',
      id: 'first_job',
      title: t('lifeStages.professionals', 'Young Professionals'),
      desc: t('lifeStages.professionalsDesc', 'Build wealth, save tax, and plan your future with smart investment and retirement options.'),
      goal: 'Tax Deduction & Compounding',
      image: LIFE_STAGE_IMAGES.first_job?.url,
      suggestedScheme: 'PPF & NPS (80CCD(1B))',
    },
    {
      num: '03',
      id: 'parent',
      title: t('lifeStages.parents', 'Parents & Families'),
      desc: t('lifeStages.parentsDesc', 'Secure your family’s future with child education funds, health cover and family protection plans.'),
      goal: 'Child Education & Marriage',
      image: LIFE_STAGE_IMAGES.parent?.url,
      suggestedScheme: 'Sukanya Samriddhi Yojana (SSY)',
    },
    {
      num: '04',
      id: 'retirement',
      title: t('lifeStages.seniors', 'Senior Citizens & Retirees'),
      desc: t('lifeStages.seniorsDesc', 'Enjoy a secure and peaceful retirement with pension plans and senior citizen savings schemes.'),
      goal: 'Stable Quarterly Income',
      image: LIFE_STAGE_IMAGES.retirement?.url,
      suggestedScheme: 'SCSS / APY / PMVVY',
    },
    {
      num: '05',
      id: 'farmers',
      title: t('lifeStages.farmers', 'Farmers & Rural Producers'),
      desc: t('lifeStages.farmersDesc', 'Access crop insurance, financial assistance and schemes to grow your farming business.'),
      goal: 'Crop Security & Grants',
      image: LIFE_STAGE_IMAGES.farmers?.url,
      suggestedScheme: 'PM-KISAN / KCC / PMFBY',
    },
    {
      num: '06',
      id: 'workers',
      title: t('lifeStages.workers', 'Gig & Unorganised Workers'),
      desc: t('lifeStages.workersDesc', 'Build financial stability with social security, insurance and government support schemes.'),
      goal: 'Pensions & Social Security',
      image: LIFE_STAGE_IMAGES.workers?.url,
      suggestedScheme: 'PM-SYM / PMSBY / Atal Pension Yojana',
    }
  ];

  return (
    <section id="life-stages" className="py-20 sm:py-28 bg-[#FAF9F5] border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Label & Heading */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-navy-950 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4 shadow-xs">
            <span className="text-sanchay-gold-500">03</span>
            <span className="text-slate-500">/</span>
            <span>{t('lifeStages.badge', 'LIFE STAGES')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight leading-tight">
            {t('lifeStages.title', 'Schemes for Every Stage of Life')}
          </h2>
          <p className="text-base sm:text-lg text-sanchay-navy-700 mt-3 leading-relaxed">
            {t('lifeStages.subtitle', 'Discover government initiatives designed specifically for your demographic and life goals.')}
          </p>
        </div>

        {/* Life Stages Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stages.map((st) => (
            <div
              key={st.id}
              onClick={() => onSelectLifeStage && onSelectLifeStage(st.id)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-card hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 cursor-pointer"
            >
              <div>
                {/* Large Rounded Photography with crisp background */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9.5] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={st.image}
                    alt={st.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/schemes/_fallback.svg';
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  
                  {/* STAGE Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-sanchay-navy-950/80 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-white/15 shadow-sm">
                    STAGE {st.num}
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-7">
                  <h3 className="font-serif font-bold text-xl text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 transition-colors leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-xs text-sanchay-navy-700 mt-2.5 leading-relaxed font-normal min-h-[40px]">
                    {st.desc}
                  </p>
                  
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-baseline gap-1.5 text-xs font-mono font-bold text-sanchay-emerald-700">
                    <span className="text-[11px] font-semibold text-slate-500 font-sans uppercase tracking-wider">Target:</span>
                    <span className="truncate">{st.suggestedScheme}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer CTA */}
              <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectLifeStage) onSelectLifeStage(st.id);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>{t('explore.exploreSchemes', 'Explore Schemes')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
