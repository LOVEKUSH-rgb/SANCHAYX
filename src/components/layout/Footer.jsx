import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { currentLang, setCurrentLang, languages, t } = useLanguage();

  return (
    <footer className="w-full bg-white border-t border-[#E7ECE8] text-[#66736C] mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img
                alt="SANCHAY Brand Emblem"
                className="h-7 w-auto object-contain"
                src="/sanchay-brand-emblem.png"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/favicon.svg';
                }}
              />
              <span className="font-extrabold text-[#202B26] text-lg tracking-tight">SANCHAY</span>
              <span className="bg-[#E7F1EB] text-[#176B50] text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-[#D5E4DC]">
                CIVIC FINANCE
              </span>
            </div>
            <p className="text-xs text-[#66736C] max-w-sm leading-relaxed font-normal">
              Editorial discovery and sovereign yield intelligence for Indian citizens. Grounded in official Government of India gazettes, small savings directives, and direct statutory entitlements.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[#176B50] font-semibold text-[11px]">
                <span className="material-symbols-outlined text-[14px]">verified</span> Sovereign Program Index
              </span>
              <span className="text-[#D5E4DC]">•</span>
              <span className="text-[#66736C] text-[11px] font-medium">Citizen-First Architecture</span>
            </div>
          </div>

          {/* Schemes & Discovery */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[#202B26] uppercase tracking-wider font-bold text-[11px]">
              Schemes &amp; Discovery
            </span>
            <Link to="/schemes" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Public Provident Fund (PPF)
            </Link>
            <Link to="/schemes" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Sukanya Samriddhi Yojana
            </Link>
            <Link to="/schemes" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Mahila Samman Certificate
            </Link>
            <Link to="/schemes" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Senior Citizens Savings (SCSS)
            </Link>
            <Link to="/schemes" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              National Pension System (NPS)
            </Link>
          </div>

          {/* Tools & Calculators */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[#202B26] uppercase tracking-wider font-bold text-[11px]">
              Tools &amp; Calculators
            </span>
            <Link to="/calculator" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              PPF Maturity Estimator
            </Link>
            <Link to="/calculator" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Sukanya Samriddhi Calculator
            </Link>
            <Link to="/calculator" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              NPS Pension Modeler
            </Link>
            <Link to="/markets" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              Sovereign Gold Bond Yields
            </Link>
            <Link to="/lic" className="text-xs text-[#66736C] hover:text-[#176B50] transition-colors">
              PMJJBY &amp; PMSBY Guide
            </Link>
          </div>

          {/* Verified Official Portals & Language */}
          <div className="flex flex-col gap-3">
            <span className="text-[#202B26] uppercase tracking-wider font-bold text-[11px]">
              Verified Portals
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <a
                href="https://www.rbi.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#176B50] transition-colors inline-flex items-center gap-1.5 group text-[#66736C]"
              >
                <span>Reserve Bank of India</span>
                <ExternalLink className="w-3 h-3 text-[#66736C] group-hover:text-[#176B50] shrink-0" />
              </a>
              <a
                href="https://www.indiapost.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#176B50] transition-colors inline-flex items-center gap-1.5 group text-[#66736C]"
              >
                <span>India Post &amp; NSI</span>
                <ExternalLink className="w-3 h-3 text-[#66736C] group-hover:text-[#176B50] shrink-0" />
              </a>
              <a
                href="https://www.pfrda.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#176B50] transition-colors inline-flex items-center gap-1.5 group text-[#66736C]"
              >
                <span>PFRDA (NPS &amp; APY)</span>
                <ExternalLink className="w-3 h-3 text-[#66736C] group-hover:text-[#176B50] shrink-0" />
              </a>
              <a
                href="https://www.myscheme.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#176B50] transition-colors inline-flex items-center gap-1.5 group text-[#66736C]"
              >
                <span>myScheme Portal</span>
                <ExternalLink className="w-3 h-3 text-[#66736C] group-hover:text-[#176B50] shrink-0" />
              </a>
            </div>

            {/* Language Switcher in Footer */}
            <div className="pt-2">
              <span className="text-[#202B26] uppercase tracking-wider font-bold text-[10px] flex items-center gap-1 mb-2">
                <Globe className="w-3 h-3 text-[#176B50]" />
                <span>{t('nav.language', 'Language')}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {languages && languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] transition-all cursor-pointer font-medium ${
                      currentLang === lang.code
                        ? 'bg-[#176B50] text-white font-bold shadow-2xs'
                        : 'bg-[#FAFAFC] text-[#66736C] hover:text-[#202B26] hover:border-[#D5E4DC] border border-[#E7ECE8]'
                    }`}
                  >
                    <span>{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer Strip */}
        <div className="bg-[#FAFAFC] px-6 py-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#E7ECE8]">
          <p className="text-xs text-[#66736C] leading-relaxed max-w-4xl">
            <strong className="text-[#202B26] font-semibold">Statutory Disclaimer:</strong> SANCHAY is an independent citizen discovery and financial decision-support tool grounded in official Government of India gazettes. SANCHAY does not sell financial products or accept commissions. All demonstration data is illustrative. Always verify scheme parameters on official government portals before applying.
          </p>
          <div className="text-[#66736C] whitespace-nowrap shrink-0 text-[11px] font-medium">
            © 2026 SANCHAY. Republic of India.
          </div>
        </div>

      </div>
    </footer>
  );
};
