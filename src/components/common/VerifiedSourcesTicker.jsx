import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const VerifiedSourcesTicker = () => {
  const sources = [
    { name: 'Ministry of Finance', detail: 'Small Savings Directives' },
    { name: 'India Post & NSI', detail: 'Postal Savings & PPF Rules' },
    { name: 'LIC of India', detail: '38 Verified Active Plans' },
    { name: 'PFRDA', detail: 'APY & NPS Statutory Data' },
    { name: 'Income Tax Dept', detail: 'Sec 80C & 10(10D) Rules' },
    { name: 'myScheme / DBT', detail: '22+ Free Sovereign Benefits' },
  ];

  return (
    <div className="w-full bg-[#FAFAFC] border-y border-slate-200/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Editorial Header */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-sanchay-navy-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-sanchay-gold-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sanchay-emerald-600 uppercase tracking-widest">
                  TRUST FRAMEWORK
                </span>
              </div>
              <span className="text-xs font-extrabold text-sanchay-navy-900 uppercase tracking-wider block mt-0.5">
                Verified Official Sources
              </span>
            </div>
          </div>

          {/* Sources Ticker Pill Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full md:w-auto">
            {sources.map((src, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-card text-xs hover:border-sanchay-emerald-500/40 hover:shadow-card-hover transition-all duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-sanchay-navy-900 leading-tight">{src.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-medium truncate mt-0.5">{src.detail}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

