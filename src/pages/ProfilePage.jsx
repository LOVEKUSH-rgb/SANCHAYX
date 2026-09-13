import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { LIFE_STAGE_PERSONAS } from '../data/mockSchemes';
import { Users, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { useLanguage } from '../context/LanguageContext';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, currentLang } = useLanguage();

  const savedProfile = JSON.parse(sessionStorage.getItem('sanchay_profile') || '{}');

  const [savingFor, setSavingFor] = useState(savedProfile.saving_for || savedProfile.savingFor || 'self');
  const [selectedPersona, setSelectedPersona] = useState(savedProfile.persona || savedProfile.life_stage || 'parents');
  const [age, setAge] = useState(savedProfile.age !== undefined ? savedProfile.age : 25);
  const [gender, setGender] = useState(savedProfile.gender || 'all');
  const [residencyStatus, setResidencyStatus] = useState(savedProfile.residency_status || savedProfile.residencyStatus || 'resident');
  const [state, setState] = useState(savedProfile.state || 'All India / Central');
  const [annualIncome, setAnnualIncome] = useState(savedProfile.annual_income || savedProfile.income || 350000);
  const [occupation, setOccupation] = useState(savedProfile.occupation || 'salaried');
  const [hasGuardian, setHasGuardian] = useState(savedProfile.has_guardian !== undefined ? savedProfile.has_guardian : true);
  const [childAge, setChildAge] = useState(savedProfile.child_age || 6);
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const occupationsList = [
    { id: 'salaried', label: currentLang === 'hi' ? 'वेतनभोगी / पेशेवर (Salaried)' : currentLang === 'mr' ? 'पगारदार / व्यावसायिक (Salaried)' : currentLang === 'bn' ? 'চাকরিজীবী / পেশাদার (Salaried)' : currentLang === 'te' ? 'ఉద్యోగి / నిపుణులు (Salaried)' : 'Salaried / Professional' },
    { id: 'student', label: currentLang === 'hi' ? 'विद्यार्थी (Student)' : currentLang === 'mr' ? 'विद्यार्थी (Student)' : currentLang === 'bn' ? 'শিক্ষার্থী (Student)' : currentLang === 'te' ? 'విద్యార్థి (Student)' : 'Student' },
    { id: 'farmer', label: currentLang === 'hi' ? 'किसान / कृषि (Farmer)' : currentLang === 'mr' ? 'शेतकरी / कृषी (Farmer)' : currentLang === 'bn' ? 'কৃষক / কৃষি (Farmer)' : currentLang === 'te' ? 'రైతు / వ్యవసాయం (Farmer)' : 'Farmer / Agriculturalist' },
    { id: 'business', label: currentLang === 'hi' ? 'स्वरोजगार / सूक्ष्म व्यवसाय (Self-Employed)' : currentLang === 'mr' ? 'स्वयंरोजगार / सूक्ष्म व्यवसाय' : currentLang === 'bn' ? 'স্বনির্ভর / ক্ষুদ্র ব্যবসা' : currentLang === 'te' ? 'స్వయం ఉపాధి / సూక్ష్మ వ్యాపారం' : 'Self-Employed / Micro Business' },
    { id: 'unorganized', label: currentLang === 'hi' ? 'असंगठित / गिग वर्कर (Gig Worker)' : currentLang === 'mr' ? 'असंघटित कामगार (Gig Worker)' : currentLang === 'bn' ? 'অসংগঠিত শ্রমিক (Gig Worker)' : currentLang === 'te' ? 'అసంఘటిత రంగ కార్మికులు' : 'Unorganised / Gig Worker' },
    { id: 'homemaker', label: currentLang === 'hi' ? 'गृहणी (Homemaker)' : currentLang === 'mr' ? 'गृहिणी (Homemaker)' : currentLang === 'bn' ? 'গৃহিনী (Homemaker)' : currentLang === 'te' ? 'గృహిణి (Homemaker)' : 'Homemaker' },
    { id: 'retired', label: currentLang === 'hi' ? 'सेवानिवृत्त वरिष्ठ नागरिक (Retired)' : currentLang === 'mr' ? 'सेवानिवृत्त ज्येष्ठ नागरिक' : currentLang === 'bn' ? 'অবসরপ্রাপ্ত প্রবীণ' : currentLang === 'te' ? 'పదవీ విరమణ పొందిన సీనియర్' : 'Retired Senior' },
  ];

  const statesList = [
    'All India / Central',
    'Andhra Pradesh',
    'Bihar',
    'Delhi',
    'Gujarat',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Punjab',
    'Rajasthan',
    'Tamil Nadu',
    'Uttar Pradesh',
    'West Bengal'
  ];

  const handleNext = (e) => {
    e.preventDefault();
    if (age === '' || isNaN(age) || age < 0 || age > 120) {
      setErrorMessage(currentLang === 'hi' ? 'कृपया 0 से 120 वर्ष के बीच एक मान्य आयु दर्ज करें।' : 'Please enter a valid age between 0 and 120 years.');
      return;
    }

    setErrorMessage('');
    const profileData = {
      persona: selectedPersona,
      life_stage: selectedPersona,
      saving_for: savingFor,
      savingFor: savingFor,
      age: Number(age),
      gender,
      residency_status: residencyStatus,
      residency: residencyStatus === 'nri' ? 'NRI' : 'Resident Indian',
      state: state === 'All India / Central' ? null : state,
      annual_income: Number(annualIncome),
      income: Number(annualIncome),
      occupation,
      is_student: occupation === 'student' || selectedPersona === 'student',
      is_farmer: occupation === 'farmer' || selectedPersona === 'farmers',
      is_senior: Number(age) >= 60 || selectedPersona === 'seniors',
      has_guardian: savingFor === 'minor' ? hasGuardian : true,
      child_age: savingFor === 'minor' ? Number(childAge) : null
    };

    sessionStorage.setItem('sanchay_profile', JSON.stringify(profileData));
    sessionStorage.removeItem('sanchay_recommendation_result');
    navigate('/goal');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Step Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
              <span className="text-sanchay-emerald-700 uppercase tracking-widest">{t('profile.stepIndicator', 'STEP 1 OF 3')}</span>
              <span className="uppercase tracking-widest">{t('profile.personaLabel', 'Profile & Hard Eligibility Parameters')}</span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-sanchay-emerald-600 rounded-full transition-all duration-300" />
            </div>
          </div>

          {/* Page Card Container */}
          <form onSubmit={handleNext} className="bg-white rounded-3xl p-6 sm:p-10 shadow-editorial border border-slate-200/90 space-y-8">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-sanchay-emerald-200">
                <Users className="w-3.5 h-3.5" />
                <span>{t('profile.title', 'Demographic & Statutory Profile')}</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950">
                {t('profile.savingFor', 'Who are you saving for?')}
              </h1>
              <p className="text-xs sm:text-sm text-sanchay-navy-700 mt-2 leading-relaxed">
                {t('profile.subtitle', 'Provide statutory details so the rule engine can evaluate mandatory eligibility criteria.')}
              </p>
            </div>

            {/* Question: Saving for Self or Minor? */}
            <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
              <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-3">
                {t('profile.savingFor', 'Account Beneficiary')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSavingFor('self')}
                  className={`p-4 rounded-xl border text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${
                    savingFor === 'self'
                      ? 'bg-white border-sanchay-emerald-600 text-sanchay-navy-950 shadow-xs ring-2 ring-sanchay-emerald-500/20'
                      : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div>
                    <span className="block text-sanchay-navy-950 font-serif">{t('profile.forSelf', 'Saving for Myself / Family')}</span>
                    <span className="text-[11px] text-slate-500 font-normal">Adult applicant (PPF, APY, SCSS, NSC, KVP)</span>
                  </div>
                  {savingFor === 'self' && <CheckCircle2 className="w-5 h-5 text-sanchay-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSavingFor('minor')}
                  className={`p-4 rounded-xl border text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${
                    savingFor === 'minor'
                      ? 'bg-white border-sanchay-emerald-600 text-sanchay-navy-950 shadow-xs ring-2 ring-sanchay-emerald-500/20'
                      : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div>
                    <span className="block text-sanchay-navy-950 font-serif">{t('profile.forMinor', 'Saving for Minor / Child')}</span>
                    <span className="text-[11px] text-slate-500 font-normal">Operated by Natural/Legal Guardian (SSY, PPF Minor)</span>
                  </div>
                  {savingFor === 'minor' && <CheckCircle2 className="w-5 h-5 text-sanchay-emerald-600 shrink-0" />}
                </button>
              </div>

              {/* Child Age + Guardian Toggle if Minor */}
              {savingFor === 'minor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                      {t('profile.childAgeLabel', 'Child Age (Years)')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="17"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-sanchay-navy-950"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                      {t('profile.guardianLabel', 'Guardian Representation')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasGuardian(true)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold ${hasGuardian ? 'bg-sanchay-emerald-600 text-white' : 'bg-white border border-slate-200'}`}
                      >
                        {t('profile.guardianYes', 'Guardian Available')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasGuardian(false)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold ${!hasGuardian ? 'bg-red-600 text-white' : 'bg-white border border-slate-200'}`}
                      >
                        {t('profile.guardianNo', 'No Guardian')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Life Stage Persona Selection */}
            <div>
              <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-3">
                {t('profile.personaLabel', 'Select Life Stage')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LIFE_STAGE_PERSONAS.map((p) => {
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-sanchay-emerald-600 bg-sanchay-emerald-50/50 shadow-xs ring-2 ring-sanchay-emerald-500/20'
                          : 'border-slate-200/90 hover:border-slate-300 hover:bg-[#F8F6F0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-serif font-bold text-sm text-sanchay-navy-950">
                            {p.title}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-sanchay-navy-700 leading-snug">
                          {p.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs Grid: Age, Gender, Residency, State, Income, Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#F8F6F0] border border-slate-200/80">
              
              {/* Age */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.ageLabel', 'Age of Applicant *')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-sm font-bold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs"
                  />
                  <span className="font-mono text-xs text-slate-500 font-bold">Yrs</span>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.genderLabel', 'Gender')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs cursor-pointer"
                >
                  <option value="all">{t('profile.genderAll', 'All / Any')}</option>
                  <option value="female">{t('profile.genderFemale', 'Female')}</option>
                  <option value="male">{t('profile.genderMale', 'Male')}</option>
                </select>
              </div>

              {/* Residency Status */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.residencyLabel', 'Residency Status')}
                </label>
                <select
                  value={residencyStatus}
                  onChange={(e) => setResidencyStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs cursor-pointer"
                >
                  <option value="resident">{t('profile.residencyResident', 'Resident Indian')}</option>
                  <option value="nri">{t('profile.residencyNRI', 'NRI (Non-Resident Indian)')}</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.stateLabel', 'State of Residence')}
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs cursor-pointer"
                >
                  {statesList.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.occLabel', 'Occupation')}
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs cursor-pointer"
                >
                  {occupationsList.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Annual Income */}
              <div>
                <label className="text-xs font-mono font-bold text-sanchay-navy-950 uppercase tracking-wider block mb-1.5">
                  {t('profile.incomeLabel', 'Annual Household Income (₹)')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="25000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-sm font-bold text-sanchay-navy-950 focus:outline-none focus:border-sanchay-emerald-600 shadow-2xs"
                />
              </div>

            </div>

            {/* Error banner if invalid */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-sanchay-navy-950 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('profile.backBtn', 'Back to Home')}</span>
              </Link>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>{t('profile.continueBtn', 'Continue to Goal Selection →')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

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
          page: 'Profile',
          profile: {
            age,
            gender,
            residency_status: residencyStatus,
            state,
            annual_income: annualIncome,
            occupation,
            saving_for: savingFor,
            has_guardian: hasGuardian,
            child_age: childAge
          }
        }}
      />

    </div>
  );
};
