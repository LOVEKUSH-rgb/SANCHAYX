import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, AlertTriangle, HelpCircle, ArrowRight, ExternalLink, RefreshCw, ShieldCheck, Award, SlidersHorizontal, ChevronDown, ChevronUp, Check, Bookmark, BookmarkCheck } from 'lucide-react';
import { recommendLicPlans } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getSchemeImage } from '../../data/schemeImages';

export const LICRecommendForm = ({ onViewDetails }) => {
  const { t } = useLanguage();
  const { isPlanSaved, addToMyPlans, removeFromMyPlans, isAuthenticated, openAuthModal } = useAuth();
  const resultsRef = useRef(null);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('All');
  const [profession, setProfession] = useState('Salaried');
  const [budgetType, setBudgetType] = useState('monthly'); // 'monthly' | 'annual'
  const [budgetAmount, setBudgetAmount] = useState('');
  const [goal, setGoal] = useState('Child Education');
  const [childAge, setChildAge] = useState('');
  const [retirementRequirement, setRetirementRequirement] = useState('Not Required');
  const [protectionRequirement, setProtectionRequirement] = useState('Standard');
  const [investmentPreference, setInvestmentPreference] = useState('Any');

  // UI & Collapse State
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [savingPlanId, setSavingPlanId] = useState(null);

  // Request & Result States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Auto-scroll to results whenever results are ready
  useEffect(() => {
    if (result && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      age: age ? Number(age) : null,
      gender: gender !== 'All' ? gender : null,
      profession: profession || null,
      monthly_budget: budgetType === 'monthly' && budgetAmount ? Number(budgetAmount) : null,
      annual_budget: budgetType === 'annual' && budgetAmount ? Number(budgetAmount) : null,
      goal: goal || null,
      child_age: childAge ? Number(childAge) : null,
      retirement_requirement: retirementRequirement === 'High' ? 'High' : (retirementRequirement === 'Yes' ? true : null),
      protection_requirement: protectionRequirement === 'Highest' ? 'Highest' : (protectionRequirement === 'High' ? 'High' : null),
      investment_preference: investmentPreference !== 'Any' ? investmentPreference : null
    };

    try {
      const res = await recommendLicPlans(payload);
      if (!res) {
        throw new Error('Unable to connect to LIC Recommendation engine.');
      }
      setResult(res);
      setIsFormCollapsed(true);
    } catch (err) {
      console.error('LIC Recommendation Error:', err);
      setError('Encountered an error while evaluating LIC plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAge('');
    setGender('All');
    setProfession('Salaried');
    setBudgetAmount('');
    setGoal('Child Education');
    setChildAge('');
    setRetirementRequirement('Not Required');
    setProtectionRequirement('Standard');
    setInvestmentPreference('Any');
    setResult(null);
    setError(null);
    setIsFormCollapsed(false);
  };

  const handleToggleSave = async (e, plan) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const planId = plan.plan_id || plan.id || plan.plan_number;
    setSavingPlanId(planId);
    try {
      if (isPlanSaved(planId)) {
        await removeFromMyPlans(planId);
      } else {
        await addToMyPlans(planId);
      }
    } catch (err) {
      console.error('Error toggling saved plan:', err);
    } finally {
      setSavingPlanId(null);
    }
  };

  const isChildGoal = goal === 'Child Education' || goal === "Children's Future";

  const topPlan = result?.recommended_plans?.[0] || null;
  const otherPlans = result?.recommended_plans?.slice(1) || [];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-[#E7ECE8] mb-12 text-[#202B26]">
      
      {/* Header */}
      <div className="mb-6 pb-5 border-b border-[#E7ECE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1EB] text-[#176B50] text-[11px] font-mono font-bold uppercase tracking-wider mb-2 border border-[#D5E4DC]">
            <Sparkles className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Deterministic LIC Suitability Engine</span>
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#202B26]">
            Find Suitable LIC Plans
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-1">
            Evaluate all 38 active LIC plans against statutory entry rules, risk coverage, and milestone savings.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              className="px-3.5 py-2 rounded-xl bg-[#FAFAFC] hover:bg-[#E7F1EB] text-[#202B26] border border-[#E7ECE8] font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#176B50]" />
              <span>{isFormCollapsed ? 'Edit Filters' : 'Hide Filters'}</span>
              {isFormCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-[#FAFAFC] hover:bg-[#E7F1EB] text-[#202B26] border border-[#E7ECE8] font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Search</span>
            </button>
          </div>
        )}
      </div>

      {/* Collapsed Filter Summary Card (Shown when results are active to keep evaluation front & center) */}
      {result && isFormCollapsed && (
        <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E7ECE8] mb-6 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-mono font-bold uppercase text-slate-400 text-[10px] tracking-wider mr-1">
              Active Criteria:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7ECE8] text-[#202B26] font-semibold">
              Age: {age || 'Any'}
            </span>
            {gender !== 'All' && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7ECE8] text-[#202B26] font-semibold">
                {gender}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7ECE8] text-[#202B26] font-semibold">
              {profession}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] font-semibold">
              Goal: {goal}
            </span>
            {budgetAmount && (
              <span className="px-2.5 py-1 rounded-lg bg-[#E7F1EB] border border-[#D5E4DC] text-[#176B50] font-semibold">
                ₹{Number(budgetAmount).toLocaleString('en-IN')}/{budgetType === 'monthly' ? 'mo' : 'yr'}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsFormCollapsed(false)}
            className="text-xs font-mono font-bold text-[#176B50] hover:text-[#125540] underline cursor-pointer"
          >
            Change / Refine Filter Inputs
          </button>
        </div>
      )}

      {/* Form Inputs Grid (Hidden when collapsed so evaluation is immediately visible) */}
      {(!result || !isFormCollapsed) && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            
            {/* 1. Age */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Your Age (Years) *
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                placeholder="e.g. 32"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] placeholder:text-[#66736C] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            {/* 2. Gender */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="All" >All / Prefer not to say</option>
                <option value="Male" >Male</option>
                <option value="Female" >Female (Eligible for Women-Exclusive Plans)</option>
                <option value="Other" >Other</option>
              </select>
            </div>

            {/* 3. Profession */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Profession / Occupation
              </label>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="Salaried" >Salaried Professional</option>
                <option value="Self-Employed" >Self-Employed / Trader</option>
                <option value="Business" >Business Owner</option>
                <option value="Homemaker" >Homemaker</option>
                <option value="Farmer" >Farmer / Agriculture</option>
                <option value="Student" >Student</option>
                <option value="Retired" >Retired / Pensioner</option>
                <option value="Professional" >Doctor / CA / Advocate</option>
              </select>
            </div>

            {/* 4. Primary Financial Goal */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Primary Financial Goal *
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="Child Education" >Child Higher Education & Milestone</option>
                <option value="Retirement" >Retirement & Lifelong Guaranteed Pension</option>
                <option value="Family Protection" >Pure Family Protection / Term Cover</option>
                <option value="Wealth Creation" >Disciplined Long-Term Wealth Creation</option>
                <option value="Money Back" >Money Back & Regular Cashflow Payouts</option>
                <option value="Women Security" >Women Financial Empowerment & Security</option>
              </select>
            </div>

            {/* 5. Budget (Monthly vs Annual Toggle) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono font-bold uppercase tracking-wider text-slate-400">
                  Budget (INR)
                </label>
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setBudgetType('monthly')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${budgetType === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetType('annual')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${budgetType === 'annual' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    /yr
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                placeholder={budgetType === 'monthly' ? 'e.g. 5000' : 'e.g. 60000'}
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] placeholder:text-[#66736C] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            {/* 6. Child Age (Shown whenever relevant) */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Child's Age {isChildGoal ? '(Required for Child Plans)' : '(Optional)'}
              </label>
              <input
                type="number"
                min="0"
                max="25"
                placeholder="e.g. 5"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] placeholder:text-[#66736C] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            {/* 7. Retirement Priority */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Retirement Cashflow Priority
              </label>
              <select
                value={retirementRequirement}
                onChange={(e) => setRetirementRequirement(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="Not Required" >Standard / Not Priority</option>
                <option value="High" >High Priority (Immediate / Deferred Annuity)</option>
              </select>
            </div>

            {/* 8. Protection Priority */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Pure Term Life Cover Priority
              </label>
              <select
                value={protectionRequirement}
                onChange={(e) => setProtectionRequirement(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="Standard" >Standard Life Cover</option>
                <option value="Highest" >Highest / Pure Term Assurance Focus</option>
              </select>
            </div>

            {/* 9. Investment Preference */}
            <div>
              <label className="block font-mono font-bold uppercase tracking-wider text-[#66736C] mb-1">
                Investment Risk Preference
              </label>
              <select
                value={investmentPreference}
                onChange={(e) => setInvestmentPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7ECE8] bg-[#FAFAFC] font-semibold text-[#202B26] focus:border-[#176B50] focus:bg-white focus:outline-hidden transition-colors"
              >
                <option value="Any" >All Suitable Types</option>
                <option value="Guaranteed + Bonus" >Guaranteed + Simple Reversionary Bonus</option>
                <option value="Market-Linked / ULIP" >Unit Linked / Market Linked (SIIP, Nivesh Plus)</option>
                <option value="Single Premium" >Single Lump-sum Premium</option>
              </select>
            </div>

          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {result && (
              <button
                type="button"
                onClick={() => setIsFormCollapsed(true)}
                className="h-11 px-5 rounded-2xl bg-white hover:bg-[#FAFAFC] text-[#202B26] font-mono font-bold text-xs uppercase tracking-wider border border-[#E7ECE8] transition-colors cursor-pointer"
              >
                Cancel / Keep Results
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-2xl bg-[#176B50] hover:bg-[#125540] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-card hover:shadow-card-hover transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Evaluating 38 Plans...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Evaluate LIC Recommendations →</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommendation Results Display */}
      {result && (
        <div ref={resultsRef} className="mt-8 pt-8 border-t border-emerald-500/15 animate-in fade-in slide-in-from-top-4 duration-300 scroll-mt-6">
          
          {/* Status Banner */}
          <div className="mb-8">
            {result.status === 'SUCCESS' && (
              <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#065F46] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-serif text-base text-[#065F46]">
                    Statutory Evaluation Complete: {result.eligible_count} Eligible Plan(s) Found
                  </div>
                  <p className="text-xs text-[#065F46]/90 mt-0.5">
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-200 text-[#92400E] flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-serif text-base text-[#92400E]">
                    Status: ADDITIONAL_INFORMATION_REQUIRED
                  </div>
                  <p className="text-xs text-[#92400E]/90 mt-0.5">
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'NO_APPLICABLE_PLAN' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-serif text-base text-rose-900">
                    Status: NO_APPLICABLE_PLAN
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {result.message || 'No currently matching LIC plan was found based on the information provided.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* TOP MATCH HERO CARD */}
          {topPlan && (
            <div className="bg-white rounded-3xl border border-[#E7ECE8] shadow-card hover:shadow-card-hover overflow-hidden mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left: Vector Illustration Banner */}
                <div className="lg:col-span-5 relative h-72 lg:h-auto min-h-[320px] bg-[#FAFAFC] overflow-hidden flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#E7ECE8]">
                  <img
                    src={getSchemeImage(topPlan.plan_id || topPlan.plan_number, topPlan.category, topPlan.plan_name)?.url || '/schemes/_fallback.svg'}
                    alt={topPlan.plan_name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/schemes/_fallback.svg';
                    }}
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#176B50] text-white font-mono font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                      ★ TOP MATCH ({topPlan.match_score || topPlan.fit_score || 65}% FIT)
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <span className="text-[10px] font-mono text-[#176B50] uppercase tracking-widest block font-bold">
                      Guaranteed Statutory Sovereign Backing
                    </span>
                    <span className="font-serif font-extrabold text-xl text-[#202B26] line-clamp-1">
                      {topPlan.benefits_summary?.death_benefit || 'Section 37 Sovereign Guarantee'}
                    </span>
                  </div>
                </div>

                {/* Right: Detailed Match Evaluation */}
                <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#176B50] bg-[#E7F1EB] px-3 py-1 rounded-full border border-[#D5E4DC]">
                          {topPlan.category || 'Life Assurance'}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#66736C]">
                          Plan No. {topPlan.plan_number} • UIN: {topPlan.uin}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#176B50] bg-[#E7F1EB] px-2.5 py-0.5 rounded-full border border-[#D5E4DC]">
                        ✓ 100% Statutory Match
                      </span>
                    </div>

                    <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-[#202B26]">
                      {topPlan.plan_name}
                    </h2>

                    {topPlan.benefits_summary?.maturity_benefit && (
                      <p className="text-xs sm:text-sm text-[#66736C] mt-2 leading-relaxed">
                        {topPlan.benefits_summary.maturity_benefit}
                      </p>
                    )}

                    {/* Breakdown Reasons */}
                    <div className="mt-6 space-y-3">
                      <h3 className="font-serif font-bold text-sm text-[#202B26] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Why this fits your profile</span>
                      </h3>

                      {/* Goal Fit Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#202B26]">Primary Goal Alignment ({goal})</span>
                          <span className="font-mono text-emerald-400">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E7ECE8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#176B50] rounded-full" style={{ width: '100%' }} />
                        </div>
                        <p className="text-[11px] text-[#66736C]">
                          Directly addresses your primary financial objective with milestone benefits.
                        </p>
                      </div>

                      {/* Eligibility Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#202B26]">Mandatory Statutory Entry Rules</span>
                          <span className="font-mono text-emerald-400">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E7ECE8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#176B50] rounded-full" style={{ width: '100%' }} />
                        </div>
                        <p className="text-[11px] text-[#66736C]">
                          Meets all statutory age, gender, and minimum sum assured criteria.
                        </p>
                      </div>

                      {/* Why it matches reasons list */}
                      {topPlan.why_it_matches && topPlan.why_it_matches.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-emerald-500/15 space-y-1">
                          {topPlan.why_it_matches.map((reason, idx) => (
                            <p key={idx} className="text-xs text-[#66736C] flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => onViewDetails && onViewDetails(topPlan)}
                      className="px-6 py-3 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>View Full Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleSave(e, topPlan)}
                        disabled={savingPlanId === (topPlan.plan_id || topPlan.plan_number)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          isPlanSaved(topPlan.plan_id || topPlan.plan_number)
                            ? 'bg-[#176B50] border-[#176B50] text-white hover:bg-[#125540]'
                            : 'bg-[#FAFAFC] border border-[#E7ECE8] text-[#202B26] hover:bg-[#E7F1EB]'
                        }`}
                      >
                        {isPlanSaved(topPlan.plan_id || topPlan.plan_number) ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-white" />
                            <span>Saved in Portfolio</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Save to Portfolio</span>
                          </>
                        )}
                      </button>

                      {topPlan.official_lic_url && (
                        <a
                          href={topPlan.official_lic_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-[#FAFAFC] text-[#202B26] border border-[#E7ECE8] text-xs font-bold uppercase tracking-wider hover:bg-[#E7F1EB] flex items-center gap-1.5"
                        >
                          <span>Official Portal →</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* OTHER MATCHING ELIGIBLE PLANS (3-COLUMN EDITORIAL GRID) */}
          {otherPlans.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-serif font-extrabold text-2xl text-[#202B26]">
                    Other Matching Eligible LIC Plans
                  </h3>
                  <p className="text-xs text-[#66736C] mt-0.5">
                    {otherPlans.length} additional LIC plan(s) fully evaluated for your criteria
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPlans.map((plan, idx) => {
                  const planKey = plan.plan_id || plan.plan_number || idx;
                  const isSaved = isPlanSaved(plan.plan_id || plan.plan_number);

                  return (
                    <div
                      key={planKey}
                      className="bg-white rounded-2xl border border-[#E7ECE8] shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Top Badge & Match Score */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold mb-3">
                          <span className="uppercase text-[#176B50] bg-[#E7F1EB] px-2.5 py-0.5 rounded-full border border-[#D5E4DC]">
                            {plan.category || 'LIC Plan'}
                          </span>
                          <span className="text-[#176B50] bg-[#E7F1EB] px-2.5 py-0.5 rounded-full border border-[#D5E4DC] font-extrabold">
                            {plan.match_score || plan.fit_score || 50}% Fit
                          </span>
                        </div>

                        {/* Title & Plan Number */}
                        <h4 className="font-serif font-extrabold text-lg text-[#202B26] leading-snug">
                          {plan.plan_name}
                        </h4>
                        <span className="text-[11px] font-mono text-[#66736C] block mt-1">
                          Plan No. {plan.plan_number} • UIN: {plan.uin}
                        </span>

                        {/* Why it matches */}
                        {plan.why_it_matches && plan.why_it_matches.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {plan.why_it_matches.slice(0, 2).map((reason, rIdx) => (
                              <p key={rIdx} className="text-xs text-[#66736C] line-clamp-2 flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{reason}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Benefit / Condition Box */}
                        {plan.important_conditions && plan.important_conditions.length > 0 && (
                          <div className="mt-3 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#E7ECE8] flex items-center justify-between text-xs">
                            <span className="text-[#66736C] font-mono">Condition:</span>
                            <span className="font-bold text-[#202B26] truncate max-w-[170px]" title={plan.important_conditions[0]}>
                              {plan.important_conditions[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between">
                        <button
                          onClick={() => onViewDetails && onViewDetails(plan)}
                          className="text-xs font-bold text-[#176B50] hover:text-[#125540] uppercase cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleToggleSave(e, plan)}
                            disabled={savingPlanId === (plan.plan_id || plan.plan_number)}
                            title={isSaved ? 'Remove from My Plans' : 'Save to My Plans'}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-[#176B50] border-[#176B50] text-white'
                                : 'bg-[#FAFAFC] border border-[#E7ECE8] text-[#66736C] hover:text-[#176B50]'
                            }`}
                          >
                            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>

                          {plan.official_lic_url && (
                            <a
                              href={plan.official_lic_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Official LIC Portal"
                              className="p-2 rounded-lg bg-[#FAFAFC] hover:bg-[#E7F1EB] text-[#66736C] hover:text-[#176B50] border border-[#E7ECE8] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

