import React, { useState } from 'react';
import sakhiAvatarPng from '../../assets/sakhi-avatar.png';

export const SAKHI_LOGO_IMAGE = sakhiAvatarPng || '/sakhi-avatar.png';

export const SakhiAvatar = ({ size = 'md', showStatus = true, className = '', isStreaming = false }) => {
  const [hasError, setHasError] = useState(false);

  const sizeMap = {
    sm: { container: 'w-8 h-8', status: 'w-2.5 h-2.5', badge: 'w-3 h-3' },
    md: { container: 'w-11 h-11', status: 'w-3.5 h-3.5', badge: 'w-4 h-4' },
    lg: { container: 'w-14 h-14', status: 'w-4 h-4', badge: 'w-5 h-5' },
    xl: { container: 'w-20 h-20', status: 'w-5 h-5', badge: 'w-6 h-6' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative inline-block ${className}`} data-cursor="sakhi">
      {/* Outer Emerald-Gold Frame */}
      <div className={`${currentSize.container} rounded-full p-0.5 bg-gradient-to-tr from-emerald-600 via-amber-400 to-emerald-500 shadow-sm relative overflow-hidden group ${isStreaming ? 'animate-pulse' : ''}`}>
        
        {/* Sakhi Official Avatar Image */}
        {!hasError ? (
          <img
            src={SAKHI_LOGO_IMAGE}
            alt="Sakhi - Sanchay Verified Scheme Assistant"
            className="w-full h-full rounded-full object-cover object-center bg-emerald-50"
            onError={() => setHasError(true)}
          />
        ) : (
          /* Graceful SVG Fallback of Sakhi with emerald attire and bindi */
          <div className="w-full h-full rounded-full bg-gradient-to-b from-emerald-800 to-emerald-950 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" fill="#064E3B" />
              {/* Saree drape */}
              <path d="M15 95 C20 72 35 65 50 65 C65 65 80 72 85 95 Z" fill="#047857" />
              <path d="M35 65 L50 82 L65 65" fill="#F59E0B" />
              {/* Neck */}
              <rect x="45" y="52" width="10" height="15" rx="3" fill="#E8AD82" />
              {/* Face */}
              <ellipse cx="50" cy="42" rx="16" ry="18" fill="#F2BA90" />
              {/* Hair bun */}
              <circle cx="50" cy="18" r="9" fill="#1C140E" />
              {/* Hair strands */}
              <path d="M34 40 C34 26 40 22 50 22 C60 22 66 26 66 40 C63 31 58 27 50 28 C42 27 37 31 34 40 Z" fill="#1C140E" />
              {/* Bindi */}
              <circle cx="50" cy="36" r="1.8" fill="#DC2626" />
              {/* Eyes */}
              <circle cx="43" cy="42" r="2" fill="#18181B" />
              <circle cx="57" cy="42" r="2" fill="#18181B" />
              <circle cx="43.5" cy="41.3" r="0.6" fill="#FFFFFF" />
              <circle cx="57.5" cy="41.3" r="0.6" fill="#FFFFFF" />
              {/* Smile */}
              <path d="M45 50 C47.5 53 52.5 53 55 50" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
              {/* Small Gold Earrings */}
              <circle cx="34" cy="44" r="1.5" fill="#F59E0B" />
              <circle cx="66" cy="44" r="1.5" fill="#F59E0B" />
            </svg>
          </div>
        )}
      </div>

      {/* Online Status Indicator */}
      {showStatus && (
        <span 
          className={`absolute bottom-0 right-0 ${currentSize.status} bg-emerald-500 border-2 border-white rounded-full shadow-xs animate-pulse`}
          title="Sakhi is Online"
        />
      )}
    </div>
  );
};
