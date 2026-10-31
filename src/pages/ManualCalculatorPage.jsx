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
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

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
    <div className="min-h-screen bg-[#060b08] text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Financial Calculation Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-white">Manual Calculator</h1>
              <p className="text-sm text-slate-300 mt-1">Perform standalone financial & math calculations</p>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 max-w-md flex gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                These are manual calculations for your reference and are <strong className="font-bold text-amber-100">not officially associated</strong> with any specific government scheme rules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Calculator Area */}
            <div className="lg:col-span-2 bg-[#0c1611]/90 rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden flex flex-col">
              
              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-emerald-500/15 bg-[#08120d] hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); resetForms(); }}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.id 
                        ? 'text-emerald-300 border-b-2 border-emerald-400 bg-emerald-950/50' 
                        : 'text-slate-400 hover:text-white hover:bg-emerald-950/20'
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
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Mathematical Expression</label>
                      <input 
                        type="text" 
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBasicCalc()}
                        placeholder="e.g. 10000 + 5000 or 50000 * 7.1%"
                        className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-lg text-white transition-all outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-2 font-mono">Supports +, -, *, /, %, (), and decimals.</p>
                    </div>

                    {basicError && <div className="text-sm font-bold text-rose-400">{basicError}</div>}
                    
                    {basicResult !== null && (
                      <div className="p-6 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">Result</span>
                        <span className="font-mono text-4xl font-black text-white">{basicResult.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button onClick={handleBasicCalc} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer">Calculate</button>
                      <button onClick={resetForms} className="px-6 bg-[#060b08] hover:bg-[#12221a] text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-emerald-500/20 cursor-pointer">Clear</button>
                    </div>
                  </div>
                )}

                {/* SIMPLE INTEREST */}
                {activeTab === 'si' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Principal Amount (₹)</label>
                        <input type="number" value={siPrincipal} onChange={(e) => setSiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Interest Rate (% p.a.)</label>
                        <input type="number" value={siRate} onChange={(e) => setSiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Time (Years)</label>
                        <input type="number" value={siTime} onChange={(e) => setSiTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                    </div>

                    {siError && <div className="text-sm font-bold text-rose-400">{siError}</div>}

                    {siResult && (
                      <div className="p-5 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 space-y-3">
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Principal</span>
                           <span className="font-mono font-bold text-white">{formatCurrency(parseFloat(siPrincipal))}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Total Interest</span>
                           <span className="font-mono font-bold text-emerald-400">+{formatCurrency(siResult.si)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                           <span className="text-sm font-bold text-white">Total Amount</span>
                           <span className="font-mono text-2xl font-black text-emerald-400">{formatCurrency(siResult.total)}</span>
                         </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button onClick={handleSICalc} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer">Calculate</button>
                      <button onClick={resetForms} className="px-6 bg-[#060b08] hover:bg-[#12221a] text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-emerald-500/20 cursor-pointer">Clear</button>
                    </div>
                  </div>
                )}

                {/* COMPOUND INTEREST */}
                {activeTab === 'ci' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Principal Amount (₹)</label>
                        <input type="number" value={ciPrincipal} onChange={(e) => setCiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Interest Rate (% p.a.)</label>
                        <input type="number" value={ciRate} onChange={(e) => setCiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Time (Years)</label>
                        <input type="number" value={ciTime} onChange={(e) => setCiTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Compounding Frequency</label>
                        <select value={ciFreq} onChange={(e) => setCiFreq(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all outline-none cursor-pointer">
                          <option value="1" className="bg-[#0c1611] text-white">Annually (1/yr)</option>
                          <option value="2" className="bg-[#0c1611] text-white">Half-Yearly (2/yr)</option>
                          <option value="4" className="bg-[#0c1611] text-white">Quarterly (4/yr)</option>
                          <option value="12" className="bg-[#0c1611] text-white">Monthly (12/yr)</option>
                        </select>
                      </div>
                    </div>

                    {ciError && <div className="text-sm font-bold text-rose-400">{ciError}</div>}

                    {ciResult && (
                      <div className="p-5 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 space-y-3">
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Principal</span>
                           <span className="font-mono font-bold text-white">{formatCurrency(parseFloat(ciPrincipal))}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Compound Interest</span>
                           <span className="font-mono font-bold text-emerald-400">+{formatCurrency(ciResult.ci)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                           <span className="text-sm font-bold text-white">Total Amount</span>
                           <span className="font-mono text-2xl font-black text-emerald-400">{formatCurrency(ciResult.total)}</span>
                         </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button onClick={handleCICalc} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer">Calculate</button>
                      <button onClick={resetForms} className="px-6 bg-[#060b08] hover:bg-[#12221a] text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-emerald-500/20 cursor-pointer">Clear</button>
                    </div>
                  </div>
                )}

                {/* EMI */}
                {activeTab === 'emi' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Loan Amount (₹)</label>
                        <input type="number" value={emiPrincipal} onChange={(e) => setEmiPrincipal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Interest Rate (% p.a.)</label>
                        <input type="number" value={emiRate} onChange={(e) => setEmiRate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">Loan Tenure (Months)</label>
                        <input type="number" value={emiTenure} onChange={(e) => setEmiTenure(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono text-white transition-all outline-none" />
                      </div>
                    </div>

                    {emiError && <div className="text-sm font-bold text-rose-400">{emiError}</div>}

                    {emiResult && (
                      <div className="p-5 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 space-y-3">
                         <div className="flex justify-between items-center pt-2 pb-4 border-b border-emerald-500/20">
                           <span className="text-sm font-bold text-white">Monthly EMI</span>
                           <span className="font-mono text-3xl font-black text-emerald-400">{formatCurrency(emiResult.emi)}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Principal</span>
                           <span className="font-mono font-bold text-white">{formatCurrency(parseFloat(emiPrincipal))}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                           <span className="text-xs font-mono uppercase text-slate-300">Total Interest</span>
                           <span className="font-mono font-bold text-amber-400">+{formatCurrency(emiResult.totalInterest)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                           <span className="text-xs font-mono uppercase text-slate-300">Total Payment</span>
                           <span className="font-mono font-bold text-white">{formatCurrency(emiResult.totalPayment)}</span>
                         </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button onClick={handleEMICalc} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer">Calculate</button>
                      <button onClick={resetForms} className="px-6 bg-[#060b08] hover:bg-[#12221a] text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-emerald-500/20 cursor-pointer">Clear</button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* History Sidebar */}
            <div className="bg-[#0c1611]/90 rounded-3xl shadow-2xl border border-emerald-500/20 p-5 flex flex-col max-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-emerald-500/15">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
                  <History className="w-4 h-4 text-emerald-400" />
                  History
                </h3>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-8 flex flex-col items-center gap-2">
                    <History className="w-8 h-8 opacity-20 text-emerald-400" />
                    No calculations yet.
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#060b08] rounded-xl border border-emerald-500/15">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 font-mono">{item.mode}</div>
                      <div className="text-xs text-slate-400 font-mono mb-1.5 break-all">{item.formula}</div>
                      <div className="text-sm font-bold text-white font-mono">{item.result}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
