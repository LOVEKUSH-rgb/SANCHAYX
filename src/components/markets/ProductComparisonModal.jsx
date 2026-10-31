import React, { useMemo } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { buildComparisonMatrix } from '../../services/productComparisonService';

export const ProductComparisonModal = ({ products, onClose }) => {
  const comparisonData = useMemo(() => buildComparisonMatrix(products), [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-[#020504]/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-8">
      <div 
        className="bg-[#0c1611] border border-emerald-500/20 text-slate-100 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-emerald-500/15 flex items-start justify-between bg-[#060b08] shrink-0 rounded-t-3xl">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Compare Products</h2>
            <p className="text-slate-400 text-sm md:text-base">Structural and factual comparison of your selected options.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-white hover:bg-emerald-950/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Guardrail Banner */}
        <div className="bg-blue-950/40 border-b border-blue-500/30 p-4 px-6 md:px-8 flex items-start gap-3 shrink-0 backdrop-blur-sm">
          <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200 leading-relaxed">
            <strong className="text-blue-300">Educational Comparison:</strong> This tool highlights structural differences. It does not rank products, predict returns, or provide investment advice. Market-linked products carry risk and their returns are not guaranteed.
          </p>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 p-6 md:p-8 bg-[#0c1611]">
          <div className="min-w-[800px]">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr>
                  <th className="w-48 p-4 align-top sticky left-0 bg-[#060b08] z-10 border-b-2 border-emerald-500/20">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Features</span>
                  </th>
                  {comparisonData.products.map((p, idx) => (
                    <th key={idx} className="p-4 align-top border-b-2 border-emerald-500/20 bg-[#060b08]">
                      {p.dataSource === 'Illustrative Demo Data' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold uppercase tracking-wider rounded mb-2">
                          <AlertTriangle className="w-3 h-3 text-slate-400" /> Demo Data
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-emerald-950/80 text-emerald-300 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/30 mb-2">
                          Verified Official
                        </span>
                      )}
                      <h4 className="text-lg font-bold text-white mb-1 leading-tight">{p.title || p.details?.name || p.id}</h4>
                      <p className="text-xs text-slate-400 font-medium">{p.subtitle}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {comparisonData.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#101e17] transition-colors">
                    <td className="p-4 py-5 font-bold text-slate-200 text-sm sticky left-0 bg-[#08120d]/95 backdrop-blur-sm shadow-[1px_0_0_0_rgba(16,185,129,0.15)]">
                      {row.label}
                    </td>
                    {row.values.map((val, idx) => (
                      <td key={idx} className="p-4 py-5 text-sm text-slate-300 leading-relaxed">
                        {val === 'Not available' ? <span className="text-slate-500 italic">Not available</span> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
