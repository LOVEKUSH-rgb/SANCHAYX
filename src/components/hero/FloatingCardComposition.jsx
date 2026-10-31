import React from 'react';
import { SovereignVault3D } from './SovereignVault3D';

export const FloatingCardComposition = () => {
  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] xl:h-[620px] flex items-center justify-center">
      {/* Background Subtle Sage & Warm Gold Ambient Radial Glow */}
      <div className="absolute w-[300px] sm:w-[400px] lg:w-[480px] h-[300px] sm:h-[400px] lg:h-[480px] bg-gradient-to-br from-[#E7F1EB] via-[#D5E4DC]/40 to-[#FEF3C7]/30 rounded-full blur-[70px] -z-10 pointer-events-none" />

      {/* Prominent, Centered 3D Sovereign Vault Illustration */}
      <div className="w-full h-full flex items-center justify-center relative">
        <SovereignVault3D />
      </div>
    </div>
  );
};
