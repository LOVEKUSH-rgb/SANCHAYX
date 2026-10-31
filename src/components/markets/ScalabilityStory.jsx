import React from 'react';
import { Network, ArrowRight, ShieldCheck, Banknote, CandlestickChart, Landmark, TrendingUp, Building2, Globe } from 'lucide-react';

export const ScalabilityStory = () => {
  return (
    <section className="py-20 bg-[#060b08] border-y border-emerald-500/15 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Future Business Model</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-white mb-4">
            Why SANCHAY can scale
          </h2>
          <p className="text-slate-400 text-lg">
            Evolving from government scheme discovery into a comprehensive infrastructure for personal financial discovery.
          </p>
        </div>

        {/* Funnel Expansion */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
          <div className="bg-[#0c1611]/90 p-6 rounded-2xl shadow-2xl border border-emerald-500/20 text-center flex flex-col items-center">
            <Landmark className="w-8 h-8 text-emerald-400 mb-3" />
            <span className="font-bold text-sm text-white">Government Schemes</span>
          </div>
          <div className="bg-[#0c1611]/90 p-6 rounded-2xl shadow-2xl border border-emerald-500/20 text-center flex flex-col items-center relative md:translate-y-4">
            <Banknote className="w-8 h-8 text-sky-400 mb-3" />
            <span className="font-bold text-sm text-white">Fixed Income</span>
          </div>
          <div className="bg-[#0c1611]/90 p-6 rounded-2xl shadow-2xl border border-emerald-500/20 text-center flex flex-col items-center relative md:translate-y-8">
            <Globe className="w-8 h-8 text-emerald-400 mb-3" />
            <span className="font-bold text-sm text-white">Mutual Funds</span>
          </div>
          <div className="bg-[#0c1611]/90 p-6 rounded-2xl shadow-2xl border border-emerald-500/20 text-center flex flex-col items-center relative md:translate-y-12">
            <Building2 className="w-8 h-8 text-purple-400 mb-3" />
            <span className="font-bold text-sm text-white">ETFs</span>
          </div>
          <div className="bg-emerald-950/80 p-6 rounded-2xl shadow-2xl border border-emerald-500/40 text-center flex flex-col items-center relative md:translate-y-16">
            <CandlestickChart className="w-8 h-8 text-emerald-300 mb-3" />
            <span className="font-bold text-sm text-white">Personal Financial Discovery</span>
          </div>
        </div>

        {/* Discovery Flow */}
        <div className="bg-[#0c1611]/90 rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-500/20 mb-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="flex-1 w-full bg-[#08120d] rounded-2xl p-6 border border-emerald-500/15">
              <h3 className="font-bold text-white mb-4 text-center">User Inputs</h3>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 bg-[#0c1611] border border-emerald-500/20 rounded-lg text-xs font-bold text-slate-300">Goal</span>
                <span className="px-3 py-1.5 bg-[#0c1611] border border-emerald-500/20 rounded-lg text-xs font-bold text-slate-300">Amount</span>
                <span className="px-3 py-1.5 bg-[#0c1611] border border-emerald-500/20 rounded-lg text-xs font-bold text-slate-300">Horizon</span>
                <span className="px-3 py-1.5 bg-[#0c1611] border border-emerald-500/20 rounded-lg text-xs font-bold text-slate-300">Risk Pref</span>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-emerald-500/40 hidden lg:block rotate-90 lg:rotate-0" />

            <div className="flex-1 w-full bg-emerald-950/60 rounded-2xl p-6 border border-emerald-500/30">
              <h3 className="font-bold text-emerald-300 mb-4 text-center">SANCHAY Platform</h3>
              <div className="text-center font-bold text-sm text-emerald-200">
                Comparison & Education
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-emerald-500/40 hidden lg:block rotate-90 lg:rotate-0" />

            <div className="flex-1 w-full bg-sky-950/40 rounded-2xl p-6 border border-sky-500/30">
              <h3 className="font-bold text-sky-200 mb-4 text-center">Destination</h3>
              <div className="text-center font-bold text-sm text-sky-300 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Official / Regulated Product
              </div>
            </div>

          </div>
        </div>

        {/* Future Business Models */}
        <div className="max-w-4xl mx-auto">
          <h3 className="font-bold text-center text-slate-400 uppercase tracking-widest text-xs mb-8">
            Potential Revenue & Scalability Vectors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'B2B Financial Discovery Platform',
              'Product Comparison Infrastructure',
              'Regulated Partner Integrations',
              'Premium Financial Planning Tools',
              'API / White-label Financial Discovery'
            ].map((item, idx) => (
              <div key={idx} className="bg-[#0c1611]/90 px-5 py-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-200 leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
