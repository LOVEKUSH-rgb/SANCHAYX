import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { useLanguage } from '../context/LanguageContext';

export const SourcesPage = () => {
  const { t } = useLanguage();
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  
  const sourcesList = [
    {
      authority: 'Ministry of Finance',
      scope: 'Official notified small-savings scheme interest rates and policy rules.',
      url: 'https://www.finmin.nic.in',
      frequency: 'Quarterly Revisions',
    },
    {
      authority: 'National Savings Institute / India Post',
      scope: 'Scheme eligibility, contribution caps, and withdrawal details.',
      url: 'https://www.indiapost.gov.in',
      frequency: 'Continuous Validation',
    },
    {
      authority: 'Pension Fund Regulatory & Development Authority (PFRDA)',
      scope: 'Atal Pension Yojana (APY) and National Pension System (NPS) guidelines.',
      url: 'https://www.pfrda.org.in',
      frequency: 'Monthly Sync',
    },
    {
      authority: 'Life Insurance Corporation of India (LIC)',
      scope: 'Statutory life assurance, pension annuity, ULIP, and micro-insurance plan gazettes (IRDAI Reg. 512).',
      url: 'https://www.licindia.in',
      frequency: 'IRDAI Gazette Alignment',
    },
    {
      authority: 'Income Tax Department',
      scope: 'Section 80C, 80CCD tax deduction rules and tax-free status provisions.',
      url: 'https://www.incometax.gov.in',
      frequency: 'Annual Finance Act Sync',
    },
    {
      authority: 'myScheme & Direct Benefit Transfer (DBT) Mission',
      scope: '100% Free Sovereign Benefits, direct welfare assistance, educational stipends, and zero-broker citizen schemes.',
      url: 'https://www.myscheme.gov.in',
      frequency: 'Continuous Gazette Alignment',
    },
    {
      authority: 'National Health Authority (Ayushman Bharat PM-JAY)',
      scope: '₹5 Lakh annual cashless sovereign family health insurance, free treatment, and Ayushman Card eligibility rules.',
      url: 'https://pmjay.gov.in',
      frequency: 'Statutory Health Gazette Sync',
    },
    {
      authority: 'Department of Food & Public Distribution (NFSA / PM-GKAY)',
      scope: 'Free food grains, Pradhan Mantri Garib Kalyan Anna Yojana, and National Food Security statutory directives.',
      url: 'https://nfsa.gov.in',
      frequency: 'Central Directives Alignment',
    },
    {
      authority: 'Ministry of New & Renewable Energy (PM Surya Ghar: Muft Bijli)',
      scope: 'Up to 300 units free monthly solar electricity and verified capital rooftop subsidy guidelines.',
      url: 'https://pmsuryaghar.gov.in',
      frequency: 'National Portal Directives',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-sanchay-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('trust.badge', 'Data Governance & Verification')}</span>
            </div>
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950">
              {t('sources.title', 'Official Data Sources & Transparency')}
            </h1>
            <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-2">
              {t('sources.subtitle', 'Every scheme displayed in SANCHAY is traced directly to official government gazettes.')}
            </p>
          </div>

          <div className="space-y-4 mb-10">
            {sourcesList.map((src, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white shadow-card hover:shadow-editorial border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600" />
                    <h3 className="font-serif font-bold text-lg text-sanchay-navy-950">
                      {src.authority}
                    </h3>
                  </div>
                  <p className="text-xs text-sanchay-navy-700 mt-1">
                    {src.scope}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {t('sources.updateFrequency', 'Update Frequency')}: {src.frequency}
                  </span>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider shrink-0 inline-flex items-center gap-2 transition-colors"
                >
                  <span>{t('sources.officialPortal', 'Official Portal →')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-3xl bg-sanchay-emerald-50 border border-sanchay-emerald-200 text-xs text-sanchay-navy-950 leading-relaxed">
            <span className="font-serif font-bold text-sanchay-emerald-700 block text-base mb-1">Strict Governance Promise:</span>
            {t('sources.governancePromise', 'Every scheme record in SANCHAY must include an official source link, effective date, and last verification date. Zero unverified commercial schemes are permitted.')}
          </div>

        </div>
      </main>

      <Footer />

      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{ page: 'Sources' }}
      />
    </div>
  );
};
