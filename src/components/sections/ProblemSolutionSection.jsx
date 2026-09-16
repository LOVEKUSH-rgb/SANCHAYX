import React from 'react';
import { CheckCircle2, ShieldCheck, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const ProblemSolutionSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-white border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Editorial Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4">
            <span className="text-sanchay-gold-500">04</span>
            <span className="text-slate-400">/</span>
            <span>{t('problemSolution.solutionBadge', 'THE SANCHAY SOLUTION')}</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-900 tracking-tight leading-tight">
            {t('problemSolution.solutionTitle', 'Deterministic Rule Engine & Grounded Explanations.')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            {t('problemSolution.solutionDesc', 'We compute exact statutory eligibility and fit scores without sponsored biases or generic chatbot hallucinations.')}
          </p>
        </div>

        {/* Asymmetric Editorial Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block: Current Market Friction (5 Columns) */}
          <div className="lg:col-span-5 bg-[#FAFAFC] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-red-100/80 text-red-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-red-500 tracking-wider">
                    {t('problemSolution.problemBadge', 'THE PROBLEM TODAY')}
                  </span>
                  <h3 className="font-serif font-extrabold text-xl text-sanchay-navy-900 leading-tight">
                    {t('problemSolution.problemTitle', 'Fragmented info, biased commissions, confusing fine print.')}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('problemSolution.problemDesc', 'Millions miss out on high-interest sovereign schemes due to misleading agent advice and complex eligibility rules.')}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200/80 text-xs font-mono font-bold text-slate-500">
              {t('problemSolution.problemResult', 'RESULT: Citizens abandon savings or invest in suboptimal options.')}
            </div>
          </div>

          {/* Right Block: Sanchay's Inclusive Solution (7 Columns - Elevated Highlight) */}
          <div className="lg:col-span-7 bg-sanchay-navy-900 text-white rounded-3xl p-7 sm:p-10 shadow-editorial border border-sanchay-navy-800 flex flex-col justify-between relative overflow-hidden group">
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sanchay-emerald-500/20 text-sanchay-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-sanchay-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('problemSolution.sanchayApproach', 'SANCHAY APPROACH')}</span>
                </div>
              </div>

              <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-white leading-snug">
                {t('problemSolution.gazettesHeadline', '100% Grounded in Official Government Gazettes.')}
              </h3>

              <p className="text-sm text-slate-300 mt-3.5 leading-relaxed">
                {t('trust.subtitle', 'SANCHAY does not sell financial products or accept commissions. Every scheme is cross-referenced directly with official Ministry portals and gazettes.')}
              </p>

              <div className="mt-8">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-card transition-all"
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
