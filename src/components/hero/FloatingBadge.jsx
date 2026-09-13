import React from 'react';

export const FloatingBadge = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  position, 
  animationClass = 'animate-float-slow', 
  iconColor = 'text-sanchay-emerald-600', 
  badgeBg = 'bg-sanchay-emerald-50',
  rotateClass = '',
  tag
}) => {
  return (
    <div className={`absolute ${position} ${rotateClass} ${animationClass} z-20 hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-floating border border-slate-200/90 hover:scale-105 hover:z-30 transition-all duration-300 pointer-events-auto`}>
      <div className={`w-9 h-9 rounded-xl ${badgeBg} flex items-center justify-center shrink-0 shadow-2xs`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none">
            {title}
          </span>
          {tag && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              {tag}
            </span>
          )}
        </div>
        <div className="text-xs font-extrabold text-sanchay-navy-900 mt-1 leading-tight">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

