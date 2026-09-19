import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  evaluateBasicMath, 
  calculateSimpleInterest, 
  calculateCompoundInterest, 
  calculateEMI 
} from '../services/manualCalculator';
import { 
  Calculator, 
  Percent, 
  TrendingUp, 
  Landmark, 
  History, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

export const ManualCalculatorPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('basic');
  const [history, setHistory] = useState([]);

  // States for Basic
  const [expression, setExpression] = useState('');
  const [basicResult, setBasicResult] = useState(null);
  const [basicError, setBasicError] = useState('');

  // States for SI
  const [siPrincipal, setSiPrincipal] = useState('');
  const [siRate, setSiRate] = useState('');
  const [siTime, setSiTime] = useState('');
  const [siResult, setSiResult] = useState(null);
  const [siError, setSiError] = useState('');

  // States for CI
  const [ciPrincipal, setCiPrincipal] = useState('');
  const [ciRate, setCiRate] = useState('');
  const [ciTime, setCiTime] = useState('');
  const [ciFreq, setCiFreq] = useState('1'); // 1=Annual
  const [ciResult, setCiResult] = useState(null);
  const [ciError, setCiError] = useState('');

  // States for EMI
  const [emiPrincipal, setEmiPrincipal] = useState('');
  const [emiRate, setEmiRate] = useState('');
  const [emiTenure, setEmiTenure] = useState('');
  const [emiResult, setEmiResult] = useState(null);
  const [emiError, setEmiError] = useState('');

  // Helpers
  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev].slice(0, 50));
  };

  const clearHistory = () => setHistory([]);

  const formatCurrency = (val) => {
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return val;
  };

  // Handlers
  const handleBasicCalc = () => {
    setBasicError('');
    setBasicResult(null);
    if (!expression) return;
    const { result, error } = evaluateBasicMath(expression);
    if (error) {
      setBasicError(error);
    } else {
      setBasicResult(result);
      addToHistory({ mode: 'Basic Math', formula: expression, result: result.toLocaleString('en-IN') });
    }
  };

  const handleSICalc = () => {
    setSiError('');
    setSiResult(null);
    const { si, total, error } = calculateSimpleInterest(siPrincipal, siRate, siTime);
    if (error) {
      setSiError(error);
    } else {
      setSiResult({ si, total });
      addToHistory({ mode: 'Simple Interest', formula: `P: ${siPrincipal}, R: ${siRate}%, T: ${siTime}yrs`, result: `Total: ${formatCurrency(total)}` });
    }
  };

  const handleCICalc = () => {
    setCiError('');
    setCiResult(null);
    const { ci, total, error } = calculateCompoundInterest(ciPrincipal, ciRate, ciTime, ciFreq);
    if (error) {
      setCiError(error);
    } else {
      setCiResult({ ci, total });
      addToHistory({ mode: 'Compound Interest', formula: `P: ${ciPrincipal}, R: ${ciRate}%, T: ${ciTime}yrs, Freq: ${ciFreq}`, result: `Total: ${formatCurrency(total)}` });
    }
  };

  const handleEMICalc = () => {
    setEmiError('');
    setEmiResult(null);
    const { emi, totalPayment, totalInterest, error } = calculateEMI(emiPrincipal, emiRate, emiTenure);
    if (error) {
      setEmiError(error);
    } else {
      setEmiResult({ emi, totalPayment, totalInterest });
      addToHistory({ mode: 'EMI', formula: `Loan: ${emiPrincipal}, R: ${emiRate}%, Tenure: ${emiTenure}mos`, result: `EMI: ${formatCurrency(emi)}/mo` });
    }
  };

  const resetForms = () => {
    setExpression(''); setBasicResult(null); setBasicError('');
    setSiPrincipal(''); setSiRate(''); setSiTime(''); setSiResult(null); setSiError('');
    setCiPrincipal(''); setCiRate(''); setCiTime(''); setCiFreq('1'); setCiResult(null); setCiError('');
    setEmiPrincipal(''); setEmiRate(''); setEmiTenure(''); setEmiResult(null); setEmiError('');
  };

  const tabs = [
    { id: 'basic', label: 'Basic Math', icon: <Calculator className="w-4 h-4" /> },
    { id: 'si', label: 'Simple Interest', icon: <Percent className="w-4 h-4" /> },
    { id: 'ci', label: 'Compound Interest', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'emi', label: 'EMI Calculator', icon: <Landmark className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-sanchay-navy-950">Manual Calculator</h1>
            <p className="text-sm text-slate-500 mt-1">Perform standalone financial & math calculations</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              These are manual calculations for your reference and are <strong className="font-bold">not officially associated</strong> with any government scheme rules or benefits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Calculator Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-200/60 overflow-hidden flex flex-col">
            
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); resetForms(); }}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'text-sanchay-emerald-700 border-b-2 border-sanchay-emerald-600 bg-sanchay-emerald-50/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex-1">
              
              {/* BASIC MATH */}
              {activeTab === 'basic' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mathematical Expression</label>
                    <input 
                      type="text" 
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBasicCalc()}
                      placeholder="e.g. 10000 + 5000 or 50000 * 7.1%"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono text-lg transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-2">Supports +, -, *, /, %, (), and decimals.</p>
                  </div>

                  {basicError && <div className="text-sm font-bold text-red-500">{basicError}</div>}
                  
                  {basicResult !== null && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Result</span>
                      <span className="font-mono text-4xl font-black text-sanchay-emerald-600">{basicResult.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleBasicCalc} className="flex-1 bg-sanchay-navy-900 hover:bg-sanchay-navy-950 text-white py-3 rounded-xl font-bold transition-colors shadow-sm">Calculate</button>
                    <button onClick={resetForms} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">Clear</button>
                  </div>
                </div>
              )}

              {/* SIMPLE INTEREST */}
              {activeTab === 'si' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Principal Amount (₹)</label>
                      <input type="number" value={siPrincipal} onChange={(e) => setSiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Interest Rate (% p.a.)</label>
                      <input type="number" value={siRate} onChange={(e) => setSiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Time (Years)</label>
                      <input type="number" value={siTime} onChange={(e) => setSiTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                  </div>

                  {siError && <div className="text-sm font-bold text-red-500">{siError}</div>}

                  {siResult && (
                    <div className="p-5 bg-sanchay-emerald-50/50 rounded-xl border border-sanchay-emerald-100/80 space-y-3">
                       <div className="flex justify-between items-center py-2 border-b border-sanchay-emerald-200/50">
                         <span className="text-sm font-medium text-sanchay-emerald-800">Principal</span>
                         <span className="font-mono font-bold text-sanchay-navy-900">{formatCurrency(parseFloat(siPrincipal))}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-sanchay-emerald-200/50">
                         <span className="text-sm font-medium text-sanchay-emerald-800">Total Interest</span>
                         <span className="font-mono font-bold text-green-600">+{formatCurrency(siResult.si)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2">
                         <span className="text-base font-bold text-sanchay-emerald-900">Total Amount</span>
                         <span className="font-mono text-2xl font-black text-sanchay-emerald-700">{formatCurrency(siResult.total)}</span>
                       </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSICalc} className="flex-1 bg-sanchay-navy-900 hover:bg-sanchay-navy-950 text-white py-3 rounded-xl font-bold transition-colors shadow-sm">Calculate</button>
                    <button onClick={resetForms} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">Clear</button>
                  </div>
                </div>
              )}

              {/* COMPOUND INTEREST */}
              {activeTab === 'ci' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Principal Amount (₹)</label>
                      <input type="number" value={ciPrincipal} onChange={(e) => setCiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Interest Rate (% p.a.)</label>
                      <input type="number" value={ciRate} onChange={(e) => setCiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Time (Years)</label>
                      <input type="number" value={ciTime} onChange={(e) => setCiTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Compounding Frequency</label>
                      <select value={ciFreq} onChange={(e) => setCiFreq(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-medium text-slate-700 transition-all bg-white">
                        <option value="1">Annually (1/yr)</option>
                        <option value="2">Half-Yearly (2/yr)</option>
                        <option value="4">Quarterly (4/yr)</option>
                        <option value="12">Monthly (12/yr)</option>
                      </select>
                    </div>
                  </div>

                  {ciError && <div className="text-sm font-bold text-red-500">{ciError}</div>}

                  {ciResult && (
                    <div className="p-5 bg-sanchay-emerald-50/50 rounded-xl border border-sanchay-emerald-100/80 space-y-3">
                       <div className="flex justify-between items-center py-2 border-b border-sanchay-emerald-200/50">
                         <span className="text-sm font-medium text-sanchay-emerald-800">Principal</span>
                         <span className="font-mono font-bold text-sanchay-navy-900">{formatCurrency(parseFloat(ciPrincipal))}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-sanchay-emerald-200/50">
                         <span className="text-sm font-medium text-sanchay-emerald-800">Compound Interest</span>
                         <span className="font-mono font-bold text-green-600">+{formatCurrency(ciResult.ci)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2">
                         <span className="text-base font-bold text-sanchay-emerald-900">Total Amount</span>
                         <span className="font-mono text-2xl font-black text-sanchay-emerald-700">{formatCurrency(ciResult.total)}</span>
                       </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleCICalc} className="flex-1 bg-sanchay-navy-900 hover:bg-sanchay-navy-950 text-white py-3 rounded-xl font-bold transition-colors shadow-sm">Calculate</button>
                    <button onClick={resetForms} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">Clear</button>
                  </div>
                </div>
              )}

              {/* EMI */}
              {activeTab === 'emi' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Loan Amount (₹)</label>
                      <input type="number" value={emiPrincipal} onChange={(e) => setEmiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Interest Rate (% p.a.)</label>
                      <input type="number" value={emiRate} onChange={(e) => setEmiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Loan Tenure (Months)</label>
                      <input type="number" value={emiTenure} onChange={(e) => setEmiTenure(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sanchay-emerald-500 focus:ring-2 focus:ring-sanchay-emerald-500/20 font-mono transition-all" />
                    </div>
                  </div>

                  {emiError && <div className="text-sm font-bold text-red-500">{emiError}</div>}

                  {emiResult && (
                    <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100/80 space-y-3">
                       <div className="flex justify-between items-center pt-2 pb-4 border-b border-blue-200/50">
                         <span className="text-base font-bold text-blue-900">Monthly EMI</span>
                         <span className="font-mono text-3xl font-black text-blue-700">{formatCurrency(emiResult.emi)}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                         <span className="text-sm font-medium text-blue-800">Principal</span>
                         <span className="font-mono font-bold text-sanchay-navy-900">{formatCurrency(parseFloat(emiPrincipal))}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                         <span className="text-sm font-medium text-blue-800">Total Interest</span>
                         <span className="font-mono font-bold text-red-500">+{formatCurrency(emiResult.totalInterest)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2">
                         <span className="text-sm font-bold text-blue-900">Total Payment</span>
                         <span className="font-mono font-bold text-sanchay-navy-900">{formatCurrency(emiResult.totalPayment)}</span>
                       </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleEMICalc} className="flex-1 bg-sanchay-navy-900 hover:bg-sanchay-navy-950 text-white py-3 rounded-xl font-bold transition-colors shadow-sm">Calculate</button>
                    <button onClick={resetForms} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">Clear</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* History Sidebar */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 p-5 flex flex-col max-h-[600px]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-sanchay-navy-950 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                History
              </h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
              {history.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8 flex flex-col items-center gap-2">
                  <History className="w-8 h-8 opacity-20" />
                  No calculations yet.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-sanchay-emerald-600 uppercase tracking-wider mb-1">{item.mode}</div>
                    <div className="text-xs text-slate-600 font-mono mb-1.5 break-all">{item.formula}</div>
                    <div className="text-sm font-bold text-sanchay-navy-900 font-mono">{item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
