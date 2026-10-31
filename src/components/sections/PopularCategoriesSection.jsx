import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Shield, Heart, BookOpen, UserCheck, Sprout } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PopularCategoriesSection = () => {
  const { t } = useLanguage();

  const categories = [
    { id: 'savings', icon: Wallet, color: 'bg-[#E7F1EB] text-[#176B50] border border-[#D5E4DC]', label: t('explore.savings', 'Savings & Deposits') },
    { id: 'pension', icon: UserCheck, color: 'bg-blue-50 text-blue-700 border border-blue-200', label: t('explore.pension', 'Retirement & Pension') },
    { id: 'protection', icon: Shield, color: 'bg-amber-50 text-[#92400E] border border-amber-200', label: t('explore.insurance', 'Insurance & Protection') },
    { id: 'education', icon: BookOpen, color: 'bg-purple-50 text-purple-700 border border-purple-200', label: t('explore.education', 'Education & Students') },
    { id: 'women', icon: Heart, color: 'bg-pink-50 text-pink-700 border border-pink-200', label: t('explore.women', 'Women & Girls') },
    { id: 'agriculture', icon: Sprout, color: 'bg-emerald-50 text-emerald-800 border border-emerald-200', label: t('explore.agriculture', 'Agriculture & Farmers') },
  ];

  return (
    <section className="py-12 bg-[#F8FAF8] border-b border-[#E7ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif font-extrabold text-2xl text-[#202B26]">
            {t('explore.popularCategories', 'Popular Categories')}
          </h2>
          <Link to="/schemes" className="text-xs font-bold text-[#176B50] hover:text-[#125540] uppercase tracking-wider transition-colors">
            {t('explore.viewAllCategories', 'View All Categories →')}
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/schemes?category=${cat.id}`}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-[#E7ECE8] shadow-card hover:shadow-card-hover hover:border-[#176B50]/30 transition-all hover:-translate-y-1 group"
            >
              <div className={`p-4 rounded-full ${cat.color} mb-4 transition-transform group-hover:scale-110 shadow-2xs`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#202B26] text-center uppercase tracking-wide group-hover:text-[#176B50] transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
