import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { Menu, X, Bookmark, User, LogOut, HeartPulse } from 'lucide-react';

export const Navbar = () => {
  const { currentLang, setCurrentLang, languages, t } = useLanguage();
  const { user, isAuthenticated, savedPlanIds, openAuthModal, logout } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const savedCount = savedPlanIds?.size || 0;
  const activeLang = languages.find(l => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('hero-scheme-search');
        if (searchInput) {
          searchInput.focus();
        } else {
          navigate('/schemes');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--header-border)] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between gap-2 lg:gap-4">
        
        {/* Brand Logo & Emblem */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img
              src="/sanchay-brand-emblem.png"
              alt="SANCHAY Brand Emblem"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg xl:text-xl tracking-tight text-[var(--header-logo)] group-hover:text-[var(--header-accent)] transition-colors duration-200">
                  SANCHAY
                </span>
                <span className="hidden xl:inline-block bg-[var(--header-control-bg)] text-[var(--header-accent)] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[var(--header-control-border)]">
                  Civic Finance
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-8">
          <Link
            to="/"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname === '/'
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Home
          </Link>
          <Link
            to="/schemes"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname === '/schemes'
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Government Schemes
          </Link>
          <Link
            to="/lic"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname.startsWith('/lic')
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Insurance
          </Link>
          <Link
            to="/markets"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname === '/markets'
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Investments
          </Link>
          <Link
            to="/financial-health"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname === '/financial-health'
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Financial Health
          </Link>
          <Link
            to="/calculator"
            className={`transition-colors duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
              location.pathname === '/calculator'
                ? 'text-[var(--header-accent)] font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[var(--header-accent)] after:rounded-full'
                : 'text-[var(--header-link)] hover:text-[var(--header-accent)]'
            }`}
          >
            Calculators
          </Link>
        </nav>

        {/* Right Actions: Search, Lang, CTA, User */}
        <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 shrink-0">
          
          {/* Quick Search Shortcut - Full on xl+, Icon button on lg */}
          <button
            type="button"
            onClick={() => {
              const searchInput = document.getElementById('hero-scheme-search');
              if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                navigate('/schemes');
              }
            }}
            className="hidden xl:flex items-center gap-2 bg-[var(--header-control-bg)] hover:bg-[var(--header-control-hover)] px-3.5 py-1.5 rounded-xl text-white transition-colors duration-200 border border-[var(--header-control-border)] cursor-pointer"
            title="Search schemes (⌘K)"
          >
            <span className="material-symbols-outlined text-[18px] text-[var(--header-accent)]">search</span>
            <span className="text-xs font-medium text-white/90">Search schemes...</span>
            <kbd className="bg-white/10 text-white/80 px-1.5 py-0.5 rounded-md font-mono text-[10px] border border-white/20 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              const searchInput = document.getElementById('hero-scheme-search');
              if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                navigate('/schemes');
              }
            }}
            className="hidden lg:flex xl:hidden p-2 rounded-xl bg-[var(--header-control-bg)] hover:bg-[var(--header-control-hover)] text-[var(--header-accent)] transition-colors duration-200 border border-[var(--header-control-border)] cursor-pointer"
            title="Search schemes (⌘K)"
            aria-label="Search schemes"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="bg-[var(--header-control-bg)] hover:bg-[var(--header-control-hover)] text-white px-2.5 py-1.5 rounded-xl text-xs hidden md:inline-flex items-center gap-1.5 transition-colors duration-200 border border-[var(--header-control-border)] cursor-pointer font-medium"
              aria-label="Select Language"
            >
              <span className="material-symbols-outlined text-[15px] text-[var(--header-accent)]">translate</span>
              <span className="text-[11px] font-semibold">{activeLang.native || 'EN'}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-floating border border-[#E7ECE8] py-2 z-50 animate-in fade-in duration-150">
                <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#66736C] border-b border-[#E7ECE8] mb-1">
                  Language / भाषा
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#E7F1EB] hover:text-[#176B50] transition-colors cursor-pointer ${
                      currentLang === lang.code ? 'text-[#176B50] font-bold bg-[#E7F1EB]' : 'text-[#202B26]'
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-[10px] text-[#66736C]">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button: Find My Schemes */}
          <Link
            to="/profile"
            className="bg-[var(--header-cta-bg)] hover:bg-[var(--header-cta-hover)] text-[var(--header-cta-text)] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 transition-all duration-200 shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[var(--header-cta-text)]">explore</span>
            <span className="hidden sm:inline whitespace-nowrap">Find My Schemes</span>
            <span className="sm:hidden whitespace-nowrap">Schemes</span>
          </Link>

          {/* User Account Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-[var(--header-control-bg)] border border-[var(--header-control-border)] ring-2 ring-[var(--header-accent)]/80 ring-offset-1 ring-offset-[var(--header-bg)] flex items-center justify-center shrink-0 shadow-2xs cursor-pointer transition-colors duration-200"
                aria-label="User Account"
              >
                <UserAvatar user={user} size="xs" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-floating border border-[#E7ECE8] py-2 z-50 text-[#202B26] animate-in fade-in duration-150">
                  <div className="px-3.5 py-2 border-b border-[#E7ECE8]">
                    <div className="text-xs font-bold truncate text-[#202B26]">{user?.full_name || 'Citizen'}</div>
                    <div className="text-[10px] text-[#66736C] truncate">{user?.email}</div>
                  </div>
                  <Link
                    to="/my-plans"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2 text-xs text-[#202B26] hover:bg-[#E7F1EB] hover:text-[#176B50] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-[#176B50]" />
                      <span>My Saved Plans</span>
                    </span>
                    {savedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#E7F1EB] text-[#176B50] text-[10px] font-mono font-bold">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/financial-health"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#202B26] hover:bg-[#E7F1EB] hover:text-[#176B50] transition-colors"
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-[#176B50]" />
                    <span>My Financial Health</span>
                  </Link>
                  <Link
                    to="/my-profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#202B26] hover:bg-[#E7F1EB] hover:text-[#176B50] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#176B50]" />
                    <span>My Profile</span>
                  </Link>
                  <div className="my-1 border-t border-[#E7ECE8]" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-8 h-8 rounded-full bg-[var(--header-control-bg)] hover:bg-[var(--header-control-hover)] border border-[var(--header-control-border)] flex items-center justify-center shrink-0 shadow-2xs cursor-pointer text-white hover:text-[var(--header-accent)] transition-colors duration-200"
              title="Citizen Login"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-[var(--header-control-bg)] text-white hover:text-[var(--header-accent)] hover:bg-[var(--header-control-hover)] border border-[var(--header-control-border)] transition-colors duration-200 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--header-accent)]" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--header-bg)] border-b border-[var(--header-border)] px-6 py-4 flex flex-col gap-3 shadow-lg animate-in fade-in duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Home
          </Link>
          <Link
            to="/schemes"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/schemes' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Government Schemes
          </Link>
          <Link
            to="/lic"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname.startsWith('/lic') ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Insurance (LIC)
          </Link>
          <Link
            to="/markets"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/markets' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Investments & Markets
          </Link>
          <Link
            to="/financial-health"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 flex items-center justify-between ${
              location.pathname === '/financial-health' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            <span>Financial Health (Smart Budget)</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--header-control-bg)] text-[var(--header-accent)] text-[10px] font-bold border border-[var(--header-control-border)]">
              Step 2
            </span>
          </Link>
          <Link
            to="/calculator"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/calculator' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Calculators
          </Link>
          <Link
            to="/free-benefits"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/free-benefits' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Free Sovereign Benefits
          </Link>
          <Link
            to="/compare"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-2 border-b border-[var(--header-border)] transition-colors duration-200 ${
              location.pathname === '/compare' ? 'text-[var(--header-accent)] font-semibold' : 'text-white hover:text-[var(--header-accent)]'
            }`}
          >
            Compare Schemes
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-sakhi'));
            }}
            className="text-left text-sm font-medium text-white hover:text-[var(--header-accent)] py-2 border-b border-[var(--header-border)] flex items-center justify-between cursor-pointer w-full transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--header-accent)] text-[18px]">auto_awesome</span>
              <span>Sakhi AI Assistant</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--header-control-bg)] text-[var(--header-accent)] text-[10px] font-bold border border-[var(--header-control-border)]">
              AI
            </span>
          </button>
          {isAuthenticated ? (
            <div className="pt-2 flex flex-col gap-2">
              <div className="text-xs text-white/70">Signed in as <span className="text-white font-bold">{user?.full_name || 'Citizen'}</span></div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-xs font-bold uppercase text-red-400 hover:text-red-300 py-1 cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                openAuthModal('login');
                setMobileMenuOpen(false);
              }}
              className="text-left text-xs font-bold uppercase text-[var(--header-accent)] hover:text-[var(--header-cta-hover)] py-2 cursor-pointer transition-colors"
            >
              Log In / Create Account →
            </button>
          )}
        </div>
      )}
    </header>
  );
};
