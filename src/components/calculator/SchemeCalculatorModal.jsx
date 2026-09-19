import React, { useState, useEffect } from 'react';
import { X, Calculator, Info, AlertTriangle } from 'lucide-react';
import { getCalculationConfig, CALCULATION_TYPES } from '../../services/calculationEngine';
import { localizeScheme, getLocalizedCommonText } from '../../utils/contentLocalizer';
import { useLanguage } from '../../context/LanguageContext';

export const SchemeCalculatorModal = ({ scheme, onClose }) => {
  const { t, currentLang } = useLanguage();
  const [config, setConfig] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (scheme) {
      const calcConfig = getCalculationConfig(scheme);
      setConfig(calcConfig);
      
      const initialInputs = {};
      calcConfig.inputs.forEach(input => {
        initialInputs[input.id] = input.defaultValue || 0;
      });
      setInputValues(initialInputs);
    }
  }, [scheme]);

  useEffect(() => {
    if (config && config.type !== CALCULATION_TYPES.NONE) {
      const newResult = config.calculate(inputValues, config.params);
      setResult(newResult);
    } else {
      setResult(null);
    }
  }, [inputValues, config]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scheme || !config) return null;

  const locItem = localizeScheme(scheme, currentLang);
  const displayName = locItem.displayName || (typeof scheme.name === 'object' ? (scheme.name[currentLang] || scheme.name.en) : scheme.name);

  const handleInputChange = (id, value) => {
    setInputValues(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (val) => {
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return val; // String like "2 Lakhs"
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl shadow-floating border border-slate-200/90 flex flex-col relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 bg-sanchay-navy-950 rounded-t-2xl sm:rounded-t-3xl overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-sanchay-emerald-900/40 to-transparent pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors backdrop-blur-xs z-10"
            aria-label="Close calculator"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-sanchay-emerald-500/20 rounded-xl text-sanchay-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-extrabold text-xl text-white leading-tight">
                  {t('calculator.title', 'Benefit Calculator')}
                </h2>
                {config && config.confidence && (
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    config.confidence === 'Exact Scheme Rule' ? 'bg-sanchay-emerald-500/20 text-sanchay-emerald-300 border border-sanchay-emerald-500/30' :
                    config.confidence === 'Dataset-Based Calculation' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {config.confidence}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 font-medium truncate mt-0.5">
                {displayName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {config.type === CALCULATION_TYPES.NONE ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-sm text-sanchay-navy-700 font-medium leading-relaxed">
                {config.message}
              </p>
            </div>
          ) : (
            <>
              {/* Dynamic Inputs */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-sanchay-navy-950 uppercase tracking-wider">
                  {t('calculator.enterDetails', 'Enter Details')}
                </h3>
                
                <div className="space-y-3">
                  {config.inputs.map(input => (
                    <div key={input.id} className="flex flex-col gap-1.5">
                      <label htmlFor={input.id} className="text-xs font-semibold text-slate-600">
                        {input.label}
                      </label>
                      <input
                        id={input.id}
                        type={input.type}
                        min={input.min}
                        max={input.max}
                        value={inputValues[input.id] === 0 ? '' : inputValues[input.id]}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 text-sanchay-navy-950 font-medium transition-all outline-none"
                        placeholder={`e.g. ${input.defaultValue}`}
                      />
                      {input.min !== undefined && input.max !== undefined && (
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                          <span>Min: {input.min}</span>
                          <span>Max: {input.max}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div className="bg-sanchay-emerald-600 rounded-3xl p-6 sm:p-8 shadow-card text-white mt-6">
                  <h3 className="font-bold text-xs uppercase tracking-[0.15em] mb-4 text-emerald-100 text-center opacity-90">
                    {config.confidence === 'Exact Scheme Rule' ? 'SCHEME RESULT' : t('calculator.estimatedResult', 'Estimated Result')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2.5 border-b border-emerald-500/30">
                      <span className="text-xs font-semibold text-emerald-50 uppercase tracking-wider">Total Contribution</span>
                      <span className="font-mono font-bold text-lg">{formatCurrency(result.totalContribution)}</span>
                    </div>
                    
                    {result.monthlyIncome !== undefined && (
                      <div className="flex justify-between items-center py-2.5 border-b border-emerald-500/30">
                        <span className="text-xs font-semibold text-emerald-50 uppercase tracking-wider">Monthly Income</span>
                        <span className="font-mono font-bold text-lg">{formatCurrency(result.monthlyIncome)}</span>
                      </div>
                    )}
                    
                    {!result.isInsurance && result.estimatedGain > 0 && result.monthlyIncome === undefined && (
                      <div className="flex justify-between items-center py-2.5 border-b border-emerald-500/30">
                        <span className="text-xs font-semibold text-emerald-50 uppercase tracking-wider">Estimated Gain (Interest)</span>
                        <span className="font-mono font-bold text-lg text-emerald-200">{formatCurrency(result.estimatedGain)}</span>
                      </div>
                    )}

                    {!result.isInsurance && result.estimatedGain > 0 && result.monthlyIncome !== undefined && (
                      <div className="flex justify-between items-center py-2.5 border-b border-emerald-500/30">
                        <span className="text-xs font-semibold text-emerald-50 uppercase tracking-wider">Total Interest Earned</span>
                        <span className="font-mono font-bold text-lg text-emerald-200">{formatCurrency(result.estimatedGain)}</span>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
                      <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em] mb-2 opacity-90">
                        {result.isInsurance 
                          ? 'Insurance Benefit' 
                          : result.isEstimate 
                            ? 'Estimated maturity — simplified calculation'
                            : (result.monthlyIncome !== undefined ? 'Maturity Amount (Principal Returned)' : (config.confidence === 'Exact Scheme Rule' ? 'Maturity Amount' : 'Total Estimated Value'))}
                      </span>
                      <span className="font-serif font-extrabold text-4xl sm:text-5xl text-white drop-shadow-md">
                        {formatCurrency(result.estimatedBenefit)}
                      </span>
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="mt-6 flex gap-3 items-start p-4 bg-emerald-700/40 rounded-2xl border border-emerald-500/30">
                      <Info className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-50 leading-relaxed font-medium">
                        {result.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
