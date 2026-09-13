import { MOCK_SCHEMES } from '../data/mockSchemes';
import { FALLBACK_LIC_PLANS } from '../data/licPlansFallback';
import { FALLBACK_FREE_BENEFITS } from '../data/freeBenefitsFallback';

/**
 * Intelligent Client-Side Grounded Sakhi Responder.
 * Provides instant, verified responses from the sovereign datasets
 * when the backend API is offline, sleeping on cold start, or connecting.
 */
export function resolveLocalSakhiAnswer(rawQuery, lang = 'en') {
  if (!rawQuery || typeof rawQuery !== 'string') return null;
  const q = rawQuery.toLowerCase().trim();

  // 1. Specific High-Frequency Schemes: Sukanya Samriddhi Yojana (SSY)
  if (q.includes('sukanya') || q.includes('ssy') || (q.includes('girl') && q.includes('child'))) {
    const ssy = MOCK_SCHEMES.find(s => s.id === 'ssy' || s.scheme_id === 'ssy_001') || {};
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: lang === 'hi'
        ? `**सुकन्या समृद्धि योजना (SSY)** — भारत सरकार एवं डाक विभाग\n\n• **वर्तमान ब्याज दर:** 8.2% वार्षिक (सर्वोच्च संप्रभु गारंटीकृत ब्याज दर, चक्रवृद्धित)\n• **कर छूट (Tax Benefit):** EEE दर्जा (धारा 80C के अंतर्गत जमा, ब्याज एवं परिपक्वता तीनों 100% कर-मुक्त)\n• **पात्रता:** 10 वर्ष तक की आयु की बालिका (Girl Child) के लिए माता-पिता या कानूनी अभिभावक द्वारा खाता खोला जा सकता है।\n• **जमा सीमा:** न्यूनतम ₹250/वर्ष, अधिकतम ₹1,50,000 प्रति वित्तीय वर्ष।\n• **परिपक्वता अवधि:** खाता खोलने की तिथि से 21 वर्ष (या बालिका के 18 वर्ष पूर्ण होने के उपरांत विवाह पर)।\n• **आंशिक निकासी:** बालिका के 18 वर्ष पूर्ण होने पर उच्च शिक्षा हेतु 50% तक निकासी अनुमन्य।`
        : `**Sukanya Samriddhi Yojana (SSY)** — Ministry of Finance & Department of Posts\n\n• **Current Sovereign Interest Rate:** 8.2% p.a. (Highest compound sovereign rate for small savings)\n• **Tax Benefit:** EEE (Exempt-Exempt-Exempt) status under Section 80C (100% Tax-Free)\n• **Eligibility:** Parents or legal guardians for a resident Indian girl child aged 0 to 10 years\n• **Deposit Limits:** Minimum ₹250/year, Maximum ₹1,50,000 per financial year\n• **Maturity Period:** 21 years from account opening (or upon marriage after age 18)\n• **Partial Withdrawal:** Up to 50% allowed for girl child's higher education after turning 18\n• **Official Authority:** Ministry of Finance Gazette & India Post`,
      intent: 'EXPLAIN_SCHEME',
      sources: [
        { title: 'Ministry of Finance Gazette — SSY Statutory Rules', url: 'https://www.indiapost.gov.in' },
        { title: 'National Savings Institute (NSI) Sovereign Catalog', url: 'https://www.nsiindia.gov.in' }
      ],
      eligibilityResult: 'ELIGIBLE_GUARDIAN_GIRL_CHILD',
      guardrailApplied: false,
      suggestedPrompts: [
        'What is Public Provident Fund (PPF)?',
        'Compare PPF and Sukanya Samriddhi Yojana',
        'What is Senior Citizen Savings Scheme (SCSS)?',
        'Tell me about Free Plans'
      ],
      actionButtons: [
        { label: '🏛️ Official Portal', action: 'open_url', payload: { url: ssy.official_url || 'https://www.indiapost.gov.in' } },
        { label: '⚖️ Compare PPF vs SSY', action: 'ask_prompt', payload: { prompt: 'Compare PPF and Sukanya Samriddhi Yojana' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 2. Public Provident Fund (PPF)
  if (q.includes('ppf') || q.includes('public provident')) {
    const ppf = MOCK_SCHEMES.find(s => s.id === 'ppf' || s.scheme_id === 'ppf_001') || {};
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: lang === 'hi'
        ? `**पब्लिक प्रोविडेंट फंड (PPF)** — भारत सरकार\n\n• **वर्तमान ब्याज दर:** 7.1% वार्षिक (चक्रवृद्धित)\n• **कर दर्जा:** EEE (धारा 80C के तहत पूर्ण कर छूट)\n• **अवधि:** 15 वर्ष की प्रारंभिक लॉक-इन अवधि (5-5 वर्ष के ब्लॉक में विस्तार संभव)\n• **जमा सीमा:** न्यूनतम ₹500/वर्ष, अधिकतम ₹1,50,000/वर्ष\n• **सुरक्षा:** संप्रभु गारंटी (क्रेता या अदालत द्वारा कुर्क नहीं किया जा सकता)।`
        : `**Public Provident Fund (PPF)** — Sovereign Government of India Scheme\n\n• **Current Interest Rate:** 7.1% p.a. (compounded annually)\n• **Tax Status:** Complete EEE (Exempt-Exempt-Exempt) under Section 80C\n• **Tenure & Lock-in:** 15 years initial tenure (extendable in blocks of 5 years with or without deposits)\n• **Deposit Limits:** Minimum ₹500/financial year, Maximum ₹1,50,000/financial year\n• **Loan & Withdrawal:** Loan facility from 3rd to 6th financial year; partial withdrawal permitted from 7th financial year.`,
      intent: 'EXPLAIN_SCHEME',
      sources: [
        { title: 'Ministry of Finance — Public Provident Fund Scheme Rules', url: 'https://www.nsiindia.gov.in' }
      ],
      suggestedPrompts: [
        'Tell me about Sukanya Samriddhi Yojana (SSY)',
        'What is Atal Pension Yojana (APY)?',
        'Compare PPF and NPS'
      ],
      actionButtons: [
        { label: '🏛️ Official Portal', action: 'open_url', payload: { url: ppf.official_url || 'https://www.indiapost.gov.in' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 3. Atal Pension Yojana (APY) / Pension schemes
  if (q.includes('apy') || q.includes('atal pension') || (q.includes('pension') && !q.includes('lic'))) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: lang === 'hi'
        ? `**अटल पेंशन योजना (APY)** — PFRDA एवं भारत सरकार\n\n• **निश्चित मासिक पेंशन:** ₹1,000 से ₹5,000 प्रति माह (60 वर्ष की आयु के बाद आजीवन)\n• **प्रवेश आयु:** 18 से 40 वर्ष के भारतीय नागरिक\n• **योगदान:** प्रवेश आयु एवं चुनी गई पेंशन राशि के आधार पर\n• **नॉमिनी सुरक्षा:** ग्राहक की मृत्यु के उपरांत पति/पत्नी को पेंशन तथा दोनों के उपरांत नामित व्यक्ति को संचित राशि (Corpus) वापसी।`
        : `**Atal Pension Yojana (APY)** — Administered by PFRDA\n\n• **Guaranteed Monthly Pension:** ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000/month after age 60 for life\n• **Entry Age:** 18 to 40 years for Indian citizens\n• **Spouse & Nominee Benefit:** 100% pension continues to spouse after subscriber's death, and accumulated corpus returned to nominee\n• **Regulatory Body:** Pension Fund Regulatory and Development Authority (PFRDA).`,
      intent: 'EXPLAIN_SCHEME',
      sources: [
        { title: 'PFRDA — Atal Pension Yojana Official Gazette', url: 'https://www.pfrda.org.in' }
      ],
      suggestedPrompts: [
        'What is National Pension System (NPS)?',
        'Tell me about PPF',
        'What is Senior Citizen Savings Scheme?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 4. Free Plans / Free Benefits
  if (q.includes('free plan') || q.includes('free benefit') || q.includes('मुफ्त') || q.includes('मोफत') || q.includes('বিনামূল্যে')) {
    const topFb = FALLBACK_FREE_BENEFITS.slice(0, 4);
    const fbList = topFb.map(f => `• **${f.name}**: ${f.description || f.coverage_details} (${f.authority})`).join('\n');
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: lang === 'hi'
        ? `**सत्यापित 100% मुफ्त सरकारी योजनाएं एवं लाभ:**\n\n${fbList}\n\nये योजनाएं स्वरोजगार, मुफ्त कौशल प्रशिक्षण एवं सामाजिक सुरक्षा सहायता के अंतर्गत शत-प्रतिशत आधिकारिक लाभ प्रदान करती हैं।`
        : `**Verified 100% Free Sovereign Government Benefits:**\n\n${fbList}\n\nExplore our dedicated Free Benefits tab to filter assistance by your state, education level, and category.`,
      intent: 'FREE_BENEFITS',
      sources: [
        { title: 'National Portal of India — Free Assistance & Schemes', url: 'https://www.india.gov.in' }
      ],
      actionButtons: [
        { label: '🎁 Explore Free Benefits', action: 'navigate', payload: { path: '/free-benefits' } }
      ],
      suggestedPrompts: [
        'PMKVY Free Skill Training',
        'Tell me about Sukanya Samriddhi Yojana (SSY)',
        'What is PPF?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 5. Generic Search Across MOCK_SCHEMES
  const matchedScheme = MOCK_SCHEMES.find(s => {
    const sName = (s.name || '').toLowerCase();
    const sShort = (s.short_name || s.shortName || '').toLowerCase();
    const sCat = (s.category || '').toLowerCase();
    return q.includes(sShort) || q.includes(sName) || sName.split(' ').some(w => w.length > 3 && q.includes(w));
  });

  if (matchedScheme) {
    const s = matchedScheme;
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: `**${s.name}** (${s.short_name || s.shortName || 'Sovereign Scheme'})\n\n• **Authority:** ${s.authority || s.officialAuthority || 'Government of India'}\n• **Key Benefits:** ${s.descriptionSimple || s.short_description || s.description}\n• **Interest/Returns:** ${s.interest_rate || s.currentInterestRate || 'Statutory Sovereign Terms'}\n• **Tax Benefit:** ${s.taxBenefit || 'Standard Sovereign Exemption'}\n• **Eligibility Summary:** ${s.eligibilitySummary || 'Resident Indian as per Scheme Rules'}\n• **Lock-in:** ${s.financial?.lock_in || `${s.lockInYears || 'Specified'} Years`}`,
      intent: 'EXPLAIN_SCHEME',
      sources: [
        { title: `${s.name} Official Portal`, url: s.official_url || s.officialSourceUrl || 'https://www.india.gov.in' }
      ],
      actionButtons: [
        { label: '🏛️ Official Portal', action: 'open_url', payload: { url: s.official_url || s.officialSourceUrl || 'https://www.india.gov.in' } }
      ],
      suggestedPrompts: [
        'Tell me about Sukanya Samriddhi Yojana (SSY)',
        'What is PPF?',
        'Compare APY and NPS'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 6. LIC Plans
  const matchedLic = FALLBACK_LIC_PLANS.find(l => {
    const lName = (l.plan_name || '').toLowerCase();
    return q.includes(lName) || lName.split(' ').some(w => w.length > 4 && q.includes(w));
  });

  if (matchedLic) {
    const l = matchedLic;
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: `**LIC ${l.plan_name}** (Plan No. ${l.plan_number}, UIN: ${l.uin})\n\n• **Category:** ${l.category}\n• **Description:** ${l.description || 'Verified LIC sovereign-backed insurance/endowment plan'}\n• **Eligibility:** Entry age ${l.min_age} to ${l.max_age} years\n• **Key Feature:** ${l.suitability_summary || 'Guaranteed life cover with maturity benefits'}\n• **Official Source:** Life Insurance Corporation of India (LIC)`,
      intent: 'LIC_PLAN',
      sources: [
        { title: 'LIC India Official Portal', url: 'https://licindia.in' }
      ],
      actionButtons: [
        { label: '🛡️ View LIC Catalog', action: 'navigate', payload: { path: '/lic' } }
      ],
      suggestedPrompts: [
        'Tell me about LIC Amritbaal',
        'Compare LIC Endowment and Term plans',
        'Tell me about PPF'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  return null;
}
