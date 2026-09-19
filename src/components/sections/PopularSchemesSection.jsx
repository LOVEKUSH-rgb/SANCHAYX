import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { getSchemeImage } from '../../data/schemeImages';
import { useLanguage } from '../../context/LanguageContext';
import { localizeScheme, getLocalizedCategory } from '../../utils/contentLocalizer';
import { ProductDetailsModal } from '../common/ProductDetailsModal';

export const PopularSchemesSection = ({ schemes = [] }) => {
  const { currentLang, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedScheme, setSelectedScheme] = useState(null);

  // Take only the first 3 featured schemes
  const featuredSchemes = schemes.slice(0, 3);

  if (!featuredSchemes || featuredSchemes.length === 0) return null;

  return (
    <section className="py-20 bg-[#FAF9F5] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950 tracking-tight">
              {t('explore.popularSchemes', 'Popular Government Schemes')}
            </h2>
            <p className="text-base text-sanchay-navy-700 mt-3 leading-relaxed">
              {t('explore.popularSubtitle', 'Handpicked verified schemes to get you started on your savings journey.')}
            </p>
          </div>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-sanchay-navy-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <span>{t('explore.viewAllSchemes', 'View All Schemes')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredSchemes.map((scheme) => {
            const schemeId = scheme.scheme_id || scheme.id;
            const locScheme = localizeScheme(scheme, currentLang);
            const schemeName = locScheme.displayName || (typeof scheme.name === 'object' ? (scheme.name[currentLang] || scheme.name.en) : scheme.name);
            const schemeImgObj = getSchemeImage(schemeId, scheme.category, schemeName);
            const imgSrc = schemeImgObj?.url || '/schemes/_fallback.svg';
            const cardDesc = locScheme.displayDescription || scheme.descriptionSimple || scheme.short_description || scheme.benefitsOverview;
            
            const rawInterest = scheme.currentInterestRate || scheme.financial?.interest_rate || scheme.benefits?.amount || scheme.benefits?.pension_amount || 'Statutory Benefit';
            const matchPercent = typeof rawInterest === 'string' && rawInterest.match(/^(\d+(\.\d+)?%\s*(?:p\.a\.)?)/i);
            const benefitDisplay = matchPercent ? matchPercent[0] : (typeof rawInterest === 'string' && rawInterest.length > 24 ? rawInterest.split('(')[0].trim() : rawInterest);

            return (
              <div
                key={schemeId}
                onClick={() => setSelectedScheme(scheme)}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-editorial transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-200/80">
                  <img
                    src={imgSrc}
                    alt={schemeName}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/schemes/_fallback.svg'; }}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-sanchay-navy-950 font-mono font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                      {getLocalizedCategory(scheme.category, currentLang) || scheme.category}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-3 right-3 flex items-center justify-between text-white">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 block drop-shadow-sm">
                        Benefit / Return
                      </span>
                      <span className="font-serif font-extrabold text-xl text-sanchay-emerald-700 drop-shadow-sm truncate block">
                        {benefitDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-serif font-extrabold text-xl text-sanchay-navy-950 group-hover:text-sanchay-emerald-700 transition-colors line-clamp-1">
                    {schemeName}
                  </h3>
                  <p className="text-xs text-sanchay-navy-700 mt-2 leading-relaxed line-clamp-2">
                    {cardDesc}
                  </p>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-extrabold text-sanchay-navy-950 uppercase tracking-wider">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:text-sanchay-emerald-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProductDetailsModal
        item={selectedScheme}
        onClose={() => setSelectedScheme(null)}
      />
    </section>
  );
};
