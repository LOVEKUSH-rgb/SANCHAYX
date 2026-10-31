import React from 'react';
import { ShieldCheck, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const ProblemSolutionSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-[#F8FAF8] border-b border-[#E7ECE8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Editorial Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 shadow-2xs">
            <span className="text-[#92400E] font-bold">04</span>
            <span className="text-[#D5E4DC]">/</span>
            <span>{t('problemSolution.solutionBadge', 'THE SANCHAY SOLUTION')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#202B26] tracking-tight leading-tight">
            {t('problemSolution.solutionTitle', 'Deterministic Rule Engine & Grounded Explanations.')}
          </h2>
          <p className="text-base sm:text-lg text-[#66736C] mt-4 leading-relaxed">
            {t('problemSolution.solutionDesc', 'We compute exact statutory eligibility and fit scores without sponsored biases or generic chatbot hallucinations.')}
          </p>
        </div>

        {/* Asymmetric Editorial Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block: Current Market Friction (5 Columns) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-7 sm:p-8 border border-red-200 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">
                    {t('problemSolution.problemBadge', 'THE PROBLEM TODAY')}
                  </span>
                  <h3 className="font-serif font-extrabold text-xl text-[#202B26] leading-tight">
                    {t('problemSolution.problemTitle', 'Fragmented info, biased commissions, confusing fine print.')}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#66736C] leading-relaxed">
                {t('problemSolution.problemDesc', 'Millions miss out on high-interest sovereign schemes due to misleading agent advice and complex eligibility rules.')}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-red-100 text-xs font-bold text-red-700">
              {t('problemSolution.problemResult', 'RESULT: Citizens abandon savings or invest in suboptimal options.')}
            </div>
          </div>

          {/* Right Block: Sanchay's Inclusive Solution (7 Columns - Elevated Highlight) */}
          <div className="lg:col-span-7 bg-white text-[#202B26] rounded-3xl p-7 sm:p-10 shadow-card hover:shadow-card-hover border border-[#D5E4DC] flex flex-col justify-between relative overflow-hidden group">
            
            {/* Subtle orbital glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E7F1EB]/60 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] text-[#176B50] text-[10px] font-bold uppercase tracking-wider border border-[#D5E4DC]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B50]" />
                  <span>{t('problemSolution.sanchayApproach', 'SANCHAY APPROACH')}</span>
                </div>
              </div>

              <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-[#202B26] leading-snug">
                {t('problemSolution.gazettesHeadline', '100% Grounded in Official Government Gazettes.')}
              </h3>

              <p className="text-sm text-[#66736C] mt-3.5 leading-relaxed">
                {t('trust.subtitle', 'SANCHAY does not sell financial products or accept commissions. Every scheme is cross-referenced directly with official Ministry portals and gazettes.')}
              </p>

              <div className="mt-8">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  <span>{t('nav.findMySchemes', 'Find My Schemes')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
