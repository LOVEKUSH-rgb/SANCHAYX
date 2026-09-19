import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { GradientUserIcon } from '../common/GradientUserIcon';
import { UserAvatar } from '../common/UserAvatar';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Globe, ChevronDown, Sparkles, Check, Menu, X,
  User, Bookmark, LogIn, LogOut, ShieldCheck, Gift
} from 'lucide-react';

export const Navbar = () => {
  const { currentLang, setCurrentLang, languages, t } = useLanguage();
  const { user, isAuthenticated, savedPlanIds, openAuthModal, logout } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSakhiOpen, setIsSakhiOpen] = useState(false);
  const location = useLocation();
  const isLicActive = location.pathname === '/lic' || location.pathname === '/lic-plans';
  const isFreeActive = location.pathname === '/free-benefits' || location.pathname === '/benefits';

  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');
  
  let profileHref = '/profile';
  if (location.pathname === '/schemes' && currentCategory && currentCategory !== 'all') {
    const categoryToPersona = {
      women: 'women',
      education: 'students',
      agriculture: 'rural',
      business: 'workers',
      employment: 'workers',
      financial_inclusion: 'workers',
      pension: 'seniors',
      social_security: 'workers',
      savings: 'parents',
      protection: 'parents',
      health: 'parents',
      housing: 'parents'
    };
    const mappedPersona = categoryToPersona[currentCategory];
    if (mappedPersona) {
      profileHref = `/profile?persona=${mappedPersona}`;
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const handleSakhiOpen = () => setIsSakhiOpen(true);
    const handleSakhiClose = () => setIsSakhiOpen(false);
    const handleSakhiToggle = () => setIsSakhiOpen(prev => !prev);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('open-sakhi', handleSakhiOpen);
    window.addEventListener('close-sakhi', handleSakhiClose);
    window.addEventListener('sakhi-closed', handleSakhiClose);
    window.addEventListener('toggle-sakhi', handleSakhiToggle);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-sakhi', handleSakhiOpen);
      window.removeEventListener('close-sakhi', handleSakhiClose);
      window.removeEventListener('sakhi-closed', handleSakhiClose);
      window.removeEventListener('toggle-sakhi', handleSakhiToggle);
    };
  }, []);

  const activeLang = languages.find(l => l.code === currentLang) || languages[0];
  const savedCount = savedPlanIds?.size || 0;

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-card py-2.5' 
          : 'bg-[#FAF9F5]/90 backdrop-blur-sm border-b border-slate-200/60 py-3.5'
      }`}
    >
      <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-3 lg:px-3 xl:px-4">
        <div className="flex items-center justify-between gap-1.5 lg:gap-2">
          
          {/* Left: Login Icon + Sanchay Brand Logo + Verified Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* 1. Citizen Login / Account Icon Button (Placed before SANCHAY) */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  title={user?.full_name || 'My Account'}
                  className="flex items-center gap-1.5 h-8 sm:h-8.5 px-1.5 sm:px-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-card transition-all cursor-pointer whitespace-nowrap group"
                >
                  <UserAvatar user={user} size="sm" showBadge={true} />
                  <span className="hidden sm:inline-block max-w-[75px] truncate font-sans text-xs font-bold text-sanchay-navy-950">
                    {user?.full_name ? user.full_name.split(' ')[0] : 'Citizen'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  title={t('nav.citizenLogin', 'Citizen Login')}
                  className="flex items-center gap-1.5 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-card hover:border-sanchay-emerald-300 transition-all cursor-pointer whitespace-nowrap group"
                >
                  <GradientUserIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-sanchay-navy-900 group-hover:text-sanchay-emerald-600 font-extrabold whitespace-nowrap">
                    {t('nav.login', 'Log In')}
                  </span>
                </button>
              )}

              {/* Citizen Account Dropdown */}
              {userDropdownOpen && isAuthenticated && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-floating border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl flex items-center gap-3">
                      <UserAvatar user={user} size="md" className="ring-2 ring-emerald-500/20 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-sanchay-navy-950 truncate">{user?.full_name || 'Citizen'}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/my-plans"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 font-semibold flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bookmark className="w-4 h-4 text-sanchay-emerald-600" />
                          <span>{t('nav.myPlans', 'My Plans')}</span>
                        </div>
                        {savedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-sanchay-emerald-100 text-sanchay-emerald-800 text-[10px] font-mono font-bold">
                            {savedCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/my-profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 font-semibold flex items-center gap-2.5 transition-colors"
                      >
                        <User className="w-4 h-4 text-sanchay-emerald-600" />
                        <span>{t('nav.myProfile', 'My Profile')}</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>{t('nav.signOut', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2. Sanchay Brand Logo */}
            <Link to="/" className="flex items-center gap-1.5 group shrink-0">
              <Logo size="md" />
            </Link>

            {/* 3. Verified Sovereign Badge */}
            <span className="hidden 2xl:inline-flex items-center gap-1.5 h-6.5 px-2.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 font-mono font-bold text-[10px] uppercase tracking-wider border border-sanchay-emerald-100 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-sanchay-emerald-600 shadow-xs"></span>
              <Check className="w-3 h-3 text-sanchay-emerald-600 stroke-[3]" />
              <span>{t('nav.verified', 'Verified')}</span>
            </span>

          </div>

          {/* Desktop Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 2xl:gap-7 text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink">
            <Link 
              to="/" 
              className={`transition-colors py-1 ${
                location.pathname === '/' ? 'text-sanchay-emerald-600 font-black border-b-2 border-sanchay-emerald-600' : 'text-sanchay-navy-800 hover:text-sanchay-emerald-600'
              }`}
            >
              {t('nav.home', 'Home')}
            </Link>
            <Link 
              to="/schemes" 
              className={`transition-colors py-1 ${
                location.pathname === '/schemes' ? 'text-sanchay-emerald-600 font-black border-b-2 border-sanchay-emerald-600' : 'text-sanchay-navy-800 hover:text-sanchay-emerald-600'
              }`}
            >
              {t('nav.schemes', 'Schemes')}
            </Link>
            <Link 
              to="/lic" 
              className={`transition-colors py-1 ${
                location.pathname === '/lic' || location.pathname === '/lic-plans' ? 'text-sanchay-emerald-600 font-black border-b-2 border-sanchay-emerald-600' : 'text-sanchay-navy-800 hover:text-sanchay-emerald-600'
              }`}
            >
              {t('nav.licPlans', 'LIC Plans')}
            </Link>
            <Link 
              to="/markets" 
              className={`transition-colors py-1 ${
                location.pathname === '/markets' ? 'text-sanchay-emerald-600 font-black border-b-2 border-sanchay-emerald-600' : 'text-sanchay-navy-800 hover:text-sanchay-emerald-600'
              }`}
            >
              {t('nav.markets', 'Markets')}
            </Link>
            <Link 
              to="/calculator" 
              className={`transition-colors py-1 ${
                location.pathname === '/calculator' ? 'text-sanchay-emerald-600 font-black border-b-2 border-sanchay-emerald-600' : 'text-sanchay-navy-800 hover:text-sanchay-emerald-600'
              }`}
            >
              {t('nav.calculator', 'Calculator')}
            </Link>
            <div className="relative group py-1">
              <button className="flex items-center gap-1 text-sanchay-navy-800 hover:text-sanchay-emerald-600 transition-colors cursor-pointer">
                <span>{t('nav.explore', 'Explore')}</span>
                <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-floating border border-slate-200/90 py-2 hidden group-hover:block z-50">
                <Link to="/free-benefits" className="block px-4 py-2 text-xs font-bold text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors">
                  <Gift className="w-3.5 h-3.5 inline-block mr-2 text-sanchay-emerald-600" />
                  {t('nav.freeBenefits', 'Free Benefits')}
                </Link>
                <Link to="/compare" className="block px-4 py-2 text-xs font-bold text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors">
                  <Bookmark className="w-3.5 h-3.5 inline-block mr-2 text-sanchay-emerald-600" />
                  {t('nav.compare', 'Compare')}
                </Link>
                {isAuthenticated && (
                  <Link to="/my-plans" className="block px-4 py-2 text-xs font-bold text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors">
                    <Bookmark className="w-3.5 h-3.5 inline-block mr-2 text-sanchay-emerald-600" />
                    {t('nav.myPlans', 'My Plans')}
                    {savedCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-sanchay-emerald-100 text-sanchay-emerald-800 text-[9px] font-mono font-bold">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="my-1 border-t border-slate-100"></div>
                <Link to="/#how-it-works" className="block px-4 py-2 text-xs font-bold text-sanchay-navy-900 hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors">
                  <Check className="w-3.5 h-3.5 inline-block mr-2 text-slate-400" />
                  {t('nav.howItWorks', 'How It Works')}
                </Link>
              </div>
            </div>
          </nav>

          {/* Right Action Controls: 5-Language Selector & Find My Schemes CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
            
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 h-8 sm:h-8.5 px-1.5 sm:px-2 rounded-xl bg-white hover:bg-slate-50 text-sanchay-navy-900 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                <span className="tracking-wide text-[10px] sm:text-[10.5px] font-mono">{activeLang.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-floating border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 border-b border-slate-100 mb-1">
                    {t('nav.language', 'Language')}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors cursor-pointer ${
                        currentLang === lang.code ? 'bg-sanchay-emerald-50 text-sanchay-emerald-700 font-extrabold' : 'text-sanchay-navy-900 font-medium'
                      }`}
                    >
                      <span className="font-medium">{lang.native}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modules moved to nav menu */}

            {/* Prominent & Larger CTA: Find My Schemes */}
            <Link
              to={profileHref}
              className="inline-flex items-center gap-1.5 h-8 sm:h-8.5 xl:h-9 px-2.5 sm:px-3 xl:px-3.5 rounded-xl bg-sanchay-navy-900 hover:bg-sanchay-navy-850 text-white font-extrabold text-[10.5px] sm:text-[11px] xl:text-xs uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group border border-sanchay-navy-800 shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-400 group-hover:rotate-12 transition-transform" />
              <span className="text-white font-extrabold">{t('nav.findMySchemes', 'Find My Schemes')}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-white border border-slate-200 text-sanchay-navy-900 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3 pb-2 animate-in fade-in duration-200">
            <Link 
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.home', 'Home')}</span>
            </Link>
            <Link 
              to="/schemes"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.schemes', 'Schemes')}</span>
            </Link>
            <Link 
              to="/lic"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.licPlans', 'LIC Plans')}</span>
            </Link>
            <Link 
              to="/markets"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.markets', 'Markets')}</span>
            </Link>
            <Link 
              to="/calculator" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.manualCalculator', 'Manual Calculator')}</span>
            </Link>
            <div className="pt-2 pb-1 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
              {t('nav.explore', 'Explore')}
            </div>
            <Link 
              to="/free-benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.freeBenefits', 'Free Benefits')}</span>
            </Link>
            <Link 
              to="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.compare', 'Compare')}</span>
            </Link>
            <Link 
              to="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>{t('nav.howItWorks', 'How It Works')}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-sakhi'));
              }}
              className="text-left text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer w-full"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-500" />
                <span>{t('nav.sakhiAI', 'Sakhi AI Assistant')}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sanchay-emerald-100 text-sanchay-emerald-800 text-[10px] font-mono font-bold">
                AI
              </span>
            </button>

            {isAuthenticated ? (
              <>
                <div className="px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                  <UserAvatar user={user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-sanchay-navy-950 truncate">{user?.full_name || t('nav.citizen', 'Citizen')}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{user?.email}</div>
                  </div>
                </div>
                <Link 
                  to="/my-plans" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-sanchay-emerald-700 py-2 border-b border-slate-100 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                    {t('nav.myPlans', 'My Plans')}
                  </span>
                  {savedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-sanchay-emerald-100 text-sanchay-emerald-800 text-[10px] font-mono font-bold">
                      {savedCount}
                    </span>
                  )}
                </Link>
                <Link 
                  to="/my-profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-sanchay-navy-900 py-2 border-b border-slate-100 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                  <span>{t('nav.myProfile', 'My Profile')}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-xs font-bold uppercase tracking-wider text-red-600 py-2 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.signOut', 'Sign Out')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-xs font-bold uppercase tracking-wider text-sanchay-navy-950 py-2 flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                <span>{t('auth.citizenLogin', 'Log In / Create Account')}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
