const fs = require('fs');
const path = require('path');

// Execute compilation by reading python data files or generating the complete array

function makeScheme(params) {
  const isVerified = params.verification_status.toUpperCase() === 'VERIFIED';
  const legacy = params.legacy || false;
  const active = params.active !== undefined ? params.active : true;
  const recommendable = params.recommendable !== undefined ? params.recommendable : (isVerified && !legacy && active);
  const recommendationEnabled = params.recommendation_enabled !== undefined ? params.recommendation_enabled : (isVerified && !legacy && active);

  return {
    scheme_id: params.scheme_id,
    name: {
      en: params.name_en,
      hi: params.name_hi
    },
    short_name: params.short_name,
    ownership: {
      level: params.level,
      state: params.state || null,
      ministry: params.ministry,
      department: params.department || params.ministry
    },
    category: params.category,
    sub_category: params.sub_category,
    scheme_type: params.scheme_type,
    target_groups: params.target_groups || [],
    goals: params.goals || [],
    eligibility: {
      min_age: params.min_age !== undefined ? params.min_age : null,
      max_age: params.max_age !== undefined ? params.max_age : null,
      gender: params.gender || 'all',
      residency: params.residency || 'Resident Indian',
      income_limit: params.income_limit !== undefined ? params.income_limit : null,
      income_unit: params.income_unit || null,
      occupation: params.occupation || [],
      education: params.education || [],
      marital_status: params.marital_status || [],
      disability_requirement: params.disability_requirement || null,
      guardian_required: params.guardian_required !== undefined ? params.guardian_required : null,
      child_age_limit: params.child_age_limit !== undefined ? params.child_age_limit : null,
      special_conditions: params.special_conditions || []
    },
    financial: {
      minimum_contribution: params.minimum_contribution !== undefined ? params.minimum_contribution : null,
      maximum_contribution: params.maximum_contribution !== undefined ? params.maximum_contribution : null,
      contribution_frequency: params.contribution_frequency || null,
      lock_in: params.lock_in || null,
      maturity: params.maturity || null,
      interest_rate: params.interest_rate || null,
      return_type: params.return_type || null
    },
    benefits: {
      summary: params.benefit_summary || '',
      amount: params.benefit_amount || null,
      tax_benefit: params.tax_benefit || null
    },
    liquidity: {
      level: params.liquidity_level || '',
      withdrawal_rules: params.withdrawal_rules || ''
    },
    recommendation: {
      recommendable: recommendable,
      suitable_goals: params.suitable_goals || params.goals || [],
      not_suitable_for: params.not_suitable_for || []
    },
    verification: {
      status: params.verification_status.toUpperCase(),
      last_verified: isVerified ? (params.last_verified || '2026-08-28') : '',
      source_authority: params.source_authority || params.ministry,
      official_url: params.official_url || (isVerified ? 'https://india.gov.in' : null)
    },
    search: {
      keywords: params.keywords || [params.short_name, params.name_en, params.category]
    },
    status: {
      active: active,
      legacy: legacy,
      recommendation_enabled: recommendationEnabled
    }
  };
}

console.log("makeScheme helper initialized.");
