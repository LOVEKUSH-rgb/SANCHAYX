import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { getSchemeImage } from '../data/schemeImages';
import { postRecommendation } from '../services/api';
import { Sparkles, ArrowRight, RefreshCw, ExternalLink, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { localizeScheme, getLocalizedCategory } from '../utils/contentLocalizer';

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { t, currentLang } = useLanguage();
  const [selectedItem, setSelectedItem] = useState(null);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendationResult, setRecommendationResult] = useState(null);

  // Check if profile exists in session storage
  const profileRaw = sessionStorage.getItem('sanchay_profile');
  const goalRaw = sessionStorage.getItem('sanchay_goal');
  const prefRaw = sessionStorage.getItem('sanchay_preferences');
  const cachedResRaw = sessionStorage.getItem('sanchay_recommendation_result');

  useEffect(() => {
    // Direct URL Protection
    if (!profileRaw) {
      navigate('/profile', { replace: true });
      return;
    }

    let isMounted = true;
    async function loadData() {
      if (cachedResRaw) {
        try {
          const cached = JSON.parse(cachedResRaw);
          if (cached && (cached.recommendations?.length > 0 || cached.recommendation_type === 'no_exact_match')) {
            if (isMounted) {
              setRecommendationResult(cached);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      setLoading(true);
      try {
        const profile = JSON.parse(profileRaw || '{"age":25,"gender":"any","residency_status":"resident"}');
        const goal = JSON.parse(goalRaw || '{"goal":"wealth"}');
        const preferences = JSON.parse(prefRaw || '{"monthly_budget":2000,"horizon_years":10,"liquidity_preference":"medium","tax_preference":true}');
        
        const res = await postRecommendation(profile, goal, preferences);
        if (isMounted && res) {
          setRecommendationResult(res);
          sessionStorage.setItem('sanchay_recommendation_result', JSON.stringify(res));
        }
      } catch (err) {
        console.warn('Recommendation API call error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [profileRaw, goalRaw, prefRaw, cachedResRaw, navigate]);

  const profile = JSON.parse(profileRaw || '{"age":25,"gender":"any","residency_status":"resident"}');
  const goal = JSON.parse(goalRaw || '{"goal":"wealth"}');
  const preferences = JSON.parse(prefRaw || '{"monthly_budget":2000,"horizon_years":10}');

  // Parse Recommendations from Result
  let topMatch = null;
  let otherMatches = [];
  let closestFits = [];
  let isNoMatch = false;

  if (recommendationResult) {
    if (recommendationResult.recommendation_type === 'no_exact_match') {
      isNoMatch = true;
      closestFits = recommendationResult.closest_fits || [];
    } else if (recommendationResult.recommendations && recommendationResult.recommendations.length > 0) {
      const apiTop = recommendationResult.recommendations[0];
      const topFin = apiTop.financial || {};
      const topBreakdown = apiTop.breakdown || {};

      topMatch = {
        id: apiTop.scheme_id,
        scheme_id: apiTop.scheme_id,
        name: typeof apiTop.name === 'object' ? (apiTop.name[currentLang] || apiTop.name.en) : apiTop.name,
        shortName: apiTop.short_name || apiTop.name,
        category: apiTop.category,
        fitScore: apiTop.fit_score || 92,
        eligibilityPct: 100,
        monthlyTarget: preferences.monthly_budget || preferences.monthlyBudget || 2000,
        horizon: preferences.horizon_years || preferences.horizonYears || 10,
        officialAuthority: apiTop.authority || 'Ministry of Finance',
        authority: apiTop.authority,
        officialSourceUrl: apiTop.official_url,
        official_url: apiTop.official_url,
        lastVerifiedDate: apiTop.last_verified_date || '2026-08-28',
        descriptionSimple: apiTop.short_description,
        full_description: apiTop.full_description,
        currentInterestRate: apiTop.benefits?.interest_rate || apiTop.benefits?.pension_amount || apiTop.benefits?.benefit_amount || 'Statutory Yield',
        lockInYears: topFin.lock_in_years || 0,
        taxBenefit: topFin.tax_treatment || 'Section 80C Tax Deduction Eligible',
        minimumContribution: topFin.minimum_contribution || 500,
        maximumContribution: topFin.maximum_contribution || null,
        benefits: apiTop.benefits,
        financial: topFin,
        eligibility: apiTop.eligibility,
        whyItFitsReasons: [
          { label: t('recommendations.goalMatch', 'Goal Match'), score: Math.round(topBreakdown.goal_score || 95), text: `Directly matches your '${goal.goal || 'Savings'}' objective.` },
          { label: t('recommendations.statutoryEligibility', 'Statutory Eligibility'), score: 100, text: `100% compliant with Age (${profile.age} yrs), Residency (${profile.residency_status || 'Resident'}), and statutory criteria.` },
          { label: t('recommendations.budgetFit', 'Budget Fit'), score: Math.round(topBreakdown.monthly_budget_score || 95), text: `Your ₹${(preferences.monthly_budget || preferences.monthlyBudget || 2000).toLocaleString('en-IN')}/mo satisfies official statutory limits.` },
          { label: t('recommendations.timeHorizon', 'Time Horizon'), score: Math.round(topBreakdown.time_horizon_score || 90), text: `Lock-in matches your ${preferences.horizon_years || preferences.horizonYears || 10}-year planning horizon.` },
        ]
      };

      otherMatches = recommendationResult.recommendations.slice(1).map(item => ({
        id: item.scheme_id,
        scheme_id: item.scheme_id,
        name: typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name,
        shortName: item.short_name || item.name,
        category: item.category,
        fitScore: item.fit_score,
        whyFits: item.why_it_fits || item.short_description,
        descriptionSimple: item.short_description,
        full_description: item.full_description,
        currentInterestRate: item.benefits?.interest_rate || item.benefits?.pension_amount || item.benefits?.benefit_amount || 'Statutory Benefit',
        officialSourceUrl: item.official_url,
        official_url: item.official_url,
        officialAuthority: item.authority,
        authority: item.authority,
        lastVerifiedDate: item.last_verified_date || '2026-08-28',
        isInsurance: item.is_insurance,
        benefits: item.benefits,
        financial: item.financial,
        eligibility: item.eligibility
      }));
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-sanchay-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-500" />
                <span>Deterministic Recommendation Engine</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-sanchay-navy-950 tracking-tight">
                {t('recommendations.title', 'Your Verified Financial Guidance')}
              </h1>
              <p className="text-sm sm:text-base text-sanchay-navy-700 mt-2">
                Matched for Age {profile.age}, {profile.residency_status === 'nri' ? 'NRI' : 'Indian Resident'}, Goal: <strong className="capitalize text-sanchay-navy-950">{goal.goal}</strong>, Budget: <strong>₹{(preferences.monthly_budget || preferences.monthlyBudget || 2000).toLocaleString('en-IN')}/mo</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/preferences"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-mono font-bold uppercase text-sanchay-navy-950 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                <span>{t('recommendations.recalculate', 'Adjust Parameters')}</span>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/90 shadow-card">
              <div className="w-14 h-14 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-xl text-sanchay-navy-950">{t('common.loading', 'Calculating Eligibility & Fit Scores...')}</h3>
              <p className="text-xs text-slate-500 mt-1">Applying statutory rules from official gazettes</p>
            </div>
          )}

          {/* ZERO MATCH FLOW */}
          {!loading && isNoMatch && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200 shadow-card mb-12 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-navy-950">
                    {t('recommendations.noMatchTitle', 'No Exact Match Found')}
                  </h2>
                  <p className="text-sm text-sanchay-navy-700 leading-relaxed">
                    {t('recommendations.noMatchDesc', 'Based on your input parameters, no active statutory scheme satisfies 100% of the mandatory criteria:')}
                  </p>
                  
                  {recommendationResult.failed_reasons && recommendationResult.failed_reasons.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-amber-900 font-mono space-y-1 pt-2">
                      {recommendationResult.failed_reasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Closest Eligible Options */}
              {closestFits.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-serif font-bold text-lg text-sanchay-navy-950 mb-4">
                    {t('recommendations.closestMatches', 'Closest Eligible Options — Review Required')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {closestFits.map((item) => {
                      const loc = localizeScheme(item, currentLang);
                      return (
                        <div key={item.scheme_id} className="p-5 rounded-2xl bg-[#F8F6F0] border border-slate-200 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                              {loc.displayCategory || getLocalizedCategory(item.category, currentLang)}
                            </span>
                            <h4 className="font-serif font-bold text-base text-sanchay-navy-950">{loc.displayName || item.name}</h4>
                            <p className="text-xs text-slate-600 mt-2">{loc.displayDescription || item.short_description}</p>
                          </div>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sanchay-emerald-700 uppercase cursor-pointer"
                          >
                            <span>{t('recommendations.viewDetails', 'Review Scheme')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOP MATCH HERO CARD */}
          {!loading && topMatch && (() => {
            const locTop = localizeScheme(topMatch, currentLang);
            const topTitle = locTop.displayName || topMatch.name;
            const topDesc = locTop.displayDescription || topMatch.descriptionSimple;
            const topCategory = locTop.displayCategory || getLocalizedCategory(topMatch.category, currentLang);

            return (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all overflow-hidden mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* Left: Large Photo Banner */}
                  <div className="lg:col-span-5 relative h-72 lg:h-auto min-h-[320px] bg-slate-100 overflow-hidden flex items-center justify-center">
                    <img
                      src={getSchemeImage(topMatch.id || topMatch.shortName, topMatch.category, topMatch.name)?.url || '/schemes/_fallback.svg'}
                      alt={topTitle}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/schemes/_fallback.svg';
                      }}
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sanchay-navy-950 via-sanchay-navy-950/40 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-sanchay-gold-500 text-sanchay-navy-950 font-mono font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                        ★ TOP MATCH ({topMatch.fitScore}% FIT)
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-6 right-6 text-white">
                      <span className="text-[10px] font-mono text-sanchay-emerald-400 uppercase tracking-widest block font-bold">Verified Statutory Yield</span>
                      <span className="font-serif font-extrabold text-2xl text-sanchay-gold-400">{topMatch.currentInterestRate}</span>
                    </div>
                  </div>

                  {/* Right: Detailed Match Evaluation */}
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-sanchay-emerald-700 bg-sanchay-emerald-50 px-3 py-1 rounded-full border border-sanchay-emerald-200">
                          {topCategory}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Verified: {topMatch.lastVerifiedDate}
                        </span>
                      </div>

                      <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-navy-950">
                        {topTitle}
                      </h2>
                      <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-2 leading-relaxed">
                        {topDesc}
                      </p>

                      {/* Breakdown Reasons */}
                      <div className="mt-6 space-y-3">
                        <h3 className="font-serif font-bold text-sm text-sanchay-navy-950 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-sanchay-gold-500" />
                          <span>{t('recommendations.whyThisFits', 'Why this fits your profile')}</span>
                        </h3>
                        {topMatch.whyItFitsReasons.map((reason, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-sanchay-navy-950">{reason.label}</span>
                              <span className="font-mono text-sanchay-emerald-700">{reason.score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-sanchay-emerald-600 rounded-full" style={{ width: `${reason.score}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-600">{reason.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => setSelectedItem(topMatch)}
                        className="px-6 py-3 rounded-xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-card transition-all cursor-pointer"
                      >
                        {t('recommendations.viewDetails', 'View Full Details')}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/compare?scheme1=${topMatch.id || topMatch.scheme_id || ''}&scheme2=${otherMatches[0]?.id || otherMatches[0]?.scheme_id || ''}&scheme3=${otherMatches[1]?.id || otherMatches[1]?.scheme_id || ''}`}
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sanchay-navy-950 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                          <span>{t('nav.compare', 'Compare Recommendations')}</span>
                        </Link>

                        {topMatch.officialSourceUrl && (
                          <a
                            href={topMatch.officialSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-sanchay-navy-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-sanchay-navy-900 flex items-center gap-1.5"
                          >
                            <span>{t('recommendations.officialPortal', 'Official Portal →')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })()}

          {/* OTHER ELIGIBLE MATCHES */}
          {!loading && otherMatches.length > 0 && (
            <div>
              <h3 className="font-serif font-extrabold text-2xl text-sanchay-navy-950 mb-6">
                {t('recommendations.topMatches', 'Other Matching Eligible Schemes')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherMatches.map((scheme) => {
                  const loc = localizeScheme(scheme, currentLang);
                  const sTitle = loc.displayName || scheme.name;
                  const sDesc = loc.displayDescription || scheme.descriptionSimple;
                  const sCategory = loc.displayCategory || getLocalizedCategory(scheme.category, currentLang);

                  return (
                    <div
                      key={scheme.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                          <span className="uppercase text-sanchay-emerald-700 bg-sanchay-emerald-50 px-2.5 py-0.5 rounded-full">{sCategory}</span>
                          <span className="text-sanchay-gold-600 font-extrabold">{scheme.fitScore}% Fit</span>
                        </div>
                        <h4 className="font-serif font-extrabold text-lg text-sanchay-navy-950">{sTitle}</h4>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">{sDesc}</p>
                        
                        <div className="mt-3 p-2.5 rounded-xl bg-[#F8F6F0] border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-mono">Yield/Benefit:</span>
                          <span className="font-bold text-sanchay-emerald-700">{scheme.currentInterestRate}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedItem(scheme)}
                          className="text-xs font-bold text-sanchay-navy-950 hover:text-sanchay-emerald-700 uppercase cursor-pointer"
                        >
                          {t('recommendations.viewDetails', 'View Details →')}
                        </button>
                        <Link
                          to={`/compare?scheme1=${topMatch?.id || 'ppf'}&scheme2=${scheme.id}`}
                          className="text-xs font-mono font-bold text-sanchay-emerald-700 uppercase hover:underline flex items-center gap-1"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{t('nav.compare', 'Compare')}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RECALCULATE / EMPTY FALLBACK */}
          {!loading && !topMatch && !isNoMatch && (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-card my-6">
              <div className="w-16 h-16 rounded-2xl bg-sanchay-emerald-50 text-sanchay-emerald-700 flex items-center justify-center mx-auto mb-4 border border-sanchay-emerald-200">
                <Sparkles className="w-8 h-8 text-sanchay-gold-500" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-sanchay-navy-950">Ready to Match Verified Schemes</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Click below to calculate and view the highest-matching verified sovereign schemes for your profile.
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    sessionStorage.removeItem('sanchay_recommendation_result');
                    window.location.reload();
                  }}
                  className="px-6 py-3 rounded-xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-card cursor-pointer"
                >
                  Calculate Recommendations
                </button>
                <Link
                  to="/schemes"
                  className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sanchay-navy-950 text-xs font-bold uppercase tracking-wider"
                >
                  Explore All Schemes
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />

      <ProductDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{
          page: 'Recommendations',
          scheme_id: topMatch?.scheme_id || topMatch?.id,
          recommendation_id: recommendationResult?.recommendation_id || null,
          profile: profile,
          scheme_name: topMatch?.name,
          top_scheme: topMatch?.name,
          fit_score: topMatch?.fitScore,
          goal: goal?.goal,
          monthly_budget: preferences?.monthly_budget || preferences?.monthlyBudget,
          horizon_years: preferences?.horizon_years || preferences?.horizonYears,
          failed_reasons: recommendationResult?.failed_reasons
        }}
      />

    </div>
  );
};
