import React from 'react';
import { Target, ShieldCheck, CheckCircle2, Award, FileText, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const KeyFeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      title: t('keyFeatures.feat1Title', '1. Goal-First Guidance'),
      desc: t('keyFeatures.feat1Desc', 'Users select what they want to achieve, not a complex financial product name.'),
      icon: Target,
    },
    {
      title: t('keyFeatures.feat2Title', '2. Eligibility-Aware'),
      desc: t('keyFeatures.feat2Desc', 'Checks age, profile, contribution capacity, goal duration, and scheme rules upfront.'),
      icon: ShieldCheck,
    },
    {
      title: t('keyFeatures.feat3Title', '3. Govt-Verified Only'),
      desc: t('keyFeatures.feat3Desc', 'Every scheme record is linked directly to an official source and verification date.'),
      icon: CheckCircle2,
    },
    {
      title: t('keyFeatures.feat4Title', '4. Explainable Ranking'),
      desc: t('keyFeatures.feat4Desc', 'Users see "Why this scheme fits you" instead of receiving a black-box result.'),
      icon: Award,
    },
    {
      title: t('keyFeatures.feat5Title', '5. Plain Language'),
      desc: t('keyFeatures.feat5Desc', 'Simple explanations of return type, minimum amount, lock-in, and tax benefits.'),
      icon: FileText,
    },
    {
      title: t('keyFeatures.feat6Title', '6. Safety-First Design'),
      desc: t('keyFeatures.feat6Desc', 'No third-party products, no agent promotion, and no misleading return promises.'),
      icon: Lock,
    },
  ];

  return (
    <section className="py-16 bg-[#F8FAF8] border-b border-[#E7ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-xs font-semibold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5 text-[#92400E]" />
            <span>{t('keyFeatures.badge', 'Why Choose Sanchay')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#202B26] tracking-tight">
            {t('keyFeatures.title', 'What Makes Sanchay Different')}
          </h2>
          <p className="text-sm sm:text-base text-[#66736C] mt-2">
            {t('keyFeatures.subtitle', '6 core pillars powering our trusted, zero-bias recommendation platform.')}
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#202B26] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#66736C] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E7ECE8] flex items-center gap-1.5 text-[11px] font-bold text-[#176B50]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#176B50]" />
                  <span>{t('keyFeatures.standardFeature', 'Standard Feature')}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
