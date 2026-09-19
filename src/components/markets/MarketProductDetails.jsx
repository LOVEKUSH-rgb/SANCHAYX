import React from 'react';
import { X, AlertTriangle, ExternalLink, ShieldAlert, BarChart3, Clock, Layers } from 'lucide-react';

export const MarketProductDetails = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-sanchay-navy-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 border border-yellow-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {product.dataSource}
              </span>
            </div>
            <h3 className="text-2xl font-black text-sanchay-navy-950 mb-1">{product.title}</h3>
            <p className="text-slate-600 font-medium">{product.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors z-10 relative cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <BarChart3 className="w-48 h-48" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {product.type === 'mutual_fund' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Risk Profile</span>
                  </div>
                  <p className="font-bold text-sanchay-navy-950">{product.details.riskometer}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ideal Horizon</span>
                  </div>
                  <p className="font-bold text-sanchay-navy-950">{product.details.suitableHorizon}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Diversification</span>
                </div>
                <p className="font-medium text-sanchay-navy-900">{product.details.diversification}</p>
              </div>
            </div>
          )}

          {product.type === 'stock' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Risk Profile</span>
                  </div>
                  <p className="font-bold text-sanchay-navy-950">High ({product.details.expectedVolatilty} Volatility)</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sector</span>
                  </div>
                  <p className="font-bold text-sanchay-navy-950">{product.details.sector}</p>
                </div>
              </div>
            </div>
          )}

          {product.type === 'etf' && (
            <div className="space-y-6">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Underlying Asset</span>
                </div>
                <p className="font-bold text-sanchay-navy-950">{product.details.underlying}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Liquidity</span>
                </div>
                <p className="font-bold text-sanchay-navy-950">{product.details.liquidity}</p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">Educational Data Only</p>
              <p>This is illustrative data to help you understand market categories. It is not investment advice, and you cannot buy or sell this asset on SANCHAY.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <a 
            href="#"
            onClick={(e) => e.preventDefault()}
            className="px-6 py-3 bg-sanchay-navy-950 text-white font-bold rounded-xl hover:bg-sanchay-navy-800 transition-colors flex items-center gap-2 cursor-not-allowed opacity-80"
          >
            Learn More <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
