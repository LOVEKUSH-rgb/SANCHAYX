import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { getSchemeImage } from '../data/schemeImages';
import { compareSchemes, fetchSchemes } from '../services/api';
import { ArrowLeft, ExternalLink, ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { useLanguage } from '../context/LanguageContext';
import { localizeScheme } from '../utils/contentLocalizer';

export const ComparePage = () => {
  const { t, currentLang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Try reading recommended schemes from session storage if URL params are empty
  const recRaw = sessionStorage.getItem('sanchay_recommendation_result');
  let recommendedIds = [];
  if (recRaw) {
    try {
      const parsed = JSON.parse(recRaw);
      if (parsed && parsed.recommendations) {
        recommendedIds = parsed.recommendations.map(r => r.scheme_id || r.id);
      }
    } catch (e) {}
  }

  const s1Param = searchParams.get('scheme1');
  const s2Param = searchParams.get('scheme2');
  const s3Param = searchParams.get('scheme3');

  const s1 = s1Param || recommendedIds[0] || 'ppf_001';
  const s2 = s2Param || recommendedIds[1] || 'ssy_001';
  const s3 = s3Param || recommendedIds[2] || 'scss_001';

  const [comparedData, setComparedData] = useState(null);
  const [catalogList, setCatalogList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  // Fetch full catalog for dynamic switching
  useEffect(() => {
    let isMounted = true;
    fetchSchemes({ limit: 200 }).then(data => {
      if (isMounted && data && data.schemes) {
        setCatalogList(data.schemes);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Fetch comparison data for current 3 schemes
  useEffect(() => {
    let isMounted = true;
    async function loadComparison() {
      setLoading(true);
      try {
        const idsToCompare = [s1, s2, s3].filter(Boolean);
        const res = await compareSchemes(idsToCompare);
        if (isMounted && res && res.items && res.items.length > 0) {
          setComparedData(res.items);
        }
      } catch (err) {
        console.warn('Compare API offline.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadComparison();
    return () => { isMounted = false; };
  }, [s1, s2, s3]);

  const handleSchemeChange = (index, newSchemeId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (index === 0) nextParams.set('scheme1', newSchemeId);
    if (index === 1) nextParams.set('scheme2', newSchemeId);
    if (index === 2) nextParams.set('scheme3', newSchemeId);
    setSearchParams(nextParams);
  };

  const displayItems = comparedData || [];

  const rows = [
    {
      key: 'eligibility',
      label: t('compare.eligibility', 'Statutory Eligibility'),
      getValue: (item) => item.eligibility_summary || 'Indian Citizens / Residents',
    },
    {
      key: 'goal',
      label: t('compare.goal', 'Goal Suitability'),
      getValue: (item) => item.goal_suitability || item.category || 'Savings & Growth',
    },
    {
      key: 'interest',
      label: t('compare.interestRate', 'Interest / Benefit Rate'),
      getValue: (item) => item.interest_or_benefit || item.currentInterestRate || 'Statutory Defined Benefit',
      highlight: true,
    },
    {
      key: 'minContribution',
      label: t('compare.minDeposit', 'Minimum Contribution'),
      getValue: (item) => item.minimum_contribution || '₹500',
    },
    {
      key: 'maxContribution',
      label: t('compare.maxDeposit', 'Maximum Contribution'),
      getValue: (item) => item.maximum_contribution || 'No statutory ceiling',
    },
    {
      key: 'lockIn',
      label: t('compare.lockIn', 'Lock-in / Tenure'),
      getValue: (item) => item.lock_in || 'Standard statutory tenure',
    },
    {
      key: 'liquidity',
      label: t('compare.liquidity', 'Liquidity & Premature Exit'),
      getValue: (item) => item.liquidity || item.withdrawal_rules || 'Permitted under official gazette rules',
    },
    {
      key: 'tax',
      label: t('compare.taxBenefit', 'Tax Treatment'),
      getValue: (item) => item.tax_treatment || 'Standard Income Tax Provisions',
    },
    {
      key: 'source',
      label: t('compare.officialPortal', 'Official Gazette Authority'),
      getValue: (item) => (
        <a
          href={item.official_url || 'https://india.gov.in'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sanchay-emerald-700 font-mono font-bold hover:underline uppercase text-[11px]"
        >
          <span>{item.authority || 'Government of India'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link to="/recommendations" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sanchay-emerald-700 uppercase tracking-wider hover:underline mb-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('goals.backBtn', 'Back to Recommendations')}</span>
              </Link>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950">
                {t('compare.title', 'Scheme Comparison Matrix')}
              </h1>
              <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-1">
                {t('compare.subtitle', 'Side-by-side comparison of verified statutory terms, yields, and liquidity rules across all 184 schemes.')}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider border border-sanchay-emerald-200 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('hero.statGazettes', 'Official Gazette Verified')}</span>
            </div>
          </div>

          {/* Matrix Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                
                {/* Column Headers (Scheme Names + Selector Dropdowns) */}
                <thead>
                  <tr className="border-b border-slate-200/90 bg-[#FAFAFC]">
                    <th className="p-6 w-1/4 min-w-[200px] text-xs font-mono font-bold uppercase text-slate-400">
                      {t('compare.parameter', 'Comparison Feature')}
                    </th>
                    {[s1, s2, s3].map((currentId, colIdx) => {
                      const item = displayItems[colIdx] || {};
                      const locItem = localizeScheme(item, currentLang);
                      const displayName = locItem.displayName || (typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : (item.name || `Scheme #${colIdx + 1}`));
                      const imgData = getSchemeImage(item.scheme_id || currentId, item.category, displayName);
                      
                      return (
                        <th key={colIdx} className="p-6 w-1/4 min-w-[240px] align-top">
                          <div className="space-y-3">
                            
                            {/* Scheme Quick Switcher Dropdown */}
                            {catalogList.length > 0 && (
                              <div className="relative">
                                <select
                                  value={item.scheme_id || currentId}
                                  onChange={(e) => handleSchemeChange(colIdx, e.target.value)}
                                  className="w-full text-xs font-bold text-sanchay-navy-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 appearance-none cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-sanchay-emerald-600 truncate"
                                >
                                  {catalogList.map((catItem) => {
                                    const cid = catItem.scheme_id || catItem.id;
                                    const cname = typeof catItem.name === 'object' ? (catItem.name[currentLang] || catItem.name.en) : (catItem.name || cid);
                                    return (
                                      <option key={cid} value={cid}>
                                        {catItem.short_name ? `${catItem.short_name} — ` : ''}{cname}
                                      </option>
                                    );
                                  })}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                              </div>
                            )}

                            <div className="h-28 w-full rounded-2xl overflow-hidden bg-slate-50 relative shadow-2xs flex items-center justify-center border border-slate-100">
                              <img
                                src={imgData?.url || '/schemes/_fallback.svg'}
                                alt={displayName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/schemes/_fallback.svg';
                                }}
                                className="w-full h-full object-contain p-2"
                              />
                              <div className="absolute bottom-1.5 left-2 right-2 text-sanchay-navy-950 font-mono font-bold text-[9px] uppercase truncate bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs">
                                {item.authority || 'Government of India'}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-mono font-bold text-sanchay-emerald-700 uppercase block">
                                {colIdx === 0 ? '★ TOP RECOMMENDATION' : `RECOMMENDED OPTION #${colIdx + 1}`}
                              </span>
                              <h3 className="font-serif font-bold text-base text-sanchay-navy-950 mt-0.5 leading-snug">
                                {displayName}
                              </h3>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body Rows */}
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-sanchay-navy-950 bg-[#FAFAFC]/70">
                        {row.label}
                      </td>
                      {[0, 1, 2].map((colIdx) => {
                        const item = displayItems[colIdx] || {};
                        return (
                          <td
                            key={colIdx}
                            className={`p-5 leading-relaxed ${
                              row.highlight
                                ? 'font-serif font-extrabold text-sm text-sanchay-emerald-700'
                                : 'text-sanchay-navy-700'
                            }`}
                          >
                            {row.getValue(item)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
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
        context={{
          page: 'Compare',
          scheme_ids: [s1, s2, s3],
          scheme_id: displayItems[0]?.scheme_id || s1
        }}
      />
    </div>
  );
};
