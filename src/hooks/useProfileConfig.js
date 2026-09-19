import { useMemo } from 'react';
import { MOCK_SCHEMES } from '../data/mockSchemes';

function getRequiredProfileFields(schemes) {
  const config = {
    showSavingFor: true,
    showChildAge: true,
    showGuardian: true,
    showPersona: true,
    showAge: true,
    showGender: true,
    showResidency: true,
    showState: true,
    showOccupation: true,
    showIncome: true,
  };

  if (!schemes || schemes.length === 0) {
    return config; // Default fallback shows everything
  }

  let anyIncomeLimit = false;
  let anySpecificOcc = false;
  let requiresMinors = false;
  let allSameGender = true;
  let requiredGender = null;
  let anyStateReq = false;

  schemes.forEach((scheme, index) => {
    const elig = scheme.eligibility || {};
    
    if (elig.income_limit !== null && elig.income_limit !== undefined) {
      anyIncomeLimit = true;
    }
    
    const occs = elig.occupation || [];
    const excl = elig.excluded_occupations || [];
    const hasSpecificOccs = occs.length > 0 && !occs.every(o => ['any', 'all', ''].includes(String(o).toLowerCase()));
    if (hasSpecificOccs || excl.length > 0) {
      anySpecificOcc = true;
    }

    if (elig.guardian_required === true || (typeof elig.min_age === 'number' && elig.min_age < 18)) {
      requiresMinors = true;
    }
    
    if (index === 0) {
       requiredGender = elig.gender && elig.gender.length === 1 ? elig.gender[0].toLowerCase() : 'mixed';
    } else if (requiredGender !== 'mixed') {
       const thisGender = elig.gender && elig.gender.length === 1 ? elig.gender[0].toLowerCase() : 'mixed';
       if (thisGender !== requiredGender) {
          allSameGender = false;
       }
    }

    const sStateRaw = elig.state || elig.states;
    if (sStateRaw && (Array.isArray(sStateRaw) ? sStateRaw.length > 0 : String(sStateRaw).trim() !== '')) {
      anyStateReq = true;
    }
  });

  if (!anyIncomeLimit) config.showIncome = false;
  if (!anySpecificOcc) config.showOccupation = false;
  if (!anyStateReq) config.showState = false; // We can hide State if no scheme requires it
  
  if (allSameGender && requiredGender !== 'mixed' && requiredGender !== 'any' && requiredGender !== 'all') {
     config.showGender = false;
  }

  if (!requiresMinors) {
    config.showSavingFor = false;
    config.showChildAge = false;
    config.showGuardian = false;
  }

  return config;
}

export function useProfileConfig(searchParams) {
  const schemeId = searchParams.get('schemeId');
  const persona = searchParams.get('persona');

  return useMemo(() => {
    let activeSchemes = [];

    if (schemeId) {
      // Specific Scheme Mode
      const scheme = MOCK_SCHEMES.find(s => s.id === schemeId || s.scheme_id === schemeId);
      if (scheme) {
        activeSchemes = [scheme];
      }
    } else if (persona) {
      // Category Mode
      activeSchemes = MOCK_SCHEMES.filter(s => {
        const catStr = (s.category || '').toLowerCase();
        const subCatStr = (s.sub_category || '').toLowerCase();
        const elig = s.eligibility || {};
        
        if (persona === 'seniors') return catStr.includes('social security') || subCatStr.includes('pension');
        if (persona === 'women') return catStr.includes('women') || elig?.woman_specific;
        if (persona === 'rural') return catStr.includes('farmer') || catStr.includes('rural');
        if (persona === 'workers') return catStr.includes('business') || catStr.includes('msme') || catStr.includes('employment');
        return true; 
      });
    } else {
      // General Mode
      activeSchemes = MOCK_SCHEMES;
    }

    return getRequiredProfileFields(activeSchemes);
  }, [schemeId, persona]);
}
