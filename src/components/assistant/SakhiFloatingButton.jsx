import React, { useState } from 'react';
import { SakhiAvatar } from './SakhiAvatar';
import { Sparkles, MessageCircle } from 'lucide-react';

export const SakhiFloatingButton = ({ onClick, isOpen }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      
      {/* Floating Micro-Pill "Ask Sakhi" */}
      {!isOpen && (
        <div 
          onClick={onClick}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-sanchay-navy-950 text-white shadow-floating border border-sanchay-navy-800 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-sanchay-navy-900 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-95'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-500 shrink-0" />
          <span>Ask Sakhi</span>
        </div>
      )}

      {/* Floating Circular Assistant Trigger Button with Emerald Ambient Glow */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative p-1 rounded-full bg-white shadow-floating border border-slate-200/90 hover:border-sanchay-emerald-500 hover:shadow-editorial transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen ? 'ring-2 ring-sanchay-emerald-500 ring-offset-2' : 'animate-float-slow'
        }`}
        aria-label="Toggle Sakhi AI Assistant"
      >
        {/* Subtle Emerald Ambient Glow */}
        <div className="absolute -inset-2 rounded-full bg-sanchay-emerald-500/30 opacity-70 group-hover:opacity-100 blur-md transition-opacity pointer-events-none" />

        {/* Sakhi Avatar */}
        <SakhiAvatar size="lg" showStatus={!isOpen} />

        {/* Message Indicator Badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sanchay-emerald-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            <MessageCircle className="w-3 h-3 text-white" />
          </span>
        )}
      </button>

    </div>
  );
};


