import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, PiggyBank, Briefcase, GraduationCap, Home, TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNormalizedProducts } from '../../services/productIntelligence';
import { calculateCompatibility } from '../../services/discoveryEngine';
import { ProductExplorerModal } from './ProductExplorerModal';

export const FinancialDiscoveryWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    amount: '',
    monthly: '',
    horizon: '',
    risk: ''
  });
  
  const [explorerCategory, setExplorerCategory] = useState(null);
  const [explorerTitle, setExplorerTitle] = useState('');

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const goals = [
    { id: 'emergency', label: 'Emergency Fund', icon: <PiggyBank className="w-6 h-6" /> },
    { id: 'retirement', label: 'Retirement', icon: <Briefcase className="w-6 h-6" /> },
    { id: 'education', label: 'Child Education', icon: <GraduationCap className="w-6 h-6" /> },
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'wealth', label: 'Wealth Building', icon: <TrendingUp className="w-6 h-6" /> },
    { id: 'short_term', label: 'Short-Term Goal', icon: <Clock className="w-6 h-6" /> }
  ];

  const horizons = [
    { id: '<1', label: '< 1 year' },
    { id: '1-3', label: '1–3 years' },
    { id: '3-5', label: '3–5 years' },
    { id: '5-10', label: '5–10 years' },
    { id: '10+', label: '10+ years' }
  ];

  const risks = [
    { id: 'low', label: 'Low', desc: 'I prefer stability and lower fluctuation.' },
    { id: 'moderate', label: 'Moderate', desc: 'I can accept some fluctuation for growth potential.' },
    { id: 'high', label: 'High', desc: 'I can accept significant market fluctuation.' }
  ];



  const renderStep1 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">What are you saving/investing for?</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {goals.map(g => (
          <button
            key={g.id}
            onClick={() => { setFormData({...formData, goal: g.id}); handleNext(); }}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${
              formData.goal === g.id 
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-lg shadow-emerald-950/40' 
                : 'border-emerald-500/20 bg-[#0c1611]/90 hover:border-emerald-400/50 text-white'
            }`}
          >
            <div className={`${formData.goal === g.id ? 'text-emerald-400' : 'text-slate-400'}`}>
              {g.icon}
            </div>
            <span className="font-bold text-sm text-center">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">How much are you planning?</h3>
      <div className="max-w-md mx-auto space-y-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Initial Amount (₹)</label>
          <input 
            type="number" 
            placeholder="e.g. 50000"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all font-bold"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Monthly Contribution (Optional ₹)</label>
          <input 
            type="number" 
            placeholder="e.g. 5000"
            value={formData.monthly}
            onChange={(e) => setFormData({...formData, monthly: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-emerald-500/25 bg-[#060b08] text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all font-bold"
          />
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-bold transition-colors cursor-pointer">Back</button>
        <button onClick={handleNext} disabled={!formData.amount} className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-emerald-950/50">Continue</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">When might you need the money?</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {horizons.map(h => (
          <button
            key={h.id}
            onClick={() => { setFormData({...formData, horizon: h.id}); handleNext(); }}
            className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
              formData.horizon === h.id 
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold' 
                : 'border-emerald-500/20 bg-[#0c1611]/90 hover:border-emerald-400/50 text-white font-medium'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-bold transition-colors cursor-pointer">Back</button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">How comfortable are you with market fluctuations?</h3>
      <div className="max-w-2xl mx-auto space-y-4 mb-8">
        {risks.map(r => (
          <button
            key={r.id}
            onClick={() => { setFormData({...formData, risk: r.id}); handleNext(); }}
            className={`w-full p-5 rounded-2xl border-2 flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${
              formData.risk === r.id 
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-lg shadow-emerald-950/40' 
                : 'border-emerald-500/20 bg-[#0c1611]/90 hover:border-emerald-400/50 text-white'
            }`}
          >
            <span className={`font-bold text-lg ${formData.risk === r.id ? 'text-emerald-400' : 'text-white'}`}>{r.label}</span>
            <span className="text-slate-400 text-sm">{r.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-bold transition-colors cursor-pointer">Back</button>
      </div>
    </div>
  );

  const renderResult = () => {
    const products = getNormalizedProducts();
    const results = calculateCompatibility(formData, products);
    
    const getMatchDetails = (score) => {
      if (score >= 85) return { label: 'Strong Structural Match', color: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40' };
      if (score >= 70) return { label: 'Good Structural Match', color: 'text-sky-300 bg-sky-950/80 border-sky-500/40' };
      if (score >= 50) return { label: 'Partial Structural Match', color: 'text-amber-300 bg-amber-950/80 border-amber-500/40' };
      return { label: 'Limited Structural Match', color: 'text-slate-300 bg-[#08120d] border-emerald-500/20' };
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-serif font-extrabold text-white mb-2">Discovery Results</h3>
          <p className="text-slate-400">Based on your inputs, here is how different categories and schemes align with your profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {results.map((res, idx) => (
            <div key={idx} className="bg-[#0c1611]/90 rounded-2xl p-6 shadow-2xl border border-emerald-500/20 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4 gap-4">
                <h4 className="text-xl font-serif font-bold text-white">{res.title}</h4>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border text-center ${getMatchDetails(res.score).color}`}>
                    {res.score === -1 ? 'Incompatible' : getMatchDetails(res.score).label}
                  </span>
                </div>
              </div>

              <div className="mb-5 bg-[#08120d] p-4 rounded-xl border border-emerald-500/15 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Educational Notice:</strong> This is a structural match based on the preferences you entered. This is an educational comparison, not investment advice or a recommendation to buy or sell.
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3">
                  <Target className="w-3.5 h-3.5" />
                  Why this appears
                </div>
                <ul className="space-y-2 mb-6">
                  {res.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-4 border-t border-emerald-500/15 mt-auto">
                <button 
                  onClick={() => {
                    setExplorerCategory(res.id);
                    setExplorerTitle(res.title);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Explore {res.title} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="md:col-span-2 text-center py-10 bg-[#0c1611]/90 rounded-2xl border border-emerald-500/20">
              <p className="text-slate-400">No strong matches found. Try adjusting your inputs or starting with Government Schemes.</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => {
              setStep(1);
              setFormData({ goal: '', amount: '', monthly: '', horizon: '', risk: '' });
            }} 
            className="px-6 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-bold transition-colors cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="py-20 bg-[#060b08] text-slate-100 relative border-b border-emerald-500/15" id="discovery-wizard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress indicator */}
        {step < 5 && (
          <div className="max-w-md mx-auto mb-10 flex items-center justify-between">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= num ? 'bg-emerald-600 text-white' : 'bg-[#0c1611] text-slate-400 border border-emerald-500/20'
                }`}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`w-12 h-1 mx-2 rounded-full transition-colors ${
                    step > num ? 'bg-emerald-600' : 'bg-[#0c1611]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderResult()}
        </div>
      </div>
      
      <ProductExplorerModal 
        categoryId={explorerCategory}
        categoryTitle={explorerTitle}
        onClose={() => {
          setExplorerCategory(null);
          setExplorerTitle('');
        }}
      />
    </section>
  );
};
