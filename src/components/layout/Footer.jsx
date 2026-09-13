import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { ShieldCheck, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { currentLang, setCurrentLang, languages, t } = useLanguage();

  return (
    <footer className="bg-sanchay-navy-950 text-white border-t border-sanchay-navy-800/80 pt-16 pb-12 relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-sanchay-emerald-500/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-sanchay-navy-850">
          
          {/* Brand & Mission Column (4 Columns) */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="inline-block transition-transform hover:scale-[1.02]">
              <Logo size="md" />
            </Link>
            <p className="text-xs text-slate-300/90 max-w-sm leading-relaxed font-sans">
              {t('footer.brandDesc', 'SANCHAY is India’s sovereign scheme guidance platform. Grounded exclusively in official gazettes and deterministic rule engines.')}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-emerald-950/70 border border-sanchay-emerald-800/80 text-sanchay-emerald-400 font-mono text-[10.5px] uppercase tracking-wider shadow-inner-soft">
              <ShieldCheck className="w-3.5 h-3.5 text-sanchay-emerald-400" />
              <span className="font-bold">100% Official Gazette Data</span>
            </div>
          </div>

          {/* Navigation Links (2 Columns) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-sanchay-gold-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sanchay-gold-500 inline-block"></span>
              {t('footer.quickLinks', 'Quick Links')}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">Home</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">{t('nav.findMySchemes', 'Find My Schemes')}</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">{t('nav.compare', 'Compare')}</Link>
              </li>
              <li>
                <Link to="/lic" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">{currentLang === 'hi' ? 'LIC योजनाएं' : 'LIC Plans'}</Link>
              </li>
              <li>
                <Link to="/free-benefits" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">{currentLang === 'hi' ? 'मुफ्त लाभ व योजनाएं' : 'Free Benefits & Assistance'}</Link>
              </li>
              <li>
                <Link to="/sources" className="hover:text-sanchay-emerald-400 transition-colors inline-block hover:translate-x-0.5">{t('nav.sources', 'Official Sources')}</Link>
              </li>
            </ul>
          </div>

          {/* Official Sources Column (3 Columns) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-sanchay-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sanchay-emerald-400" />
              <span>
                {currentLang === 'hi' ? 'आधिकारिक स्रोत (Links)' :
                 currentLang === 'mr' ? 'अधिकृत स्रोत (Links)' :
                 currentLang === 'bn' ? 'অফিসিয়াল উৎস (Links)' :
                 currentLang === 'te' ? 'అధికారిక మూలాలు (Links)' :
                 'Official Sources (Links)'}
              </span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a
                  href="https://egazette.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">The Gazette of India</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.indiapost.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">India Post (Small Savings)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.pfrda.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">PFRDA (NPS & APY)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.myscheme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">myScheme Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.licindia.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">LIC Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmjay.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sanchay-emerald-400 transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 group"
                >
                  <span className="truncate">Ayushman Bharat (PM-JAY)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sanchay-emerald-400 shrink-0 transition-colors" />
                </a>
              </li>
              <li className="pt-1">
                <Link
                  to="/sources"
                  className="text-[11px] text-sanchay-emerald-400 hover:text-sanchay-emerald-300 font-mono inline-flex items-center gap-1 hover:underline"
                >
                  <span>{currentLang === 'hi' ? 'सभी 9+ आधिकारिक स्रोत देखें →' : 'View All 9+ Sources →'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Language Switcher in Footer (3 Columns) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-sanchay-gold-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{t('nav.language', 'Language')}</span>
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                    currentLang === lang.code
                      ? 'bg-sanchay-emerald-600 text-white font-bold shadow-card ring-1 ring-emerald-400'
                      : 'bg-sanchay-navy-900/90 text-slate-300 hover:text-white hover:bg-sanchay-navy-850 border border-sanchay-navy-800'
                  }`}
                >
                  <span>{lang.native}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Switch languages anytime. Recommendations, calculations, and eligibility remain 100% consistent.
            </p>
          </div>

        </div>

        {/* Legal & Educational Disclaimer */}
        <div className="pt-8 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-sanchay-navy-900/70 border border-sanchay-navy-800/90 text-[11px] text-slate-300/90 leading-relaxed shadow-sm">
            <strong className="text-white font-bold block mb-1 tracking-wide">
              {t('footer.legal', 'Educational Guidance Disclaimer')}:
            </strong>
            {t('footer.disclaimer', 'Educational Guidance Disclaimer: SANCHAY is an independent educational technology platform grounded in official Government of India gazettes. SANCHAY is not a registered financial intermediary, broker, or depository. All interest rates and rules are subject to statutory government notifications.')}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 pt-2 gap-2">
            <span>{t('footer.copyright', '© 2026 SANCHAY. All rights reserved. Grounded in Official Indian Gazettes.')}</span>
            <span className="text-sanchay-emerald-400/90 font-semibold">Single Source of Truth: Verified Gazette Master</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

