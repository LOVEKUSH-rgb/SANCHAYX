import React, { useState } from 'react';
import { ShieldCheck, Target, Sliders, CheckCircle2, ArrowRight, Sparkles, UserCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ScrollStorytellingSection = () => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      num: '01',
      title: 'UNDERSTAND',
      heading: 'Tell us what you\'re building towards.',
      desc: 'Input your life stage, age bracket, and specific financial aspiration without filling out complicated financial forms.',
      visual: {
        badge: 'PROFILE MAPPING',
        title: 'Persona: Widowed Parent (Age 34)',
        detail: 'Goal: Higher Education for Daughter • Horizon: 12 Years',
        stats: [
          { label: 'Risk Tolerance', val: 'Low (Capital Protection Focus)' },
          { label: 'Target Category', val: 'Small Savings / Sovereign' },
        ]
      }
    },
    {
      num: '02',
      title: 'CHOOSE',
      heading: 'Set your contribution capacity.',
      desc: 'Define monthly savings capacity and liquidity requirements. Sanchay accommodates monthly deposits starting from ₹250.',
      visual: {
        badge: 'BUDGET & HORIZON',
        title: 'Monthly Capacity: ₹1,500 / mo',
        detail: 'Lock-in Preference: Flexible with mid-term partial withdrawal option',
        stats: [
          { label: 'Annual Investment', val: '₹18,000 / year' },
          { label: 'Minimum Tenure', val: '10 to 15 Years' },
        ]
      }
    },
    {
      num: '03',
      title: 'MATCH',
      heading: 'Rule engine filters official schemes.',
      desc: 'Deterministic eligibility logic evaluates government gazette rules, gender-specific criteria, and age thresholds instantly.',
      visual: {
        badge: 'TRANSPARENT MATCHING',
        title: '12 Official Schemes Evaluated',
        detail: 'Filtered: 3 Fully Eligible • 9 Disqualified (Age / Gender criteria)',
        stats: [
          { label: 'Engine Logic', val: 'Deterministic Rule Matching' },
          { label: 'Exclusion Reason', val: 'Transparent Age & Income Limits' },
        ]
      }
    },
    {
      num: '04',
      title: 'EXPLAIN',
      heading: 'Clear fit scores with plain language rationale.',
      desc: 'No technical financial jargon. Sanchay explains return guarantee, lock-in clauses, and tax exemptions in simple words.',
      visual: {
        badge: 'FIT SCORE & RATIONALE',
        title: 'Sukanya Samriddhi Yojana (SSY)',
        detail: '92% Fit Score (DEMO) • High compound rate (8.2%) with EEE tax exemption',
        stats: [
          { label: 'Sovereign Guarantee', val: 'Government of India' },
          { label: 'Tax Status', val: '100% Tax Free under Sec 80C' },
        ]
      }
    },
    {
      num: '05',
      title: 'PLAN',
      heading: 'Direct guidance to official sources.',
      desc: 'Access verified official post office/bank links and complete documentation checklists to start your savings safely.',
      visual: {
        badge: 'VERIFIED NEXT STEPS',
        title: 'Official Channel Guidance',
        detail: 'Available at India Post & Designated Public Sector Banks',
        stats: [
          { label: 'Official Source', val: 'India Post / Ministry of Finance' },
          { label: 'Form Checklist', val: 'ID Proof, Birth Certificate, Aadhaar' },
        ]
      }
    }
  ];

  return (
    <section className="py-24 bg-[#FAFAFC] border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-4">
            <span className="text-sanchay-gold-500">03</span>
            <span className="text-slate-400">/</span>
            <span>SCROLL STORYTELLING</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-900 tracking-tight leading-tight">
            How Sanchay guides you step-by-step.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Experience progressive visual storytelling that turns financial confusion into deterministic confidence.
          </p>
        </div>

        {/* Storytelling 2-Column Sticky Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: 5 Stage Selectors / Cards (6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            {stages.map((st, idx) => {
              const isActive = activeStage === idx;
              return (
                <div
                  key={st.num}
                  onClick={() => setActiveStage(idx)}
                  className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 cursor-pointer border ${
                    isActive 
                      ? 'bg-white border-sanchay-emerald-500 shadow-editorial ring-1 ring-sanchay-emerald-500/20 translate-x-1' 
                      : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-display font-extrabold font-mono ${isActive ? 'text-sanchay-emerald-600' : 'text-slate-300'}`}>
                        {st.num}
                      </span>
                      <span className="text-xs font-mono font-extrabold tracking-widest uppercase text-slate-400">
                        {st.title}
                      </span>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 border border-sanchay-emerald-200">
                        ACTIVE STAGE
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-extrabold text-xl text-sanchay-navy-900 mb-2">
                    {st.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Interactive Stage Visual Container (6 Columns) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="bg-sanchay-navy-950 text-white rounded-3xl p-7 sm:p-9 shadow-editorial border border-slate-800 relative overflow-hidden">
              
              {/* Dynamic Ambient Background Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-sanchay-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Stage Header Indicator */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sanchay-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-sanchay-emerald-400">
                    STAGE {stages[activeStage].num} VISUAL PREVIEW
                  </span>
                </div>
                <span className="text-xs font-mono font-extrabold text-slate-500 uppercase">
                  {stages[activeStage].title}
                </span>
              </div>

              {/* Stage Dynamic Visual Card Content */}
              <div className="py-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sanchay-emerald-500/20 text-sanchay-emerald-300 text-[10px] font-mono font-extrabold uppercase tracking-wider mb-4 border border-sanchay-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-500" />
                  {stages[activeStage].visual.badge}
                </div>

                <h4 className="font-display font-extrabold text-2xl text-white mb-2">
                  {stages[activeStage].visual.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono mb-8">
                  {stages[activeStage].visual.detail}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stages[activeStage].visual.stats.map((st, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {st.label}
                      </div>
                      <div className="text-xs font-extrabold text-sanchay-emerald-400">
                        {st.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Guidance CTA */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between relative z-10">
                <span className="text-xs text-slate-400 font-mono">
                  Stage {activeStage + 1} of 5
                </span>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  <span>Experience Interactive Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
