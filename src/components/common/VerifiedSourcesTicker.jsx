import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const VerifiedSourcesTicker = () => {
  const { t } = useLanguage();

  const sources = [
    { name: 'Ministry of Finance', detail: t('ticker.smallSavings', 'Small Savings Directives') },
    { name: 'India Post & NSI', detail: t('ticker.postalSavings', 'Postal Savings & PPF Rules') },
    { name: 'LIC of India', detail: t('ticker.activePlans38', '38 Verified Active Plans') },
    { name: 'PFRDA', detail: t('ticker.pfrdaData', 'APY & NPS Statutory Data') },
    { name: 'Income Tax Dept', detail: t('ticker.taxRules', 'Sec 80C & 10(10D) Rules') },
    { name: 'myScheme / DBT', detail: t('ticker.freeBenefits22', '22+ Free Sovereign Benefits') },
  ];

  return (
    <div className="w-full bg-white border-y border-[#E7ECE8] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Editorial Header */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#176B50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#176B50] uppercase tracking-widest">
                  {t('ticker.trustFramework', 'TRUST FRAMEWORK')}
                </span>
              </div>
              <span className="text-xs font-bold text-[#202B26] uppercase tracking-wider block mt-0.5">
                {t('ticker.verifiedOfficialSources', 'Verified Official Sources')}
              </span>
            </div>
          </div>

          {/* Sources Ticker Pill Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full md:w-auto">
            {sources.map((src, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] shadow-2xs text-xs hover:border-[#176B50]/30 hover:bg-white hover:shadow-card transition-all duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-[#176B50] shrink-0" />
                <div>
                  <div className="font-bold text-[#202B26] leading-tight">{src.name}</div>
                  <div className="text-[10px] text-[#66736C] font-normal truncate mt-0.5">{src.detail}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
