import React from 'react';

export const GradientUserIcon = ({ className = "w-7 h-7" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sanchayUserGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="35%" stopColor="#4F46E5" />
          <stop offset="70%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      
      {/* Outer Circle Ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="url(#sanchayUserGrad)"
        strokeWidth="5"
      />
      
      {/* Head Circle */}
      <circle
        cx="50"
        cy="37"
        r="16"
        stroke="url(#sanchayUserGrad)"
        strokeWidth="5"
      />
      
      {/* Torso / Shoulders Arc */}
      <path
        d="M 16.5 76 C 18.5 56, 32 52.5, 50 52.5 C 68 52.5, 81.5 56, 83.5 76"
        stroke="url(#sanchayUserGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
};
