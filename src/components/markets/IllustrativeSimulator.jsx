import React, { useState } from 'react';
import { Calculator, AlertCircle, Info } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export const IllustrativeSimulator = () => {
  const [initialAmount, setInitialAmount] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [years, setYears] = useState(10);
  const [customRate, setCustomRate] = useState(12);

  // Helper to calculate future value
  const calculateFV = (annualRatePercent) => {
    const p = Math.max(0, Number(initialAmount) || 0);
    const m = Math.max(0, Number(monthlyContribution) || 0);
    const y = Math.max(0, Number(years) || 0);
    
    if (y === 0) return p;
    
    if (annualRatePercent === 0) {
       return p + (m * y * 12);
    }

    const r = (annualRatePercent / 100) / 12;
    const n = y * 12;

    // FV of initial principal compound interest
    const fvPrincipal = p * Math.pow(1 + r, n);

    // FV of monthly contributions (Annuity due or regular annuity, using standard FV of annuity)
    const fvMonthly = m * (Math.pow(1 + r, n) - 1) / r;

    return fvPrincipal + fvMonthly;
  };

  const totalInvested = Math.max(0, Number(initialAmount) || 0) + (Math.max(0, Number(monthlyContribution) || 0) * Math.max(0, Number(years) || 0) * 12);

  const scenarios = [
    {
      name: 'Scenario A: Fixed Income Style',
      desc: 'Illustrative stable return (e.g. 7% p.a.)',
      rate: 7,
      color: 'bg-[#0c1611]/90 border-emerald-500/20 text-white'
    },
    {
      name: 'Scenario B: Moderate Market-Linked',
      desc: 'Illustrative moderate growth (e.g. 10% p.a.)',
      rate: 10,
      color: 'bg-[#0c1611]/90 border-emerald-500/30 text-white'
    },
    {
      name: 'Scenario C: Custom Assumption',
      desc: `Illustrative custom growth (${customRate}% p.a.)`,
      rate: customRate,
      color: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
    }
  ];

  return (
    <section className="py-20 bg-[#060b08] border-t border-emerald-500/15 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
            <Calculator className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-white mb-4">
            See How Different Scenarios Behave
          </h2>
          <p className="text-slate-400">
            A mathematical illustration to understand how time, contribution, and assumed growth rates affect future value.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs */}
          <div className="lg:col-span-4 bg-[#0c1611]/90 rounded-3xl p-6 shadow-2xl border border-emerald-500/20 backdrop-blur-sm">
            <h3 className="font-bold text-lg text-white mb-6 border-b border-emerald-500/15 pb-4">Simulation Inputs</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Initial Amount (₹)</label>
                <input 
                  type="number" 
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#060b08] border border-emerald-500/25 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Monthly Contribution (₹)</label>
                <input 
                  type="number" 
                  value={monthlyContribution}
                  onChange={e => setMonthlyContribution(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#060b08] border border-emerald-500/25 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Time Horizon (Years)</label>
                <input 
                  type="number" 
                  value={years}
                  onChange={e => setYears(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#060b08] border border-emerald-500/25 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Custom Assumed Rate (% p.a.)</label>
                <input 
                  type="number" 
                  value={customRate}
                  onChange={e => setCustomRate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#060b08] border border-emerald-500/25 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-emerald-500/15">
              <div className="text-sm text-slate-400 font-bold mb-1">Total Invested Over Time:</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(totalInvested)}</div>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 mb-6 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <strong className="text-amber-300">Illustrative only.</strong> These mathematical scenarios do not predict actual future returns. Market-linked returns are not guaranteed and can result in capital loss. 
              </div>
            </div>

            {scenarios.map((scenario, idx) => {
              const fv = calculateFV(scenario.rate);
              const gain = fv - totalInvested;
              
              return (
                <div key={idx} className={`p-6 rounded-2xl border ${scenario.color} flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl backdrop-blur-sm`}>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1 text-white">{scenario.name}</h4>
                    <p className="text-sm text-slate-300">{scenario.desc}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400/80 mb-1">Illustrative Future Value</div>
                    <div className="text-3xl font-black font-mono text-emerald-300 mb-1">{formatCurrency(fv)}</div>
                    <div className="text-sm font-medium text-slate-300">
                      Illustrative Gain: <span className="text-emerald-400 font-mono">{formatCurrency(gain > 0 ? gain : 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
