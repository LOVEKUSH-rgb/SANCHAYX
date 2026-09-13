import React from 'react';

export const AVATAR_PRESETS = [
  // ================= MALE AVATARS =================
  {
    id: 'male_1',
    gender: 'male',
    label: 'Arjun',
    title: 'Professional',
    bg: '#0F172A', // Slate 900
    accent: '#059669', // Emerald 600
    // Friendly, professional man with modern side-parted hair and crisp emerald-collared shirt
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#0F172A" />
        {/* Soft Background glow */}
        <circle cx="50" cy="50" r="40" fill="#1E293B" />
        {/* Shoulders / Suit */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#047857" />
        <path d="M42 68L50 82L58 68" fill="#F8FAFC" />
        <path d="M47 74L50 90L53 74" fill="#065F46" />
        {/* Neck */}
        <rect x="44" y="55" width="12" height="15" rx="3" fill="#E0A97E" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="17" ry="19" fill="#EBB38B" />
        {/* Ears */}
        <ellipse cx="32" cy="46" rx="3" ry="5" fill="#E0A97E" />
        <ellipse cx="68" cy="46" rx="3" ry="5" fill="#E0A97E" />
        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
        <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
        <circle cx="43.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        <circle cx="57.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        {/* Eyebrows */}
        <path d="M39 40C41 39 45 39 47 41" stroke="#2B1810" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 41C55 39 59 39 61 40" stroke="#2B1810" strokeWidth="1.8" strokeLinecap="round" />
        {/* Nose */}
        <path d="M50 45V50L52 50.5" stroke="#D18F63" strokeWidth="1.5" strokeLinecap="round" />
        {/* Friendly Smile */}
        <path d="M44 54C46.5 57 53.5 57 56 54" stroke="#8B3A3A" strokeWidth="2" strokeLinecap="round" />
        {/* Hair - Stylish side sweep */}
        <path d="M32 42C32 29 41 24 50 24C60 24 68 28 68 37C68 39 66 42 66 42C64 36 60 33 50 33C42 33 36 37 32 42Z" fill="#1E1612" />
        <path d="M33 37C35 28 44 24 55 24C62 24 67 27 68 34C64 30 58 29 48 30C39 31 35 34 33 37Z" fill="#2E2019" />
      </svg>
    )
  },
  {
    id: 'male_2',
    gender: 'male',
    label: 'Vikram',
    title: 'Intellectual & Glasses',
    bg: '#1E1B4B', // Indigo 950
    accent: '#3B82F6', // Blue 500
    // Distinguished look with sleek rounded glasses and navy blazer
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#1E1B4B" />
        <circle cx="50" cy="50" r="40" fill="#2E2A72" />
        {/* Suit & Collar */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#1E293B" />
        <path d="M38 68L50 84L62 68" fill="#3B82F6" />
        <path d="M43 68L50 78L57 68" fill="#FFFFFF" />
        {/* Neck */}
        <rect x="44" y="55" width="12" height="15" rx="3" fill="#D89A6A" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="17" ry="19" fill="#E2A77A" />
        {/* Ears */}
        <ellipse cx="32" cy="46" rx="3" ry="5" fill="#D89A6A" />
        <ellipse cx="68" cy="46" rx="3" ry="5" fill="#D89A6A" />
        {/* Glasses */}
        <circle cx="43" cy="45" r="5.5" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
        <circle cx="57" cy="45" r="5.5" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
        <line x1="48.5" y1="45" x2="51.5" y2="45" stroke="#F59E0B" strokeWidth="1.8" />
        {/* Eyes behind glasses */}
        <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
        <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
        {/* Eyebrows */}
        <path d="M38 38C41 37 45 37 47 39" stroke="#1A120B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 39C55 37 59 37 62 38" stroke="#1A120B" strokeWidth="1.8" strokeLinecap="round" />
        {/* Nose & Smile */}
        <path d="M50 46V50L52 50.5" stroke="#BF7D4D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 54C47.5 56.5 52.5 56.5 55 54" stroke="#7A3030" strokeWidth="2" strokeLinecap="round" />
        {/* Modern Crop Haircut */}
        <path d="M32 40C32 28 40 23 50 23C60 23 68 28 68 40C68 35 65 30 50 30C35 30 32 35 32 40Z" fill="#1A120B" />
      </svg>
    )
  },
  {
    id: 'male_3',
    gender: 'male',
    label: 'Kabir',
    title: 'Warm Kurta & Neoteric',
    bg: '#064E3B', // Emerald 900
    accent: '#F59E0B', // Amber 500
    // Warm, welcoming expression in elegant saffron/amber bordered bandhgala
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#064E3B" />
        <circle cx="50" cy="50" r="40" fill="#065F46" />
        {/* Bandhgala / Kurta */}
        <path d="M22 88C22 74 33 68 50 68C67 68 78 74 78 88" fill="#F59E0B" />
        <path d="M45 68H55V88H45V68Z" fill="#B45309" />
        <circle cx="50" cy="74" r="1.2" fill="#FDE68A" />
        <circle cx="50" cy="80" r="1.2" fill="#FDE68A" />
        <circle cx="50" cy="86" r="1.2" fill="#FDE68A" />
        {/* Neck */}
        <rect x="44" y="55" width="12" height="15" rx="3" fill="#D99B6E" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="17" ry="19" fill="#EAB085" />
        {/* Ears */}
        <ellipse cx="32" cy="46" rx="3" ry="5" fill="#D99B6E" />
        <ellipse cx="68" cy="46" rx="3" ry="5" fill="#D99B6E" />
        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#1C1917" />
        <circle cx="57" cy="45" r="2.2" fill="#1C1917" />
        <circle cx="43.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        <circle cx="57.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        {/* Eyebrows */}
        <path d="M39 40C41 39 45 39 47 41" stroke="#291A10" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 41C55 39 59 39 61 40" stroke="#291A10" strokeWidth="1.8" strokeLinecap="round" />
        {/* Nose & Smile */}
        <path d="M50 45V50L52 50.5" stroke="#C47E4F" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M43 54C46 58 54 58 57 54" stroke="#881337" strokeWidth="2" strokeLinecap="round" />
        {/* Neat Classic Hair */}
        <path d="M32 40C32 27 41 24 50 24C60 24 68 28 68 39C66 33 60 29 50 29C40 29 34 33 32 40Z" fill="#1C1717" />
        {/* Trimmed subtle beard/stubble */}
        <path d="M39 51C41 57 45 61 50 61C55 61 59 57 61 51" stroke="#885A3C" strokeWidth="1.2" strokeDasharray="1 1.5" fill="none" />
      </svg>
    )
  },
  {
    id: 'male_4',
    gender: 'male',
    label: 'Rohan',
    title: 'Modern & Dynamic',
    bg: '#18181B', // Zinc 900
    accent: '#10B981', // Emerald 500
    // Tech-friendly, crisp posture with emerald polo
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#18181B" />
        <circle cx="50" cy="50" r="40" fill="#27272A" />
        {/* Emerald Polo */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#059669" />
        <path d="M44 68L50 78L56 68" fill="#10B981" />
        <path d="M36 68L44 76L46 68" fill="#047857" />
        <path d="M64 68L56 76L54 68" fill="#047857" />
        {/* Neck */}
        <rect x="44" y="55" width="12" height="15" rx="3" fill="#E5AA7D" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="17" ry="19" fill="#F0B78C" />
        {/* Ears */}
        <ellipse cx="32" cy="46" rx="3" ry="5" fill="#E5AA7D" />
        <ellipse cx="68" cy="46" rx="3" ry="5" fill="#E5AA7D" />
        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#18181B" />
        <circle cx="57" cy="45" r="2.2" fill="#18181B" />
        <circle cx="43.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        <circle cx="57.7" cy="44.3" r="0.7" fill="#FFFFFF" />
        {/* Eyebrows */}
        <path d="M39 40C41 38.5 45 38.5 47 40.5" stroke="#231913" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 40.5C55 38.5 59 38.5 61 40" stroke="#231913" strokeWidth="1.8" strokeLinecap="round" />
        {/* Nose & Smile */}
        <path d="M50 45V50L52 50.5" stroke="#CC8A59" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M44 54C47 57 53 57 56 54" stroke="#881337" strokeWidth="2" strokeLinecap="round" />
        {/* Textured Voluminous Hair */}
        <path d="M32 40C31 29 38 22 47 21C55 21 66 23 68 34C68 39 65 42 65 42C62 34 57 28 48 29C40 30 35 34 32 40Z" fill="#1C140F" />
      </svg>
    )
  },

  // ================= FEMALE AVATARS =================
  {
    id: 'female_1',
    gender: 'female',
    label: 'Ananya',
    title: 'Professional Leader',
    bg: '#0F172A', // Slate 900
    accent: '#10B981', // Emerald 500
    // High-bun professional woman in emerald blazer and delicate earrings
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#0F172A" />
        <circle cx="50" cy="50" r="40" fill="#1E293B" />
        {/* Hair Bun at top */}
        <circle cx="50" cy="21" r="10" fill="#1C140E" />
        {/* Blazer & Top */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#047857" />
        <path d="M38 68L50 83L62 68" fill="#065F46" />
        <path d="M43 68L50 76L57 68" fill="#FEF3C7" />
        {/* Neck */}
        <rect x="45" y="55" width="10" height="15" rx="3" fill="#E8AD82" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#F2BA90" />
        {/* Ears & Pearls */}
        <ellipse cx="33" cy="46" rx="2.5" ry="4.5" fill="#E8AD82" />
        <ellipse cx="67" cy="46" rx="2.5" ry="4.5" fill="#E8AD82" />
        <circle cx="33" cy="48" r="1.5" fill="#F59E0B" />
        <circle cx="67" cy="48" r="1.5" fill="#F59E0B" />
        {/* Eyes & Lashes */}
        <circle cx="43" cy="45" r="2.2" fill="#18181B" />
        <circle cx="57" cy="45" r="2.2" fill="#18181B" />
        <circle cx="43.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        <circle cx="57.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        <path d="M40 43L38 42" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M60 43L62 42" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
        {/* Eyebrows */}
        <path d="M39 39.5C41 38 45 38 47 40" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40C55 38 59 38 61 39.5" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        {/* Nose & Radiant Smile */}
        <path d="M50 45V49L51.5 49.5" stroke="#D39265" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M44 54C46.5 57.5 53.5 57.5 56 54" stroke="#BE185D" strokeWidth="2.2" strokeLinecap="round" />
        {/* Sleek Middle-Part Hair Framing */}
        <path d="M33 42C33 30 40 24 50 24C60 24 67 30 67 42C64 33 58 29 50 31C42 29 36 33 33 42Z" fill="#1C140E" />
      </svg>
    )
  },
  {
    id: 'female_2',
    gender: 'female',
    label: 'Pooja',
    title: 'Intellectual & Confident',
    bg: '#312E81', // Indigo 900
    accent: '#EC4899', // Pink 500
    // Smart glasses, side braid/shoulder hair, confident rose-toned blouse
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#312E81" />
        <circle cx="50" cy="50" r="40" fill="#3730A3" />
        {/* Hair Behind Shoulders */}
        <path d="M30 40C30 55 32 75 34 85C66 85 68 75 70 40" fill="#1E1611" />
        {/* Blouse & Neckline */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#831843" />
        <path d="M40 68L50 78L60 68" fill="#FCE7F3" />
        {/* Neck */}
        <rect x="45" y="55" width="10" height="15" rx="3" fill="#DF9F72" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#ECAE82" />
        {/* Ears */}
        <ellipse cx="33" cy="46" rx="2.5" ry="4.5" fill="#DF9F72" />
        <ellipse cx="67" cy="46" rx="2.5" ry="4.5" fill="#DF9F72" />
        {/* Sleek Golden Frames Glasses */}
        <circle cx="43" cy="45" r="5" stroke="#F59E0B" strokeWidth="1.6" fill="none" />
        <circle cx="57" cy="45" r="5" stroke="#F59E0B" strokeWidth="1.6" fill="none" />
        <line x1="48" y1="45" x2="52" y2="45" stroke="#F59E0B" strokeWidth="1.6" />
        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#1E1611" />
        <circle cx="57" cy="45" r="2.2" fill="#1E1611" />
        {/* Eyebrows */}
        <path d="M39 39C41 37.5 45 37.5 47 39" stroke="#1E1611" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 39C55 37.5 59 37.5 61 39" stroke="#1E1611" strokeWidth="1.5" strokeLinecap="round" />
        {/* Nose & Warm Lip */}
        <path d="M50 45V49L51.5 49.5" stroke="#C88556" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M44 54C46.5 57 53.5 57 56 54" stroke="#9D174D" strokeWidth="2.2" strokeLinecap="round" />
        {/* Front Flowing Hair */}
        <path d="M32 40C32 26 41 23 50 23C59 23 68 26 68 40C66 32 58 27 50 29C42 27 34 32 32 40Z" fill="#291E18" />
      </svg>
    )
  },
  {
    id: 'female_3',
    gender: 'female',
    label: 'Meera',
    title: 'Graceful & Traditional',
    bg: '#831843', // Pink 900
    accent: '#F59E0B', // Amber 500
    // Elegant saree pallu with delicate red bindi and warm friendly expression
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#831843" />
        <circle cx="50" cy="50" r="40" fill="#9D174D" />
        {/* Saree & Pallu */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#047857" />
        <path d="M22 88L45 68L56 88Z" fill="#F59E0B" opacity="0.9" />
        <path d="M42 68L48 88" stroke="#D97706" strokeWidth="1.5" />
        {/* Neck & Necklace */}
        <rect x="45" y="55" width="10" height="15" rx="3" fill="#E8B088" />
        <path d="M45 64C48 67 52 67 55 64" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#F2BC95" />
        {/* Bindi */}
        <circle cx="50" cy="40.5" r="1.3" fill="#BE123C" />
        {/* Ears & Jhumkas */}
        <ellipse cx="33" cy="46" rx="2.5" ry="4.5" fill="#E8B088" />
        <ellipse cx="67" cy="46" rx="2.5" ry="4.5" fill="#E8B088" />
        <circle cx="33" cy="49" r="1.8" fill="#F59E0B" />
        <circle cx="67" cy="49" r="1.8" fill="#F59E0B" />
        {/* Eyes & Kohl */}
        <circle cx="43" cy="45" r="2.2" fill="#1C140E" />
        <circle cx="57" cy="45" r="2.2" fill="#1C140E" />
        <circle cx="43.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        <circle cx="57.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        <path d="M39 46.5C41 47 45 47 47 46.5" stroke="#1C140E" strokeWidth="1" />
        <path d="M53 46.5C55 47 59 47 61 46.5" stroke="#1C140E" strokeWidth="1" />
        {/* Eyebrows */}
        <path d="M39 39.5C41 38 45 38 47 40" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40C55 38 59 38 61 39.5" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        {/* Nose & Smile */}
        <path d="M50 45V49L51.5 49.5" stroke="#C98B60" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M43.5 54C46.5 58 53.5 58 56.5 54" stroke="#9F1239" strokeWidth="2.2" strokeLinecap="round" />
        {/* Hair with center part and jasmine gajra hint */}
        <path d="M33 42C33 28 40 23 50 23C60 23 67 28 67 42C64 32 58 27 50 29C42 27 36 32 33 42Z" fill="#1C140E" />
        <circle cx="35" cy="27" r="2" fill="#FEF3C7" />
        <circle cx="65" cy="27" r="2" fill="#FEF3C7" />
      </svg>
    )
  },
  {
    id: 'female_4',
    gender: 'female',
    label: 'Neha',
    title: 'Modern & Approachable',
    bg: '#14532D', // Green 900
    accent: '#34D399', // Emerald 400
    // Chic bob hairstyle with modern teal-collared jacket
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#14532D" />
        <circle cx="50" cy="50" r="40" fill="#166534" />
        {/* Modern Jacket */}
        <path d="M22 88C22 75 34 68 50 68C66 68 78 75 78 88" fill="#0E7490" />
        <path d="M40 68L50 82L60 68" fill="#06B6D4" />
        <path d="M45 68L50 75L55 68" fill="#FFFFFF" />
        {/* Neck */}
        <rect x="45" y="55" width="10" height="15" rx="3" fill="#E5AA80" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#F0B891" />
        {/* Ears */}
        <ellipse cx="33" cy="46" rx="2.5" ry="4.5" fill="#E5AA80" />
        <ellipse cx="67" cy="46" rx="2.5" ry="4.5" fill="#E5AA80" />
        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#1E1611" />
        <circle cx="57" cy="45" r="2.2" fill="#1E1611" />
        <circle cx="43.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        <circle cx="57.6" cy="44.2" r="0.7" fill="#FFFFFF" />
        {/* Eyebrows */}
        <path d="M39 39.5C41 38 45 38 47 40" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 40C55 38 59 38 61 39.5" stroke="#251810" strokeWidth="1.5" strokeLinecap="round" />
        {/* Nose & Smile */}
        <path d="M50 45V49L51.5 49.5" stroke="#CC895C" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M44 54C46.5 57 53.5 57 56 54" stroke="#BE123C" strokeWidth="2.2" strokeLinecap="round" />
        {/* Bob Cut with Side Part */}
        <path d="M31 46C30 33 38 23 48 23C58 23 68 28 69 44C69 48 68 53 66 55C65 42 61 31 50 30C39 31 34 38 31 46Z" fill="#1E1611" />
      </svg>
    )
  },

  // ================= NEUTRAL FALLBACK =================
  {
    id: 'neutral_1',
    gender: 'neutral',
    label: 'Citizen',
    title: 'Sovereign Citizen',
    bg: '#0F172A',
    accent: '#10B981',
    render: (size = '100%') => (
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
        <circle cx="50" cy="50" r="46" fill="#0F172A" />
        <circle cx="50" cy="50" r="40" fill="#1E293B" />
        <path d="M24 88C24 74 35 68 50 68C65 68 76 74 76 88" fill="#059669" />
        <circle cx="50" cy="46" r="16" fill="#F1B68C" />
        <circle cx="44" cy="45" r="2.2" fill="#0F172A" />
        <circle cx="56" cy="45" r="2.2" fill="#0F172A" />
        <path d="M45 54C47 56.5 53 56.5 55 54" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
];

export const MALE_AVATARS = AVATAR_PRESETS.filter(a => a.gender === 'male');
export const FEMALE_AVATARS = AVATAR_PRESETS.filter(a => a.gender === 'female');

export const getAvatarById = (id) => {
  if (!id) return null;
  return AVATAR_PRESETS.find(a => a.id === id) || null;
};

export const getDefaultAvatarForUser = (user) => {
  if (!user) return AVATAR_PRESETS[0];

  // If user already has an explicit avatar_id that exists
  if (user.avatar_id) {
    const found = getAvatarById(user.avatar_id);
    if (found) return found;
  }

  const gender = (user.gender || '').trim().toLowerCase();
  const seedStr = user.user_id || user.email || user.full_name || 'sanchay';
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash);

  if (gender === 'female') {
    return FEMALE_AVATARS[index % FEMALE_AVATARS.length];
  } else if (gender === 'male') {
    return MALE_AVATARS[index % MALE_AVATARS.length];
  }

  return AVATAR_PRESETS[index % AVATAR_PRESETS.length];
};
