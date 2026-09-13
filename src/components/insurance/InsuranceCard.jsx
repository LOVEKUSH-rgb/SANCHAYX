import React from 'react';
import { ShieldCheck, Info, ExternalLink, ArrowRight } from 'lucide-react';

export const InsuranceCard = ({ product, onViewDetails, onCompare }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover border border-slate-200/90 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Top Category & Demo Tag Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-sanchay-sky-50 text-sanchay-sky-500 font-extrabold text-[10px] uppercase tracking-wider border border-sanchay-sky-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sanchay-sky-500" />
            Protection & Insurance
          </span>

          <span className="px-2.5 py-0.5 rounded bg-sanchay-gold-50 text-sanchay-gold-600 border border-sanchay-gold-200 font-extrabold text-[10px] uppercase tracking-wider">
            DEMO DATA
          </span>
        </div>

        <h3 className="font-display font-bold text-lg text-sanchay-navy-900 leading-snug group-hover:text-sanchay-emerald-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {product.provider} • {product.subCategory}
        </p>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          {product.descriptionSimple}
        </p>

        {/* Key Product Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Policy Term</span>
            <span className="font-bold text-sanchay-navy-900 mt-0.5 block">{product.policyTerm}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Premium Frequency</span>
            <span className="font-bold text-sanchay-navy-900 mt-0.5 block">{product.premiumFrequency}</span>
          </div>
        </div>

        {/* Benefits Bullet Summary */}
        <div className="text-xs text-slate-600 space-y-1.5 mb-4">
          <div className="flex items-start gap-1.5">
            <span className="text-sanchay-emerald-600 font-bold">✓</span>
            <span>{product.benefitsOverview}</span>
          </div>
        </div>
      </div>

      {/* Footer & Disclaimer */}
      <div>
        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 font-medium mb-4 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-sanchay-gold-600 shrink-0 mt-0.5" />
          <span>{product.disclaimer}</span>
        </div>

        <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
          <button
            onClick={() => onViewDetails(product)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sanchay-navy-900 hover:bg-sanchay-navy-800 text-white font-bold text-xs transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onCompare(product)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-900 font-bold text-xs border border-slate-200 transition-colors"
          >
            Compare
          </button>
        </div>
      </div>

    </div>
  );
};
