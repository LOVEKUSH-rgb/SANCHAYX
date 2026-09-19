import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Shield, Heart, BookOpen, UserCheck, Sprout } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PopularCategoriesSection = () => {
  const { t } = useLanguage();

  const categories = [
    { id: 'savings', icon: Wallet, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300', label: t('explore.savings', 'Savings & Deposits') },
    { id: 'pension', icon: UserCheck, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100 hover:border-blue-300', label: t('explore.pension', 'Retirement & Pension') },
    { id: 'protection', icon: Shield, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100 hover:border-amber-300', label: t('explore.insurance', 'Insurance & Protection') },
    { id: 'education', icon: BookOpen, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100 hover:border-purple-300', label: t('explore.education', 'Education & Students') },
    { id: 'women', icon: Heart, color: 'bg-pink-50 text-pink-600', border: 'border-pink-100 hover:border-pink-300', label: t('explore.women', 'Women & Girls') },
    { id: 'agriculture', icon: Sprout, color: 'bg-green-50 text-green-600', border: 'border-green-100 hover:border-green-300', label: t('explore.agriculture', 'Agriculture & Farmers') },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif font-extrabold text-2xl text-sanchay-navy-950">
            {t('explore.popularCategories', 'Popular Categories')}
          </h2>
          <Link to="/schemes" className="text-xs font-bold text-sanchay-emerald-600 hover:text-sanchay-emerald-700 uppercase tracking-wider transition-colors">
            {t('explore.viewAllCategories', 'View All Categories →')}
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/schemes?category=${cat.id}`}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${cat.border} transition-all hover:-translate-y-1 hover:shadow-card group bg-white`}
            >
              <div className={`p-4 rounded-full ${cat.color} mb-4 transition-transform group-hover:scale-110`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-sanchay-navy-950 text-center uppercase tracking-wide">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
