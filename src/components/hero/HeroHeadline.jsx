import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HeroHeadline = () => {
  const { t } = useLanguage();
  const [schemeCount, setSchemeCount] = React.useState(null);

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
    <div className="flex flex-col justify-center space-y-7 max-w-2xl">
      
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 border border-sanchay-emerald-200/90 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-sanchay-emerald-600 shrink-0" />
          <span>{t('hero.badge', '100% Grounded in Official Gazettes')}</span>
        </div>

        <Link
          to="/lic"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sanchay-gold-50 hover:bg-amber-100/80 text-sanchay-gold-700 border border-sanchay-gold-100 text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-2xs group"
        >
          <span className="w-2 h-2 rounded-full bg-sanchay-gold-500"></span>
          <span>{t('hero.activeLicBadge', '38+ Active LIC Plans')}</span>
          <span className="text-sanchay-gold-700 font-extrabold group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        <a
          href="#free-benefits-home-section"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('free-benefits-home-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sanchay-emerald-50 hover:bg-sanchay-emerald-100 text-sanchay-emerald-800 border border-sanchay-emerald-200 text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-2xs group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sanchay-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sanchay-emerald-600"></span>
          </span>
          <span>{t('hero.freeBenefitsBadge', '22+ Free Benefits & Aid')}</span>
          <span className="text-sanchay-emerald-700 font-extrabold group-hover:translate-y-0.5 transition-transform">↓</span>
        </a>
      </div>

      {/* Large Editorial Headline */}
      <h1 className="font-serif font-extrabold text-4xl sm:text-5xl lg:text-6xl text-sanchay-navy-950 leading-[1.14] tracking-tight">
        {t('hero.headlinePrefix', 'Trusted Indian Savings & Schemes.')} <br className="hidden sm:inline" />
        <span className="italic text-sanchay-emerald-700 font-normal">{t('hero.headlineHighlight', 'Grounded in Official Gazettes.')}</span>
      </h1>

      {/* Supporting Text */}
      <p className="text-base sm:text-lg text-sanchay-navy-700 font-normal leading-relaxed">
        {t('hero.heroSubtitle', 'Match your life goals with verified Government schemes, sovereign LIC insurance, and 100% free direct welfare benefits through our deterministic rule engine.')}
      </p>

      {/* Dual CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-card hover:shadow-editorial hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
        >
          <span>{t('hero.ctaFindSchemes', 'Find My Schemes →')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <a
          href="#verified-schemes"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('verified-schemes');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-sanchay-navy-950 font-bold text-sm uppercase tracking-wider border border-slate-200/90 shadow-card hover:-translate-y-0.5 transition-all duration-200"
        >
          <span>{t('hero.ctaExplore', 'Explore All Schemes')}</span>
        </a>
      </div>

      {/* Trust Statistics for All 3 Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-slate-200/80">
        <div>
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-navy-950">
            {schemeCount ? `${schemeCount}+` : '184+'}
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mt-0.5">
            {t('hero.statGovtSchemes', 'Govt Schemes')}
          </div>
        </div>
        <Link to="/lic" className="group block">
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-gold-700 group-hover:text-sanchay-gold-600 transition-colors">
            38+
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 group-hover:text-sanchay-gold-700 transition-colors mt-0.5">
            {t('hero.statLicPlans', 'Active LIC Plans')} →
          </div>
        </Link>
        <Link to="/free-benefits" className="group block">
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-emerald-600 group-hover:text-sanchay-emerald-700 transition-colors">
            22+
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 group-hover:text-sanchay-emerald-800 transition-colors mt-0.5">
            {t('hero.statFreeBenefits', 'Free Benefits & Aid')} →
          </div>
        </Link>
        <div>
          <div className="font-serif font-extrabold text-2xl sm:text-3xl text-sanchay-navy-900">0</div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mt-0.5">
            {t('hero.statCommissions', 'Commissions')}
          </div>
        </div>
      </div>

    </div>
  );
};
