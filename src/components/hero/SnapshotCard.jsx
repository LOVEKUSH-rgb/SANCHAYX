import React from 'react';
import { ShieldCheck, CheckCircle2, TrendingUp, ChevronRight, Award, Compass } from 'lucide-react';

export const SnapshotCard = () => {
  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-floating border border-slate-200/90 transition-all duration-300 hover:shadow-editorial hover:border-sanchay-emerald-500/40">
      
      {/* Card Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sanchay-navy-900 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 text-sanchay-gold-500" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-sanchay-navy-900 leading-tight">
              Sanchay Financial Snapshot
            </h3>
            <p className="text-[11px] font-mono text-slate-400 font-medium mt-0.5">Real-Time Eligibility Engine</p>
          </div>
        </div>

        {/* 92% Match Badge (Explicit Demo Data Labeling) */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 font-extrabold text-xs border border-sanchay-emerald-200 shadow-2xs">
          <Award className="w-3.5 h-3.5 text-sanchay-gold-500" />
          <span>92% FIT</span>
          <span className="text-[9px] font-mono text-slate-400 font-normal uppercase">(DEMO)</span>
        </div>
      </div>

      {/* User Financial Parameters Grid */}
      <div className="grid grid-cols-3 gap-2.5 my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Target Goal</div>
          <div className="font-bold text-sanchay-navy-900 mt-1 truncate">Higher Education</div>
        </div>
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Monthly Budget</div>
          <div className="font-bold text-sanchay-emerald-600 mt-1">₹1,500 / mo</div>
        </div>
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Time Horizon</div>
          <div className="font-bold text-sanchay-navy-900 mt-1">12 Years</div>
        </div>
      </div>

      {/* Recommended Scheme Card Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-sanchay-emerald-50/70 via-white to-sanchay-sky-50/50 border border-sanchay-emerald-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-sanchay-emerald-700 bg-sanchay-emerald-100/60 px-2 py-0.5 rounded">
            Top Matched Scheme
          </span>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-sanchay-emerald-600" />
            Verified Official Source
          </span>
        </div>

        <h4 className="font-display font-extrabold text-lg text-sanchay-navy-900">
          Sukanya Samriddhi Yojana (SSY)
        </h4>

        <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1 text-sanchay-navy-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
            <TrendingUp className="w-3.5 h-3.5 text-sanchay-emerald-600" />
            <span>8.2% Guaranteed Rate</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="text-sanchay-navy-900 font-bold">100% Tax Exempt (Sec 80C)</div>
        </div>
      </div>

      {/* Transparent Match Rationale Footnote */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2 truncate">
          <ShieldCheck className="w-4 h-4 text-sanchay-emerald-600 shrink-0" />
          <span className="truncate">Rationale: High compound growth for 12-yr horizon</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

    </div>
  );
};

