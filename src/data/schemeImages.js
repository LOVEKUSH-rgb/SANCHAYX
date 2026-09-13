import schemePaths from '../scheme_images.paths.json';

// Mapping of scheme IDs and aliases to official SVG artwork in /public/schemes/
export const SCHEME_SVG_MAP = {
  // 15 Standard Schemes
  'sc-emp-001': '/schemes/mgnrega_001.svg',
  mgnrega: '/schemes/mgnrega_001.svg',
  mgnrega_001: '/schemes/mgnrega_001.svg',

  'sc-emp-002': '/schemes/edu_pm_yasasvi_001.svg',
  'ddu-gky': '/schemes/edu_pm_yasasvi_001.svg',
  ddugky: '/schemes/edu_pm_yasasvi_001.svg',

  'sc-emp-003': '/schemes/pmkvy_001.svg',
  pmkvy: '/schemes/pmkvy_001.svg',
  pmkvy_001: '/schemes/pmkvy_001.svg',

  'sc-emp-004': '/schemes/standupindia_001.svg',
  pmegp: '/schemes/standupindia_001.svg',

  'sc-biz-005': '/schemes/pmsvanidhi_001.svg',
  pmsvanidhi: '/schemes/pmsvanidhi_001.svg',
  pmsvanidhi_001: '/schemes/pmsvanidhi_001.svg',
  svanidhi: '/schemes/pmsvanidhi_001.svg',

  'sc-biz-006': '/schemes/pmvishwakarma_001.svg',
  pmvishwakarma: '/schemes/pmvishwakarma_001.svg',
  pmvishwakarma_001: '/schemes/pmvishwakarma_001.svg',
  vishwakarma: '/schemes/pmvishwakarma_001.svg',

  'sc-biz-007': '/schemes/mudra_001.svg',
  pmmy: '/schemes/mudra_001.svg',
  mudra: '/schemes/mudra_001.svg',
  mudra_001: '/schemes/mudra_001.svg',

  'sc-biz-008': '/schemes/standupindia_001.svg',
  cgtmse: '/schemes/standupindia_001.svg',

  'sc-biz-009': '/schemes/eshram_001.svg',
  'day-nulm': '/schemes/eshram_001.svg',
  nulm: '/schemes/eshram_001.svg',

  'sc-ss-010': '/schemes/pmsym_001.svg',
  'pm-sym': '/schemes/pmsym_001.svg',
  pmsym: '/schemes/pmsym_001.svg',
  pmsym_001: '/schemes/pmsym_001.svg',

  'sc-ss-011': '/schemes/nps_traders_001.svg',
  'nps-traders': '/schemes/nps_traders_001.svg',
  nps_traders_001: '/schemes/nps_traders_001.svg',

  'sc-ss-012': '/schemes/pmjjby_001.svg',
  pmjjby: '/schemes/pmjjby_001.svg',
  pmjjby_001: '/schemes/pmjjby_001.svg',

  'sc-ss-013': '/schemes/pmsby_001.svg',
  pmsby: '/schemes/pmsby_001.svg',
  pmsby_001: '/schemes/pmsby_001.svg',

  'sc-fi-014': '/schemes/pmjdy_001.svg',
  pmjdy: '/schemes/pmjdy_001.svg',
  pmjdy_001: '/schemes/pmjdy_001.svg',

  'sc-ss-015': '/schemes/pmkmy_001.svg',
  'pm-kmy': '/schemes/pmkmy_001.svg',
  pmkmy: '/schemes/pmkmy_001.svg',
  pmkmy_001: '/schemes/pmkmy_001.svg',

  // Core Small Savings & Pension
  ppf: '/schemes/ppf_001.svg',
  ppf_001: '/schemes/ppf_001.svg',
  ssy: '/schemes/ssy_001.svg',
  ssy_001: '/schemes/ssy_001.svg',
  scss: '/schemes/scss_001.svg',
  scss_001: '/schemes/scss_001.svg',
  nsc: '/schemes/nsc_001.svg',
  nsc_001: '/schemes/nsc_001.svg',
  kvp: '/schemes/kvp_001.svg',
  kvp_001: '/schemes/kvp_001.svg',
  apy: '/schemes/apy_001.svg',
  apy_001: '/schemes/apy_001.svg',
  pomis: '/schemes/pomis_001.svg',
  pomis_001: '/schemes/pomis_001.svg',
  nps: '/schemes/nps_001.svg',
  nps_001: '/schemes/nps_001.svg',
  fin_nps_001: '/schemes/nps_001.svg',
  fin_sgb_001: '/schemes/fin_sgb_001.svg',
  pmvvy_001: '/schemes/pmvvy_001.svg',
  wmn_mssc_001: '/schemes/wmn_mssc_001.svg',
  pmkisan_001: '/schemes/pmkisan_001.svg',
  pmfby_001: '/schemes/pmfby_001.svg',
  pmjay_001: '/schemes/pmjay_001.svg',
  pmay_u_001: '/schemes/pmay_u_001.svg',
  pmay_g_001: '/schemes/pmay_g_001.svg',
  pmmvy_001: '/schemes/pmmvy_001.svg',
  bbbp_001: '/schemes/bbbp_001.svg',
  kcc_001: '/schemes/kcc_001.svg',
  eshram_001: '/schemes/eshram_001.svg',
  epf_001: '/schemes/epf_001.svg',
  eps_001: '/schemes/eps_001.svg',
  standupindia_001: '/schemes/standupindia_001.svg'
};

// Export individual structure for backwards compatibility
export const SCHEME_IMAGES = Object.fromEntries(
  Object.entries(SCHEME_SVG_MAP).map(([key, svgUrl]) => [
    key,
    {
      url: svgUrl,
      alt: key.toUpperCase(),
      caption: 'Official Verified Scheme Vector',
      fitMode: 'contain'
    }
  ])
);

export const LIFE_STAGE_IMAGES = {
  student: {
    url: '/schemes/edu_pmrf_001.svg',
    alt: 'Students & Early Savers',
    title: 'Students & Early Savers',
    goal: 'Build first savings habit with low minimum contributions'
  },
  first_job: {
    url: '/schemes/ppf_001.svg',
    alt: 'Young Professionals',
    title: 'Young Professionals',
    goal: 'Save taxes under Section 80C & start compounding'
  },
  young_professional: {
    url: '/schemes/ppf_001.svg',
    alt: 'Young Professionals',
    title: 'Young Professionals',
    goal: 'Save taxes under Section 80C & start compounding'
  },
  family: {
    url: '/schemes/ssy_001.svg',
    alt: 'Parents & Families',
    title: 'Parents & Families',
    goal: 'Secure child education, emergency cashflow & life cover'
  },
  parent: {
    url: '/schemes/ssy_001.svg',
    alt: 'Parents & Families',
    title: 'Parents & Families',
    goal: 'Create dedicated SSY or PPF corpus for higher studies'
  },
  parents: {
    url: '/schemes/ssy_001.svg',
    alt: 'Parents & Families',
    title: 'Parents & Families',
    goal: 'Create dedicated SSY or PPF corpus for higher studies'
  },
  retirement: {
    url: '/schemes/scss_001.svg',
    alt: 'Senior Citizens & Retirees',
    title: 'Senior Citizens & Retirees',
    goal: 'Guarantee quarterly payouts with 100% capital safety'
  },
  seniors: {
    url: '/schemes/scss_001.svg',
    alt: 'Senior Citizens & Retirees',
    title: 'Senior Citizens & Retirees',
    goal: 'Guarantee quarterly payouts with 100% capital safety'
  },
  farmers: {
    url: '/schemes/pmkisan_001.svg',
    alt: 'Farmers & Rural Producers',
    title: 'Farmers & Rural Producers',
    goal: 'Access crop insurance, financial assistance and farm growth schemes'
  },
  workers: {
    url: '/schemes/pmsym_001.svg',
    alt: 'Gig & Unorganised Workers',
    title: 'Gig & Unorganised Workers',
    goal: 'Build financial stability with social security and pension support'
  }
};

export const EDITORIAL_FEATURE_IMAGES = {
  wealth: {
    url: '/schemes/ppf_001.svg',
    alt: 'Long-term wealth and sovereign compounding',
    title: 'Building Long-term Wealth'
  },
  child: {
    url: '/schemes/ssy_001.svg',
    alt: 'Child education and guaranteed financial security',
    title: "Saving for your child's future"
  },
  retirement_card: {
    url: '/schemes/apy_001.svg',
    alt: 'Serene senior retirement and assured monthly pension',
    title: 'Planning retirement'
  },
  emergency: {
    url: '/schemes/pomis_001.svg',
    alt: 'Liquid emergency savings and safe fixed returns',
    title: 'Building emergency savings'
  },
  protection: {
    url: '/schemes/pmjjby_001.svg',
    alt: 'Family protection and tax-saving deductions under 80C',
    title: 'Tax Saving (80C / 80CCD)'
  }
};

export const SCROLL_STORY_IMAGES = {
  understand: '/schemes/ppf_001.svg',
  choose: '/schemes/ssy_001.svg',
  grow: '/schemes/scss_001.svg'
};

const SCHEME_ID_ALIAS = {
  ppf: 'ppf_001',
  ssy: 'ssy_001',
  nsc: 'nsc_001',
  apy: 'apy_001',
  kvp: 'kvp_001',
  scss: 'scss_001',
  pomis: 'pomis_001',
  nps: 'nps_001',
  mgnrega: 'mgnrega_001',
  'sc-emp-001': 'mgnrega_001',
  'sc-emp-002': 'edu_pm_yasasvi_001',
  ddugky: 'edu_pm_yasasvi_001',
  'ddu-gky': 'edu_pm_yasasvi_001',
  'sc-emp-003': 'pmkvy_001',
  pmkvy: 'pmkvy_001',
  'sc-emp-004': 'standupindia_001',
  pmegp: 'standupindia_001',
  'sc-biz-005': 'pmsvanidhi_001',
  pmsvanidhi: 'pmsvanidhi_001',
  svanidhi: 'pmsvanidhi_001',
  'sc-biz-006': 'pmvishwakarma_001',
  pmvishwakarma: 'pmvishwakarma_001',
  vishwakarma: 'pmvishwakarma_001',
  'sc-biz-007': 'mudra_001',
  pmmy: 'mudra_001',
  mudra: 'mudra_001',
  'sc-biz-008': 'standupindia_001',
  cgtmse: 'standupindia_001',
  'sc-biz-009': 'eshram_001',
  'day-nulm': 'eshram_001',
  nulm: 'eshram_001',
  'sc-ss-010': 'pmsym_001',
  'pm-sym': 'pmsym_001',
  pmsym: 'pmsym_001',
  'sc-ss-011': 'nps_traders_001',
  'nps-traders': 'nps_traders_001',
  'sc-ss-012': 'pmjjby_001',
  pmjjby: 'pmjjby_001',
  'sc-ss-013': 'pmsby_001',
  pmsby: 'pmsby_001',
  'sc-fi-014': 'pmjdy_001',
  pmjdy: 'pmjdy_001',
  'sc-ss-015': 'pmkmy_001',
  'pm-kmy': 'pmkmy_001',
  pmkmy: 'pmkmy_001'
};

export function getSchemeImage(schemeId, category = '', name = '', schemeObj = null) {
  const rawId = schemeId || (schemeObj && (schemeObj.scheme_id || schemeObj.id || schemeObj.shortName)) || '';
  const normalizedId = String(rawId).toLowerCase().trim();
  const aliasId = SCHEME_ID_ALIAS[normalizedId] || normalizedId;

  // 1. Direct match in SCHEME_SVG_MAP
  if (SCHEME_SVG_MAP[normalizedId]) {
    return {
      url: SCHEME_SVG_MAP[normalizedId],
      alt: name || schemeId || 'Government Scheme',
      caption: 'Official Verified Vector Artwork',
      fitMode: 'contain'
    };
  }

  // 2. Match via alias
  if (SCHEME_SVG_MAP[aliasId]) {
    return {
      url: SCHEME_SVG_MAP[aliasId],
      alt: name || schemeId || 'Government Scheme',
      caption: 'Official Verified Vector Artwork',
      fitMode: 'contain'
    };
  }

  // 3. Match from schemePaths json
  if (schemePaths[normalizedId]) {
    return {
      url: schemePaths[normalizedId],
      alt: name || schemeId || 'Government Scheme',
      caption: 'Official Verified Vector Artwork',
      fitMode: 'contain'
    };
  }
  if (schemePaths[aliasId]) {
    return {
      url: schemePaths[aliasId],
      alt: name || schemeId || 'Government Scheme',
      caption: 'Official Verified Vector Artwork',
      fitMode: 'contain'
    };
  }

  // 4. Match by Category-Tailored Fallbacks
  const catLower = String(category || '').toLowerCase();
  if (catLower.includes('pension') || catLower.includes('annuity') || catLower.includes('retire')) {
    return {
      url: '/schemes/apy_001.svg',
      alt: name || schemeId || 'Pension Scheme',
      caption: 'Official Verified Pension Artwork',
      fitMode: 'contain'
    };
  }
  if (catLower.includes('girl') || catLower.includes('women') || catLower.includes('child') || catLower.includes('education') || catLower.includes('student')) {
    return {
      url: '/schemes/ssy_001.svg',
      alt: name || schemeId || 'Education Scheme',
      caption: 'Official Verified Education Artwork',
      fitMode: 'contain'
    };
  }
  if (catLower.includes('farmer') || catLower.includes('agri') || catLower.includes('crop') || catLower.includes('rural')) {
    return {
      url: '/schemes/pmkisan_001.svg',
      alt: name || schemeId || 'Agriculture Scheme',
      caption: 'Official Verified Agriculture Artwork',
      fitMode: 'contain'
    };
  }
  if (catLower.includes('senior')) {
    return {
      url: '/schemes/scss_001.svg',
      alt: name || schemeId || 'Senior Citizens Scheme',
      caption: 'Official Verified Senior Scheme Artwork',
      fitMode: 'contain'
    };
  }
  if (catLower.includes('insurance') || catLower.includes('protection') || catLower.includes('lic') || catLower.includes('security') || catLower.includes('worker')) {
    return {
      url: '/schemes/pmjjby_001.svg',
      alt: name || schemeId || 'Protection Scheme',
      caption: 'Official Verified Protection Artwork',
      fitMode: 'contain'
    };
  }
  if (catLower.includes('saving') || catLower.includes('wealth') || catLower.includes('investment') || catLower.includes('financial')) {
    return {
      url: '/schemes/ppf_001.svg',
      alt: name || schemeId || 'Savings Scheme',
      caption: 'Official Verified Savings Artwork',
      fitMode: 'contain'
    };
  }

  // 5. Default official fallback SVG
  return {
    url: '/schemes/_fallback.svg',
    alt: `${name || schemeId || 'Government Scheme'} - Verified Product`,
    caption: 'Official Verified Government Scheme',
    fitMode: 'contain'
  };
}
