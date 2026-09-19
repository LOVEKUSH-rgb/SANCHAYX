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
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950 mb-4">
            Compare Options
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A high-level educational comparison of different financial asset classes.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-sanchay-navy-900">
                <th className="p-4 font-extrabold">Category</th>
                <th className="p-4 font-bold">Risk Characteristics</th>
                <th className="p-4 font-bold">Typical Horizon</th>
                <th className="p-4 font-bold">Liquidity</th>
                <th className="p-4 font-bold">Return Type</th>
                <th className="p-4 font-bold">Diversification</th>
                <th className="p-4 font-bold">Official / Regulated Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-sanchay-navy-950 whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="p-4 text-sm text-slate-700">{row.risk}</td>
                  <td className="p-4 text-sm text-slate-700">{row.horizon}</td>
                  <td className="p-4 text-sm text-slate-700">{row.liquidity}</td>
                  <td className="p-4 text-sm text-slate-700">{row.returnType}</td>
                  <td className="p-4 text-sm text-slate-700">{row.diversification}</td>
                  <td className="p-4 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Disclaimer:</strong> This comparison is for educational purposes only. It does not constitute investment advice. Market-linked investments involve risk. Please verify current product terms, risks, and eligibility from the official provider or regulator before making financial decisions.
          </p>
        </div>
      </div>
    </section>
  );
};
