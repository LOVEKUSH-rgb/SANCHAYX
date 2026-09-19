import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

export const MarketsHero = ({ onStartDiscovery }) => {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-sanchay-navy-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sanchay-emerald-500/20 text-sanchay-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-6 border border-sanchay-emerald-500/30">
          <Compass className="w-4 h-4" />
          <span>Personal Financial Discovery</span>
        </div>

        <h1 className="font-serif font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-tight mb-6">
          Explore Where Your <br className="hidden sm:block" /> Money Can Go
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Compare savings, government schemes and market-linked products based on your goal, horizon and risk preference.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartDiscovery}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-editorial hover:scale-105 transition-all cursor-pointer"
          >
            Find My Options
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <a
            href="#market-categories"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            Explore Markets
          </a>
        </div>
      </div>
    </section>
  );
};
