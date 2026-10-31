import React from 'react';
import { Info } from 'lucide-react';

export const MarketComparisonTable = () => {
  const comparisonData = [
    {
      category: "Government Schemes",
      risk: "Government-backed schemes where applicable",
      horizon: "Scheme-specific horizon",
      liquidity: "Scheme-specific rules",
      returnType: "Scheme-specific interest/benefit",
      diversification: "Varies by scheme",
      examples: "PPF, SSY, NSC, KVP",
      source: "India Post, RBI, Relevant Ministries"
    },
    {
      category: "Mutual Funds",
      risk: "Market-linked",
      horizon: "Depends on fund (Short/Medium/Long)",
      liquidity: "Generally redeemable subject to scheme rules",
      returnType: "Market-linked (Capital appreciation/IDCW)",
      diversification: "Diversification varies (Index, Sectoral, Broad)",
      examples: "Index Funds, Liquid Funds, Flexi-cap",
      source: "SEBI, AMFI"
    },
    {
      category: "Stocks",
      risk: "Market-linked",
      horizon: "No fixed maturity",
      liquidity: "Market liquidity depends on security/market",
      returnType: "Price appreciation/dividends where applicable",
      diversification: "Single-company exposure unless diversified",
      examples: "Listed Equity Shares",
      source: "SEBI, BSE, NSE"
    },
    {
      category: "ETFs",
      risk: "Market-linked",
      horizon: "No fixed maturity",
      liquidity: "Exchange traded",
      returnType: "Market-linked",
      diversification: "Usually tracks an index/asset basket",
      examples: "Nifty 50 ETF, Gold ETF",
      source: "SEBI, BSE, NSE"
    },
    {
      category: "Fixed Income",
      risk: "Product-specific (Credit/Interest rate risk)",
      horizon: "Product-specific maturity",
      liquidity: "Product-specific lock-ins/trading",
      returnType: "Interest/coupon/product-specific",
      diversification: "Product-specific",
      examples: "Bank FDs, Corporate Bonds, T-Bills",
      source: "RBI, SEBI, Banks"
    }
  ];

  return (
    <section className="py-16 bg-[#060b08] text-slate-100 border-b border-emerald-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-white mb-4">
            Compare Options
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A high-level educational comparison of different financial asset classes.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-emerald-500/20 shadow-2xl bg-[#0c1611]/90">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-[#08120d] border-b border-emerald-500/20 text-xs uppercase tracking-wider text-white">
                <th className="p-4 font-serif font-extrabold">Category</th>
                <th className="p-4 font-bold text-slate-300">Risk Characteristics</th>
                <th className="p-4 font-bold text-slate-300">Typical Horizon</th>
                <th className="p-4 font-bold text-slate-300">Liquidity</th>
                <th className="p-4 font-bold text-slate-300">Return Type</th>
                <th className="p-4 font-bold text-slate-300">Diversification</th>
                <th className="p-4 font-bold text-slate-300">Official / Regulated Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/15">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#101e17] transition-colors">
                  <td className="p-4 font-serif font-bold text-white whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="p-4 text-sm text-slate-300">{row.risk}</td>
                  <td className="p-4 text-sm text-slate-300">{row.horizon}</td>
                  <td className="p-4 text-sm text-slate-300">{row.liquidity}</td>
                  <td className="p-4 text-sm text-slate-300">{row.returnType}</td>
                  <td className="p-4 text-sm text-slate-300">{row.diversification}</td>
                  <td className="p-4 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-[#08120d] border border-emerald-500/20 text-sm text-slate-400">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Disclaimer:</strong> This comparison is for educational purposes only. It does not constitute investment advice. Market-linked investments involve risk. Please verify current product terms, risks, and eligibility from the official provider or regulator before making financial decisions.
          </p>
        </div>
      </div>
    </section>
  );
};
