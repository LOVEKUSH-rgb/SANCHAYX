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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#176B50] hover:bg-[#125540] text-white shadow-floating border border-[#125540] text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-95'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Ask Sakhi</span>
        </div>
      )}

      {/* Floating Circular Assistant Trigger Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative p-1 rounded-full bg-white shadow-floating border border-[#E7ECE8] hover:border-[#176B50] hover:shadow-card transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen ? 'ring-2 ring-[#176B50] ring-offset-2' : 'animate-float-slow'
        }`}
        aria-label="Toggle Sakhi AI Assistant"
      >
        {/* Subtle Ambient Sage/Forest Glow */}
        <div className="absolute -inset-2 rounded-full bg-[#176B50]/20 opacity-70 group-hover:opacity-100 blur-md transition-opacity pointer-events-none" />

        {/* Sakhi Avatar */}
        <SakhiAvatar size="lg" showStatus={!isOpen} />

        {/* Message Indicator Badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#176B50] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            <MessageCircle className="w-3 h-3 text-white" />
          </span>
        )}
      </button>

    </div>
  );
};
