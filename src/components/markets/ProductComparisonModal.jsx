import React, { useMemo } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { buildComparisonMatrix } from '../../services/productComparisonService';

export const ProductComparisonModal = ({ products, onClose }) => {
  const comparisonData = useMemo(() => buildComparisonMatrix(products), [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-sanchay-navy-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-8">
      <div 
        className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 flex items-start justify-between bg-slate-50 shrink-0 rounded-t-3xl">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-sanchay-navy-950 mb-2">Compare Products</h2>
            <p className="text-slate-600 text-sm md:text-base">Structural and factual comparison of your selected options.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Guardrail Banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 px-6 md:px-8 flex items-start gap-3 shrink-0">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Educational Comparison:</strong> This tool highlights structural differences. It does not rank products, predict returns, or provide investment advice. Market-linked products carry risk and their returns are not guaranteed.
          </p>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 p-6 md:p-8">
          <div className="min-w-[800px]">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr>
                  <th className="w-48 p-4 align-top sticky left-0 bg-white z-10 border-b-2 border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features</span>
                  </th>
                  {comparisonData.products.map((p, idx) => (
                    <th key={idx} className="p-4 align-top border-b-2 border-slate-200 bg-white">
                      {p.dataSource === 'Illustrative Demo Data' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded mb-2">
                          <AlertTriangle className="w-3 h-3" /> Demo Data
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-sanchay-emerald-50 text-sanchay-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded border border-sanchay-emerald-200 mb-2">
                          Verified Official
                        </span>
                      )}
                      <h4 className="text-lg font-bold text-sanchay-navy-950 mb-1 leading-tight">{p.title || p.details?.name || p.id}</h4>
                      <p className="text-xs text-slate-500 font-medium">{p.subtitle}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonData.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 py-5 font-bold text-sanchay-navy-900 text-sm sticky left-0 bg-white/90 backdrop-blur-sm shadow-[1px_0_0_0_#f1f5f9]">
                      {row.label}
                    </td>
                    {row.values.map((val, idx) => (
                      <td key={idx} className="p-4 py-5 text-sm text-slate-700 leading-relaxed">
                        {val === 'Not available' ? <span className="text-slate-400 italic">Not available</span> : val}
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
