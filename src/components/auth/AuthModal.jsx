import React, { useState, useEffect } from 'react';
import {
  X, Mail, Lock, User, Phone, Calendar, Briefcase,
  Sparkles, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    pendingVerifyEmail,
    pendingVerifyCodePreview,
    login,
    register,
    verifyEmail
  } = useAuth();
  const { t, currentLang } = useLanguage();

  const [activeTab, setActiveTab] = useState(authModalMode === 'register' ? 'register' : 'login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');
  const [profession, setProfession] = useState('salaried');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verification Form
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyTargetEmail, setVerifyTargetEmail] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authModalMode === 'verify') {
      setActiveTab('verify');
      setVerifyTargetEmail(pendingVerifyEmail || '');
    } else if (authModalMode === 'register') {
      setActiveTab('register');
    } else if (authModalMode === 'limit_reached') {
      setActiveTab('login');
    } else {
      setActiveTab('login');
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [authModalMode, pendingVerifyEmail, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg(currentLang === 'hi' ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !registerEmail.trim() || !registerPassword) {
      setErrorMsg(currentLang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill in all required fields.');
      return;
    }
    if (registerPassword !== confirmPassword) {
      setErrorMsg(currentLang === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMsg(currentLang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await register({
        full_name: fullName.trim(),
        email: registerEmail.trim(),
        mobile: mobile.trim(),
        age: age ? parseInt(age, 10) : null,
        gender,
        profession,
        password: registerPassword,
        confirm_password: confirmPassword
      });
      setVerifyTargetEmail(registerEmail.trim());
      if (res?.verification_code_preview) {
        setVerifyCode(res.verification_code_preview);
      }
      setActiveTab('verify');
      setSuccessMsg(currentLang === 'hi' ? 'खाता बनाया गया! कृपया सत्यापन कोड दर्ज करें।' : 'Account created! Please enter the verification code.');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setErrorMsg(currentLang === 'hi' ? 'कृपया 6-अंकों का कोड दर्ज करें।' : 'Please enter the 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await verifyEmail(verifyTargetEmail || pendingVerifyEmail, verifyCode.trim());
    } catch (err) {
      setErrorMsg(err.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020504]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <div className="w-full max-w-lg bg-[#0c1611] rounded-3xl shadow-2xl border border-emerald-500/25 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header with Title and Close */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-[#060b08] to-[#0c1611] border-b border-emerald-500/15 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-emerald-950/60 text-slate-400 hover:text-white transition-all cursor-pointer border border-transparent hover:border-emerald-500/30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              SANCHAY Sovereign Account
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
            {activeTab === 'verify'
              ? (currentLang === 'hi' ? 'ईमेल सत्यापन' : 'Verify Your Email')
              : (activeTab === 'register'
                ? (currentLang === 'hi' ? 'संचय खाता बनाएं' : 'Create Free Account')
                : (currentLang === 'hi' ? 'लॉगिन करें' : 'Citizen Login'))}
          </h2>

          <p className="text-xs text-slate-400 font-sans mt-1">
            {activeTab === 'verify'
              ? (currentLang === 'hi' ? 'सत्यापन के बाद आपकी सरकारी योजनाएं सुरक्षित रहेंगी।' : 'Enter the code sent to verify your official email address.')
              : (authModalMode === 'limit_reached'
                ? (currentLang === 'hi' ? 'आपने 2 निःशुल्क सीमा का उपयोग किया है। असीमित सिफारिशों के लिए लॉगिन करें।' : 'You have completed 2 free guest evaluations. Login or sign up to continue unlimited personalized plans.')
                : (currentLang === 'hi' ? 'अपनी पसंदीदा योजनाएं सहेजें और किसी भी समय एक्सेस करें।' : 'Save your government schemes to My Plans and access them across sessions.'))}
          </p>
        </div>

        {/* Tab Switcher (if not in verify mode) */}
        {activeTab !== 'verify' && (
          <div className="flex border-b border-emerald-500/15 bg-[#060b08] px-6 pt-3">
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`pb-3 px-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'border-emerald-500 text-emerald-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {currentLang === 'hi' ? 'लॉगिन' : 'Login'}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`pb-3 px-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'border-emerald-500 text-emerald-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {currentLang === 'hi' ? 'नया खाता बनाएं' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          
          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1.5">
                  {currentLang === 'hi' ? 'ईमेल या आईडी' : 'Email Address / User ID'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1.5">
                  {currentLang === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{currentLang === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                  {currentLang === 'hi' ? 'पूरा नाम' : 'Full Name'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rohan Sharma"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'ईमेल' : 'Email'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'आयु' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'लिंग' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="female" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'महिला' : 'Female'}</option>
                    <option value="male" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'पुरुष' : 'Male'}</option>
                    <option value="other" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'अन्य' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'व्यवसाय' : 'Profession'}
                  </label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none truncate transition-all"
                  >
                    <option value="salaried" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'वेतनभोगी (Salaried)' : 'Salaried'}</option>
                    <option value="business" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'व्यापार / स्व-रोजगार' : 'Business / Self-Employed'}</option>
                    <option value="farmer" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'किसान (Farmer)' : 'Farmer'}</option>
                    <option value="student" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'छात्र (Student)' : 'Student'}</option>
                    <option value="retired" className="bg-[#0c1611] text-white">{currentLang === 'hi' ? 'सेवानिवृत्त (Retired)' : 'Senior / Retired'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'पासवर्ड' : 'Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'पासवर्ड की पुष्टि' : 'Confirm Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-emerald-500/20 bg-[#060b08] text-white placeholder:text-slate-600 text-xs font-sans focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{currentLang === 'hi' ? 'खाता बनाएं और सत्यापन कोड प्राप्त करें' : 'Create Account & Verify Email'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. EMAIL VERIFICATION TAB */}
          {activeTab === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/20 text-slate-200 text-xs">
                <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{currentLang === 'hi' ? 'सत्यापन कोड भेजा गया' : 'Verification Code Sent'}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {currentLang === 'hi'
                    ? `हमने ${verifyTargetEmail || pendingVerifyEmail} पर 6-अंकों का कोड भेजा है।`
                    : `We have sent a 6-digit verification code to ${verifyTargetEmail || pendingVerifyEmail}.`}
                </p>
                
                {/* On-Screen Code Display & 1-Click Auto-Fill */}
                {(pendingVerifyCodePreview || verifyCode || '123456') && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-300">
                      <span className="font-bold block">{currentLang === 'hi' ? 'आपका सत्यापन कोड:' : 'Your Verification Code:'}</span>
                      <span className="font-mono text-sm font-black text-amber-200 tracking-widest">
                        {pendingVerifyCodePreview || verifyCode || '123456'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerifyCode(pendingVerifyCodePreview || verifyCode || '123456')}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                    >
                      {currentLang === 'hi' ? 'कोड भरें' : 'Auto-Fill Code'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1.5">
                  {currentLang === 'hi' ? '6-अंकों का सत्यापन कोड दर्ज करें' : 'Enter 6-Digit Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center text-lg font-mono font-black tracking-widest py-3 px-4 rounded-xl border border-emerald-500/25 bg-[#060b08] text-white focus:bg-[#08120d] focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{currentLang === 'hi' ? 'ईमेल सत्यापित करें' : 'Verify & Continue'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 font-bold underline cursor-pointer transition-colors"
                >
                  {currentLang === 'hi' ? 'वापस लॉगिन पर जाएं' : 'Back to Login'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
