import React from 'react';
import { ShieldCheck, Sparkles, UserCheck, ArrowRight, X, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const FindMySchemesGateModal = ({ isOpen, onClose }) => {
  const { openAuthModal } = useAuth();
  const { t, currentLang } = useLanguage();

  if (!isOpen) return null;

  const handleLoginClick = () => {
    onClose();
    openAuthModal('login');
  };

  const handleRegisterClick = () => {
    onClose();
    openAuthModal('register');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020504]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[#0c1611] rounded-3xl shadow-2xl border border-emerald-500/25 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-[#060b08] to-[#0c1611] border-b border-emerald-500/15 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-emerald-950/60 text-slate-400 hover:text-white transition-all cursor-pointer border border-transparent hover:border-emerald-500/30"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <Lock className="w-5 h-5" />
          </div>

          <h3 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-white">
            {currentLang === 'hi' ? '2 निःशुल्क मूल्यांकन पूरे हुए' : 'Free Guest Evaluations Completed'}
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-1">
            {currentLang === 'hi'
              ? 'असीमित व्यक्तिगत योजना सिफारिशें प्राप्त करने और अपने प्लान सुरक्षित सहेजने के लिए कृपया लॉगिन करें या निःशुल्क खाता बनाएं।'
              : 'To calculate unlimited personalized scheme recommendations and save your custom plans, please log in or create your free account.'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
              <span className="w-5 h-5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span>{currentLang === 'hi' ? 'असीमित सटीक सरकारी योजना सिफारिशें' : 'Unlimited personalized scheme evaluations'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
              <span className="w-5 h-5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span>{currentLang === 'hi' ? 'योजनाओं को "My Plans" में सहेजें' : 'Save verified schemes to "My Plans"'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
              <span className="w-5 h-5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span>{currentLang === 'hi' ? '100% निःशुल्क और सरकारी राजपत्रों से सुरक्षित' : '100% free with sovereign data privacy'}</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={handleRegisterClick}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentLang === 'hi' ? 'निःशुल्क खाता बनाएं' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleLoginClick}
              className="w-full py-2.5 px-4 rounded-xl bg-[#08120d] hover:bg-[#101e17] text-slate-200 border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              <span>{currentLang === 'hi' ? 'मौजूदा खाता लॉगिन करें' : 'Log In to Existing Account'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
