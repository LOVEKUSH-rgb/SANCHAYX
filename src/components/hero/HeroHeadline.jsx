import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HeroHeadline = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [schemeCount, setSchemeCount] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/schemes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    import('../../services/api').then(({ fetchSchemeCount }) => {
      fetchSchemeCount().then(data => {
        if (isMounted && data && data.count) {
          setSchemeCount(data.count);
        }
      }).catch(() => {});
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col justify-center space-y-6 max-w-2xl">
      
      {/* Trust & Category Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC] text-xs font-semibold shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#176B50] shrink-0" />
          <span>{t('hero.badge', '100% Grounded in Official Gazettes')}</span>
        </div>

        <Link
          to="/lic"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-semibold transition-all shadow-2xs group"
        >
          <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
          <span>{t('hero.activeLicBadge', '38+ Active LIC Plans')}</span>
          <span className="text-[#92400E] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        <a
          href="#latest-free-benefits"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('latest-free-benefits');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] hover:bg-[#D5E4DC] text-[#176B50] border border-[#D5E4DC] text-xs font-semibold transition-all shadow-2xs group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#176B50] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#176B50]"></span>
          </span>
          <span>{t('hero.freeBenefitsBadge', '22+ Free Benefits & Aid')}</span>
          <span className="text-[#176B50] font-bold group-hover:translate-y-0.5 transition-transform">↓</span>
        </a>
      </div>

      {/* Large Editorial Headline */}
      <h1 className="font-serif font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#202B26] leading-[1.15] tracking-tight">
        {t('hero.headlinePrefix', 'Smart Budget & Financial Resilience Engine')}
      </h1>

      {/* Supporting Text */}
      <p className="text-base sm:text-lg text-[#66736C] font-normal leading-relaxed">
        {t('hero.heroSubtitle', 'Discover verified government schemes, free benefits, savings options and market-linked financial products — with clear eligibility, comparison and educational tools.')}
      </p>

      {/* Clean Fintech Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-xl w-full pt-1">
        <Search className="w-5 h-5 text-[#176B50] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="hero-scheme-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('hero.searchPlaceholder', 'Search schemes, benefits, insurance...')}
          className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-[#E7ECE8] text-sm text-[#202B26] placeholder:text-[#66736C] focus:outline-none focus:border-[#176B50] focus:ring-3 focus:ring-[#176B50]/12 transition-all shadow-card font-medium"
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
        >
          Search
        </button>
      </form>

      {/* Dual CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-sm transition-all duration-200 group shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>{t('hero.ctaFindSchemes', 'Find My Schemes →')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/schemes"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#202B26] font-semibold text-sm border border-[#E7ECE8] hover:border-[#D5E4DC] shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <span>{t('hero.ctaExplore', 'Explore All Schemes')}</span>
        </Link>
      </div>

      {/* Trust Statistics for All 3 Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-[#E7ECE8]">
        <div>
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#202B26]">
            {schemeCount ? `${schemeCount}+` : '184+'}
          </div>
          <div className="text-xs font-semibold text-[#66736C] mt-0.5">
            {t('hero.statGovtSchemes', 'Govt Schemes')}
          </div>
        </div>
        <Link to="/lic" className="group block">
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#B45309] group-hover:text-[#92400E] transition-colors">
            38+
          </div>
          <div className="text-xs font-semibold text-[#66736C] group-hover:text-[#92400E] transition-colors mt-0.5">
            {t('hero.statLicPlans', 'Active LIC Plans')} →
          </div>
        </Link>
        <Link to="/free-benefits" className="group block">
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#176B50] group-hover:text-[#125540] transition-colors">
            22+
          </div>
          <div className="text-xs font-semibold text-[#66736C] group-hover:text-[#125540] transition-colors mt-0.5">
            {t('hero.statFreeBenefits', 'Free Benefits & Aid')} →
          </div>
        </Link>
        <div>
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#202B26]">0</div>
          <div className="text-xs font-semibold text-[#66736C] mt-0.5">
            {t('hero.statCommissions', 'Commissions')}
          </div>
        </div>
      </div>

    </div>
  );
};
