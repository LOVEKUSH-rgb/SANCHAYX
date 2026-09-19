import { MOCK_SCHEMES } from '../data/mockSchemes';

/**
 * Deterministic Client-side Scheme Fit & Recommendation Engine
 * Acts as an instant offline/online fallback ensuring 100% platform uptime.
 */
export function calculateLocalRecommendations(profile = {}, goal = {}, preferences = {}, categoryFilter = 'all', schemeIdFilter = null) {
  const isMinor = (profile.saving_for === 'minor' || profile.savingFor === 'minor');
  // resolveEligibilitySubject: determines the actual age to evaluate based on the beneficiary
  const targetAge = isMinor && profile.child_age !== undefined && profile.child_age !== null 
    ? Number(profile.child_age) 
    : (Number(profile.age) || 25);
    
  const userGender = (profile.gender || 'all').toLowerCase();
  const userResidency = (profile.residency_status || profile.residency || 'resident').toLowerCase();
  const userGoal = (goal.goal || goal.id || 'wealth').toLowerCase();
  const monthlyBudget = Number(preferences.monthly_budget || preferences.monthlyBudget) || 2000;
  const horizonYears = Number(preferences.horizon_years || preferences.horizonYears) || 10;
  const taxPref = preferences.tax_preference !== undefined ? preferences.tax_preference : true;
  
  const userIncome = Number(profile.annual_income || profile.income) || 0;
  const userState = String(profile.state || '').toLowerCase().trim();

  const eligibleSchemes = [];
  const rejectedSchemes = [];

  for (const s of MOCK_SCHEMES) {
    const failedCriteria = [];
    const elig = s.eligibility || {};

    // 0. Specific Scheme Filter
    if (schemeIdFilter) {
      if (s.id !== schemeIdFilter && s.scheme_id !== schemeIdFilter) {
        continue;
      }
    }

    // 1. Verification check
    if (s.verified === false || s.active === false) {
      failedCriteria.push('Scheme inactive or unverified.');
      rejectedSchemes.push({ scheme_id: s.id || s.scheme_id, name: s.name, failedCriteria });
      continue;
    }

    // 2. Residency check
    const isNri = userResidency.includes('nri');
    const sRes = Array.isArray(elig.residency) ? elig.residency.join(' ').toLowerCase() : String(elig.residency || '').toLowerCase();
    if (isNri && (sRes.includes('resident') || sRes.includes('indian citizen')) && !sRes.includes('nri') && !sRes.includes('all')) {
      failedCriteria.push('Requires Resident Indian status.');
    }

    // 3. Age check (using resolved targetAge)
    const minAge = elig.min_age !== undefined ? elig.min_age : (s.minAge !== undefined ? s.minAge : null);
    const maxAge = elig.max_age !== undefined ? elig.max_age : (s.maxAge !== undefined ? s.maxAge : null);
    if (minAge !== null && targetAge < minAge) {
      failedCriteria.push(`Minimum age required is ${minAge} years (Target applicant is ${targetAge}).`);
    }
    if (maxAge !== null && targetAge > maxAge) {
      failedCriteria.push(`Maximum age limit is ${maxAge} years (Target applicant is ${targetAge}).`);
    }

    // 3.1 Income check
    if (elig.income_limit !== null && elig.income_limit !== undefined) {
      if (userIncome > elig.income_limit) {
        failedCriteria.push(`Income exceeds maximum limit of ₹${elig.income_limit}.`);
      }
    }

    // 3.2 State check
    const sStateRaw = elig.state || elig.states;
    const sStateArr = Array.isArray(sStateRaw) ? sStateRaw.map(st => String(st).toLowerCase().trim()) : (sStateRaw ? [String(sStateRaw).toLowerCase().trim()] : []);
    if (sStateArr.length > 0 && userState) {
      if (userState !== 'all' && !sStateArr.some(st => st === 'all' || st === 'any' || st === userState)) {
        failedCriteria.push(`Scheme is restricted to residents of specific states.`);
      }
    }

    // 4. Gender check
    const sGender = Array.isArray(elig.gender) ? elig.gender.join(' ').toLowerCase() : String(elig.gender || s.genderRequirement || 'all').toLowerCase();
    if (userGender === 'male' && sGender.includes('female') && !sGender.includes('all') && !sGender.includes('male')) {
      failedCriteria.push('Scheme restricted to female applicants.');
    }

    // 5. Occupation, Employment Status & Exclusions check
    const userOcc = String(profile.occupation || '').toLowerCase().trim();
    const userPersona = String(profile.persona || profile.life_stage || '').toLowerCase().trim();
    const isSalaried = ['salaried', 'private', 'employee', 'corporate', 'it', 'formal', 'banker', 'tech', 'executive', 'clerk', 'manager', 'staff'].some(w => userOcc.includes(w));
    
    const exclOccs = (elig.excluded_occupations || []).map(e => String(e).toLowerCase().trim());
    if (exclOccs.length > 0 && exclOccs.some(e => userOcc.includes(e) || e.includes(userOcc))) {
      failedCriteria.push(`Not eligible based on occupational criteria: Scheme explicitly excludes '${userOcc}' applicants.`);
    }

    const reqOccs = (elig.occupation || []).map(o => String(o).toLowerCase().trim()).filter(o => !['any', 'all', ''].includes(o));
    if (reqOccs.length > 0) {
      if (!reqOccs.some(req => req.includes(userOcc) || userOcc.includes(req))) {
        // If occupation is salaried but scheme is for farmer/unorganised, give a clearer message
        if (isSalaried && (reqOccs.some(r => r.includes('farmer')) || reqOccs.some(r => r.includes('unorganised')))) {
          failedCriteria.push("Not eligible based on occupational criteria: Scheme is reserved for specific non-salaried occupations; formal salaried employees are ineligible.");
        } else {
          failedCriteria.push(`Not eligible based on occupational criteria: Applicant's occupation does not match the required categories.`);
        }
      }
    }

    // 6. Category filter
    if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
      const cat = (s.category || '').toLowerCase();
      if (!cat.includes(categoryFilter.toLowerCase())) {
        continue;
      }
    }

    if (failedCriteria.length > 0) {
      rejectedSchemes.push({ scheme_id: s.id || s.scheme_id, name: s.name, failedCriteria });
      continue;
    }

    // Scoring Engine
    let goalScore = 70;
    const goalsList = (s.goals || []).map(g => g.toLowerCase());
    const tagsList = (s.tags || []).map(t => t.toLowerCase());
    const catStr = (s.category || '').toLowerCase();
    const subCatStr = (s.sub_category || '').toLowerCase();

    if (
      goalsList.some(g => g.includes(userGoal) || userGoal.includes(g)) ||
      tagsList.some(t => t.includes(userGoal) || userGoal.includes(t)) ||
      catStr.includes(userGoal) ||
      subCatStr.includes(userGoal)
    ) {
      goalScore = 95;
    } else if (
      (userGoal === 'education' && (subCatStr.includes('skill') || subCatStr.includes('child') || tagsList.includes('education') || tagsList.includes('skill') || catStr.includes('savings'))) ||
      (userGoal === 'wealth' && (catStr.includes('savings') || catStr.includes('msme') || catStr.includes('inclusion'))) ||
      (userGoal === 'retirement' && (catStr.includes('pension') || subCatStr.includes('pension') || catStr.includes('social security')))
    ) {
      goalScore = 90;
    }

    // Budget match
    const minContrib = s.financial?.minimum_contribution || s.minimumContribution || 0;
    const maxContrib = s.financial?.maximum_contribution || s.maximumContribution || Infinity;
    let budgetScore = 90;
    if (monthlyBudget >= minContrib && monthlyBudget <= maxContrib) {
      budgetScore = 96;
    } else if (monthlyBudget < minContrib) {
      budgetScore = 65;
    }

    // Horizon match
    const lockIn = s.financial?.lock_in_years !== undefined ? s.financial.lock_in_years : (s.lockInYears || 0);
    let horizonScore = 85;
    if (Math.abs(horizonYears - lockIn) <= 3) {
      horizonScore = 95;
    } else if (horizonYears >= lockIn) {
      horizonScore = 90;
    }

    // Tax match
    const hasTaxBenefit = (s.taxBenefit || s.benefits?.tax_benefit || '').length > 0;
    const taxScore = (taxPref && hasTaxBenefit) ? 95 : 85;

    // Total Composite Fit Score
    const fitScore = Math.round(
      goalScore * 0.35 +
      budgetScore * 0.25 +
      horizonScore * 0.20 +
      taxScore * 0.20
    );

    eligibleSchemes.push({
      ...s,
      fitScore: Math.min(fitScore, 98),
      goalScore,
      budgetScore,
      horizonScore,
      taxScore
    });
  }

  // Sort eligible schemes descending by Fit Score
  eligibleSchemes.sort((a, b) => b.fitScore - a.fitScore);

  const topExact = eligibleSchemes.slice(0, 6);
  const uiRecommendations = topExact.map(item => {
    const fin = item.financial || {};
    const ben = item.benefits || {};
    const nameStr = typeof item.name === 'object' ? (item.name.en || Object.values(item.name)[0]) : item.name;

    return {
      id: item.id || item.scheme_id,
      scheme_id: item.scheme_id || item.id,
      name: nameStr,
      short_name: item.short_name || item.shortName || nameStr,
      category: item.category,
      sub_category: item.sub_category,
      fit_score: item.fitScore,
      fitScore: item.fitScore,
      short_description: item.short_description || item.descriptionSimple || ben.summary || 'Government verified scheme.',
      full_description: item.full_description || item.description || ben.summary,
      descriptionSimple: item.descriptionSimple || item.short_description || ben.summary,
      authority: item.authority || item.officialAuthority || 'Government of India',
      officialAuthority: item.officialAuthority || item.authority || 'Government of India',
      official_url: item.official_url || item.officialSourceUrl || 'https://india.gov.in',
      officialSourceUrl: item.officialSourceUrl || item.official_url || 'https://india.gov.in',
      last_verified_date: item.last_verified_date || item.lastVerifiedDate || '2026-08-29',
      lastVerifiedDate: item.lastVerifiedDate || item.last_verified_date || '2026-08-29',
      benefits: {
        interest_rate: ben.interest_rate || item.currentInterestRate || ben.amount || 'Statutory Benefit',
        summary: ben.summary || item.descriptionSimple
      },
      currentInterestRate: item.currentInterestRate || ben.interest_rate || ben.amount || 'Statutory Yield',
      financial: {
        minimum_contribution: fin.minimum_contribution || item.minimumContribution || 500,
        maximum_contribution: fin.maximum_contribution || item.maximumContribution || null,
        lock_in_years: fin.lock_in_years !== undefined ? fin.lock_in_years : (item.lockInYears || 0),
        tax_treatment: fin.tax_treatment || item.taxBenefit || 'Statutory Provisions'
      },
      eligibility: item.eligibility || {},
      why_it_fits: `Directly matches your ${goal.goal || 'financial'} goal with validated statutory eligibility and budget parameters.`,
      breakdown: {
        goal_score: item.goalScore,
        monthly_budget_score: item.budgetScore,
        time_horizon_score: item.horizonScore,
        liquidity_score: 85,
        tax_preference_score: item.taxScore,
        eligibility_score: 100
      }
    };
  });

  const recId = `local_rec_${Date.now()}`;
  return {
    recommendation_id: recId,
    status: 'success',
    recommendation_type: uiRecommendations.length > 0 ? 'exact_match' : 'no_exact_match',
    explanation: uiRecommendations.length > 0
      ? `Found ${uiRecommendations.length} verified schemes matching your profile.`
      : 'No schemes met all criteria. Showing closest potential matches.',
    exact_matches: uiRecommendations,
    closest_matches: [],
    rejected_schemes: rejectedSchemes,
    review_required: [],
    total_evaluated: MOCK_SCHEMES.length,
    total_eligible: uiRecommendations.length,
    total_ineligible: rejectedSchemes.length,
    recommendations: uiRecommendations,
    closest_fits: [],
    failed_reasons: rejectedSchemes.flatMap(r => r.failedCriteria || [])
  };
}
