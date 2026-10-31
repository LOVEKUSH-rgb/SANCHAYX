import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Briefcase, Users, ShieldCheck,
  Bookmark, Award, LogOut, ArrowRight, CheckCircle2, Clock,
  RefreshCw, ChevronRight, Sparkles, ExternalLink, Camera, Trash2,
  Check, Image as ImageIcon, X, Smile
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchSavedPlans } from '../services/api';
import { MALE_AVATARS, FEMALE_AVATARS, AVATAR_PRESETS, getAvatarById } from '../data/avatars.jsx';

// Fast client-side image compressor: scales high-res files to clean ~300x300 JPEG
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 320;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const MyProfilePage = () => {
  const { user, token, isAuthenticated, logout, openAuthModal, savedPlanIds, uploadProfilePhoto, changeAvatar } = useAuth();
  const { t, currentLang } = useLanguage();
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [planStats, setPlanStats] = useState({ gov: 0, lic: 0, free: 0, total: 0 });
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Avatar & Photo Management State
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [avatarCategoryFilter, setAvatarCategoryFilter] = useState('auto'); // 'auto' | 'male' | 'female' | 'all'

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (!token || !isAuthenticated) {
        setPlanStats({ gov: 0, lic: 0, free: 0, total: 0 });
        return;
      }
      setLoadingPlans(true);
      try {
        const plans = await fetchSavedPlans(token);
        if (!isMounted) return;
        let gov = 0, lic = 0, free = 0;
        
        if (plans && plans.length > 0) {
          plans.forEach(p => {
            if (p.is_free_benefit || p.benefit_id || String(p.scheme_id || '').startsWith('fb_')) {
              free++;
            } else if (p.is_lic_plan || String(p.category || '').toLowerCase().includes('lic') || String(p.scheme_id || '').startsWith('lic')) {
              lic++;
            } else {
              gov++;
            }
          });
          setPlanStats({
            gov,
            lic,
            free,
            total: plans.length
          });
        } else if (savedPlanIds && savedPlanIds.size > 0) {
          savedPlanIds.forEach(id => {
            const idStr = String(id).toLowerCase();
            if (idStr.startsWith('fb_') || idStr.includes('benefit')) {
              free++;
            } else if (idStr.includes('lic') || /^\d+$/.test(idStr)) {
              lic++;
            } else {
              gov++;
            }
          });
          setPlanStats({
            gov,
            lic,
            free,
            total: savedPlanIds.size
          });
        } else {
          setPlanStats({ gov: 0, lic: 0, free: 0, total: 0 });
        }
      } catch (err) {
        console.error('Failed to load plan stats:', err);
        if (savedPlanIds && savedPlanIds.size > 0) {
          setPlanStats({
            gov: savedPlanIds.size,
            lic: 0,
            free: 0,
            total: savedPlanIds.size
          });
        }
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    };

    loadStats();
    return () => { isMounted = false; };
  }, [token, isAuthenticated, savedPlanIds]);

  const showTemporaryFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg('');
    }, 4000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(currentLang === 'hi' ? 'कृपया एक मान्य छवि फ़ाइल (PNG/JPG/WebP) चुनें।' : 'Please choose a valid image file (PNG/JPG/WebP).');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImage(file);
      await uploadProfilePhoto(compressedDataUrl);
      showTemporaryFeedback(currentLang === 'hi' ? 'प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट की गई!' : 'Custom profile photo saved securely!');
    } catch (err) {
      console.error('Failed to upload profile photo:', err);
      alert(err.message || 'Failed to update photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await uploadProfilePhoto(null);
      showTemporaryFeedback(currentLang === 'hi' ? 'फ़ोटो हटा दी गई, डिफ़ॉल्ट अवतार बहाल किया गया।' : 'Custom photo removed. Default avatar restored.');
    } catch (err) {
      console.error('Failed to remove profile photo:', err);
      alert(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSelectPresetAvatar = async (presetId) => {
    setIsUploadingPhoto(true);
    try {
      await changeAvatar(presetId);
      setAvatarModalOpen(false);
      showTemporaryFeedback(currentLang === 'hi' ? 'अवतार सफलतापूर्वक बदला गया!' : 'Avatar updated successfully!');
    } catch (err) {
      console.error('Failed to change avatar:', err);
      alert(err.message || 'Failed to update avatar.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Active Citizen Account';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Appropriate avatar preset list based on user's gender
  const userGender = (user?.gender || '').toLowerCase();
  const relevantAvatars = avatarCategoryFilter === 'male'
    ? MALE_AVATARS
    : avatarCategoryFilter === 'female'
      ? FEMALE_AVATARS
      : avatarCategoryFilter === 'all'
        ? AVATAR_PRESETS
        : (userGender === 'female' ? FEMALE_AVATARS : MALE_AVATARS);

  return (
    <div className="min-h-screen bg-[#060b08] text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Page Breadcrumb / Pill */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30 shadow-2xs">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentLang === 'hi' ? 'नागरिक खाता' : 'Citizen Account'}</span>
          </span>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Not Logged In State */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#0c1611]/90 border border-emerald-500/20 shadow-2xl text-center max-w-lg mx-auto my-12 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 text-emerald-400 mx-auto flex items-center justify-center mb-4 border border-emerald-500/30">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-white mb-2">
              {currentLang === 'hi' ? 'अपनी प्रोफाइल देखने के लिए लॉगिन करें' : 'Sign in to View Your Profile'}
            </h2>
            <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
              {currentLang === 'hi'
                ? 'अपने पंजीकृत विवरण, सुरक्षित योजनाओं और व्यक्तिगत सिफारिशों तक पहुँचने के लिए कृपया लॉगिन करें।'
                : 'Access your verified registered details, demographic data, and saved multi-category plan portfolio.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {currentLang === 'hi' ? 'लॉगिन करें' : 'Citizen Login'}
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                {currentLang === 'hi' ? 'नया खाता बनाएं' : 'Create Account'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Header Hero Card with Integrated Avatar & Photo Controls */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1611]/90 border border-emerald-500/20 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* Avatar Container with Hover Upload Trigger */}
                  <div className="relative group self-start sm:self-center">
                    <UserAvatar
                      user={user}
                      size="xl"
                      showBadge={true}
                      className="shadow-md ring-4 ring-emerald-500/30"
                    />

                    {/* Camera Badge to trigger file select */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      title={currentLang === 'hi' ? 'फ़ोटो बदलें' : 'Upload or change profile photo'}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-[#060b08] hover:bg-emerald-600 text-white shadow-md border-2 border-[#0c1611] transition-all cursor-pointer hover:scale-110 active:scale-95"
                    >
                      {isUploadingPhoto ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                    />
                  </div>

                  {/* Citizen Details & Actions */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        {user?.full_name || 'Citizen'}
                      </h1>
                      {user?.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/30">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{currentLang === 'hi' ? 'सत्यापित नागरिक' : 'Verified Sovereign Citizen'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30">
                          <span>{currentLang === 'hi' ? 'सक्रिय खाता' : 'Active Account'}</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {user?.email}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{currentLang === 'hi' ? 'खाता निर्माण' : 'Account Created'}: {formatDate(user?.created_at)}</span>
                    </p>

                    {/* Avatar & Photo Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08120d] hover:bg-[#101e17] text-white text-[11px] font-mono font-bold tracking-wide transition-colors cursor-pointer border border-emerald-500/25"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{user?.profile_photo ? (currentLang === 'hi' ? 'फ़ोटो बदलें' : 'Change Photo') : (currentLang === 'hi' ? 'फ़ोटो अपलोड करें' : 'Upload Photo')}</span>
                      </button>

                      {user?.profile_photo && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isUploadingPhoto}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-[11px] font-mono font-bold transition-colors cursor-pointer border border-red-500/40"
                          title="Remove custom photo and return to gender avatar"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>{currentLang === 'hi' ? 'फ़ोटो हटाएं' : 'Remove Photo'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAvatarModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-[11px] font-mono font-bold tracking-wide transition-colors cursor-pointer border border-emerald-500/30"
                      >
                        <Smile className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentLang === 'hi' ? 'अवतार चुनें' : 'Choose Avatar'}</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Right Top Header Navigation CTAs */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
                  <Link
                    to="/my-plans"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-white" />
                    <span>{currentLang === 'hi' ? 'मेरे प्लान देखें' : 'View My Plans'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-bold transition-colors cursor-pointer border border-red-500/40"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">{currentLang === 'hi' ? 'लॉगआउट' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Registered Citizen Profile Details Card */}
            <div className="bg-[#0c1611]/90 rounded-3xl border border-emerald-500/20 shadow-2xl backdrop-blur-sm p-6 sm:p-8 text-white">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-serif font-bold text-white">
                    {currentLang === 'hi' ? 'पंजीकृत नागरिक विवरण' : 'Registered Citizen Profile'}
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {currentLang === 'hi'
                      ? 'यह जानकारी आपके सुरक्षित खाते से जुड़ी है और पात्रता जांच के लिए उपयोग की जाती है।'
                      : 'These details are permanently associated with your account and used for accurate eligibility matching.'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#060b08] text-emerald-400/90 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Private & Encrypted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Full Name */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'पूरा नाम' : 'Full Name'}</span>
                  </div>
                  <div className="font-serif font-bold text-sm text-white truncate">
                    {user?.full_name || 'Not Specified'}
                  </div>
                </div>

                {/* 2. Email */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'ईमेल आईडी' : 'Email Address'}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 truncate font-semibold">
                    {user?.email || 'Not Specified'}
                  </div>
                </div>

                {/* 3. Mobile */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                  </div>
                  <div className="font-mono text-sm text-slate-200 font-semibold">
                    {user?.mobile ? `+91 ${user.mobile}` : '—'}
                  </div>
                </div>

                {/* 4. Age */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'आयु (वर्ष)' : 'Age'}</span>
                  </div>
                  <div className="font-serif font-bold text-sm text-white">
                    {user?.age ? `${user.age} Years` : '—'}
                  </div>
                </div>

                {/* 5. Gender */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'लिंग' : 'Gender'}</span>
                  </div>
                  <div className="font-serif font-bold text-sm text-white capitalize">
                    {user?.gender || '—'}
                  </div>
                </div>

                {/* 6. Profession */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'पेशा / व्यवसाय' : 'Profession'}</span>
                  </div>
                  <div className="font-serif font-bold text-sm text-white capitalize truncate">
                    {user?.profession || 'General Citizen'}
                  </div>
                </div>

                {/* 7. Verification Status */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'सत्यापन स्थिति' : 'Verification Status'}</span>
                  </div>
                  <div className="text-xs font-mono font-bold flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user?.is_verified ? 'Verified Citizen' : 'Active Account'}</span>
                  </div>
                </div>

                {/* 8. Account Created Date */}
                <div className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/15 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang === 'hi' ? 'खाता निर्माण तिथि' : 'Account Created Date'}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 font-semibold">
                    {formatDate(user?.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Plans Portfolio Summary Card */}
            <div className="bg-[#0c1611]/90 rounded-3xl border border-emerald-500/20 shadow-2xl backdrop-blur-sm p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/15 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    <span>{currentLang === 'hi' ? 'सहेजी गई योजनाएं और पोर्टफोलियो' : 'Saved Portfolio Breakdown'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {currentLang === 'hi'
                      ? 'आपके खाते में सुरक्षित सरकारी योजनाएं, एलआईसी प्लान और मुफ्त कल्याणकारी लाभ।'
                      : 'All 3 categories of saved plans are securely isolated to your citizen identity.'}
                  </p>
                </div>
                <Link
                  to="/my-plans"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <span>{currentLang === 'hi' ? 'सभी देखें' : 'Manage All in My Plans'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Government Schemes */}
                <Link
                  to="/my-plans"
                  className="p-4 rounded-2xl bg-[#08120d] border border-emerald-500/20 hover:border-emerald-400/50 hover:bg-[#101e17] transition-all group"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {currentLang === 'hi' ? 'सरकारी योजनाएं' : 'Sovereign Schemes'}
                  </div>
                  <div className="text-2xl font-serif font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {planStats.gov}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Central & State Schemes
                  </div>
                </Link>

                {/* LIC Plans */}
                <Link
                  to="/my-plans"
                  className="p-4 rounded-2xl bg-[#08120d] border border-amber-500/20 hover:border-amber-400/50 hover:bg-[#101e17] transition-all group"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
                    {currentLang === 'hi' ? 'एलआईसी प्लान' : 'LIC Plans'}
                  </div>
                  <div className="text-2xl font-serif font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                    {planStats.lic}
                  </div>
                  <div className="text-[11px] text-amber-300/70 font-mono mt-1">
                    Verified Life & Pension
                  </div>
                </Link>

                {/* Free Benefits */}
                <Link
                  to="/my-plans"
                  className="p-4 rounded-2xl bg-[#08120d] border border-teal-500/20 hover:border-teal-400/50 hover:bg-[#101e17] transition-all group"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 mb-1">
                    {currentLang === 'hi' ? 'मुफ्त कल्याणकारी लाभ' : 'Free Benefits'}
                  </div>
                  <div className="text-2xl font-serif font-black text-teal-300 group-hover:text-teal-200 transition-colors">
                    {planStats.free}
                  </div>
                  <div className="text-[11px] text-teal-300/70 font-mono mt-1">
                    100% Free & Subsidies
                  </div>
                </Link>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Gender Avatar Selector Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#020504]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0c1611] rounded-3xl shadow-2xl border border-emerald-500/25 p-6 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">
                  {currentLang === 'hi' ? 'अपना अवतार चुनें' : 'Choose Your Avatar'}
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {currentLang === 'hi' ? 'पसंदीदा आधिकारिक नागरिक अवतार चुनें' : 'Select a professional citizen avatar'}
                </p>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-950/60 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-emerald-500/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gender Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#060b08] border border-emerald-500/15 p-1 rounded-xl mb-4 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setAvatarCategoryFilter(userGender === 'female' ? 'female' : 'male')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  avatarCategoryFilter === 'auto' || avatarCategoryFilter === userGender
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {userGender === 'female' ? (currentLang === 'hi' ? 'महिला अवतार' : 'Female (Recommended)') : (currentLang === 'hi' ? 'पुरुष अवतार' : 'Male (Recommended)')}
              </button>
              <button
                type="button"
                onClick={() => setAvatarCategoryFilter(userGender === 'female' ? 'male' : 'female')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  (userGender === 'female' && avatarCategoryFilter === 'male') || (userGender !== 'female' && avatarCategoryFilter === 'female')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {userGender === 'female' ? (currentLang === 'hi' ? 'पुरुष अवतार' : 'Male Avatars') : (currentLang === 'hi' ? 'महिला अवतार' : 'Female Avatars')}
              </button>
              <button
                type="button"
                onClick={() => setAvatarCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  avatarCategoryFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {currentLang === 'hi' ? 'सभी' : 'All'}
              </button>
            </div>

            {/* Avatar Presets Grid */}
            <div className="grid grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto p-1">
              {relevantAvatars.map((preset) => {
                const isSelected = !user?.profile_photo && user?.avatar_id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/30'
                        : 'border-emerald-500/15 bg-[#08120d] hover:border-emerald-400/40 hover:bg-[#101e17]'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-xs group-hover:scale-105 transition-transform bg-[#060b08]">
                      {preset.render('100%')}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-xs text-white flex items-center justify-center gap-1">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{preset.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{relevantAvatars.length} avatar options available</span>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Persistent Sakhi AI Assistant */}
      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />

      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
        context={{ stage: 'profile', user: user?.full_name }}
      />
    </div>
  );
};
