import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { getSchemeImage } from '../../data/schemeImages';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import inlineImages from '../../scheme_images.inline.json';
import { useLanguage } from '../../context/LanguageContext';
import { localizeScheme, localizeLICPlan, localizeFreeBenefit } from '../../utils/contentLocalizer';

export const FloatingCardComposition = ({ onSelectScheme }) => {
  const navigate = useNavigate();
  const { currentLang, t } = useLanguage();

  const heroCards = [
    {
      id: 'ppf',
      scheme_id: 'ppf_001',
      type: 'scheme',
      svgKey: 'ppf_001',
      name: t('hero.floatingCardPPF', 'Public Provident Fund'),
      category: t('featuredSchemes.savings', 'Govt Scheme • Wealth'),
      benefit: '7.1% Sovereign Tax-Free Return',
      position: 'top-0 left-4 sm:left-6 lg:left-0 z-30',
      rotation: '-rotate-2 hover:rotate-0',
      anim: 'animate-float-slow',
    },
    {
      id: 'pmjay',
      benefit_id: 'CENTRAL-PMJAY-FREE-HEALTH',
      type: 'free_benefit',
      image: '/schemes/pmjay_001.svg',
      name: 'Ayushman Bharat PM-JAY',
      category: t('freeBenefits.categoryHealth', 'Free Benefit • Health'),
      benefit: '₹5 Lakh Free Cashless Hospitalization',
      badgeClass: 'bg-sanchay-emerald-700 text-white',
      position: 'top-12 right-2 sm:right-4 lg:right-0 z-20',
      rotation: 'rotate-3 hover:rotate-0',
      anim: 'animate-float-delayed',
    },
    {
      id: 'ssy',
      scheme_id: 'ssy_001',
      type: 'scheme',
      svgKey: 'ssy_001',
      name: 'Sukanya Samriddhi Yojana',
      category: t('featuredSchemes.women', 'Govt Scheme • Girl Child'),
      benefit: '8.2% Compound Interest',
      position: 'top-48 left-0 sm:left-2 lg:left-0 z-40',
      rotation: 'rotate-1 hover:rotate-0',
      anim: 'animate-float-slow',
    },
    {
      id: 'lic-digi-term',
      plan_number: '876',
      type: 'lic',
      svgKey: 'fin_sgb_001',
      name: "LIC's Digi Term Plan",
      category: 'LIC Life Cover • UIN 512N356',
      benefit: 'High-Value Life Cover up to ₹50L+',
      badgeClass: 'bg-sanchay-gold-700 text-white',
      position: 'top-60 right-0 sm:right-6 lg:right-2 z-30',
      rotation: '-rotate-3 hover:rotate-0',
      anim: 'animate-float-delayed',
    },
    {
      id: 'pmgkay',
      benefit_id: 'CENTRAL-PMGKAY',
      type: 'free_benefit',
      image: '/schemes/pmkisan_001.svg',
      name: 'PM Garib Kalyan Anna (PMGKAY)',
      category: t('freeBenefits.categoryFood', 'Free Benefit • Food Grain'),
      benefit: '100% Free Rations (35kg/month)',
      badgeClass: 'bg-sanchay-emerald-800 text-white',
      position: 'top-[22rem] left-8 sm:left-12 lg:left-8 z-50',
      rotation: 'rotate-2 hover:rotate-0',
      anim: 'animate-float-slow',
    }
  ];

  const getCardDisplay = (card) => {
    if (card.type === 'scheme') {
      const loc = localizeScheme(card, currentLang);
      return {
        name: loc.displayName || card.name,
        benefit: loc.displayBenefit || card.benefit
      };
    }
    if (card.type === 'free_benefit') {
      const loc = localizeFreeBenefit(card, currentLang);
      return {
        name: loc.name || card.name,
        benefit: loc.benefit || card.benefit
      };
    }
    if (card.type === 'lic') {
      const loc = localizeLICPlan(card, currentLang);
      return {
        name: loc.name || card.name,
        benefit: loc.benefit || card.benefit
      };
    }
    return { name: card.name, benefit: card.benefit };
  };

  const getCardImageSrc = (card) => {
    if (card.svgKey && inlineImages[card.svgKey]) {
      return inlineImages[card.svgKey];
    }
    if (card.image) return card.image;
    return getSchemeImage(card.id)?.url || '/schemes/_fallback.svg';
  };

  const handleCardClick = (card) => {
    if (card.type === 'lic') {
      navigate('/lic');
      return;
    }
    if (card.type === 'free_benefit') {
      navigate('/free-benefits');
      return;
    }
    if (!onSelectScheme) return;
    const fullScheme = MOCK_SCHEMES.find(
      s => s.id === card.id || s.scheme_id === card.id || String(s.shortName || '').toLowerCase() === card.id.toLowerCase() || String(s.short_name || '').toLowerCase() === card.id.toLowerCase()
    );
    onSelectScheme(fullScheme || card);
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[620px] flex items-center justify-center p-2">
      {/* Background Soft Ambient Light & Architectural Grid Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-sanchay-gold-100/40 via-sanchay-emerald-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none transform scale-90" />
      
      {/* Overlapping Scheme Cards Collage */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {heroCards.map((card) => {
          const display = getCardDisplay(card);
          return (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={0}
            aria-label={`Open details for ${display.name}`}
            className={`absolute ${card.position} ${card.rotation} ${card.anim} transition-all duration-500 hover:scale-105 hover:z-50 group cursor-pointer focus:outline-none`}
          >
            <div className="w-56 sm:w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-card border border-slate-200/90 group-hover:border-sanchay-emerald-400 group-hover:shadow-floating transition-all">
              
              {/* Image Frame */}
              <div className="h-28 rounded-xl overflow-hidden mb-2.5 relative bg-slate-50 flex items-center justify-center border border-slate-100">
                <img
                  src={getCardImageSrc(card)}
                  alt={display.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/schemes/_fallback.svg';
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full ${card.badgeClass || 'bg-sanchay-navy-950/80'} backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase shadow-2xs`}>
                  {card.category}
                </span>
                
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sanchay-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>

              {/* Title & Statutory Benefit */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-sanchay-navy-950 line-clamp-1 group-hover:text-sanchay-emerald-700 transition-colors">
                    {display.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-sanchay-emerald-700 mt-0.5 line-clamp-1">
                    {display.benefit}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-sanchay-emerald-50 text-slate-500 group-hover:text-sanchay-emerald-700 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};
