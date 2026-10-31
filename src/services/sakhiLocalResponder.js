import { MOCK_SCHEMES } from '../data/mockSchemes.js';
import { FALLBACK_LIC_PLANS } from '../data/licPlansFallback.js';
import { FALLBACK_FREE_BENEFITS } from '../data/freeBenefitsFallback.js';

/**
 * Verified Educational Financial Coach Dictionaries
 * Five supported languages: en, hi, mr, bn, te
 */
const COACH_SOURCES = [
  { title: 'Reserve Bank of India — Financial Education & Budgeting Guidelines', url: 'https://www.rbi.org.in' },
  { title: 'Department of Economic Affairs — Sovereign Small Savings Guidelines', url: 'https://financialservices.gov.in' }
];

const COACH_ACTION_BUTTONS = [
  { label: '📊 Budget Planner', action: 'navigate', payload: { path: '/financial-health' } },
  { label: '🎯 Goal Feasibility', action: 'navigate', payload: { path: '/goals' } },
  { label: '🏛️ Find My Schemes', action: 'navigate', payload: { path: '/profile' } }
];

const SPECULATIVE_REFUSAL_TEXTS = {
  en: `### ⚠️ Sanchay Does Not Provide Speculative Trading Advice

Sanchay is designed strictly for **sovereign welfare schemes, transparent financial education, and disciplined budgeting**.

• **No Stock Tips or Intraday Trading:** We do not provide individual stock recommendations, share market tips, day trading signals, or speculative derivatives advice.
• **No Cryptocurrencies:** We do not recommend crypto assets or volatile speculative products.
• **No Guaranteed Market Returns:** Market-linked instruments always carry volatility risk; returns are never guaranteed.
• **Sovereign Security:** For safe, guaranteed growth, explore Government of India small savings schemes like **PPF, SSY, and SCSS**.

👉 Use the **Budget Planner** to calculate your monthly surplus or explore verified schemes below:`,
  hi: `### ⚠️ संचय सट्टा या शेयर बाज़ार टिप्स प्रदान नहीं करता

संचय केवल **सत्यापित सरकारी कल्याणकारी योजनाओं, निष्पक्ष वित्तीय शिक्षा और अनुशासित बजट** के लिए बनाया गया है।

• **शेयर टिप्स व इंट्राडे नहीं:** हम व्यक्तिगत शेयर खरीदने/बेचने, इंट्राडे ट्रेडिंग, सट्टा या कॉल-पुट डेरिवेटिव्स की सलाह नहीं देते हैं।
• **क्रिप्टोकरेंसी नहीं:** हम क्रिप्टो या अत्यधिक जोखिम वाली सट्टा संपत्तियों का समर्थन नहीं करते।
• **बाज़ार जोखिम:** मार्केट-लिंक्ड निवेशों में हमेशा जोखिम होता है और कोई भी रिटर्न गारंटीकृत नहीं होता।
• **सुरक्षित संप्रभु विकल्प:** शत-प्रतिशत सुरक्षित बचत के लिए भारत सरकार की **PPF, सुकन्या समृद्धि (SSY)** जैसी योजनाओं का लाभ उठाएं।

👉 अपने मासिक सरप्लस का विश्लेषण करने के लिए **Budget Planner** देखें या नीचे सरकारी योजनाएं खोजें:`,
  mr: `### ⚠️ संचय शेअर मार्केट टिप्स किंवा सट्टा सल्ला देत नाही

संचय केवळ **शासकीय कल्याणकारी योजना, पारदर्शक आर्थिक साक्षरता आणि शिस्तबद्ध बचतीसाठी** तयार करण्यात आले आहे.

• **शेअर टिप्स व इंट्राडे नाही:** आम्ही विशिष्ट शेअर्स, इंट्राडे ट्रेडिंग किंवा सट्टेबाजीबाबत कोणताही सल्ला देत नाही.
• **क्रिप्टो नाही:** आम्ही क्रिप्टो मालमत्ता किंवा अनियंत्रित उत्पादनांना समर्थन देत नाही.
• **बाजार जोखीम:** बाजारातील गुंतवणूक नेहमी जोखमीच्या अधीन असते आणि त्यावर कोणताही हमीयुक्त परतावा नसतो.
• **सरकारी सुरक्षा:** सुरक्षित बचतीसाठी भारत सरकारच्या **PPF किंवा सुकन्या समृद्धी** योजनांचा लाभ घ्या.

👉 अधिक माहितीसाठी **Budget Planner** किंवा सरकारी योजना तपासा:`,
  bn: `### ⚠️ সঞ্চয় কোনো ট্রেডিং বা শেয়ার বাজারের টিপস প্রদান করে না

সঞ্চয় শুধুমাত্র **সরকারি কল্যাণমূলক স্কিম, আর্থিক শিক্ষা এবং সুশৃঙ্খল মাসিক বাজেটের** জন্য নিবেদিত।

• **শেয়ার বা ট্রেডিং টিপস নয়:** আমরা কোনো শেয়ার কেনাবেচা, ডে-ট্রেডিং বা ফটকাবাজির পরামর্শ প্রদান করি না।
• **ক্রিপ্টোকারেন্সি নয়:** আমরা কোনো ক্রিপ্টো বা অননুমোদিত সম্পদে বিনিয়োগ সমর্থন করি না।
• **বাজার ঝুঁকি:** বাজারভিত্তিক বিনিয়োগে ঝুঁকি থাকে এবং রিটার্ন কখনো নিশ্চিত বা গ্যারান্টিযুক্ত নয়।
• **সার্বভৌম নিরাপত্তা:** নিশ্চিত সঞ্চয়ের জন্য ভারত সরকারের **PPF বা সুকন্যা সমৃদ্ধি** স্কিমসমূহ অন্বেষণ করুন।

👉 আপনার সঞ্চয় পরিকল্পনা করতে **Budget Planner** ব্যবহার করুন:`,
  te: `### ⚠️ సంచయ్ ట్రేడింగ్ లేదా స్టాక్ టిప్స్ అందించదు

సంచయ్ కేవలం **ప్రభుత్వ సంక్షేమ పథకాలు, పారదర్శక ఆర్థిక విద్య మరియు క్రమశిక్షణతో కూడిన బడ్జెట్** కోసమే రూపొందించబడింది.

• **స్టాక్ టిప్స్ లేదా ఇంట్రాడే వద్దు:** మేము నిర్దిష్ట షేర్లు, డే-ట్రేడింగ్ లేదా ఊహాజనిత పెట్టుబడులపై ఎలాంటి సలహాలు ఇవ్వము.
• **క్రిప్టో వద్దు:** మేము క్రిప్టోకరెన్సీలు లేదా నియంత్రణ లేని ఆస్తులను ప్రోత్సహించము.
• **మార్కెట్ రిస్క్:** మార్కెట్ ఆధారిత పెట్టుబడులలో రిస్క్ ఉంటుంది, ఎటువంటి హామీ ఉండదు.
• **ప్రభుత్వ భద్రత:** హామీతో కూడిన సురక్షిత పొదుపు కోసం భారత ప్రభుత్వ పథకాలైన **PPF, సుకన్య సమృద్ధి** లను పరిశీలించండి.

👉 మీ నెలవారీ ప్రణాళిక కోసం **Budget Planner** ను ఉపయోగించండి:`
};

const COACH_50_30_20_TEXTS = {
  hinglish: `### 📊 50/30/20 Budget Rule Kya Hai?

Bilkul! Agar aapki monthly income ₹30,000 hai, toh aap shuruaat mein 50/30/20 rule follow kar sakte ho:

• **₹15,000 — zaroori kharche (50% Needs):** Rent, groceries, bijli-paani bill aur zaroori commuting.
• **₹9,000 — personal aur fun expenses (30% Wants):** Shopping, eating out, entertainment aur hobbies.
• **₹6,000 — savings (20%):** Emergency savings, Post Office RD, PPF aur future goals.

Aap apne actual kharche bata do, toh main aapke liye practical monthly budget bana sakti hoon.`,
  en: `### 📊 The 50/30/20 Budgeting Rule Explained

The 50/30/20 rule is an intuitive benchmark to allocate your take-home pay:

• **50% for Essential Needs:** Unavoidable living expenses—housing/rent, groceries, utilities, transportation, and debt/EMIs.
• **30% for Lifestyle Wants:** Discretionary lifestyle spending—dining out, entertainment, shopping, hobbies, and personal treats.
• **20% for Savings & Goals:** Your financial defense and future—emergency fund cushion, sovereign retirement schemes (PPF/APY), and milestone investments.

👉 **How to use in Sanchay:** Click **Budget Planner** below to input your take-home pay and expenses. Sanchay will calculate your verified monthly surplus and show your personalized allocation breakdown!`,
  hi: `### 📊 50/30/20 बजट नियम क्या है?

50/30/20 नियम मासिक वेतन के सही आवंटन और वित्तीय अनुशासन का एक सरल व प्रभावी नियम है:

• **50% अनिवार्य ज़रूरतें (Needs):** घर का किराया, राशन, बिजली-पानी का बिल और आवश्यक ऋण/EMI।
• **30% जीवनशैली व शौक (Wants):** बाहर खाना, मनोरंजन, फिल्में, शॉपिंग और व्यक्तिगत शौक।
• **20% बचत व भविष्य के लक्ष्य (Savings):** आपातकालीन निधि (Emergency Fund), सुरक्षित सरकारी योजनाएं (PPF/APY) और लक्ष्य निवेश।

👉 **संचय में कैसे देखें:** संचय के **Budget Planner** टैब पर अपनी आय और खर्च दर्ज करें। संचय स्वचालित रूप से आपका उपलब्ध मासिक सरप्लस और बजट विश्लेषण प्रदर्शित करेगा!`,
  mr: `### 📊 ५०/३०/२० बजेट नियम काय आहे?

५०/३०/२० हा मासिक वेतनाचे योग्य नियोजन करण्याचा एक सोपा आणि प्रभावी मार्गदर्शक नियम आहे:

• **५०% मूलभूत गरजा (Needs):** घरभाडे, किराणा, वीज बिल, प्रवास आणि कर्जाचे आवश्यक हप्ते (EMI).
• **३०% जीवनशैली व इच्छा (Wants):** बाहेर जेवणे, मनोरंजन, शॉपिंग आणि वैयक्तिक छंद.
• **२०% बचत व उद्दिष्टे (Savings):** आपत्कालीन निधी, सुरक्षित सरकारी योजना (PPF/APY) आणि भविष्यातील गुंतवणूक.

👉 **संचय मध्ये तपासा:** संचयच्या **Budget Planner** टॅबवर आपली मासिक आवक आणि खर्च नोंदवून स्वतःचा बचत सरप्लस त्वरित तपासा!`,
  bn: `### 📊 ৫০/৩০/২০ বাজেট নিয়ম কী?

৫০/৩০/২০ নিয়ম হলো আপনার মাসিক আয়ের ভারসাম্য বজায় রাখার একটি প্রমাণিত আর্থিক নির্দেশিকা:

• **৫০% মৌলিক চাহিদা (Needs):** বাড়িভাড়া, নিত্যপ্রয়োজনীয় বাজার, ইউটিলিটি বিল এবং ঋণের কিস্তি (EMI)।
• **৩০% ব্যক্তিগত পছন্দ (Wants):** বাইরে খাওয়া, বিনোদন, কেনাকাটা ও ভ্রমণ।
• **২০% সঞ্চয় ও লক্ষ্য (Savings):** জরুরি তহবিল, সুরক্ষিত সরকারি স্কিম (PPF/APY) এবং ভবিষ্যতের লক্ষ্যভিত্তিক বিনিয়োগ।

👉 **সঞ্চয়-এ কীভাবে ব্যবহার করবেন:** আপনার আয় ও ব্যয়ের হিসাব দেখতে **Budget Planner** ট্যাবটি খুলুন। সঞ্চয় আপনার সঠিক উদ্বৃত্ত (Surplus) হিসাব করে দেখাবে!`,
  te: `### 📊 50/30/20 బడ్జెట్ నియమం ఏమిటి?

50/30/20 నియమం అనేది మీ నెలవారీ ఆదాయాన్ని సమతుల్యంగా పంపిణీ చేసే ఒక ప్రభావవంతమైన మార్గదర్శకం:

• **50% ప్రాథమిక అవసరాలు (Needs):** ఇంటి అద్దె, నిత్యావసరాలు, కరెంట్ బిల్లులు మరియు తప్పనిసరి EMIలు.
• **30% కోరికలు (Wants):** వినోదం, బయట భోజనం, షాపింగ్ మరియు వ్యక్తిగత అభిరుచులు.
• **20% పొదుపు మరియు భవిష్యత్ లక్ష్యాలు (Savings):** అత్యవసర నిధి, సురక్షిత ప్రభుత్వ పథకాలు (PPF/APY) మరియు పెట్టుబడులు.

👉 **సంచయ్‌లో ఎలా చూడాలి:** మీ ఖచ్చితమైన బడ్జెట్ విభజన మరియు మిగులును తెలుసుకోవడానికి **Budget Planner** ట్యాబ్‌ను ఉపయోగించండి!`
};

const COACH_SIP_TEXTS = {
  hinglish: `### 💡 SIP (Systematic Investment Plan) Kya Hai?

SIP ek disciplined tareeka hai jisme aap market ke utaar-chadhhaav ki chinta kiye bina regular invest kar sakte ho:

• **Kaise kaam karta hai:** Aap har mahine ek fixed date par fixed amount (jaise ₹500, ₹1,000 ya ₹5,000) invest karte ho.
• **Rupee-Cost Averaging:** Jab market girta hai toh zyada units milti hain, aur jab market badhta hai toh kam units milti hain. Isse lambe samay mein acquisition cost average ho jaati hai.
• **SIP vs Lump-sum:** Lump-sum mein ek saath saara paisa invest hota hai jisme market peak ka risk rehta hai. SIP is risk ko har mahine distribute kar deta hai.
• **Market Risk:** Mutual Fund SIP returns market movement par depend karte hain aur **kabhi bhi guaranteed nahi hote**.
• **Safe Sovereign Alternatives:** Agar aap safe aur guaranteed return chahte ho, toh PPF ya Sukanya Samriddhi Yojana (SSY) mein monthly deposit kar sakte ho jahan government-guaranteed compound interest milta hai.

👉 Kisi bhi investment se pehle apna 3 se 6 mahine ka emergency fund zaroor banayein!`,
  en: `### 💡 What is an SIP (Systematic Investment Plan)?

An SIP is a disciplined approach to building long-term wealth without stressing over market timing:

• **How It Works:** You invest a fixed sum on a set date each month (e.g. ₹500, ₹1,000, or ₹5,000 on the 5th of every month).
• **Rupee-Cost Averaging:** When markets dip, your fixed contribution buys more units; when markets rise, it buys fewer. This naturally averages out your acquisition cost over time.
• **SIP vs Lump-Sum:** A lump-sum commits all capital on a single day (carrying the risk of entering at a market peak). An SIP spreads investments across economic cycles, making it ideal for first-time investors with monthly salaries.
• **Market Reality:** Mutual fund SIP returns depend on market movements and are **never guaranteed**. Past returns do not ensure future outcomes.
• **Sovereign Alternatives:** Government small savings schemes like **PPF** and **Sukanya Samriddhi Yojana (SSY)** also accept monthly deposits, offering sovereign guaranteed compound interest without market volatility.

👉 Always secure your 3 to 6-month Emergency Fund before committing surplus to investments!`,
  hi: `### 💡 एसआईपी (SIP - Systematic Investment Plan) क्या है?

एसआईपी बाज़ार के उतार-चढ़ाव की चिंता किए बिना अनुशासित तरीके से संपत्ति बनाने की एक लोकप्रिय विधि है:

• **यह कैसे काम करता है:** आप प्रत्येक माह एक निश्चित तिथि पर एक निश्चित राशि (उदा. ₹500, ₹1,000 या ₹5,000) निवेश करते हैं।
• **रुपया-लागत औसत (Rupee-Cost Averaging):** जब बाज़ार में गिरावट होती है, तो आपकी निर्धारित राशि से अधिक यूनिट्स मिलती हैं; जब बाज़ार चढ़ता है, तो कम यूनिट्स मिलती हैं। लंबी अवधि में यह आपकी औसत खरीद लागत को संतुलित कर देता है।
• **SIP बनाम एकमुश्त (Lump-Sum):** एकमुश्त निवेश में सारा पैसा एक ही दिन लगाना पड़ता है, जिससे गलत समय पर प्रवेश का जोखिम रहता है। एसआईपी हर महीने निवेश कर इस जोखिम को घटाता है।
• **बाज़ार जोखिम:** म्यूचुअल फंड एसआईपी के रिटर्न बाज़ार की चाल पर निर्भर होते हैं और **कभी भी गारंटीकृत नहीं होते**।
• **सुरक्षित संप्रभु विकल्प:** यदि आप बाज़ार जोखिम से बचना चाहते हैं, तो **PPF** और **सुकन्या समृद्धि (SSY)** जैसी सरकारी योजनाओं में भी मासिक जमा की सुविधा है, जहाँ संप्रभु गारंटीकृत चक्रवृद्धि ब्याज मिलता है।

👉 किसी भी निवेश से पहले अपने 3 से 6 महीने के आपातकालीन फंड को हमेशा सुरक्षित रखें!`,
  mr: `### 💡 एसआयपी (SIP - Systematic Investment Plan) म्हणजे काय?

एसआयपी ही बाजारातील चढ-उतारांची चिंता न करता शिस्तबद्धपणे दीर्घकालीन संपत्ती निर्माण करण्याची पद्धत आहे:

• **कार्यपद्धती:** दरमहा एका ठराविक तारखेला ठराविक रक्कम (उदा. ₹५०० किंवा ₹२,०००) नियमितपणे गुंतवणे.
• **रुपया-किंमत सरासरी (Rupee-Cost Averaging):** बाजार घसरल्यावर जास्त युनिट्स आणि बाजार वाढल्यावर कमी युनिट्स मिळतात, ज्यामुळे सरासरी खरेदी किंमत संतुलित राहते.
• **एसआयपी विरुद्ध एकरकमी (Lump-Sum):** एकरकमी गुंतवणुकीत चुकीच्या वेळी प्रवेश करण्याचा धोका असतो. एसआयपी हा धोका विविध महिन्यांमध्ये विभागते.
• **बाजार जोखीम:** म्युच्युअल फंड एसआयपी परतावा बाजारावर आधारित असतो आणि तो **हमीयुक्त नसतो**.
• **सरकारी पर्याय:** बाजार जोखीम नको असल्यास **PPF** किंवा **सुकन्या समृद्धी** या सरकारी योजनांमध्ये मासिक बचत करून हमीयुक्त परतावा मिळवता येतो.

👉 गुंतवणूक सुरू करण्यापूर्वी ३ ते ६ महिन्यांचा आपत्कालीन निधी सुरक्षित करा!`,
  bn: `### 💡 এসআইপি (SIP - Systematic Investment Plan) কী?

এসআইপি হলো বাজার ওঠানামার ঝুঁকি কমিয়ে নিয়মতান্ত্রিকভাবে দীর্ঘমেয়াদী সম্পদ গড়ে তোলার একটি কার্যকরী পদ্ধতি:

• **কীভাবে কাজ করে:** প্রতি মাসে একটি নির্দিষ্ট তারিখে একটি নির্দিষ্ট পরিমাণ অর্থ (যেমন ৫০০, ১,০০০ বা ৫,০০০ টাকা) বিনিয়োগ করা।
• **রুপি-কস্ট অ্যাভারেজিং:** বাজার কম থাকলে বেশি ইউনিট এবং বাজার বাড়লে কম ইউনিট কেনা হয়, যা দীর্ঘমেয়াদে গড় ক্রয়মূল্য কমিয়ে আনে।
• **এসআইপি বনাম এককালীন (Lump-Sum):** এককালীন বিনিয়োগে ভুল সময়ে বিনিয়োগের ঝুঁকি থাকে। এসআইপি সেই ঝুঁকিকে বিভিন্ন মাসে ছড়িয়ে দেয়।
• **বাজারের বাস্তবতা:** মিউচুয়াল ফান্ড এসআইপি রিটার্ন বাজারভিত্তিক এবং এটি **কখনও নিশ্চিত বা গ্যারান্টিযুক্ত নয়**।
• **সুরক্ষিত বিকল্প:** শূন্য বাজার ঝুঁকিতে সঞ্চয় করতে চাইলে **PPF** বা **সুকন্যা সমৃদ্ধি** এর মতো সরকারি স্কিমে মাসিক সঞ্চয় করতে পারেন।

👉 বিনিয়োগের আগে অন্তত ৩ থেকে ৬ মাসের জরুরি তহবিল নিশ্চিত করুন!`,
  te: `### 💡 SIP (సిస్టమాటిక్ ఇన్వెస్ట్‌మెంట్ ప్లాన్) అంటే ఏమిటి?

మార్కెట్ హెచ్చుతగ్గుల ఆందోళన లేకుండా క్రమశిక్షణతో దీర్ఘకాలిక సంపదను సృష్టించడానికి SIP ఒక అద్భుతమైన మార్గం:

• **ఇది ఎలా పనిచేస్తుంది:** ప్రతి నెలా ఒక నిర్దిష్ట తేదీన ఒక స్థిరమైన మొత్తాన్ని (ఉదాహరణకు ₹500, ₹1,000 లేదా ₹5,000) క్రమం తప్పకుండా పెట్టుబడి పెట్టడం.
• **రూపాయి-ధర సగటు (Rupee-Cost Averaging):** మార్కెట్ తగ్గినప్పుడు ఎక్కువ యూనిట్లు, పెరిగినప్పుడు తక్కువ యూనిట్లు లభిస్తాయి. దీర్ఘకాలంలో ఇది కొనుగోలు ఖర్చును సగటు చేస్తుంది.
• **SIP వర్సెస్ ఒకేసారి పెట్టుబడి (Lump-Sum):** ఒకేసారి మొత్తం పెట్టుబడి పెట్టడం వల్ల మార్కెట్ గరిష్టంలో ఉండే రిస్క్ ఉంటుంది. SIP ఆ రిస్క్‌ను తగ్గిస్తుంది.
• **మార్కెట్ రిస్క్:** మ్యూచువల్ ఫండ్ రిటర్న్స్ మార్కెట్ హెచ్చుతగ్గులపై ఆధారపడి ఉంటాయి, వీటికి **హామీ ఉండదు**.
• **సురక్షిత ప్రభుత్వ పథకాలు:** మార్కెట్ రిస్క్ లేకుండా సురక్షితంగా పొదుపు చేయాలనుకుంటే **PPF** లేదా **సుకున్య సమృద్ధి** పథకాలలో నెలవారీ డిపాజిట్ చేయవచ్చు.

👉 పెట్టుబడి పెట్టే ముందు కనీసం 3 నుండి 6 నెలల అత్యవసర నిధిని సిద్ధం చేసుకోండి!`
};

const COACH_EMERGENCY_TEXTS = {
  hinglish: `### 🛡️ Emergency Fund Kyun Zaroori Hai?

Kisi bhi long-term investment se pehle emergency buffer banana financial planning ka sabse pehla rule hai:

• **Rule:** Kam se kam **3 se 6 mahine ke zaroori kharche (Needs)** liquid form mein alag rakhein.
• **Purpose:** Sudden job loss, medical emergency ya urgent repairs ke samay high-interest loans ya credit card debt se bachata hai.
• **Kahan rakhein:** Isse savings account ya sweep-in FD jaise liquid options mein rakhein jahan bina penalty turant nikala ja sake.
• **Priority:** Long-term schemes mein lock karne se pehle emergency safety ensure karein.`,
  en: `### 🛡️ Why You Need an Emergency Fund First

An emergency cushion is the bedrock of all sound financial plans before entering long-term investments:

• **The Benchmark:** Maintain at least **3 to 6 months of essential living expenses** (Needs).
• **The Purpose:** Shields you against sudden job interruptions, medical crises, or unplanned repairs without taking high-interest loans.
• **Where to Park It:** Keep it in liquid instruments (savings account or sweep-in FD), never in 15-year locked instruments or volatile market assets.
• **First Priority:** Clear high-cost debt and secure your emergency cushion before committing surplus to long-term lock-in plans.

👉 Check your emergency cushion runway in Sanchay's **Budget Planner**!`,
  hi: `### 🛡️ आपातकालीन निधि (Emergency Fund) क्यों ज़रूरी है?

किसी भी दीर्घकालिक निवेश से पहले आपातकालीन निधि बनाना वित्तीय सुरक्षा का पहला और सबसे महत्वपूर्ण नियम है:

• **नियम:** कम से कम **3 से 6 महीने के अनिवार्य खर्चों** (Needs) के बराबर राशि अलग रखनी चाहिए।
• **उद्देश्य:** अचानक नौकरी में बदलाव, चिकित्सा आपातकाल या अप्रत्याशित संकट के समय उच्च ब्याज वाले कर्ज़ या क्रेडिट कार्ड के जाल से बचाना।
• **कहाँ रखें:** इसे बचत खाते या स्वीप-इन एफडी (Sweep-in FD) जैसे लिक्विड विकल्पों में रखें, ताकि ज़रूरत पड़ने पर बिना किसी पेनाल्टी के तुरंत निकाला जा सके।
• **प्राथमिकता:** लंबी अवधि के निवेश में पैसा लगाने से पहले अपनी आपातकालीन सुरक्षा सुनिश्चित करें।

👉 संचय के **Budget Planner** में अपनी बचत क्षमता और आपातकालीन रनवे जांचें!`,
  mr: `### 🛡️ आपत्कालीन निधी (Emergency Fund) का आवश्यक आहे?

दीर्घकालीन गुंतवणुकीचा विचार करण्यापूर्वी आपत्कालीन निधी तयार करणे हा वित्तीय सुरक्षेचा पहिला पाया आहे:

• **नियम:** कमीत कमी **३ ते ६ महिन्यांच्या आवश्यक खर्चांइतकी** रक्कम सुरक्षित ठेवावी.
• **उद्देश:** नोकरीतील अनपेक्षित बदल, वैद्यकीय आणीबाणी किंवा अचानक खर्चाच्या वेळी कर्ज घेण्यापासून स्वतःचे रक्षण करणे.
• **कुठे ठेवावा:** बचत खाते किंवा लिक्विड बँक ठेवींमध्ये ठेवावा, जेणेकरून संकटाच्या वेळी विनाअडथळा त्वरित पैसे मिळतील.
• **पहिली पायरी:** दीर्घकालीन गुंतवणुकीत पैसे अडकवण्यापूर्वी हा सुरक्षित निधी पूर्ण करा.

👉 संचयच्या **Budget Planner** मध्ये आपला इमर्जन्सी रनवे तपासा!`,
  bn: `### 🛡️ জরুরি তহবিল (Emergency Fund) কেন সবচেয়ে জরুরি?

যেকোনো দীর্ঘমেয়াদী বিনিয়োগ শুরু করার আগে জরুরি তহবিল তৈরি করাই আর্থিক নিরাপত্তার প্রথম পদক্ষেপ:

• **নিয়ম:** কমপক্ষে **৩ থেকে ৬ মাসের মৌলিক জীবনযাত্রার খরচের** সমান অর্থ আলাদা রাখুন।
• **উদ্দেশ্য:** চাকরি পরিবর্তন, চিকিৎসা সংকট বা অপ্রত্যাশিত খরচের সময় উচ্চ সুদের ঋণ এড়ানো।
• **কোথায় রাখবেন:** সঞ্চয়ী ব্যাংক অ্যাকাউন্ট বা লিকুইড এফডি-তে রাখুন, যাতে প্রয়োজনের মুহূর্তে কোনো জরিমানা ছাড়াই দ্রুত তোলা যায়।
• **অগ্রাধিকার:** দীর্ঘমেয়াদী স্কিমে টাকা লক করার আগে জরুরি তহবিল প্রস্তুত করুন।

👉 সঞ্চয়-এর **Budget Planner**-এ আপনার জরুরি রানওয়ে যাচাই করুন!`,
  te: `### 🛡️ అత్యవసర నిధి (Emergency Fund) ఎందుకు అత్యంత ముఖ్యం?

ఎలాంటి దీర్ఘకాలిక పెట్టుబడులు ప్రారంభించే ముందైనా అత్యవసర నిధిని ఏర్పాటు చేసుకోవడం అత్యంత కీలకమైన భద్రతా చర్య:

• **సూత్రం:** కనీసం **3 నుండి 6 నెలల నిత్యావసర ఖర్చులకు** సరిపడే మొత్తాన్ని భద్రపరచండి.
• **లక్ష్యం:** అనుకోని ఉద్యోగ మార్పులు, వైద్య అత్యవసరాలు లేదా ఊహించని ఖర్చులు వచ్చినప్పుడు అధిక వడ్డీ అప్పుల పాలు కాకుండా రక్షించడం.
• **ఎక్కడ ఉంచాలి:** సేవింగ్స్ బ్యాంక్ ఖాతా లేదా లిక్విడ్ ఎఫ్‌డీలలో ఉంచండి, తద్వారా అవసరమైన సమయంలో వెంటనే వాడుకోవచ్చు.
• **ముందస్తు ప్రాధాన్యత:** దీర్ఘకాలిక పథకాలలో డబ్బు లాక్ చేయడానికి ముందు అత్యవసర నిధిని సమకూర్చుకోండి.

👉 సంచయ్ **Budget Planner** లో మీ అత్యవసర రన్‌వేను తనిఖీ చేసుకోండి!`
};

const COACH_COMPOUNDING_TEXTS = {
  hinglish: `### 📈 Compound Interest (Chakravriddhi Byaj) Kya Hai?

Compound interest ka seedha matlab hai: **'Byaj par bhi byaj kamana'** (Interest on Interest).

• **Kaise kaam karta hai:** Pehle saal aapko aapke mool dhan (Principal) par byaj milta hai. Agle saal mool dhan aur pichle byaj dono par byaj milta hai.
• **Example:** Agar aap ₹10,000 8% annual compound interest par 3 saal ke liye rakhte ho:
  - 1st year: ₹800 byaj -> ₹10,800
  - 2nd year: ₹864 byaj -> ₹11,664
  - 3rd year: ₹933 byaj -> ₹12,597 (Total byaj: ₹2,597)
• **Time is Power:** Jitna lamba samay aap paisa invest rakhte ho, compounding utni hi tezi se badhti hai!`,
  en: `### 📈 The Power of Compounding & Time Explained Simply

Compounding is the mathematical engine behind long-term wealth creation:

• **Interest on Interest:** Unlike simple interest where returns are calculated only on your principal, compounding earns returns on your past accumulated returns as well.
• **Time Horizon is King:** Starting early with smaller amounts (e.g. ₹1,500/month at age 22) often builds more wealth than investing ₹5,000/month at age 32, because time allows the exponential curve to accelerate.
• **Beating Inflation:** Over 5 to 15 years, compounding helps your savings maintain real purchasing power against rising lifestyle costs.
• **Sovereign vs Market:** Sovereign schemes like PPF offer risk-free, guaranteed compound interest (7.1% p.a., tax-free). Mutual funds offer market-linked compounding which fluctuates with market cycles.

👉 Test illustrative compounding timelines in Sanchay's **Goal Feasibility Simulator**!`,
  hi: `### 📈 चक्रवृद्धि ब्याज की शक्ति (Power of Compounding)

चक्रवृद्धि ब्याज लंबी अवधि में संपत्ति निर्माण का सबसे शक्तिशाली गणितीय नियम है:

• **ब्याज पर भी ब्याज:** साधारण ब्याज में केवल मूलधन पर ब्याज मिलता है। चक्रवृद्धि ब्याज में पिछले वर्षों के ब्याज पर भी नया ब्याज जुड़ता है!
• **समय सबसे बड़ी शक्ति है:** 22 वर्ष की आयु में ₹1,500 प्रति माह शुरू करना, 32 वर्ष की आयु में ₹5,000 प्रति माह शुरू करने से अधिक पूंजी बना सकता है।
• **महंगाई (Inflation) से सुरक्षा:** लंबी अवधि में चक्रवृद्धि विकास ही आपके पैसे की क्रय शक्ति को महंगाई की मार से सुरक्षित रखता है।
• **सरकारी vs बाज़ार:** PPF जैसी सरकारी योजनाएं 100% कर-मुक्त व संप्रभु गारंटीकृत चक्रवृद्धि ब्याज (7.1%) देती हैं, जबकि मार्केट-लिंक्ड फंड्स में रिटर्न बाज़ार के साथ बदलते हैं।

👉 संचय के **Goal Feasibility Simulator** में विभिन्न समय अवधियों के लिए चक्रवृद्धि का प्रभाव देखें!`,
  mr: `### 📈 चक्रवाढ व्याजाची ताकद (Power of Compounding)

चक्रवाढ व्याज हा दीर्घकाळात संपत्ती वाढवण्याचा सर्वात प्रभावी नियम आहे:

• **व्याजावर व्याज:** केवळ मुद्दलावरच नव्हे, तर आधी मिळालेल्या व्याजावरही व्याज मिळणे म्हणजे चक्रवाढ.
• **वेळेचे महत्त्व:** तरुण वयात दरमहा लहान रक्कम (उदा. ₹१,५००) गुंतवणे उशिरा सुरू केलेल्या मोठ्या रकमेपेक्षा जास्त संपत्ती निर्माण करू शकते.
• **महागाईवर मात:** भविष्यातील वाढत्या खर्चाचा सामना करण्यासाठी चक्रवाढ परतावा अत्यंत उपयुक्त ठरतो.
• **सुरक्षित पर्याय:** PPF सारख्या सरकारी योजनांमध्ये हमीयुक्त चक्रवाढ व्याज (७.१%) मिळते.

👉 संचयच्या **Goal Feasibility Simulator** वर चक्रवाढीचे परिणाम तपासा!`,
  bn: `### 📈 চক্রবৃদ্ধির শক্তি (Power of Compounding)

চক্রবৃদ্ধি হলো দীর্ঘমেয়াদে সঞ্চয় বহুগুণ বৃদ্ধি করার একটি বৈজ্ঞানিক নিয়ম:

• **সুদের ওপর সুদ:** সাধারণ সুদে কেবল আসলের ওপর লাভ হয়, কিন্তু চক্রবৃদ্ধিতে আগের জমাকৃত লাভের ওপরও নতুন লাভ অর্জিত হয়।
• **সময়ই আসল চাবিকাঠি:** কম বয়সে অল্প টাকা দিয়ে শুরু করা (যেমন মাসে ১,৫০০ টাকা) বেশি বয়সে বড় অংক শুরু করার চেয়েও বেশি সম্পদ তৈরি করতে পারে।
• **মুদ্রাস্ফীতি প্রতিরোধ:** সময়ের সাথে সাথে টাকার মান ধরে রাখতে চক্রবৃদ্ধি বৃদ্ধি অত্যন্ত সহায়ক।
• **সুরক্ষিত স্কিম:** পিপিএফ (PPF) এর মতো সরকারি স্কিমে ঝুঁকিমুক্ত সার্বভৌম চক্রবৃদ্ধি সুদ (৭.১%) পাওয়া যায়।

👉 সঞ্চয়-এর **Goal Feasibility Simulator**-এ চক্রবৃদ্ধির প্রভাব পর্যবেক্ষণ করুন!`,
  te: `### 📈 చక్రవడ్డీ శక్తి (Power of Compounding)

దీర్ఘకాలంలో సంపదను వేగంగా పెంచడానికి చక్రవడ్డీ అత్యంత శక్తివంతమైన సాధనం:

• **వడ్డీపై వడ్డీ:** సాధారణ వడ్డీలో అసలుపై మాత్రమే లాభం వస్తుంది, కానీ చక్రవడ్డీలో గతంలో సంపాదించిన వడ్డీపై కూడా కొత్త వడ్డీ లభిస్తుంది.
• **సమయం ముఖ్యం:** చిన్న వయసులోనే తక్కువ మొత్తం (ఉదాహరణకు నెలకు ₹1,500) ప్రారంభించడం, ఆలస్యంగా పెద్ద మొత్తం ప్రారంభించడం కంటే ఎక్కువ లాభాన్ని ఇస్తుంది.
• **ద్రవ్యోల్బణం నుండి రక్షణ:** పెరుగుతున్న ఖర్చుల నుండి డబ్బు విలువ పడిపోకుండా చక్రవడ్డీ కాపాడుతుంది.
• **సురక్షిత పథకాలు:** PPF వంటి ప్రభుత్వ పథకాలు 100% హామీతో కూడిన చక్రవడ్డీని (7.1%) అందిస్తాయి.

👉 సంచయ్ **Goal Feasibility Simulator** లో వివిధ కాలవ్యవధుల ఫలితాలను గమనించండి!`
};

const COACH_MILESTONE_TEXTS = {
  en: `### 🎯 How to Plan & Save for a Milestone Goal (Laptop / Bike)

Saving for personal milestones requires a structured 4-step framework:

1. **Define Target & Horizon:** Fix the exact cost (e.g. ₹50,000 to ₹80,000 for a laptop, or ₹90,000 to ₹1,50,000 for a bike) and your deadline (e.g. 12 months or 24 months).
2. **Calculate Required Monthly Contribution:** For short horizons (under 3 years), prioritize capital safety over aggressive risk. Divide your remaining shortfall by the number of months.
3. **Verify Budget Affordability:** Compare this monthly target against your verified monthly surplus in Sanchay's Budget Planner. Never sacrifice your Emergency Fund for a gadget or vehicle!
4. **Automate Savings:** Dedicate surplus directly on salary day into a designated savings fund before lifestyle spending.

👉 **Simulate Your Plan:** Open Sanchay's **Goal Feasibility** page to input your target amount and timeline. Sanchay will mathematically verify if your surplus can comfortably achieve it!`,
  hi: `### 🎯 लक्ष्य बचत योजना (लैपटॉप या बाइक के लिए बचत कैसे करें?)

लैपटॉप, बाइक या किसी भी व्यक्तिगत लक्ष्य के लिए बचत करने का 4-चरणीय वैज्ञानिक तरीका:

1. **स्पष्ट लक्ष्य और समय सीमा तय करें:** आपको कितनी राशि चाहिए (उदा. लैपटॉप के लिए ₹50,000–₹80,000 या बाइक के लिए ₹90,000–₹1,50,000) और कितने समय में (उदा. 1 वर्ष या 2 वर्ष)।
2. **मासिक आवश्यक बचत निकालें:** 1 से 3 वर्ष के अल्पकालिक लक्ष्यों के लिए पूंजी की सुरक्षा सबसे महत्वपूर्ण है। लक्ष्य राशि को महीनों में विभाजित करें।
3. **बजट में सरप्लस जांचें:** संचय के Budget Planner में देखें कि क्या आपका मासिक बचत सरप्लस इस योगदान के लिए पर्याप्त है। किसी गैजेट के लिए कभी भी अपनी आपातकालीन निधि खर्च न करें!
4. **अनुशासित बचत:** वेतन मिलते ही जीवनशैली खर्चों से पहले लक्ष्य की राशि अलग रख दें।

👉 **संचय में जांचें:** नीचे **Goal Feasibility** खोलकर अपनी लक्ष्य राशि व समय सीमा दर्ज करें और गणितीय व्यवहार्यता रिपोर्ट प्राप्त करें!`,
  mr: `### 🎯 उद्दिष्ट बचत नियोजन (लॅपटॉप किंवा बाईकसाठी बचत कशी करावी?)

कोणत्याही वैयक्तिक उद्दिष्टासाठी बचत करण्याचे ४ महत्त्वाचे टप्पे:

१. **निश्चित उद्दिष्ट व मुदत ठरवा:** आवश्यक रक्कम (उदा. लॅपटॉपसाठी ₹५०,०००–₹८०,००० किंवा बाईकसाठी ₹९०,०००–₹१,५०,०००) आणि कालावधी (उदा. १२ किंवा २४ महिने) निश्चित करा.
२. **मासिक बचत ठरवा:** अल्पकालीन उद्दिष्टांसाठी भांडवलाची सुरक्षितता महत्त्वाची असते. मुदतीनुसार दरमहा किती रक्कम बाजूला काढायची ते काढा.
३. **बजेट सरप्लस तपासा:** संचयच्या Budget Planner मध्ये आपला मासिक सरप्लस तपासा. कोणत्याही गॅझेटसाठी इमर्जन्सी फंड मोडू नका!
४. **शिस्तबद्ध बचत:** पगार होताच आधी उद्दिष्टाची रक्कम बाजूला ठेवा.

👉 **संचय मध्ये तपासा:** खालील **Goal Feasibility** बटणावर क्लिक करून आपल्या उद्दिष्टाचे गणित तपासा!`,
  bn: `### 🎯 নির্দিষ্ট লক্ষ্যের জন্য সঞ্চয় (ল্যাপটপ বা বাইকের পরিকল্পনা)

যেকোনো ব্যক্তিগত লক্ষ্যের জন্য সঞ্চয় করার ৪টি বাস্তবসম্মত পদক্ষেপ:

১. **নির্দিষ্ট লক্ষ্য ও সময়সীমা:** কত টাকা প্রয়োজন (যেমন ল্যাপটপের জন্য ৫০,০০০–৮০,০০০ টাকা বা বাইকের জন্য ৯০,০০০–১,৫০,০০০ টাকা) এবং কত মাসে তা প্রয়োজন তা নির্ধারণ করুন।
২. **প্রয়োজনীয় মাসিক সঞ্চয়:** স্বল্পমেয়াদী লক্ষ্যের ক্ষেত্রে মূলধনের সুরক্ষা সবচেয়ে জরুরি। মোট টাকাকে মাসের সংখ্যা দিয়ে ভাগ করুন।
৩. **বাজেটের সাথে তুলনা করুন:** সঞ্চয়ের Budget Planner-এ যাচাই করুন আপনার মাসিক উদ্বৃত্ত এই সঞ্চয়ের জন্য যথেষ্ট কিনা। গ্যাজেটের জন্য জরুরি তহবিল খরচ করবেন না!
৪. **নিয়মিত সঞ্চয়:** প্রতি মাসের শুরুতে অন্যান্য খরচের আগেই এই সঞ্চয় আলাদা করে রাখুন।

👉 **সঞ্চয়-এ যাচাই করুন:** নিচে **Goal Feasibility** খুলে আপনার লক্ষ্য ও সময়সীমা দিয়ে হিসাবটি যাচাই করে নিন!`,
  te: `### 🎯 లక్ష్య ఆధారిత పొదుపు (ల్యాప్‌టాప్ లేదా బైక్ కోసం ఎలా ప్లాన్ చేయాలి?)

వ్యక్తిగత లక్ష్యాలను చేరుకోవడానికి 4 ముఖ్యమైన దశలు:

1. **ఖచ్చితమైన మొత్తం మరియు సమయం:** మీకు ఎంత మొత్తం అవసరం (ఉదాహరణకు ల్యాప్‌టాప్ కోసం ₹50,000–₹80,000 లేదా బైక్ కోసం ₹90,000–₹1,50,000) మరియు ఎన్ని నెలల్లో కావాలి అనేది నిర్ణయించండి.
2. **నెలవారీ పొదుపు మొత్తం:** స్వల్పకాలిక లక్ష్యాల కోసం మూలధన భద్రత ముఖ్యం. గడువు ప్రకారం ప్రతి నెలా ఎంత పొదుపు చేయాలో గుర్తించండి.
3. **బడ్జెట్ మిగులుతో సరిచూడండి:** సంచయ్ Budget Planner లో మీ నెలవారీ మిగులు సరిపోతుందో లేదో తనిఖీ చేయండి. వస్తువుల కోసం అత్యవసర నిధిని ఖర్చు చేయవద్దు!
4. **క్రమశిక్షణతో పొదుపు:** జీతం రాగానే ఇతర ఖర్చుల కంటే ముందే లక్ష్యం కోసం డబ్బును పక్కన పెట్టండి.

👉 **సంచయ్‌లో చూడండి:** క్రింద ఉన్న **Goal Feasibility** పై క్లిక్ చేసి మీ లక్ష్యం మరియు సమయానికి సరిపోయే ప్లాన్‌ను రూపొందించుకోండి!`
};

/**
 * Intelligent Client-Side Grounded Sakhi Responder.
 * Provides instant, verified responses from sovereign datasets and educational financial coaching
 * when the backend API is offline, sleeping on cold start, or connecting.
 */
/**
 * Automatic input language detection for offline / local responder:
 * English (en), Hindi (hi), Hinglish (hinglish), Marathi (mr), Bengali (bn), Telugu (te).
 */
export function detectLocalInputLanguage(message, fallbackLang = 'en') {
  if (!message || typeof message !== 'string' || !message.trim()) {
    return ['en', 'hi', 'hinglish', 'mr', 'bn', 'te'].includes(fallbackLang) ? fallbackLang : 'en';
  }

  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  // 1. Explicit Directives
  if (/\b(in english|explain (?:it )?in english|speak in english|tell me in english|now explain (?:it )?in english|in pure english)\b/i.test(msgLower)) {
    return 'en';
  }
  if (/\b(in hindi|shuddh hindi|shuddha hindi)\b/i.test(msgLower)) {
    return 'hi';
  }
  if (/\b(in marathi|marathi madhye)\b/i.test(msgLower)) {
    return 'mr';
  }
  if (/\b(in bengali|bangla te)\b/i.test(msgLower)) {
    return 'bn';
  }
  if (/\b(in telugu|telugu lo)\b/i.test(msgLower)) {
    return 'te';
  }

  // 2. Script-based Detection
  if (/[\u0C00-\u0C7F]/.test(msg)) return 'te';
  if (/[\u0980-\u09FF]/.test(msg)) return 'bn';
  if (/[\u0900-\u097F]/.test(msg)) {
    if (msg.includes('ळ')) return 'mr';
    const marathiMarkers = ['आहेत', 'आहे', 'नाही', 'नाहीत', 'होते', 'होता', 'होती', 'असेल', 'सांगा', 'दाखवा', 'करावे', 'पाहिजे', 'हवे', 'माझ्यासाठी', 'मला', 'तुम्हाला', 'कोणत्या', 'कसे', 'किती', 'शेतकरी', 'मुले', 'मुलगी', 'मोफत', 'बचत', 'काय', 'वाचवायचे', 'वाचवावे'];
    const hindiMarkers = ['हैं', 'है', 'नहीं', 'था', 'थी', 'थे', 'होगा', 'होगी', 'बताओ', 'बताइए', 'करना', 'चाहिए', 'सकता', 'सकती', 'सकते', 'मुझे', 'मुझको', 'मेरा', 'मेरी', 'मेरे', 'आपका', 'आपकी', 'हमारे', 'कौन', 'कैसे', 'कितना', 'कितने', 'के लिए', 'में', 'पर', 'योजनाएं', 'मुफ्त', 'अब', 'पैसे', 'बचाने'];
    let mrScore = marathiMarkers.reduce((acc, m) => acc + (msg.includes(m) ? 1 : 0), 0);
    let hiScore = hindiMarkers.reduce((acc, m) => acc + (msg.includes(m) ? 1 : 0), 0);
    if (mrScore > hiScore) return 'mr';
    if (hiScore > mrScore) return 'hi';
    return fallbackLang === 'mr' ? 'mr' : 'hi';
  }

  // 3. Romanized non-Hindi languages
  const teluguRom = ['naaku', 'naku', 'pathakalu', 'pathakam', 'cheppandi', 'raitulaku', 'arhudina', 'kosam', 'ela', 'unnayi'];
  const bengaliRom = ['amar', 'aamar', 'jonno', 'prokolpo', 'krishok', 'chaii', 'chai', 'shorkari', 'subidha', 'koto'];
  const marathiRom = ['majhyasathi', 'majhe', 'shetkari', 'konti yojana', 'ahet', 'aahe', 'sangaa', 'pahije', 'kiti'];
  if (teluguRom.some(w => new RegExp(`\\b${w}\\b`, 'i').test(msgLower))) return 'te';
  if (bengaliRom.some(w => new RegExp(`\\b${w}\\b`, 'i').test(msgLower))) return 'bn';
  if (marathiRom.some(w => new RegExp(`\\b${w}\\b`, 'i').test(msgLower))) return 'mr';

  // 4. Hinglish Detection (Romanized Hindi)
  const hinglishPhrases = [
    /\bbacha sakta hu\b/i, /\bbacha sakta hoon\b/i, /\bbacha sakti hu\b/i, /\bbacha sakte hain\b/i,
    /\bbacha sakte ho\b/i, /\bkaise bacha\b/i, /\bkaise bachaye\b/i, /\bkaise bachau\b/i,
    /\bkarna hai\b/i, /\bkarein\b/i, /\bsamjha do\b/i, /\bbata do\b/i, /\bho jaye\b/i,
    /\bho jayega\b/i, /\bkamaata hu\b/i, /\bkamata hu\b/i, /\bkamata hoon\b/i,
    /\bkitne paise\b/i, /\bkitna paisa\b/i, /\bshuru karu\b/i, /\bpaise bachane\b/i,
    /\bsip samjhao\b/i, /\bkaise manage\b/i
  ];
  if (hinglishPhrases.some(p => p.test(msgLower))) {
    return 'hinglish';
  }

  const hinglishWords = [
    'mujhe', 'mujhko', 'mera', 'meri', 'mere', 'mein', 'main', 'hum', 'humara', 'humari',
    'aap', 'aapka', 'aapki', 'aapke', 'tum', 'tumhara', 'tumhari',
    'kaise', 'kya', 'kaun', 'kaunsa', 'kaunsi', 'kitna', 'kitne', 'kitni', 'kab', 'kaha', 'kahan', 'kyun', 'kyu',
    'chahiye', 'chahie', 'sakta', 'sakti', 'sakte', 'hu', 'hoon', 'hai', 'hain', 'ho', 'hoga', 'hogi',
    'karo', 'karna', 'karein', 'karu', 'batao', 'bataiye', 'samjhao', 'samjhaiye',
    'bacha', 'bachana', 'bachaye', 'bachau', 'bachane', 'bachat', 'kamaata', 'kamata',
    'kharch', 'kharcha', 'kharche', 'aur', 'agar', 'toh', 'bhi', 'nahi', 'nahin', 'mat',
    'liye', 'baad', 'pehle', 'zaroori', 'zaruri', 'shuru', 'paise', 'paisa', 'rupaye', 'byaj', 'nivesh', 'ab'
  ];
  const tokens = msgLower.match(/\b[a-z]+\b/g) || [];
  let hinglishCount = tokens.filter(t => hinglishWords.includes(t)).length;
  if (hinglishCount > 0) {
    return 'hinglish';
  }

  // 5. English Check
  const englishMarkers = ['how', 'what', 'which', 'who', 'when', 'why', 'can', 'could', 'should', 'would', 'save', 'saving', 'invest', 'budget', 'salary', 'income', 'explain', 'tell', 'bike', 'trip', 'compound', 'interest'];
  if (tokens.some(t => englishMarkers.includes(t))) {
    return 'en';
  }

  return ['en', 'hi', 'hinglish', 'mr', 'bn', 'te'].includes(fallbackLang) ? fallbackLang : 'en';
}

export function resolveLocalSakhiAnswer(rawQuery, lang = 'en') {
  if (!rawQuery || typeof rawQuery !== 'string') return null;
  const q = rawQuery.toLowerCase().trim();
  const effectiveLang = detectLocalInputLanguage(rawQuery, lang);


  // -----------------------------------------------------------------
  // 1. Speculative Trading, Crypto, Gambling & Stock-Tips Hard Refusal
  // -----------------------------------------------------------------
  const isSpeculative = /\b(day\s*trading|intraday|futures\s*trading|options\s*trading|call\s*option|put\s*option|forex|derivatives|crypto|cryptocurrency|bitcoin|ethereum|doge|क्रिप्टो|बिटकॉइन|multibagger|get\s*rich\s*quick|20%\s*return|guaranteed\s*20%?|satta|सट्टा|buy\s+stocks?|sell\s+stocks?|stock\s*tips?|share\s*tips?|share\s*market\s*tips?|penny\s*stocks?|which\s+stock|which\s+share|best\s+stock|which\s+mutual\s+fund\s+to\s+buy|best\s+mutual\s+fund\s+to\s+invest)\b/i.test(q);

  if (isSpeculative) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: SPECULATIVE_REFUSAL_TEXTS[effectiveLang] || SPECULATIVE_REFUSAL_TEXTS.en,
      intent: 'OUT_OF_SCOPE',
      sources: COACH_SOURCES,
      guardrailApplied: 'SPECULATIVE_REFUSAL',
      suggestedPrompts: [
        'Explain the 50/30/20 budget rule',
        'What is Public Provident Fund (PPF)?',
        'Why do I need an emergency fund?',
        'Tell me about Sukanya Samriddhi Yojana'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // -----------------------------------------------------------------
  // 2. Specific High-Frequency Schemes: Sukanya Samriddhi Yojana (SSY)
  // -----------------------------------------------------------------
  if (q.includes('sukanya') || q.includes('ssy') || (q.includes('girl') && q.includes('child'))) {
    const ssy = MOCK_SCHEMES.find(s => s.id === 'ssy' || s.scheme_id === 'ssy_001') || {};
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: effectiveLang === 'hi'
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

  // -----------------------------------------------------------------
  // 3. Public Provident Fund (PPF)
  // -----------------------------------------------------------------
  if (q.includes('ppf') || q.includes('public provident')) {
    const ppf = MOCK_SCHEMES.find(s => s.id === 'ppf' || s.scheme_id === 'ppf_001') || {};
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: effectiveLang === 'hi'
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

  // -----------------------------------------------------------------
  // 4. Atal Pension Yojana (APY) / Pension schemes
  // -----------------------------------------------------------------
  if (q.includes('apy') || q.includes('atal pension') || (q.includes('pension') && !q.includes('lic'))) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: effectiveLang === 'hi'
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

  // -----------------------------------------------------------------
  // 5. Free Plans / Free Benefits
  // -----------------------------------------------------------------
  if (q.includes('free plan') || q.includes('free benefit') || q.includes('मुफ्त') || q.includes('मोफत') || q.includes('বিনামূল্যে') || q.includes('ఉచిత')) {
    const topFb = FALLBACK_FREE_BENEFITS.slice(0, 4);
    const fbList = topFb.map(f => `• **${f.name}**: ${f.description || f.coverage_details} (${f.authority})`).join('\n');
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: effectiveLang === 'hi'
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

  // -----------------------------------------------------------------
  // 6. Greetings and Identity Introduction
  // -----------------------------------------------------------------
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
      text: greetingTexts[effectiveLang] || greetingTexts.en,
      intent: 'GREETING',
      sources: [],
      guardrailApplied: false,
      suggestedPrompts: [
        'Explain the 50/30/20 budget rule',
        'What is an SIP?',
        'Tell me about Sukanya Samriddhi Yojana (SSY)',
        'What is PPF?'
      ],
      actionButtons: [
        { label: '📊 Budget Planner', action: 'navigate', payload: { path: '/financial-health' } },
        { label: '🎯 Find My Schemes', action: 'navigate', payload: { path: '/profile' } },
        { label: '🏛️ Explore Catalog', action: 'navigate', payload: { path: '/explore' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // -----------------------------------------------------------------
  // 7. Educational Financial Coaching (Offline Mode)
  // -----------------------------------------------------------------

  // 7f. Travel & Vacation Milestone Budgeting (USA, Europe, etc.)
  const isTravelTopic = /go\s+to|trip|travel|vacation|tour|holiday|usa|america|europe|विदेश|यात्रा|घूमने|अमेरिका/i.test(q);
  if (isTravelTopic) {
    const travelTexts = {
      hinglish: `### ✈️ USA Travel Budget & Savings Plan

India se USA ki 10 se 14 din ki trip ke liye realistic budget **₹2,20,000 se ₹3,50,000** per person hota hai:

• **Round-Trip Flights:** ₹80,000 – ₹1,20,000
• **US Visa Fee:** ~₹16,000 ($185 statutory fee)
• **Accommodation & Food:** ~₹1,20,000 – ₹2,00,000
• **Recommended Strategy:** Departure se 12 se 24 mahine pehle Recurring Deposit (RD) ya liquid fund mein disciplined saving shuru karein.
• **Debt se bachein:** Chhuttiyon ke liye high-interest personal loan ya credit card EMI lene se bachein.`,
      en: `### ✈️ Travel & Vacation Budget Roadmap (e.g. USA / Europe Trip)\n\nPlanning international or milestone travel requires structured advance savings:\n\n• **Typical Benchmark (10–14 days USA trip):** ~₹2,20,000 to ₹3,50,000 per person (Flights: ₹80k–₹1.2L, Visa: ~₹16k, Accommodation & Food: ~₹1.2L–₹2L).\n• **Recommended Strategy:** Start a dedicated Recurring Deposit (RD) or liquid fund 12 to 24 months before departure.\n• **Avoid High-Cost Debt:** Avoid funding leisure travel through high-interest personal loans or credit cards.\n\n👉 Use the **Goal Feasibility Simulator** below to calculate your exact monthly savings for your travel goal!`,
      hi: `### ✈️ यात्रा एवं पर्यटन बजट योजना (उदा. अमेरिका / यूरोप यात्रा)\n\nविदेश या लंबी यात्रा के लिए अग्रिम बचत योजना सबसे सुरक्षित तरीका है:\n\n• **अनुमानित बजट दायरा (10-14 दिन अमेरिका):** ₹2,20,000 से ₹3,50,000 प्रति व्यक्ति (उड़ान: ₹80,000-₹1.2L, वीज़ा: ~₹16,000, होटल व भोजन: ~₹1.2L-₹2L)।\n• **अनुशंसित रणनीति:** यात्रा से 12 से 24 महीने पहले आवर्ती जमा (RD) या लिक्विड फंड में बचत शुरू करें।\n• **कर्ज से बचें:** महंगे पर्सनल लोन या क्रेडिट कार्ड ईएमआई से यात्रा करने से बचें।\n\n👉 अपने यात्रा लक्ष्य की सटीक मासिक बचत जानने के लिए **Goal Simulator** का उपयोग करें!`
    };
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: travelTexts[effectiveLang] || travelTexts.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'How do I budget for a milestone goal?',
        'What is the 50/30/20 rule?',
        'Tell me about PPF for long-term savings',
        'Back to Budget Planner'
      ],
      actionButtons: [
        { label: '🎯 Goal Simulator', action: 'navigate', payload: { path: '/goals' } },
        { label: '📊 Budget Planner', action: 'navigate', payload: { path: '/financial-health' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 7a. 50/30/20 Budgeting Rule & Budget Planning
  const isBudgetTopic = /50[\s\/\-_]*30[\s\/\-_]*20|budget|बजट|बजेट|বাজেট|బడ్జెట్|surplus|सरप्लस|উদ্বৃত্ত|మిగులు|earn|salary|income|manage.*money|how.*manage|manage.*salary|पगार|वेतन|कमाई/i.test(q);
  if (isBudgetTopic) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: COACH_50_30_20_TEXTS[effectiveLang] || COACH_50_30_20_TEXTS.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'Why do I need an emergency fund?',
        'What is an SIP?',
        'How does compounding work?',
        'What schemes fit my budget?'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 7b. Emergency Funds & Runway Cushion
  const isEmergencyTopic = /emergency|runway|cushion|आपातकालीन|इमरजेंसी|आपत्कालीन|জরুরি\s*তহবিল|জরুরী|అత్యవసర/i.test(q);
  if (isEmergencyTopic) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: COACH_EMERGENCY_TEXTS[effectiveLang] || COACH_EMERGENCY_TEXTS.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'Explain the 50/30/20 budget rule',
        'What is an SIP?',
        'How does compounding work?',
        'Tell me about PPF'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 7c. Power of Compounding & Inflation
  const isCompoundingTopic = /compound|compounding|chakravriddhi|चक्रवृद्धि|चक्रवाढ|চক্রবৃদ্ধি|చక్రవడ్డీ|inflation|महंगाई|महागाई|মুদ্রাস্ফীতি|ద్రవ్యోల్బణం/i.test(q);
  if (isCompoundingTopic) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: COACH_COMPOUNDING_TEXTS[effectiveLang] || COACH_COMPOUNDING_TEXTS.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'How does compounding help my goal?',
        'What is an SIP?',
        'Tell me about PPF',
        'Simulate Goal Feasibility'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 7d. Milestone Goals (Laptop, Bike, Gadget, Vehicle, Timeline)
  const isMilestoneTopic = /laptop|bike|car|scooter|phone|mobile|gadget|vehicle|milestone|लॅपटॉप|लैपटॉप|बाईक|बाइक|গ্যাজেট|ల్యాప్‌టాప్|బైక్|feasibility|afford|shortfall/i.test(q);
  if (isMilestoneTopic) {
    const hasExplicitAmount = /₹?\s*[\d]+(?:,[\d]+)*(?:\s*(?:k|lakhs?|lakh|हजार|लाख))?|\b\d{4,7}\b/i.test(q);
    const hasTimeframe = /year|month|saal|mahine|साल|माह|वर्ष|महिने|বছর|মাস|సంవత్సర|నెల/i.test(q);

    if (!hasExplicitAmount) {
      // Missing target amount: ask for target price instead of assuming 70,000 or any default
      const askTexts = {
        hinglish: hasTimeframe
          ? `Bike ke liye saving shuru karna ek bohot accha goal hai! Aap kis budget ya price ki bike lene ki soch rahe hain (aapka target amount kitna hai)?`
          : `Bike ke liye saving shuru karna ek bohot accha goal hai! Aap kis budget ya price ki bike lene ki soch rahe hain (aapka target amount kitna hai), aur aap ise kitne samay (mahine ya saal) mein kharidna chahte hain?`,
        hi: hasTimeframe
          ? `बाइक के लिए बचत शुरू करना एक बहुत ही बढ़िया लक्ष्य है! सटीक बचत योजना बनाने के लिए, आप किस बजट या अनुमानित कीमत की बाइक खरीदना चाहते हैं (आपका टारगेट अमाउंट कितना है)?`
          : `बाइक के लिए बचत शुरू करना एक बहुत ही बढ़िया लक्ष्य है! सटीक बचत योजना बनाने के लिए, आप किस बजट या अनुमानित कीमत की बाइक खरीदना चाहते हैं (आपका टारगेट अमाउंट कितना है), और आपका लक्ष्य इसे कितने समय (महीने या साल) में खरीदने का है?`,
        en: hasTimeframe
          ? `Planning to save for a bike is a fantastic milestone! To calculate your exact monthly savings contribution, what is your estimated budget or target price for the bike?`
          : `Planning to save for a bike is a fantastic milestone! To calculate your exact monthly savings contribution, what is your estimated budget or target price for the bike, and in what timeframe (months or years) do you plan to buy it?`,
        mr: `बाईकसाठी बचत करणे हे एक उत्तम उद्दिष्ट आहे! अचूक नियोजन करण्यासाठी, आपले अंदाजे बजेट (किंमत) किती आहे आणि किती कालावधीत आपल्याला ही बाईक खरेदी करायची आहे?`,
        bn: `বাইকের জন্য সঞ্চয় শুরু করা একটি দারুণ লক্ষ্য! সঠিক পরিকল্পনা তৈরি করতে, বাইকটির আনুমানিক বাজেট (টার্গেট মূল্য) কত এবং কত সময়ের মধ্যে আপনি এটি কিনতে চান?`,
        te: `బైక్ కోసం పొదుపు చేయడం చాలా మంచి లక్ష్యం! ఖచ్చితమైన ప్రణాళిక కోసం, మీ అంచనా బడ్జెట్ ఎంత మరియు ఎంత కాలంలో దీనిని కొనుగోలు చేయాలనుకుంటున్నారు?`
      };

      return {
        id: `s-local-${Date.now()}`,
        sender: 'sakhi',
        text: askTexts[effectiveLang] || askTexts.en,
        intent: 'GOAL_FEASIBILITY',
        sources: COACH_SOURCES,
        guardrailApplied: false,
        suggestedPrompts: [
          '₹80,000 in 1 year',
          '₹1,00,000 in 2 years',
          '₹60,000 in 6 months',
          'Back to Budget Planner'
        ],
        actionButtons: COACH_ACTION_BUTTONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    if (!hasTimeframe) {
      // Amount is known, but timeframe is missing
      const tfTexts = {
        hinglish: `Aapka target amount note kar liya gaya hai! Is goal ke liye exact monthly savings calculate karne ke liye, aapka target timeframe kitna hai (aap ise kitne mahine ya saal mein achieve karna chahte hain)?`,
        hi: `आपकी लक्ष्य राशि नोट कर ली गई है! सटीक मासिक बचत की गणना करने के लिए, आपका लक्ष्य इसे कितने समय (महीने या साल) में हासिल करने का है?`,
        en: `Your target amount has been noted! To calculate your exact required monthly savings, what is your target timeframe (how many months or years do you have to reach this goal)?`,
        mr: `आपली लक्ष्य रक्कम नोंदवली गेली आहे! मासिक बचत काढण्यासाठी, आपला कालावधी (महिने किंवा वर्ष) किती आहे?`,
        bn: `আপনার লক্ষ্য মূল্য নথিভুক্ত করা হয়েছে! মাসিক সঞ্চয় হিসাব করতে, আপনার সময়সীমা কত (কত মাস বা বছর)?`,
        te: `మీ లక్ష్య మొత్తం నమోదు చేయబడింది! ఖచ్చితమైన నెలవారీ పొదుపు లెక్కించడానికి, మీరు ఎంత కాలంలో కొనుగోలు చేయాలనుకుంటున్నారు?`
      };

      return {
        id: `s-local-${Date.now()}`,
        sender: 'sakhi',
        text: tfTexts[effectiveLang] || tfTexts.en,
        intent: 'GOAL_FEASIBILITY',
        sources: COACH_SOURCES,
        guardrailApplied: false,
        suggestedPrompts: [
          'In 1 year',
          'In 2 years',
          'In 6 months',
          'Back to Budget Planner'
        ],
        actionButtons: COACH_ACTION_BUTTONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: COACH_MILESTONE_TEXTS[effectiveLang] || COACH_MILESTONE_TEXTS.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'Explain the 50/30/20 budget rule',
        'What is an SIP?',
        'How does compounding work?',
        'Back to Budget Planner'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 7e. Systematic Investment Plan (SIP) Educational Concepts
  const isSipTopic = /(?:what\s+(?:is|are)|explain|meaning|how\s+does|how\s+to|kya\s+hai|kay\s+aahe|म्हणजे\s+काय|काय\s+आहे|কী|কি|ఏమిటి)\s+(?:an?\s+)?(?:sip|एसआयपी|एसआईपी|এসআইপি|ఎస్ఐపీ)|(?:sip|एसआयपी|एसआईपी|এসআইপি|ఎస్ఐపీ)\s+(?:kya\s+hai|kay\s+aahe|म्हणजे\s+काय|काय\s+आहे|কী|কি|ఏమిటి|meaning|explain|vs|aur|and)|\b(?:sip|एसआयपी|एसआईपी|এসআইপি|ఎస్ఐపీ)\b|systematic\s*investment|rupee\s*cost\s*averaging/i.test(q);
  if (isSipTopic) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: COACH_SIP_TEXTS[effectiveLang] || COACH_SIP_TEXTS.en,
      intent: 'FINANCIAL_COACH',
      sources: COACH_SOURCES,
      guardrailApplied: false,
      suggestedPrompts: [
        'Explain SIP vs Lump-sum',
        'What is an emergency fund?',
        'How does compounding work?',
        'Safe government savings schemes'
      ],
      actionButtons: COACH_ACTION_BUTTONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // -----------------------------------------------------------------
  // 8. LIC Plans
  // -----------------------------------------------------------------
  const matchedLic = FALLBACK_LIC_PLANS.find(l => {
    const lName = (l.plan_name || '').toLowerCase();
    const stripped = lName.replace(/lic's\s*/i, '').trim();
    return q.includes(lName) || q.includes(stripped) || stripped.split(' ').filter(w => w.length > 3).every(w => q.includes(w));
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

  // -----------------------------------------------------------------
  // 8.5 Everyday Open-Domain & General Inquiries (Flexible Conversational Sakhi)
  // -----------------------------------------------------------------
  // Dangerous / Harmful query safety guardrail
  const isHarmfulQuery = /\b(bomb|weapon|explosive|kill|suicide|self-harm|harm\s+myself|credit\s*card\s*hack|atm\s*hack|counterfeit|money\s*laundering|terror)\b/i.test(q);
  if (isHarmfulQuery) {
    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: effectiveLang === 'hi' 
        ? 'मैं हिंसा, अवैध गतिविधियों, साइबर हमलों या आत्म-नुकसान से संबंधित प्रश्नों में सहायता नहीं कर सकती। यदि आप किसी संकट में हैं, तो कृपया राष्ट्रीय हेल्पलाइन (14416) से संपर्क करें।'
        : 'I cannot assist with queries involving violence, illegal acts, cyber attacks, or self-harm. If you are experiencing distress, please reach out to trusted national helplines (Tele-MANAS: 14416 in India).',
      intent: 'SAFETY_REFUSAL',
      sources: [],
      guardrailApplied: 'SAFETY_REFUSAL',
      suggestedPrompts: ['What is PPF?', 'How do I start saving?'],
      actionButtons: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Artificial Intelligence (AI)
  const isAiTopic = /\b(artificial\s*intelligence|explain\s*ai|what\s+is\s+ai|machine\s*learning|deep\s*learning|generative\s*ai|neural\s*network|artifical\s*intelligence)\b/i.test(q);
  if (isAiTopic) {
    const aiText = effectiveLang === 'hi'
      ? `### 🤖 आर्टिफिशियल इंटेलिजेंस (Artificial Intelligence - AI) क्या है?\n\n**आर्टिफिशियल इंटेलिजेंस (AI)** कंप्यूटर साइंस का वह क्षेत्र है जो मशीनों और सॉफ्टवेयर को इंसानों की तरह सोचने, सीखने, समझने और समस्याओं को हल करने में सक्षम बनाता है।\n\n• **प्रमुख स्तंभ:**\n  1. **मशीन लर्निंग (ML):** डेटा से पैटर्न सीखकर लगातार बेहतर होना।\n  2. **नेचुरल लैंग्वेज प्रोसेसिंग (NLP):** इंसानी भाषा को समझना और बातचीत करना (जैसे सखी आपकी बात समझती है)।\n  3. **कंप्यूटर विज़न:** छवियों और विजुअल्स को पहचानना।\n• **दैनिक जीवन में अनुप्रयोग:** स्मार्ट असिस्टेंट, स्वास्थ्य सेवा में रोग निदान, सटीक सर्च और संचय जैसे वित्तीय प्लेटफॉर्म में व्यक्तिगत मार्गदर्शन।\n\n👉 क्या आप AI के किसी विशिष्ट अनुप्रयोग या वित्तीय तकनीक के बारे में जानना चाहते हैं?`
      : `### 🤖 Understanding Artificial Intelligence (AI)\n\n**Artificial Intelligence (AI)** refers to systems and computer algorithms capable of performing tasks that typically require human intelligence, such as pattern recognition, decision-making, learning, and natural language communication.\n\n### 💡 Core Pillars of Modern AI\n• **Machine Learning (ML):** Algorithms that recognize patterns from data rather than following static rules.\n• **Deep Learning & Neural Networks:** Multi-layered representations inspired by biological neurons, powering voice and image processing.\n• **Natural Language Processing (NLP) & LLMs:** Enabling machines to understand, contextualize, and converse fluently (similar to how Sakhi assists you on Sanchay).\n• **Computer Vision:** Interpreting visual data from images and real-world sensors.\n\n### 🌍 Everyday Impact\nFrom virtual assistants, navigation, and medical diagnostics to algorithmic fraud detection in banking, AI helps process high-dimensional information with speed and scale.\n\nWould you like to explore a specific application of AI or another topic?`;

    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: aiText,
      intent: 'GENERAL_CONVERSATION',
      sources: [
        { title: 'AI & Computational Intelligence Overview', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' }
      ],
      guardrailApplied: null,
      suggestedPrompts: [
        'Who is the Prime Minister of France?',
        'How can I prepare for an interview?',
        'What is compound interest?',
        'I earn 30k, how to manage?'
      ],
      actionButtons: [
        { label: '📊 Financial Health', action: 'navigate', payload: { path: '/financial-health' } },
        { label: '🎯 Explore Schemes', action: 'navigate', payload: { path: '/explore' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Prime Minister of France / French Leadership
  const isFranceTopic = /\b(prime\s*minister\s*of\s*france|pm\s*of\s*france|france\s*pm|president\s*of\s*france|french\s*prime\s*minister|french\s*pm|michel\s*barnier|emmanuel\s*macron)\b/i.test(q);
  if (isFranceTopic) {
    const franceText = effectiveLang === 'hi'
      ? `### 🏛️ फ्रांस के प्रधानमंत्री (Prime Minister of France)\n\nवर्तमान में फ्रांस के प्रधानमंत्री **मिशेल बार्नियर (Michel Barnier)** हैं, जिन्हें राष्ट्रपति **इमैनुएल मैक्रों (Emmanuel Macron)** द्वारा सितंबर 2024 में नियुक्त किया गया था।\n\n• **शासन प्रणाली:** फ्रांस में अर्ध-राष्ट्रपति प्रणाली (Semi-Presidential System) है, जहाँ राष्ट्रपति राष्ट्राध्यक्ष (Head of State) होते हैं और प्रधानमंत्री सरकार के प्रमुख (Head of Government) के रूप में कार्य करते हैं।\n• **पृष्ठभूमि:** मिशेल बार्नियर फ्रांस के पूर्व विदेश मंत्री तथा यूरोपीय संघ (EU) के मुख्य ब्रेक्सिट वार्ताकार रह चुके हैं।\n\n👉 क्या आप किसी अन्य देश के नेतृत्व या अंतरराष्ट्रीय मामलों के बारे में जानना चाहते हैं?`
      : `### 🏛️ Prime Minister of France\n\nThe Prime Minister of France is **Michel Barnier**, appointed by President **Emmanuel Macron** in September 2024.\n\n### 📌 Governance & Role\n• **Semi-Presidential Republic:** In France, the President is the directly elected Head of State (directing foreign affairs and national defense), while the Prime Minister serves as the Head of Government (responsible for domestic policy, national administration, and parliamentary legislation).\n• **Background:** Michel Barnier is a veteran statesman who previously served as France's Minister of Foreign Affairs, Minister of Agriculture, and the European Union's Chief Brexit Negotiator.\n\nWould you like to know more about international governance or explore another topic?`;

    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: franceText,
      intent: 'GENERAL_CONVERSATION',
      sources: [
        { title: 'Official Portal of the French Government (Gouvernement.fr)', url: 'https://www.gouvernement.fr/en' }
      ],
      guardrailApplied: null,
      suggestedPrompts: [
        'Explain artificial intelligence',
        'How can I prepare for an interview?',
        'What is compound interest?',
        'I earn 30k, how to manage?'
      ],
      actionButtons: [
        { label: '📊 Financial Health', action: 'navigate', payload: { path: '/financial-health' } },
        { label: '🏛️ Explore Schemes', action: 'navigate', payload: { path: '/explore' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Interview Preparation Framework
  const isInterviewTopic = /\b(prepare\s*for\s*(?:an?\s*)?interview|interview\s*prep|interview\s*tips|job\s*interview|clear\s*(?:an?\s*)?interview|interview\s*ki\s*taiyari)\b/i.test(q);
  if (isInterviewTopic) {
    const interviewText = effectiveLang === 'hi'
      ? `### 💼 इंटरव्यू की तैयारी कैसे करें (Practical Guide)\n\nसफल इंटरव्यू के लिए 4 प्रमुख चरणों का पालन करें:\n\n1. **कंपनी और पद पर शोध:** कंपनी के उत्पाद, मिशन और हालिया उपलब्धियों की जानकारी लें।\n2. **STAR पद्धति का प्रयोग:** व्यवहारिक प्रश्नों के लिए **STAR** (Situation, Task, Action, Result) तकनीक अपनाएं।\n3. **मुख्य कौशल और बायोडाटा की तैयारी:** अपने प्रोजेक्ट्स और उपलब्धियों को आत्मविश्वास के साथ समझाएं।\n4. **विचारशील प्रश्न तैयार रखें:** इंटरव्यू के अंत में टीम लक्ष्यों और कंपनी की संस्कृति पर प्रश्न पूछें।\n\n👉 क्या आप किसी खास डोमेन (टेक, फाइनेंस या सामान्य) के इंटरव्यू के बारे में जानना चाहते हैं?`
      : `### 💼 Practical Interview Preparation Framework\n\nTo prepare effectively for a job interview, structure your preparation across these four essential pillars:\n\n### 1. Research the Organization & Role\n• Study the organization's core products, industry position, recent developments, and company culture.\n• Align your past achievements with the key requirements in the job description.\n\n### 2. Master the STAR Method for Behavioral Questions\nWhen asked about handling conflicts, leadership, or challenges, structure your response:\n• **S (Situation):** Outline the background and specific scenario briefly.\n• **T (Task):** Describe your responsibility and what needed to be accomplished.\n• **A (Action):** Detail the exact technical or collaborative actions **you** executed.\n• **R (Result):** Conclude with quantifiable outcomes, impact, and lessons learned.\n\n### 3. Review Fundamentals & Technical Depth\n• Ensure you can discuss every bullet point and project on your resume in granular detail.\n• Practice explaining complex problems simply.\n\n### 4. Prepare Thoughtful Questions for the Interviewer\n• Ask about team priorities, tech stacks, or what success looks like in the first 90 days.\n\nWould you like guidance for a technical, managerial, or case-study interview?`;

    return {
      id: `s-local-${Date.now()}`,
      sender: 'sakhi',
      text: interviewText,
      intent: 'GENERAL_CONVERSATION',
      sources: [
        { title: 'National Career Service — Interview Preparation Guidelines', url: 'https://www.ncs.gov.in' }
      ],
      guardrailApplied: null,
      suggestedPrompts: [
        'Explain artificial intelligence',
        'Who is the Prime Minister of France?',
        'I earn 30k, how to manage?',
        'What is compound interest?'
      ],
      actionButtons: [
        { label: '📊 Financial Health', action: 'navigate', payload: { path: '/financial-health' } },
        { label: '🎯 Explore Schemes', action: 'navigate', payload: { path: '/explore' } }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // 9. Generic Search Across MOCK_SCHEMES
  // -----------------------------------------------------------------
  const SCHEME_STOP_WORDS = new Set(['prime', 'minister', 'scheme', 'schemes', 'programme', 'program', 'yojana', 'national', 'central', 'state', 'india', 'bima', 'vima', 'fund', 'general', 'mission', 'about', 'tell', 'what', 'which', 'explain']);
  const matchedScheme = MOCK_SCHEMES.find(s => {
    const sName = (s.name || '').toLowerCase();
    const sShort = (s.short_name || s.shortName || '').toLowerCase();
    if (sShort && (q === sShort || q.includes(` ${sShort} `) || q.startsWith(`${sShort} `) || q.endsWith(` ${sShort}`))) return true;
    if (sName && q.includes(sName)) return true;
    const distinctiveWords = sName.split(/[\s,()/-]+/).filter(w => w.length > 4 && !SCHEME_STOP_WORDS.has(w));
    return distinctiveWords.length > 0 && distinctiveWords.every(w => q.includes(w));
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

  // -----------------------------------------------------------------
  // 10. Conversational Fallback (Flexible Conversational Sakhi)
  // -----------------------------------------------------------------
  const generalConversationalFallback = {
    hi: `### 💡 नमस्ते! मैं सखी (Sakhi) हूँ — आपकी एआई सहायक\n\nमैं आपकी सहायता के लिए तैयार हूँ। हालांकि मेरी मुख्य विशेषज्ञता व्यक्तिगत वित्त, संप्रभु सरकारी योजनाओं (PPF, SSY, NPS), 50/30/20 बजट नियम और जीवन लक्ष्यों (जैसे बाइक, यात्रा या आपातकालीन निधि) में है, मैं आपके रोज़मर्रा के सामान्य सवालों और बातचीत में भी मार्गदर्शन करने में सक्षम हूँ।\n\nआप मुझसे वित्त, सामान्य ज्ञान या किसी भी विषय पर पूछ सकते हैं!`,
    mr: `### 💡 नमस्कार! मी सखी (Sakhi) आहे — आपली एआय सहाय्यक\n\nमी आपल्या मदतीसाठी सदैव उपस्थित आहे. माझे मुख्य कार्य वैयक्तिक वित्त, अधिकृत सरकारी योजना (PPF, SSY, NPS), बजेट नियोजन आणि उद्दिष्ट बचत यामध्ये आहे. तसेच मी आपल्या दैनंदिन प्रश्नांचे निराकरण आणि संभाषण करण्यासही सज्ज आहे.\n\nआपण कोणत्याही विषयावर निःसंकोचपणे विचारू शकता!`,
    bn: `### 💡 নমস্কার! আমি সখী (Sakhi) — আপনার এআই সহকারী\n\nআমি আপনাকে সাহায্য করতে পেরে আনন্দিত। যদিও আমার মূল বিশেষত্ব व्यक्तिगत অর্থব্যবস্থা, সরকারি স্কিম (PPF, SSY, NPS), ৫০/৩০/২০ বাজেট ও সঞ্চয় লক্ষ্য পরিকল্পনায়, আমি আপনার সাধারণ প্রশ্নের उत्तर দিতেও প্রস্তুত।\n\nআজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?`,
    te: `### 💡 నమస్కారం! నేను సఖిని (Sakhi) — మీ ఏఐ సహాయకురాలిని\n\nమీకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను. నా ప్రధాన ప్రత్యేకత వ్యక్తిగత ఆర్థిక ప్రణాళిక, ప్రభుత్వ పథకాలు (PPF, SSY, NPS), 50/30/20 బడ్జెట్ మరియు పొదుపు లక్ష్యాలలో ఉన్నప్పటికీ, రోజువారీ ప్రశ్నలకు సమాధానం ఇవ్వడానికి కూడా నేను సిద్ధంగా ఉన్నాను.\n\nమీరు ఏ విషయంలోనైనా నన్ను అడగవచ్చు!`,
    en: `### 💡 Hello! I am Sakhi — Sanchay's Conversational AI Companion\n\nI am delighted to assist you! While my core specialization is personal financial planning, budgeting (the 50/30/20 rule), milestone goal modeling (vehicles, travel, education), and official Government of India savings programs (PPF, SSY, NPS, SCSS), I am happy to converse naturally, explain concepts, and assist with everyday questions.\n\nFeel free to ask me anything or choose a suggested topic below!`
  };

  // Detect Hinglish slang/casual phrases
  const isHinglish = /\b(hat|re|hatt|chup|kya|bhai|bata|batao|kaun|kon|teri|mera|mujhe|kuch|nahi|nhi)\b/i.test(q);
  const finalLang = (effectiveLang === 'hi' || isHinglish) ? 'hi' : effectiveLang;

  return {
    id: `s-local-${Date.now()}`,
    sender: 'sakhi',
    text: generalConversationalFallback[finalLang] || generalConversationalFallback.en,
    intent: 'GENERAL_CONVERSATION',
    sources: [],
    guardrailApplied: null,
    suggestedPrompts: finalLang === 'hi' ? [
      '50/30/20 बजट नियम क्या है?',
      'एसआईपी (SIP) क्या है?',
      'सुकन्या समृद्धि योजना क्या है?',
      'पब्लिक प्रोविडेंट फंड (PPF) के नियम'
    ] : [
      'Explain the 50/30/20 budget rule',
      'What is an SIP?',
      'Tell me about Sukanya Samriddhi Yojana (SSY)',
      'What is Public Provident Fund (PPF)?'
    ],
    actionButtons: [
      { label: finalLang === 'hi' ? '📊 बजट प्लानर' : '📊 Budget Planner', action: 'navigate', payload: { path: '/financial-health' } },
      { label: finalLang === 'hi' ? '🎯 मेरे लिए योजनाएं खोजें' : '🎯 Find My Schemes', action: 'navigate', payload: { path: '/profile' } },
      { label: finalLang === 'hi' ? '🏛️ सभी योजनाएं देखें' : '🏛️ Explore All Schemes', action: 'navigate', payload: { path: '/explore' } }
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
