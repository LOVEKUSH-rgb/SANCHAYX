import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { evaluateFreeBenefitEligibility } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const FreeBenefitEligibilityModal = ({ benefit, isOpen, onClose, onViewDetails }) => {
  const { t } = useLanguage();

  // Profile Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('All');
  const [state, setState] = useState(benefit?.state !== 'All India' ? (benefit?.state || '') : 'Rajasthan');
  const [category, setCategory] = useState('General');
  const [occupation, setOccupation] = useState('Student');
  const [annualIncome, setAnnualIncome] = useState('');
  const [hasRationCard, setHasRationCard] = useState('none'); // 'none' | 'aay' | 'phh' | 'bpl' | 'nfsa'
  const [isTransgenderCert, setIsTransgenderCert] = useState('no'); // 'yes' | 'no' | 'na'
  const [courseType, setCourseType] = useState('Undergraduate');
  const [hasMeritRank, setHasMeritRank] = useState('no');
  const [residencyYears, setResidencyYears] = useState('5');

  // Request & Result States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEvaluationResult(null);

    const isTrans = gender === 'Transgender' || isTransgenderCert === 'yes';

    const payload = {
      benefit_id: benefit ? benefit.benefit_id : null,
      profile: {
        age: age ? Number(age) : null,
        gender: gender !== 'All' ? gender : null,
        state: state || null,
        category: category !== 'General' ? category : null,
        occupation: occupation || null,
        annual_family_income: annualIncome ? Number(annualIncome) : null,
        has_ration_card: hasRationCard !== 'none',
        ration_card_type: hasRationCard !== 'none' ? hasRationCard.toUpperCase() : null,
        is_transgender: isTrans,
        has_transgender_certificate: isTransgenderCert === 'yes',
        is_student: occupation === 'Student',
        student_standard_or_course: courseType || null,
        has_merit_rank: hasMeritRank === 'yes',
        residency_years: residencyYears ? Number(residencyYears) : null
      }
    };

    try {
      const res = await evaluateFreeBenefitEligibility(payload);
      if (!res || !res.results || res.results.length === 0) {
        throw new Error('Unable to complete eligibility evaluation.');
      }
      setEvaluationResult(res.results[0]);
    } catch (err) {
      console.error('Eligibility evaluation error:', err);
      setError('Encountered an issue evaluating your criteria against verified rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEvaluationResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020504]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c1611] rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-emerald-500/15 flex items-start justify-between gap-4 bg-[#060b08]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deterministic Free Benefits Engine</span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              {benefit ? `Check Eligibility: ${benefit.name}` : 'Check Free Benefits Eligibility'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto space-y-6">
          
          {/* Form when no result yet */}
          {!evaluationResult && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Age */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Age (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-hidden"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Gender / Identity
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="All" className="bg-[#060b08]">All / Prefer not to say</option>
                    <option value="Female" className="bg-[#060b08]">Female</option>
                    <option value="Male" className="bg-[#060b08]">Male</option>
                    <option value="Transgender" className="bg-[#060b08]">Transgender Person</option>
                    <option value="Other" className="bg-[#060b08]">Other</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    State of Residence *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="Rajasthan" className="bg-[#060b08]">Rajasthan</option>
                    <option value="Delhi" className="bg-[#060b08]">Delhi</option>
                    <option value="Haryana" className="bg-[#060b08]">Haryana</option>
                    <option value="Maharashtra" className="bg-[#060b08]">Maharashtra</option>
                    <option value="Gujarat" className="bg-[#060b08]">Gujarat</option>
                    <option value="Nagaland" className="bg-[#060b08]">Nagaland</option>
                    <option value="Puducherry" className="bg-[#060b08]">Puducherry</option>
                    <option value="Uttar Pradesh" className="bg-[#060b08]">Uttar Pradesh</option>
                    <option value="Bihar" className="bg-[#060b08]">Bihar</option>
                    <option value="Punjab" className="bg-[#060b08]">Punjab</option>
                    <option value="All India" className="bg-[#060b08]">Other / All India</option>
                  </select>
                </div>

                {/* Social Category */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Social Category / Caste
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="General" className="bg-[#060b08]">General / Unreserved</option>
                    <option value="SC" className="bg-[#060b08]">SC (Scheduled Caste)</option>
                    <option value="ST" className="bg-[#060b08]">ST (Scheduled Tribe)</option>
                    <option value="OBC" className="bg-[#060b08]">OBC (Other Backward Class)</option>
                    <option value="EWS" className="bg-[#060b08]">EWS (Economically Weaker Section)</option>
                    <option value="VJNT" className="bg-[#060b08]">VJNT / NT (Maharashtra)</option>
                    <option value="SEBC" className="bg-[#060b08]">SEBC (Gujarat / State)</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Occupation / Status
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="Student" className="bg-[#060b08]">Enrolled Student</option>
                    <option value="Salaried" className="bg-[#060b08]">Salaried Employee</option>
                    <option value="Self-Employed" className="bg-[#060b08]">Self-Employed / Worker</option>
                    <option value="Farmer" className="bg-[#060b08]">Farmer / Agriculture</option>
                    <option value="Homemaker" className="bg-[#060b08]">Homemaker</option>
                    <option value="Unemployed" className="bg-[#060b08]">Job Seeker / Trainee</option>
                  </select>
                </div>

                {/* Annual Income */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Annual Family Income (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-hidden"
                  />
                </div>

                {/* Ration Card */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ration Card / Food Security Card
                  </label>
                  <select
                    value={hasRationCard}
                    onChange={(e) => setHasRationCard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="none" className="bg-[#060b08]">None / Standard APL</option>
                    <option value="aay" className="bg-[#060b08]">Antyodaya Anna Yojana (AAY - Poorest)</option>
                    <option value="phh" className="bg-[#060b08]">Priority Household (PHH / NFSA)</option>
                    <option value="bpl" className="bg-[#060b08]">Below Poverty Line (BPL / Yellow-Red Card)</option>
                  </select>
                </div>

                {/* Transgender Certificate */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Transgender Certificate / Identity Card
                  </label>
                  <select
                    value={isTransgenderCert}
                    onChange={(e) => setIsTransgenderCert(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/25 bg-[#060b08] font-bold text-white focus:border-emerald-400 focus:outline-hidden"
                  >
                    <option value="no" className="bg-[#060b08]">No / Not Applicable</option>
                    <option value="yes" className="bg-[#060b08]">Yes (Issued under Transgender Act)</option>
                  </select>
                </div>

              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/50 text-red-300 border border-red-500/40 text-xs">
                  {error}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Eligibility...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Evaluate Eligibility →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Results View */}
          {evaluationResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Status Banner */}
              {evaluationResult.status === 'ELIGIBLE' && (
                <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-serif font-bold text-base text-white">
                      ELIGIBLE: You Meet All Statutory Criteria
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300/90">
                    Based on verified government gazette rules, your profile qualifies for <strong>{evaluationResult.name}</strong>.
                  </p>
                </div>
              )}

              {evaluationResult.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
                <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="font-serif font-bold text-base text-white">
                      Additional Information Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-300/90">
                    {evaluationResult.missing_information_prompt || 'Missing specific proof required to confirm eligibility.'}
                  </p>
                </div>
              )}

              {evaluationResult.status === 'INELIGIBLE' && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="font-serif font-bold text-base text-white">
                      Ineligible For This Specific Scheme
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Your profile does not satisfy one or more mandatory conditions for this benefit.
                  </p>
                </div>
              )}

              {/* Reasons list */}
              {evaluationResult.eligibility_reasons && evaluationResult.eligibility_reasons.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#08120d] border border-emerald-500/20 space-y-1 text-xs">
                  <span className="font-mono font-bold uppercase text-emerald-400 block">
                    Verified Criteria Satisfied:
                  </span>
                  {evaluationResult.eligibility_reasons.map((r, i) => (
                    <p key={i} className="text-slate-300">• {r}</p>
                  ))}
                </div>
              )}

              {evaluationResult.failed_criteria && evaluationResult.failed_criteria.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#08120d] border border-red-500/30 space-y-1 text-xs">
                  <span className="font-mono font-bold uppercase text-red-400 block">
                    Criteria Not Met:
                  </span>
                  {evaluationResult.failed_criteria.map((f, i) => (
                    <p key={i} className="text-red-300">• {f}</p>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs uppercase cursor-pointer"
                >
                  Modify Criteria
                </button>

                <div className="flex items-center gap-2">
                  {evaluationResult.application_url ? (
                    <a
                      href={evaluationResult.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </a>
                  ) : (
                    <a
                      href={evaluationResult.official_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

