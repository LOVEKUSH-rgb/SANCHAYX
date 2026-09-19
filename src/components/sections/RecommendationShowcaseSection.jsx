import React from 'react';
import { Award, ShieldCheck, CheckCircle2, TrendingUp, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecommendationShowcaseSection = () => {
  const matchFactors = [
    { label: 'Goal Alignment', score: 98, detail: 'Exact fit for long-term higher education objective' },
    { label: 'Eligibility Check', score: 100, detail: 'Meets age, gender, and guardian statutory requirements' },
    { label: 'Budget Capacity Fit', score: 95, detail: '₹1,500/mo comfortably sits within ₹250–₹1,50,000/yr limit' },
    { label: 'Time Horizon Fit', score: 90, detail: '12-year lock-in perfectly matches education timeline' },
    { label: 'Liquidity Match', score: 85, detail: 'Partial withdrawal (up to 50%) available at age 18' },
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Editorial Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4">
            <span className="text-sanchay-gold-500">06</span>
            <span className="text-slate-400">/</span>
            <span>RECOMMENDATIONS</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-900 tracking-tight leading-tight">
            Not just a recommendation. A reason.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Sanchay doesn't just show scheme names—it presents transparent score breakdowns and plain-language rationales so you know exactly why an option fits.
          </p>
        </div>

        {/* Editorial Recommendation Showcase Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Top Matched Scheme Spotlight Card (5 Columns) */}
          <div className="lg:col-span-5 bg-[#FAFAFC] rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-card flex flex-col justify-between relative">
            <div>
              {/* Badge Bar */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3.5 py-1 rounded-full bg-sanchay-emerald-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-widest shadow-2xs">
                  HIGHEST COMPATIBILITY MATCH
                </span>

                {/* Explicit Demo Data Fit Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sanchay-gold-50 text-sanchay-gold-600 text-xs font-extrabold border border-sanchay-gold-100">
                  <Award className="w-3.5 h-3.5 text-sanchay-gold-500" />
                  <span>92% FIT SCORE</span>
                  <span className="text-[9px] font-mono text-slate-400 font-normal uppercase">(DEMO)</span>
                </div>
              </div>

              {/* Product Title */}
              <h3 className="font-display font-extrabold text-2xl text-sanchay-navy-900 leading-tight">
                Sukanya Samriddhi Yojana (SSY)
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Official Ministry of Finance Small Savings Scheme
              </p>

              {/* Highlights Box */}
              <div className="my-6 p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Interest Rate (Current):</span>
                  <span className="font-extrabold text-sanchay-emerald-600 text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    8.2% Guaranteed
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tax Status:</span>
                  <span className="font-bold text-sanchay-navy-900">100% Tax Free (Sec 80C)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Guarantee Level:</span>
                  <span className="font-bold text-sanchay-navy-900">Sovereign (Govt of India)</span>
                </div>
              </div>

              {/* Rationale Quote */}
              <div className="p-4 rounded-2xl bg-sanchay-emerald-50/70 border border-sanchay-emerald-200 text-xs text-slate-700 leading-relaxed">
                <div className="font-extrabold text-sanchay-emerald-700 uppercase tracking-wider text-[10px] font-mono mb-1">
                  Why this fits you
                </div>
                "Provides the highest sovereign guaranteed compound return for long-term education goals with full tax exemption."
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Verified Source: India Post / Gazette</span>
              <Link
                to="/profile"
                className="font-extrabold text-sanchay-emerald-600 hover:text-sanchay-emerald-700 flex items-center gap-1"
              >
                <span>View My Full Match</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Animated Score Breakdown & Rationale Metrics (7 Columns) */}
          <div className="lg:col-span-7 bg-sanchay-navy-900 text-white rounded-3xl p-7 sm:p-9 shadow-editorial border border-sanchay-navy-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold text-sanchay-emerald-400 uppercase tracking-widest">
                    TRANSPARENT MATCHING ENGINE
                  </span>
                  <h4 className="font-display font-extrabold text-xl text-white mt-0.5">
                    Fit Score Rationale Breakdown
                  </h4>
                </div>

                <div className="text-[10px] font-mono uppercase text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  DEMO FIT MODEL
                </div>
              </div>

              {/* Factor Score Bars */}
              <div className="space-y-6">
                {matchFactors.map((factor, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white">{factor.label}</span>
                      <span className="font-mono font-bold text-sanchay-emerald-400 text-sm">
                        {factor.score}%
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sanchay-emerald-500 to-sanchay-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footnote Assurance */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-sanchay-gold-500 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Deterministic calculations based strictly on user input inputs.</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Sanchay Match Rationale</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
