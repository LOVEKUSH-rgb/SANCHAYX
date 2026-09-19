import React from 'react';
import { Network, ArrowRight, ShieldCheck, Banknote, CandlestickChart, Landmark, TrendingUp, Building2, Globe } from 'lucide-react';

export const ScalabilityStory = () => {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
            <Network className="w-3.5 h-3.5" />
            <span>Future Business Model</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950 mb-4">
            Why SANCHAY can scale
          </h2>
          <p className="text-slate-600 text-lg">
            Evolving from government scheme discovery into a comprehensive infrastructure for personal financial discovery.
          </p>
        </div>

        {/* Funnel Expansion */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
            <Landmark className="w-8 h-8 text-slate-400 mb-3" />
            <span className="font-bold text-sm text-sanchay-navy-900">Government Schemes</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center relative md:translate-y-4">
            <Banknote className="w-8 h-8 text-blue-400 mb-3" />
            <span className="font-bold text-sm text-sanchay-navy-900">Fixed Income</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center relative md:translate-y-8">
            <Globe className="w-8 h-8 text-emerald-400 mb-3" />
            <span className="font-bold text-sm text-sanchay-navy-900">Mutual Funds</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center relative md:translate-y-12">
            <Building2 className="w-8 h-8 text-purple-400 mb-3" />
            <span className="font-bold text-sm text-sanchay-navy-900">ETFs</span>
          </div>
          <div className="bg-sanchay-navy-950 p-6 rounded-2xl shadow-card border border-sanchay-navy-800 text-center flex flex-col items-center relative md:translate-y-16">
            <CandlestickChart className="w-8 h-8 text-sanchay-gold-400 mb-3" />
            <span className="font-bold text-sm text-white">Personal Financial Discovery</span>
          </div>
        </div>

        {/* Discovery Flow */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-card border border-slate-200 mb-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="flex-1 w-full bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-sanchay-navy-900 mb-4 text-center">User Inputs</h3>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 bg-white shadow-2xs rounded-lg text-xs font-bold text-slate-700">Goal</span>
                <span className="px-3 py-1.5 bg-white shadow-2xs rounded-lg text-xs font-bold text-slate-700">Amount</span>
                <span className="px-3 py-1.5 bg-white shadow-2xs rounded-lg text-xs font-bold text-slate-700">Horizon</span>
                <span className="px-3 py-1.5 bg-white shadow-2xs rounded-lg text-xs font-bold text-slate-700">Risk Pref</span>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-slate-300 hidden lg:block rotate-90 lg:rotate-0" />

            <div className="flex-1 w-full bg-sanchay-emerald-50 rounded-2xl p-6 border border-sanchay-emerald-100">
              <h3 className="font-bold text-sanchay-emerald-900 mb-4 text-center">SANCHAY Platform</h3>
              <div className="text-center font-bold text-sm text-sanchay-emerald-700">
                Comparison & Education
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-slate-300 hidden lg:block rotate-90 lg:rotate-0" />

            <div className="flex-1 w-full bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-4 text-center">Destination</h3>
              <div className="text-center font-bold text-sm text-blue-700 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Official / Regulated Product
              </div>
            </div>

          </div>
        </div>

        {/* Future Business Models */}
        <div className="max-w-4xl mx-auto">
          <h3 className="font-bold text-center text-slate-500 uppercase tracking-widest text-xs mb-8">
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
              <div key={idx} className="bg-white px-5 py-4 rounded-xl shadow-2xs border border-slate-100 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-sanchay-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-sanchay-navy-900 leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
