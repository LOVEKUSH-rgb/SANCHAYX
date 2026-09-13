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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sanchay-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-editorial border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sanchay-gold-50 text-sanchay-gold-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 border border-sanchay-gold-200">
              <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-600" />
              <span>Deterministic Free Benefits Engine</span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-sanchay-navy-950">
              {benefit ? `Check Eligibility: ${benefit.name}` : 'Check Free Benefits Eligibility'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-sanchay-navy-950 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
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
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Gender / Identity
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="All">All / Prefer not to say</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Transgender">Transgender Person</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    State of Residence *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Punjab">Punjab</option>
                    <option value="All India">Other / All India</option>
                  </select>
                </div>

                {/* Social Category */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Social Category / Caste
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="General">General / Unreserved</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                    <option value="VJNT">VJNT / NT (Maharashtra)</option>
                    <option value="SEBC">SEBC (Gujarat / State)</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Occupation / Status
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Student">Enrolled Student</option>
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Self-Employed">Self-Employed / Worker</option>
                    <option value="Farmer">Farmer / Agriculture</option>
                    <option value="Homemaker">Homemaker</option>
                    <option value="Unemployed">Job Seeker / Trainee</option>
                  </select>
                </div>

                {/* Annual Income */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Annual Family Income (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Ration Card */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Ration Card / Food Security Card
                  </label>
                  <select
                    value={hasRationCard}
                    onChange={(e) => setHasRationCard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="none">None / Standard APL</option>
                    <option value="aay">Antyodaya Anna Yojana (AAY - Poorest)</option>
                    <option value="phh">Priority Household (PHH / NFSA)</option>
                    <option value="bpl">Below Poverty Line (BPL / Yellow-Red Card)</option>
                  </select>
                </div>

                {/* Transgender Certificate */}
                <div>
                  <label className="block font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Transgender Certificate / Identity Card
                  </label>
                  <select
                    value={isTransgenderCert}
                    onChange={(e) => setIsTransgenderCert(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sanchay-navy-950 focus:bg-white focus:outline-hidden"
                  >
                    <option value="no">No / Not Applicable</option>
                    <option value="yes">Yes (Issued under Transgender Act)</option>
                  </select>
                </div>

              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
                  {error}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Eligibility...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-400" />
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
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-serif font-bold text-base text-emerald-900">
                      ELIGIBLE: You Meet All Statutory Criteria
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Based on verified government gazette rules, your profile qualifies for <strong>{evaluationResult.name}</strong>.
                  </p>
                </div>
              )}

              {evaluationResult.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-serif font-bold text-base text-amber-900">
                      Additional Information Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    {evaluationResult.missing_information_prompt || 'Missing specific proof required to confirm eligibility.'}
                  </p>
                </div>
              )}

              {evaluationResult.status === 'INELIGIBLE' && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                    <span className="font-serif font-bold text-base text-slate-900">
                      Ineligible For This Specific Scheme
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Your profile does not satisfy one or more mandatory conditions for this benefit.
                  </p>
                </div>
              )}

              {/* Reasons list */}
              {evaluationResult.eligibility_reasons && evaluationResult.eligibility_reasons.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <span className="font-mono font-bold uppercase text-emerald-700 block">
                    Verified Criteria Satisfied:
                  </span>
                  {evaluationResult.eligibility_reasons.map((r, i) => (
                    <p key={i} className="text-slate-700">• {r}</p>
                  ))}
                </div>
              )}

              {evaluationResult.failed_criteria && evaluationResult.failed_criteria.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-1 text-xs">
                  <span className="font-mono font-bold uppercase text-red-700 block">
                    Criteria Not Met:
                  </span>
                  {evaluationResult.failed_criteria.map((f, i) => (
                    <p key={i} className="text-red-800">• {f}</p>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sanchay-navy-950 font-mono font-bold text-xs uppercase cursor-pointer"
                >
                  Modify Criteria
                </button>

                <div className="flex items-center gap-2">
                  {evaluationResult.application_url ? (
                    <a
                      href={evaluationResult.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-card"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3.5 h-3.5 text-sanchay-gold-400" />
                    </a>
                  ) : (
                    <a
                      href={evaluationResult.official_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-sanchay-navy-950 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
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
