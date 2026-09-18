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

  // 7. Greetings and Identity Introduction
  const greetings = ['hi', 'hello', 'hey', 'hii', 'namaste', 'namaskar', 'pranam', 'halo', 'who are you', 'kon ho', 'koun ho', 'kaun ho', 'who is sakhi', 'sakhi kon hai', 'sakhi kaun hai'];
  const cleanQ = q.replace(/[^\w\s]/g, '').trim();
  const isGreeting = greetings.includes(cleanQ) || greetings.some(g => cleanQ === `${g} sakhi` || cleanQ === `sakhi ${g}`) || (cleanQ.length <= 15 && greetings.some(g => cleanQ.startsWith(g)));

  if (isGreeting) {
    const greetingTexts = {
      hi: `नमस्ते! मैं **सखी (Sakhi)** हूँ — संचय की सत्यापित सरकारी योजना एवं वित्तीय बचत सहायक। 🙏\n\nमैं केवल **भारत सरकार की योजनाओं (जैसे PPF, सुकन्या समृद्धि, अटल पेंशन)**, **LIC पॉलिसियों** और **सुरक्षित बचत नियमों** की 100% सटीक और आधिकारिक जानकारी देने के लिए बनाई गई हूँ।\n\nआप मुझसे क्या जानना चाहते हैं?`,
      mr: `नमस्कार! मी **सखी (Sakhi)** आहे — संचयची अधिकृत सरकारी योजना आणि आर्थिक बचत सहाय्यक. 🙏\n\nमी केवळ **भारत सरकारच्या अधिकृत योजना (उदा. PPF, सुकन्या, APY)** आणि **LIC पॉलिसी** बाबत माहिती देण्यासाठी तयार करण्यात आलेली आहे.\n\nमी आपल्याला कशी मदत करू शकते?`,
      bn: `নমস্কার! আমি **সখী (Sakhi)** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম ও সঞ্চয় সহায়ক। 🙏\n\nআমি শুধুমাত্র **ভারত সরকারের বিভিন্ন স্কিম (যেমন PPF, SSY, APY)** এবং **LIC পলিসির** সঠিক ও অফিসিয়াল তথ্য প্রদান করি।\n\nআমি আপনাকে কীভাবে সাহায্য করতে পারি?`,
      te: `నమస్కారం! నేను **సఖి (Sakhi)** — సంచయ్ యొక్క అధికారిక ప్రభుత్వ పథకాల సహాయకురాలిని. 🙏\n\nనేను కేవలం **భారత ప్రభుత్వ పథకాలు (PPF, SSY, APY వంటివి)** మరియు **LIC పాలసీలపై** సరైన సమాచారం అందించడానికే రూపొందించబడ్డాను.\n\nనేను మీకు ఏ విధంగా సహాయపడగలను?`,
      en: `Hello! I am **Sakhi** — Sanchay's Verified Government Schemes & Savings Assistant. 🙏\n\nI am designed specifically to assist you with **Government of India Schemes (e.g. PPF, Sukanya Samriddhi, APY)**, **LIC Plans**, and sovereign savings guidelines.\n\nHow can I help you today?`
    };

    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: greetingTexts[lang] || greetingTexts.en,
      intent: 'GREETING',
      sources: [],
      guardrailApplied: false,
      suggestedPrompts: [
        'Tell me about Sukanya Samriddhi Yojana (SSY)',
        'What is PPF?',
        'Atal Pension Yojana (APY)',
        '🎁 Free Plans'
      ],
      actionButtons: [
        { label: '🎯 Find My Schemes', action: 'navigate', payload: { path: '/profile' } },
        { label: '🏛️ Explore Catalog', action: 'navigate', payload: { path: '/explore' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 8. Out-of-Scope / Casual / Slang / Rude / Wrong Questions Handling
  // Clearly explain that Sakhi is not designed for these things, but strictly for government schemes & financial guidance
  const outOfScopeResponses = {
    hi: `### ⚠️ सखी केवल सरकारी योजनाओं और वित्तीय बचत के लिए है\n\nमैं **सखी (Sakhi)** हूँ — संचय की समर्पित सरकारी योजना एवं वित्तीय बचत सहायक।\n\n**कृपया ध्यान दें:**\n• मैं इन सब चीज़ों, सामान्य बातचीत या गैर-सरकारी/गलत सवालों के लिए **नहीं बनी हूँ**।\n• मेरा एकमात्र उद्देश्य आपको **भारत सरकार की कल्याणकारी योजनाओं (जैसे PPF, सुकन्या समृद्धि, किसान व पेंशन योजनाएं)**, **LIC पॉलिसियों** और **बचत नियमों** की 100% सत्यापित जानकारी देना है।\n\n👉 *कृपया सरकारी योजनाओं, सब्सिडी, छात्रवृत्ति या वित्तीय बचत से जुड़ा कोई सवाल पूछें:*`,
    mr: `### ⚠️ सखी केवळ सरकारी योजना आणि आर्थिक बचतीसाठी आहे\n\nमी **सखी (Sakhi)** आहे — संचयची अधिकृत सरकारी योजना व वित्तीय बचत सहाय्यक.\n\n**कृपया नोंद घ्या:**\n• मी सामान्य गप्पागोष्टी, अवांतर किंवा अशा प्रकारच्या चुकीच्या प्रश्नांसाठी **बनलेली नाही**.\n• माझे उद्दिष्ट केवळ **भारत सरकारच्या योजना (PPF, सुकन्या, APY)** आणि **LIC पॉलिसी** बाबत अधिकृत माहिती देणे हे आहे.\n\n👉 *कृपया सरकारी योजना किंवा बचतीशी संबंधित प्रश्न विचारा:*`,
    bn: `### ⚠️ সখী শুধুমাত্র সরকারি স্কিম ও আর্থিক সঞ্চয়ের জন্য নিবেদিত\n\nআমি **সখী (Sakhi)** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক।\n\n**অনুগ্রহ করে মনে রাখবেন:**\n• আমি সাধারণ আড্ডা বা ভুল/অনুপযুক্ত প্রশ্নের জন্য **তৈরি নই**।\n• আমার একমাত্র উদ্দেশ্য আপনাকে **ভারত সরকারের বিভিন্ন স্কিম (যেমন PPF, সুকন্যা, পেনশন স্কিম)** এবং **LIC পলিসির** নির্ভরযোগ্য তথ্য দেওয়া।\n\n👉 *অনুগ্রহ করে সরকারি স্কিম বা সঞ্চয় সম্পর্কিত কোনো প্রশ্ন জিজ্ঞাসা করুন:*`,
    te: `### ⚠️ సఖి కేవలం ప్రభుత్వ పథకాలు మరియు పొదుపు కోసమే\n\nనేను **సఖి (Sakhi)** — సంచయ్ యొక్క అధికారిక ప్రభుత్వ పథకాల సహాయకురాలిని.\n\n**గమనిక:**\n• నేను సాధారణ సంభాషణలు లేదా సంబంధం లేని తప్పుడు ప్రశ్నల కోసం **రూపొందించబడలేదు**.\n• నా ఉద్దేశం కేవలం **భారత ప్రభుత్వ పథకాలు (PPF, SSY, APY)** మరియు **LIC పాలసీలపై** అధికారిక సమాచారాన్ని అందించడమే.\n\n👉 *దయచేసి ప్రభుత్వ పథకాలు లేదా పొదుపునకు సంబంధించిన ప్రశ్నలను అడగండి:*`,
    en: `### ⚠️ Sakhi is Designed Exclusively for Government Schemes & Savings\n\nI am **Sakhi** — Sanchay's Verified Government Schemes & Financial Guidance Assistant.\n\n**Important Notice:**\n• I am **not designed** for casual conversations, slang, or off-topic/unrelated questions.\n• My sole purpose is to provide verified, sovereign-backed information on **Government of India Schemes (e.g. PPF, Sukanya Samriddhi, APY, Welfare Programs)**, **LIC Plans**, and statutory savings rules.\n\n👉 *Please ask a question related to government schemes, subsidies, pensions, or financial savings:*`
  };

  // If query is in Hindi/Hinglish (e.g. contains words like 'hat', 're', 'kya', 'hai', 'bhai', 'tu', 'kar'), detect language context
  const isHinglish = /\b(hat|re|hatt|chup|kya|bhai|bata|batao|kaun|kon|teri|mera|mujhe|kuch|nahi|nhi)\b/i.test(q);
  const effectiveLang = (lang === 'hi' || isHinglish) ? 'hi' : (outOfScopeResponses[lang] ? lang : 'en');

  return {
    id: `s-local-${Date.now()}`,
    sender: 'sakhi',
    text: outOfScopeResponses[effectiveLang] || outOfScopeResponses.en,
    intent: 'OUT_OF_SCOPE',
    sources: [],
    guardrailApplied: 'OUT_OF_SCOPE_REFUSAL',
    suggestedPrompts: effectiveLang === 'hi' ? [
      'सुकन्या समृद्धि योजना क्या है?',
      'पब्लिक प्रोविडेंट फंड (PPF) के नियम',
      'अटल पेंशन योजना (APY)',
      '🎁 मुफ्त सरकारी योजनाएं (Free Plans)'
    ] : [
      'Tell me about Sukanya Samriddhi Yojana (SSY)',
      'What is Public Provident Fund (PPF)?',
      'Atal Pension Yojana (APY)',
      '🎁 100% Free Government Plans'
    ],
    actionButtons: [
      { label: effectiveLang === 'hi' ? '🎯 मेरे लिए योजनाएं खोजें' : '🎯 Find My Schemes', action: 'navigate', payload: { path: '/profile' } },
      { label: effectiveLang === 'hi' ? '🏛️ सभी योजनाएं देखें' : '🏛️ Explore All Schemes', action: 'navigate', payload: { path: '/explore' } }
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
