import React from 'react';

export const SAKHI_LOGO_IMAGE = '/@fs/C:/Users/Yash Srivastava/.gemini/antigravity-ide/brain/a86d881c-5ad3-435f-8040-b5f50e6436db/.user_uploaded/media_1787931513019.png';

export const SakhiAvatar = ({ size = 'md', showStatus = true, className = '', isStreaming = false }) => {
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
      <div className={`${currentSize.container} rounded-full p-0.5 bg-gradient-to-tr from-sanchay-emerald-600 via-sanchay-gold-500 to-sanchay-emerald-500 shadow-sm relative overflow-hidden group ${isStreaming ? 'animate-pulse' : ''}`}>
        
        {/* Sakhi Official Avatar Image */}
        <img
          src={SAKHI_LOGO_IMAGE}
          alt="Sakhi - Sanchay Verified Scheme Assistant"
          className="w-full h-full rounded-full object-cover object-center bg-white"
        />
      </div>

      {/* Online Status Indicator */}
      {showStatus && (
        <span 
          className={`absolute bottom-0 right-0 ${currentSize.status} bg-emerald-500 border-2 border-white rounded-full shadow-xs animate-pulse-subtle`}
          title="Sakhi is Online"
        />
      )}
    </div>
  );
};
