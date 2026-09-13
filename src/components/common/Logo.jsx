import React from 'react';

export const Logo = ({ size = 'md', showText = true, className = '' }) => {
  // Sizing definitions
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg' },
    md: { icon: 'w-9 h-9', text: 'text-2xl' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Sanchay Golden Lotus Emblem */}
      <svg
        className={`${currentSize.icon} shrink-0 transition-transform duration-300 hover:scale-105`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floating Drops */}
        <path
          d="M 36 22 C 36 17 38 13 40 10 C 42 13 44 17 44 22 C 44 25 42 27 40 27 C 38 27 36 25 36 22 Z"
          fill="#F59E0B"
        />
        <path
          d="M 56 22 C 56 17 58 13 60 10 C 62 13 64 17 64 22 C 64 25 62 27 60 27 C 58 27 56 25 56 22 Z"
          fill="#F59E0B"
        />

        {/* Center Main Petal */}
        <path
          d="M 50 20 C 65 35 68 55 50 75 C 32 55 35 35 50 20 Z"
          fill="#F59E0B"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Left Wing Petal */}
        <path
          d="M 46 68 C 25 62 12 48 30 38 C 45 42 46 58 46 68 Z"
          fill="#F59E0B"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Right Wing Petal */}
        <path
          d="M 54 68 C 75 62 88 48 70 38 C 55 42 54 58 54 68 Z"
          fill="#F59E0B"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Base Intersecting Arc */}
        <path
          d="M 28 55 C 35 72 65 72 72 55"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* SANCHAY Futuristic Wordmark */}
      {showText && (
        <span className={`font-display font-extrabold tracking-wider ${currentSize.text} bg-gradient-to-r from-sanchay-navy-900 via-sanchay-navy-800 to-sanchay-gold-600 bg-clip-text text-transparent`}>
          SANCHAY
        </span>
      )}
    </div>
  );
};
