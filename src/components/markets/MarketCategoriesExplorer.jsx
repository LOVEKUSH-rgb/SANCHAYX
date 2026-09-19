import React from 'react';
import { Landmark, TrendingUp, PieChart, Building, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketCategoriesExplorer = () => {
  const categories = [
    {
      id: 'mutual-funds',
      title: 'Mutual Funds',
      icon: <PieChart className="w-6 h-6 text-emerald-500" />,
      description: 'Pooled investment vehicles managed by professionals, investing in equities, debt, or hybrid instruments.',
      bullets: [
        'Market-linked (returns not guaranteed)',
        'Different risk levels (Equity, Debt, Hybrid)',
        'Suitable horizons vary by fund type',
        'Invest via SIP or lump-sum'
      ],
      disclaimer: 'Mutual fund investments are subject to market risks. Read scheme-related documents carefully.'
    },
    {
      id: 'stocks',
      title: 'Stocks (Direct Equity)',
      icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
      description: 'Direct ownership of shares in listed companies, trading on stock exchanges.',
      bullets: [
        'Market-linked (returns not guaranteed)',
        'Higher price fluctuation can occur',
        'Requires active research and monitoring',
        'Capital appreciation & potential dividends'
      ],
      disclaimer: 'Direct equity exposure can involve substantial price fluctuations and capital risk.'
    },
    {
      id: 'etfs',
      title: 'ETFs',
      icon: <Globe className="w-6 h-6 text-purple-500" />,
      description: 'Exchange-Traded Funds that track an index, commodity, or basket of assets, traded like stocks.',
      bullets: [
        'Market-linked (returns not guaranteed)',
        'Instant diversification across an index',
        'Can be bought and sold during market hours',
        'Generally lower expense ratios'
      ],
      disclaimer: 'ETFs are subject to market risks and tracking error.'
    },
    {
      id: 'fixed-income',
      title: 'Fixed Income',
      icon: <Building className="w-6 h-6 text-slate-500" />,
      description: 'Debt instruments like corporate bonds, T-bills, and bank FDs providing regular interest.',
      bullets: [
        'Predictable interest concept where applicable',
        'Generally lower risk than equities',
        'Subject to credit and interest rate risk',
        'Suitable for stability-focused horizons'
      ],
      disclaimer: 'Verify credit ratings and terms. Not completely risk-free.'
    }
  ];

  return (
    <section id="market-categories" className="py-20 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950 mb-4">
            Educational Market Explorer
          </h2>
          <p className="text-slate-600 text-lg">
            Understand the fundamentals of different asset classes. SANCHAY provides this information for educational purposes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Government Schemes Special Card */}
          <div className="md:col-span-2 bg-sanchay-navy-950 rounded-3xl p-8 sm:p-10 shadow-card border border-sanchay-navy-800 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Landmark className="w-6 h-6 text-sanchay-gold-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Government Schemes</h3>
              </div>
              <p className="text-slate-300 mb-6 max-w-2xl">
                Sovereign-backed savings, pension, and insurance schemes. Typically offering capital protection and fixed or declared interest rates. Our core verified dataset.
              </p>
              <ul className="flex flex-wrap gap-3 mb-8">
                <li className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-slate-300 font-medium">Sovereign Guarantee</li>
                <li className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-slate-300 font-medium">Fixed/Declared Interest</li>
                <li className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-slate-300 font-medium">Tax Benefits</li>
              </ul>
              <Link
                to="/schemes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider transition-colors"
              >
                Explore Government Schemes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Market Categories */}
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-card transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-sanchay-navy-950">{cat.title}</h3>
              </div>
              <p className="text-slate-600 mb-6 min-h-[48px]">
                {cat.description}
              </p>
              <ul className="space-y-3 mb-8">
                {cat.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-mono leading-relaxed">
                  <strong>Regulatory Notice:</strong> {cat.disclaimer}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
