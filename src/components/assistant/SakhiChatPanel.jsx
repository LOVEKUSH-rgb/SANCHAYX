import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SakhiAvatar } from './SakhiAvatar';
import {
  X, Send, Languages, ShieldCheck, ExternalLink,
  Sparkles, AlertCircle, HelpCircle,
  FileCheck, ArrowRight, CheckCircle2, ChevronRight, Globe,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sendSakhiChat } from '../../services/api';
import { resolveLocalSakhiAnswer } from '../../services/sakhiLocalResponder';

const CONTEXTUAL_PROMPTS = {
  Landing: {
    en: [
      { label: 'What is PPF?', prompt: 'What is Public Provident Fund (PPF)?' },
      { label: 'Sukanya Scheme', prompt: 'Tell me about Sukanya Samriddhi Yojana (SSY)' },
      { label: 'Pension Schemes', prompt: 'What pension schemes are available (APY / NPS)?' },
      { label: 'Official Sources', prompt: 'What are the official verified sources for Sanchay?' },
    ],
    hi: [
      { label: 'PPF क्या है?', prompt: 'पब्लिक प्रोविडेंट फंड (PPF) क्या है?' },
      { label: 'सुकन्या योजना', prompt: 'सुकन्या समृद्धि योजना (SSY) के बारे में बताएं' },
      { label: 'पेंशन योजनाएं', prompt: 'कौन सी पेंशन योजनाएं उपलब्ध हैं (APY / NPS)?' },
      { label: 'आधिकारिक स्रोत', prompt: 'संचय के आधिकारिक सत्यापित स्रोत कौन से हैं?' },
    ],
    mr: [
      { label: 'PPF काय आहे?', prompt: 'पब्लिक प्रॉव्हिडंट फंड (PPF) काय आहे?' },
      { label: 'सुकन्या योजना', prompt: 'सुकन्या समृद्धी योजना (SSY) बद्दल सांगा' },
      { label: 'पेन्शन योजना', prompt: 'कोणत्या पेन्शन योजना उपलब्ध आहेत (APY / NPS)?' },
      { label: 'अधिकृत स्रोत', prompt: 'संचयचे अधिकृत सत्यापित स्रोत कोणते आहेत?' },
    ],
    bn: [
      { label: 'PPF কী?', prompt: 'পাবলিক প্রভিডেন্ট ফান্ড (PPF) কী?' },
      { label: 'সুকন্যা যোজনা', prompt: 'সুকন্যা সমৃদ্ধি যোজনা (SSY) সম্পর্কে জানান' },
      { label: 'পেনশন স্কিম', prompt: 'কোন কোন পেনশন স্কিম উপলব্ধ (APY / NPS)?' },
      { label: 'অফিসিয়াল উৎস', prompt: 'সঞ্চয়ের যাচাইকৃত অফিসিয়াল সোর্স কোনগুলো?' },
    ],
    te: [
      { label: 'PPF అంటే ఏమిటి?', prompt: 'పబ్లిక్ ప్రావిడెంట్ ఫండ్ (PPF) అంటే ఏమిటి?' },
      { label: 'సుకున్య యోజన', prompt: 'సుకున్య సమృద్ధి యోజన (SSY) గురించి చెప్పండి' },
      { label: 'పెన్షన్ పథకాలు', prompt: 'ఏ పెన్షన్ పథకాలు అందుబాటులో ఉన్నాయి (APY / NPS)?' },
      { label: 'అధికారిక వనరులు', prompt: 'సంచయ్ యొక్క ధృవీకరించబడిన అధికారిక వనరులు ఏమిటి?' },
    ]
  },
  Profile: {
    en: [
      { label: 'Age & Residency Rules', prompt: 'How do age and residency affect scheme eligibility?' },
      { label: 'Women Schemes', prompt: 'Which verified schemes are reserved for women or girl children?' },
      { label: 'Farmer Schemes', prompt: 'What schemes support farmers and agriculture?' },
      { label: 'Check Eligibility', prompt: 'Am I eligible based on my declared profile?' },
    ],
    hi: [
      { label: 'आयु व नागरिकता नियम', prompt: 'आयु और नागरिकता पात्रता को कैसे प्रभावित करते हैं?' },
      { label: 'महिला योजनाएं', prompt: 'महिलाओं या बालिकाओं के लिए कौन सी योजनाएं हैं?' },
      { label: 'किसान योजनाएं', prompt: 'किसानों के लिए कौन सी योजनाएं उपलब्ध हैं?' },
      { label: 'पात्रता जांचें', prompt: 'मेरी घोषित प्रोफ़ाइल के अनुसार मेरी पात्रता क्या है?' },
    ],
    mr: [
      { label: 'वय आणि रहिवासी नियम', prompt: 'वय आणि रहिवासी स्थिती पात्रतेवर कसा परिणाम करतात?' },
      { label: 'महिला योजना', prompt: 'महिला किंवा मुलींसाठी कोणत्या योजना आहेत?' },
      { label: 'शेतकरी योजना', prompt: 'शेतकऱ्यांसाठी कोणत्या योजना उपलब्ध आहेत?' },
      { label: 'पात्रता तपासा', prompt: 'माझ्या प्रोफाइलनुसार माझी पात्रता काय आहे?' },
    ],
    bn: [
      { label: 'বয়স ও নাগরিকত্ব নিয়ম', prompt: 'বয়স ও বাসস্থান কীভাবে যোগ্যতা প্রভাবিত করে?' },
      { label: 'মহিলাদের স্কিম', prompt: 'মহিলা বা কন্যা সন্তানদের জন্য কোন স্কিম আছে?' },
      { label: 'কৃষক স্কিম', prompt: 'কৃষকদের জন্য কোন স্কিমগুলি উপলব্ধ?' },
      { label: 'যোগ্যতা যাচাই', prompt: 'আমার প্রোফাইল অনুযায়ী আমার যোগ্যতা কী?' },
    ],
    te: [
      { label: 'వయస్సు & నివాస నియమాలు', prompt: 'వయస్సు మరియు నివాసం అర్హతను ఎలా ప్రభావితం చేస్తాయి?' },
      { label: 'మహిళా పథకాలు', prompt: 'మహిళలు లేదా ఆడపిల్లల కోసం ఏ పథకాలు ఉన్నాయి?' },
      { label: 'రైతు పథకాలు', prompt: 'రైతులకు ఏ పథకాలు అందుబాటులో ఉన్నాయి?' },
      { label: 'అర్హతను తనిఖీ చేయండి', prompt: 'నా ప్రొఫైల్ ఆధారంగా నా అర్హత ఏమిటి?' },
    ]
  },
  Recommendations: {
    en: [
      { label: 'Why recommended?', prompt: 'Why was this top scheme recommended for my profile?' },
      { label: 'Am I 100% eligible?', prompt: 'Am I 100% eligible for my recommended schemes?' },
      { label: 'Why others rejected?', prompt: 'Why were other schemes rejected or filtered out?' },
      { label: 'Compare Top 2', prompt: 'Compare the top 2 recommended schemes for me' },
    ],
    hi: [
      { label: 'यह सिफारिश क्यों?', prompt: 'मेरी प्रोफ़ाइल के लिए इस योजना की सिफारिश क्यों की गई?' },
      { label: 'क्या मैं 100% पात्र हूँ?', prompt: 'क्या मैं सुझाई गई योजनाओं के लिए 100% पात्र हूँ?' },
      { label: 'अन्य क्यों खारिज हुए?', prompt: 'अन्य योजनाएं क्यों खारिज या बाहर की गईं?' },
      { label: 'शीर्ष 2 की तुलना', prompt: 'शीर्ष 2 अनुशंसित योजनाओं की आपस में तुलना करें' },
    ],
    mr: [
      { label: 'ही शिफारस का?', prompt: 'माझ्या प्रोफाइलसाठी ही योजना का शिफारस केली गेली?' },
      { label: 'मी १००% पात्र आहे का?', prompt: 'मी शिफारस केलेल्या योजनांसाठी पात्र आहे का?' },
      { label: 'इतर का नाकारले?', prompt: 'इतर योजना का नाकारल्या गेल्या?' },
      { label: 'शीर्ष २ ची तुलना', prompt: 'माझ्यासाठी सर्वोत्तम २ योजनांची तुलना करा' },
    ],
    bn: [
      { label: 'কেন সুপারিশ করা হলো?', prompt: 'আমার প্রোফাইলের জন্য এই স্কিম কেন সুপারিশ করা হয়েছে?' },
      { label: 'আমি কি ১০০% যোগ্য?', prompt: 'আমি কি সুপারিশকৃত স্কিমগুলির জন্য যোগ্য?' },
      { label: 'অন্যগুলি কেন বাদ পড়ল?', prompt: 'অন্যান্য স্কিমগুলি কেন বাতিল করা হলো?' },
      { label: 'শীর্ষ ২টির তুলনা', prompt: 'সেরা ২টি স্কিমের মধ্যে তুলনা করুন' },
    ],
    te: [
      { label: 'ఎందుకు సిఫార్సు చేయబడింది?', prompt: 'నా ప్రొఫైల్ కోసం ఈ పథకం ఎందుకు సిఫార్సు చేయబడింది?' },
      { label: 'నేను అర్హుడినా?', prompt: 'సిఫార్సు చేయబడిన పథకాలకు నేను 100% అర్హుడినా?' },
      { label: 'ఇతరాలు ఎందుకు తిరస్కరించబడ్డాయి?', prompt: 'ఇతర పథకాలు ఎందుకు ఫిల్టర్ చేయబడ్డాయి?' },
      { label: 'టాప్ 2 పోల్చండి', prompt: 'నా కోసం సిఫార్సు చేసిన టాప్ 2 పథకాలను పోల్చండి' },
    ]
  },
  Compare: {
    en: [
      { label: 'Compare PPF vs NSC', prompt: 'Compare PPF and NSC on interest and lock-in' },
      { label: 'Compare APY vs NPS', prompt: 'Compare Atal Pension Yojana and NPS for retirement' },
      { label: 'Highest Interest Rate', prompt: 'Which verified small savings scheme has the highest interest rate?' },
      { label: 'Withdrawal Rules', prompt: 'What are premature exit and withdrawal rules across these schemes?' },
    ],
    hi: [
      { label: 'PPF बनाम NSC तुलना', prompt: 'ब्याज और लॉक-इन पर PPF और NSC की तुलना करें' },
      { label: 'APY बनाम NPS तुलना', prompt: 'पेंशन के लिए अटल पेंशन योजना और NPS की तुलना करें' },
      { label: 'उच्चतम ब्याज दर', prompt: 'किस लघु बचत योजना में सबसे अधिक ब्याज मिलता है?' },
      { label: 'निकासी नियम', prompt: 'इन योजनाओं के समयपूर्व निकासी नियम क्या हैं?' },
    ],
    mr: [
      { label: 'PPF वि. NSC तुलना', prompt: 'व्याज आणि लॉक-इनवर PPF आणि NSC ची तुलना करा' },
      { label: 'APY वि. NPS तुलना', prompt: 'पेन्शनसाठी APY आणि NPS ची तुलना करा' },
      { label: 'सर्वोच्च व्याजदर', prompt: 'कोणत्या सरकारी योजनेचा व्याजदर सर्वाधिक आहे?' },
      { label: 'पैसे काढण्याचे नियम', prompt: 'या योजनांचे मुदतपूर्व पैसे काढण्याचे नियम काय आहेत?' },
    ],
    bn: [
      { label: 'PPF বনাম NSC তুলনা', prompt: 'সুদ ও মেয়াদের ওপর PPF এবং NSC-এর তুলনা করুন' },
      { label: 'APY বনাম NPS তুলনা', prompt: 'পেনশনের জন্য APY এবং NPS তুলনা করুন' },
      { label: 'সর্বোচ্চ সুদের হার', prompt: 'কোন ক্ষুদ্র সঞ্চয় প্রকল্পে সর্বোচ্চ সুদ পাওয়া যায়?' },
      { label: 'টাকা তোলার নিয়ম', prompt: 'এই প্রকল্পগুলির মেয়াদপূর্তির আগে টাকা তোলার নিয়ম কী?' },
    ],
    te: [
      { label: 'PPF vs NSC పోలిక', prompt: 'వడ్డీ మరియు లాక్-ఇన్ పై PPF మరియు NSC ని పోల్చండి' },
      { label: 'APY vs NPS పోలిక', prompt: 'రిటైర్మెంట్ కోసం APY మరియు NPS ని పోల్చండి' },
      { label: 'అత్యధిక వడ్డీ రేటు', prompt: 'ఏ ప్రభుత్వ పథకంలో అత్యధిక వడ్డీ రేటు లభిస్తుంది?' },
      { label: 'విత్‌డ్రా నిబంధనలు', prompt: 'ఈ పథకాల ముందస్తు విత్‌డ్రా నిబంధనలు ఏమిటి?' },
    ]
  }
};

// Markdown Formatter Helper with full Table support
const renderMarkdown = (content) => {
  if (!content) return null;
  const rawLines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // Check if start of a Markdown Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map(cell => cell.trim());
        
        // Skip separator line (e.g. |---|---|)
        const dataRows = tableLines.slice(2).map(r =>
          r.slice(1, -1).split('|').map(cell => cell.trim())
        );

        elements.push(
          <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
              <thead className="bg-slate-50 text-sanchay-navy-950 font-bold">
                <tr>
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 text-[11px] font-semibold text-slate-800 border-r last:border-r-0 border-slate-200 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {row.map((cell, cIdx) => {
                      const parts = cell.split(/(\*\*.*?\*\*)/g);
                      return (
                        <td key={cIdx} className="px-3 py-1.5 text-[11px] text-slate-700 border-r last:border-r-0 border-slate-200">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-semibold text-sanchay-navy-950">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h-${i}`} className="font-serif font-bold text-sm text-sanchay-navy-950 mt-2 mb-1 flex items-center gap-1.5">
          {line.replace('### ', '')}
        </h4>
      );
    } else if (line.startsWith('• ') || line.startsWith('* ') || line.startsWith('- ')) {
      const rawText = line.replace(/^[•*-]\s*/, '');
      const parts = rawText.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <li key={`li-${i}`} className="ml-3.5 list-disc text-[11px] leading-relaxed text-slate-700 my-0.5">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="text-sanchay-navy-950 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </li>
      );
    } else if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-sanchay-navy-950 my-1">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-sanchay-navy-950">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    }

    i++;
  }

  return elements;
};

export const SakhiChatPanel = ({
  isOpen: propIsOpen,
  onClose,
  initialPrompt = '',
  context = {}
}) => {
  const { currentLang, setCurrentLang, languages, t } = useLanguage();
  const navigate = useNavigate();

  const [internalOpen, setInternalOpen] = useState(false);
  const isPanelOpen = propIsOpen !== undefined ? (propIsOpen || internalOpen) : internalOpen;

  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState(currentLang === 'hi' ? 'hi-IN' : 'en-IN');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeakingId, setIsSpeakingId] = useState(null);
  const [micNotice, setMicNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const latestMessageRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const handleOpen = () => setInternalOpen(true);
    const handleClose = () => {
      setInternalOpen(false);
      if (onClose) onClose();
    };
    const handleToggle = () => setInternalOpen(prev => !prev);

    window.addEventListener('open-sakhi', handleOpen);
    window.addEventListener('close-sakhi', handleClose);
    window.addEventListener('toggle-sakhi', handleToggle);
    return () => {
      window.removeEventListener('open-sakhi', handleOpen);
      window.removeEventListener('close-sakhi', handleClose);
      window.removeEventListener('toggle-sakhi', handleToggle);
    };
  }, [onClose]);

  useEffect(() => {
    if (propIsOpen !== undefined) {
      setInternalOpen(propIsOpen);
    }
  }, [propIsOpen]);

  const handlePanelClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
    window.dispatchEvent(new CustomEvent('sakhi-closed'));
  };

  const langVoiceCodeMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    te: 'te-IN'
  };

  useEffect(() => {
    // Keep voice lang aligned with current UI lang or en-IN
    setVoiceLang(langVoiceCodeMap[currentLang] || 'en-IN');
  }, [currentLang]);

  // Multilingual browser fallback notices
  const micFallbackNotices = {
    hi: {
      unsupported: 'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया Google Chrome या Edge का उपयोग करें।',
      denied: 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में माइक की अनुमति दें।',
      error: 'माइक्रोफ़ोन शुरू करने में समस्या आई। कृपया पुनः प्रयास करें।'
    },
    mr: {
      unsupported: 'तुमच्या ब्राउझरमध्ये व्हॉइस इनपुट समर्थित नाही. कृपया Google Chrome किंवा Edge वापरा.',
      denied: 'मायक्रोफोन परवानगी नाकारली. कृपया ब्राउझरमध्ये माइक परवानगी द्या.',
      error: 'मायक्रोफोन सुरू करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
    },
    bn: {
      unsupported: 'আপনার ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। অনুগ্রহ করে Google Chrome বা Edge ব্যবহার করুন।',
      denied: 'মাইক্রোফোনের অনুমতি বাতিল করা হয়েছে। অনুগ্রহ করে ব্রাউজারে মাইক চালু করুন।',
      error: 'মাইক্রোফোন শুরু করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
    },
    te: {
      unsupported: 'మీ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ సపోర్ట్ లేదు. దయచేసి Google Chrome లేదా Edge ఉపయోగించండి.',
      denied: 'మైక్రోఫోన్ అనుమతి తిరస్కరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్‌ను అనుమతించండి.',
      error: 'మైక్రోఫోన్ ప్రారంభించడంలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
    },
    en: {
      unsupported: 'Voice input is not supported in this browser. Please use Chrome or Edge.',
      denied: 'Microphone permission denied. Please allow microphone access in browser settings.',
      error: 'Could not start microphone. Please try again.'
    }
  };

  // Enhanced Continuous Multilingual Microphone Input (Speech-to-Text)
  const toggleListening = (forcedLang) => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      setLiveTranscript('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const notices = micFallbackNotices[currentLang] || micFallbackNotices.en;

    if (!SpeechRecognition) {
      setMicNotice(notices.unsupported);
      setTimeout(() => setMicNotice(null), 5000);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const activeLang = forcedLang || voiceLang || langVoiceCodeMap[currentLang] || 'en-IN';
      const recognition = new SpeechRecognition();
      recognition.lang = activeLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      finalTranscriptRef.current = '';
      setLiveTranscript('');

      recognition.onstart = () => {
        setIsListening(true);
        setMicNotice(null);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let newFinalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalText += trans + ' ';
          } else {
            interimText += trans;
          }
        }

        if (newFinalText) {
          finalTranscriptRef.current += newFinalText;
        }

        const fullCaptured = (finalTranscriptRef.current + interimText).replace(/\s+/g, ' ').trim();
        setLiveTranscript(interimText || fullCaptured);
        if (fullCaptured) {
          setInputMessage(fullCaptured);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setIsListening(false);
          setMicNotice(notices.denied);
          setTimeout(() => setMicNotice(null), 5000);
        } else if (event.error === 'no-speech') {
          // Keep listening or quietly recover
        } else if (event.error === 'language-not-supported') {
          setIsListening(false);
          setMicNotice(currentLang === 'hi' ? 'चयनित भाषा इस डिवाइस पर उपलब्ध नहीं है।' : 'Selected language not supported on this speech engine.');
          setTimeout(() => setMicNotice(null), 5000);
        } else {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setMicNotice(notices.error);
      setTimeout(() => setMicNotice(null), 4000);
    }
  };

  // Available voices cache for robust multilingual Text-to-Speech
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Intelligently detect the language/script of the text to be read out
  const detectTextLanguage = (text, defaultLang) => {
    if (!text) return langVoiceCodeMap[defaultLang] || 'en-IN';

    // 1. Bengali Script check (Unicode \u0980-\u09FF)
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';

    // 2. Telugu Script check (Unicode \u0C00-\u0C7F)
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';

    // 3. Devanagari Script check (Unicode \u0900-\u097F)
    if (/[\u0900-\u097F]/.test(text)) {
      // Check for Marathi-specific words
      if (/(आहे|नाही|सांगा|योजना|शेतकरी|वय|उत्पन्न|करू|पाहिजे|मिळेल|माहिती|प्रकल्प|अर्ज)/i.test(text) || defaultLang === 'mr') {
        return 'mr-IN';
      }
      return 'hi-IN';
    }

    return langVoiceCodeMap[defaultLang] || 'en-IN';
  };

  // Find the highest-quality native voice for the given language code
  const getBestVoiceForLang = (targetLang) => {
    if (!('speechSynthesis' in window)) return null;
    const voices = availableVoices.length > 0 ? availableVoices : (window.speechSynthesis.getVoices() || []);
    if (!voices || voices.length === 0) return null;

    const langPrefix = targetLang.split('-')[0].toLowerCase(); // 'hi', 'mr', 'bn', 'te', 'en'

    // 1. Exact match by lang code (e.g. 'hi-IN', 'hi_IN')
    let matched = voices.find(v => v.lang && (v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase()));
    if (matched) return matched;

    // 2. Matches language prefix (e.g. starts with 'hi' or 'mr' or 'bn' or 'te')
    matched = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (matched) return matched;

    // 3. Match voice name keywords
    const langKeywords = {
      hi: ['hindi', 'हिन्दी', 'kalpana', 'hemant', 'swara', 'madhur'],
      mr: ['marathi', 'मराठी', 'aarohi', 'manohar'],
      bn: ['bengali', 'bangla', 'বাংলা', 'tapan', 'bashkar'],
      te: ['telugu', 'తెలుగు', 'mohan', 'chitra', 'shruti'],
      en: ['india', 'indian', 'heera', 'neerja', 'ravi', 'en-in']
    };

    const keywords = langKeywords[langPrefix] || [];
    for (const kw of keywords) {
      matched = voices.find(v => (v.name && v.name.toLowerCase().includes(kw)) || (v.lang && v.lang.toLowerCase().includes(kw)));
      if (matched) return matched;
    }

    // 4. Indic fallback: If target is Marathi/Bengali/Telugu and OS lacks specific voice,
    // fallback to Hindi or Indian English voice (which pronounces Indic phonetics accurately)
    if (['mr', 'bn', 'te'].includes(langPrefix)) {
      matched = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('hi')) ||
                voices.find(v => v.name && v.name.toLowerCase().includes('hindi')) ||
                voices.find(v => v.lang && v.lang.toLowerCase().includes('in'));
      if (matched) return matched;
    }

    // 5. General Indian accent fallback
    matched = voices.find(v => v.lang && v.lang.toLowerCase().includes('in')) ||
              voices.find(v => v.default) ||
              voices[0];

    return matched;
  };

  // Toggle Speech Output (Text-to-Speech)
  const toggleSpeak = (msgId, textToRead) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown tags, emojis, bullets, links for natural spoken audio
    const cleanSpeechText = textToRead
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\|/g, ', ')
      .replace(/[•🟢⚡👉★✔✓]/g, '')
      .replace(/-{3,}/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanSpeechText) return;

    // Detect target language and best voice
    const targetLang = detectTextLanguage(cleanSpeechText, currentLang);
    const selectedVoice = getBestVoiceForLang(targetLang);

    // Split text into natural sentence chunks to prevent Chrome/Edge speech timeouts
    const rawChunks = cleanSpeechText.split(/([।\n.!?]+)/);
    const sentenceChunks = [];
    for (let i = 0; i < rawChunks.length; i += 2) {
      const sentence = (rawChunks[i] || '') + (rawChunks[i + 1] || '');
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        sentenceChunks.push(trimmed);
      }
    }

    if (sentenceChunks.length === 0) {
      sentenceChunks.push(cleanSpeechText);
    }

    setIsSpeakingId(msgId);

    // Queue sentence chunks sequentially
    sentenceChunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = targetLang;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = targetLang.startsWith('en') ? 0.95 : 0.90;
      utterance.pitch = 1.0;

      // When the final sentence chunk completes, clear speaking state
      if (index === sentenceChunks.length - 1) {
        utterance.onend = () => setIsSpeakingId(null);
        utterance.onerror = () => setIsSpeakingId(null);
      } else {
        utterance.onerror = () => setIsSpeakingId(null);
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      const greetings = {
        hi: "नमस्ते! मैं **सखी (Sakhi)** हूँ — संचय की सत्यापित सरकारी योजना सहायक।\n\nमैं केवल आधिकारिक भारत सरकार के राजपत्रों द्वारा सत्यापित योजनाओं (जैसे **PPF, SSY, SCSS, APY, NPS**) की जानकारी देती हूँ।\n\nआप किसी भी योजना की ब्याज दर, पात्रता, या लॉक-इन नियमों के बारे में पूछ सकते हैं।",
        mr: "नमस्कार! मी **सखी (Sakhi)** आहे — संचयची अधिकृत सरकारी योजना सहाय्यक.\n\nमी केवळ भारत सरकारच्या राजपत्रांद्वारे सत्यापित योजनांची (उदा. **PPF, SSY, SCSS, APY, NPS**) माहिती देते.\n\nतुम्ही पात्रता, व्याजदर आणि पैसे काढण्याच्या नियमांबद्दल विचारू शकता.",
        bn: "নমস্কার! আমি **সখী (Sakhi)** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক।\n\nআমি শুধুমাত্র ভারত সরকারের অনুমোদিত স্কিম (যেমন **PPF, SSY, SCSS, APY, NPS**) ব্যাখ্যা করি।\n\nআপনি যেকোনো স্কিমের সুদের হার, যোগ্যতা বা নিয়মাবলী সম্পর্কে জিজ্ঞাসা করতে পারেন।",
        te: "నమస్కారం! నేను **సఖి (Sakhi)** — సంచయ్ యొక్క ధృవీకరించబడిన ప్రభుత్వ పథకాల సహాయకురాలిని.\n\nనేను భారత ప్రభుత్వ అధికారిక గెజిట్‌ల ద్వారా ధృవీకరించబడిన పథకాల (ఉదా. **PPF, SSY, SCSS, APY, NPS**) పై మాత్రమే సమాచారం అందిస్తాను.\n\nమీరు అర్హత, వడ్డీ రేట్లు లేదా విత్‌డ్రా నిబంధనల గురించి అడగవచ్చు.",
        en: "Hello! I am **Sakhi** — Sanchay's Verified Scheme Assistant.\n\nI provide grounded explanations strictly based on official Government of India gazettes for schemes like **PPF, SSY, SCSS, APY, and NPS**.\n\nHow can I help you understand verified government savings rules today?"
      };

      setMessages([
        {
          id: 'welcome',
          sender: 'sakhi',
          text: greetings[currentLang] || greetings.en,
          intent: 'WELCOME',
          sources: [
            {
              scheme_name: 'National Small Savings & Central Gazettes',
              source_authority: 'Ministry of Finance & PFRDA',
              official_url: 'https://india.gov.in',
              last_verified: '2026-08-28',
              verification_status: 'VERIFIED'
            }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentLang, messages.length]);

  useEffect(() => {
    if (isPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isPanelOpen]);

  useEffect(() => {
    if (messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'user') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (lastMsg.sender === 'sakhi') {
        setTimeout(() => {
          if (latestMessageRef.current) {
            latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 120);
      }
    }
  }, [messages, isLoading]);

  const activePage = context.page || 'Landing';
  const pagePrompts = useMemo(() => {
    const pageObj = CONTEXTUAL_PROMPTS[activePage] || CONTEXTUAL_PROMPTS.Landing;
    return pageObj[currentLang] || pageObj.en;
  }, [activePage, currentLang]);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    setIsLoading(true);

    try {
      const response = await sendSakhiChat({
        message: textToSend.trim(),
        language: currentLang,
        context: {
          page: activePage,
          scheme_id: context.scheme_id,
          recommendation_id: context.recommendation_id,
          profile: context.profile,
          top_scheme: context.top_scheme,
          fit_score: context.fit_score,
          goal: context.goal,
          monthly_budget: context.monthly_budget,
          horizon_years: context.horizon_years,
          history: messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }))
        }
      });

      const sakhiMsg = {
        id: `s-${Date.now()}`,
        sender: 'sakhi',
        text: response.answer || response.message,
        intent: response.intent,
        sources: response.sources || [],
        eligibilityResult: response.eligibility_result,
        guardrailApplied: response.guardrail_applied,
        suggestedPrompts: response.suggested_prompts || [],
        actionButtons: response.action_buttons || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, sakhiMsg]);
    } catch (err) {
      console.warn('Sakhi assistant API error:', err);
      const localFallback = resolveLocalSakhiAnswer(textToSend.trim(), currentLang);
      if (localFallback) {
        setMessages(prev => [...prev, localFallback]);
      } else {
        setMessages(prev => [
          ...prev,
          {
          id: `err-${Date.now()}`,
          sender: 'sakhi',
          text: ({
            hi: "क्षमा करें, सत्यापित डेटाबेस से संपर्क करने में समस्या आई। कृपया पुनः प्रयास करें।",
            mr: "क्षमस्व, अधिकृत योजना डेटाबेसशी संपर्क साधण्यात समस्या आली. कृपया पुन्हा प्रयत्न करा.",
            bn: "দুঃখিত, যাচাইকৃত স্কিম ডেটাবেসের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            te: "క్షమించండి, ధృవీకరించబడిన పథకాల డేటాబేస్‌ను సంప్రదించడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
            en: "I encountered a connectivity issue while querying the verified scheme database. Please try asking again."
          }[currentLang] || "I encountered a connectivity issue while querying the verified scheme database. Please try asking again."),
          intent: 'ERROR',
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (btn) => {
    if (btn.action === 'open_url' && btn.payload?.url) {
      window.open(btn.payload.url, '_blank', 'noopener,noreferrer');
    } else if (btn.action === 'navigate' && btn.payload?.path) {
      navigate(btn.payload.path);
      onClose();
    } else if (btn.action === 'ask_prompt' && btn.payload?.prompt) {
      handleSendMessage(btn.payload.prompt);
    }
  };

  const quickChips = [
    { 
      label: currentLang === 'hi' ? '🎁 Free Plans (मुफ्त लाभ)' : currentLang === 'mr' ? '🎁 Free Plans (मोफत लाभ)' : currentLang === 'bn' ? '🎁 Free Plans (বিনামূল্যে)' : currentLang === 'te' ? '🎁 Free Plans (ఉచిత ప్రయోజనాలు)' : '🎁 Free Plans', 
      prompt: currentLang === 'hi' ? 'मुझे मुफ्त सरकारी लाभ और योजनाएं (Free Plans) बताओ' : currentLang === 'mr' ? 'मला मोफत सरकारी लाभ आणि योजना (Free Plans) सांगा' : currentLang === 'bn' ? 'আমাকে বিনামূল্যে সরকারি সুবিধা ও স্কিমগুলি (Free Plans) জানান' : currentLang === 'te' ? 'నాకు ఉచిత ప్రభుత్వ ప్రయోజనాలు (Free Plans) చెప్పండి' : 'Tell me about available Free Plans, 100% free benefits, and skill training' 
    },
    { 
      label: currentLang === 'hi' ? '🏛️ Government Schemes' : currentLang === 'mr' ? '🏛️ Government Schemes' : currentLang === 'bn' ? '🏛️ Government Schemes' : currentLang === 'te' ? '🏛️ Government Schemes' : '🏛️ Government Schemes', 
      prompt: currentLang === 'hi' ? 'मुझे शीर्ष सरकारी बचत और निवेश योजनाएं बताओ' : currentLang === 'mr' ? 'मला सर्वोत्तम सरकारी बचत योजना सांगा' : currentLang === 'bn' ? 'আমাকে শীর্ষ সরকারি সঞ্চয় স্কিমগুলি জানান' : currentLang === 'te' ? 'నాకు ఉత్తమ ప్రభుత్వ పొదుపు పథకాలను చెప్పండి' : 'What are the top sovereign Government Schemes on Sanchay?' 
    },
    { 
      label: currentLang === 'hi' ? '🛡️ LIC Plans' : currentLang === 'mr' ? '🛡️ LIC Plans' : currentLang === 'bn' ? '🛡️ LIC Plans' : currentLang === 'te' ? '🛡️ LIC Plans' : '🛡️ LIC Plans', 
      prompt: currentLang === 'hi' ? 'मेरे लिए कौन सी LIC बीमा योजना उपयुक्त है?' : currentLang === 'mr' ? 'माझ्यासाठी कोणता LIC प्लॅन योग्य आहे?' : currentLang === 'bn' ? 'আমার জন্য কোন এলআইসি পলিসি উপযুক্ত?' : currentLang === 'te' ? 'నా కోసం ఏ ఎల్‌ఐసీ ప్లాన్ సరిపోతుంది?' : 'Which LIC plan is suitable for my profile?' 
    },
    { label: currentLang === 'hi' ? '👧 बच्चे/बालिका योजना' : '👧 Child / SSY', prompt: currentLang === 'hi' ? 'मुझे बच्चे और बालिका के लिए सरकारी योजनाएं बताओ' : 'What are the best government schemes for children and girl child?' },
    { label: currentLang === 'hi' ? '📈 उच्चतम ब्याज दर' : '📈 Highest Interest', prompt: 'Highest interest rate' },
    { label: currentLang === 'hi' ? '🌾 किसान योजनाएं' : '🌾 Farmer / PM-KISAN', prompt: currentLang === 'hi' ? 'किसानों के लिए कौन सी सरकारी योजनाएं हैं?' : 'Tell me about schemes for farmers and agriculture' },
    { label: currentLang === 'hi' ? '👵 वरिष्ठ नागरिक (60+)' : '👵 Senior Citizen', prompt: currentLang === 'hi' ? 'वरिष्ठ नागरिकों और 60+ के लिए योजनाएं बताओ' : 'What schemes are available for senior citizens (60+)?' },
    { label: currentLang === 'hi' ? '💰 80C टैक्स बचत' : '💰 80C Tax-Free', prompt: currentLang === 'hi' ? 'टैक्स बचाने के लिए सर्वोत्तम सरकारी योजनाएं' : 'Which government schemes provide Section 80C tax exemption?' },
    { label: currentLang === 'hi' ? '💼 व्यापार लोन / MUDRA' : '💼 Business / MUDRA', prompt: currentLang === 'hi' ? 'व्यापार और दुकान के लिए सरकारी लोन योजनाएं' : 'Tell me about PM MUDRA and business loan schemes' },
    { label: currentLang === 'hi' ? '⚖️ PPF vs SSY' : '⚖️ PPF vs SSY', prompt: 'Compare PPF and Sukanya Samriddhi Yojana' }
  ];

  const activeLangObj = languages.find(l => l.code === currentLang) || languages[0];

  if (!isPanelOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) handlePanelClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-end sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      
      <div className="w-full sm:w-[460px] h-full sm:h-[680px] bg-white sm:rounded-3xl shadow-floating border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
        
        {/* Header */}
        <div className="p-4 bg-sanchay-navy-950 text-white border-b border-sanchay-navy-800 flex items-center justify-between shrink-0 shadow-xs">
          
          <div className="flex items-center gap-3">
            <SakhiAvatar size="md" isStreaming={isLoading} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-extrabold text-base text-white">
                  {t('sakhi.title', 'Sakhi')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sanchay-emerald-600/90 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 border border-sanchay-emerald-400/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{t('sakhi.badge', 'VERIFIED ASSISTANT')}</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {t('sakhi.subtitle', 'Grounded in Official Gazettes')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="px-2.5 py-1.5 rounded-xl bg-sanchay-navy-900 hover:bg-sanchay-navy-850 text-slate-200 font-mono font-bold text-[10px] uppercase tracking-wider border border-sanchay-navy-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Select Language"
              >
                <Globe className="w-3 h-3 text-sanchay-emerald-400" />
                <span>{activeLangObj.native}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-floating border border-slate-200 py-1.5 z-50 text-sanchay-navy-950 animate-in fade-in duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 transition-colors ${
                        currentLang === lang.code ? 'bg-sanchay-emerald-50 text-sanchay-emerald-700 font-bold' : 'font-medium'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{lang.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handlePanelClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-sanchay-navy-900 transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Dedicated 3 Categories Quick Options Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-sanchay-navy-800 flex items-center justify-between gap-1.5 shrink-0 text-[11px]">
          <button
            type="button"
            onClick={() => handleSendMessage(
              currentLang === 'hi' ? 'मुझे प्रमुख सरकारी योजनाओं के बारे में बताओ' :
              currentLang === 'mr' ? 'मला महत्त्वाच्या सरकारी योजनांबद्दल सांगा' :
              currentLang === 'bn' ? 'আমাকে প্রধান সরকারি স্কিমগুলি সম্পর্কে জানান' :
              currentLang === 'te' ? 'నాకు ప్రధాన ప్రభుత్వ పథకాల గురించి చెప్పండి' :
              'Tell me about major Government Schemes available on Sanchay'
            )}
            className="flex-1 py-1.5 px-2 rounded-xl bg-sanchay-navy-800/90 hover:bg-sanchay-navy-700 text-slate-200 hover:text-white font-medium text-center transition-all cursor-pointer border border-sanchay-navy-700/60 truncate"
          >
            🏛️ {t('sakhi.govtSchemesOption', 'Government Schemes')}
          </button>

          <button
            type="button"
            onClick={() => handleSendMessage(
              currentLang === 'hi' ? 'मुझे प्रमुख एलआईसी बीमा योजनाओं (LIC Plans) के बारे में बताओ' :
              currentLang === 'mr' ? 'मला प्रमुख एलआयसी विमा योजनांबद्दल (LIC Plans) सांगा' :
              currentLang === 'bn' ? 'আমাকে প্রধান এলআইসি পলিসিগুলি (LIC Plans) সম্পর্কে জানান' :
              currentLang === 'te' ? 'నాకు ప్రధాన ఎల్‌ఐసీ పాలసీల (LIC Plans) గురించి చెప్పండి' :
              'Tell me about verified LIC Plans and life insurance solutions'
            )}
            className="flex-1 py-1.5 px-2 rounded-xl bg-sanchay-navy-800/90 hover:bg-sanchay-navy-700 text-slate-200 hover:text-white font-medium text-center transition-all cursor-pointer border border-sanchay-navy-700/60 truncate"
          >
            🛡️ {t('sakhi.licPlansOption', 'LIC Plans')}
          </button>

          <button
            type="button"
            onClick={() => handleSendMessage(
              currentLang === 'hi' ? 'मुझे मुफ्त सरकारी लाभ और योजनाओं (Free Plans) के बारे में बताओ' :
              currentLang === 'mr' ? 'मला मोफत सरकारी लाभ आणि योजनांबद्दल (Free Plans) सांगा' :
              currentLang === 'bn' ? 'আমাকে বিনামূল্যে সরকারি সুবিধা ও স্কিমগুলি (Free Plans) সম্পর্কে জানান' :
              currentLang === 'te' ? 'నాకు ఉచిత ప్రభుత్వ ప్రయోజనాలు మరియు పథకాల (Free Plans) గురించి చెప్పండి' :
              'Tell me about available Free Plans, 100% free benefits and training assistance'
            )}
            className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-center transition-all cursor-pointer border border-emerald-400/40 shadow-xs truncate"
            title="Explore 100% Free Sovereign Benefits"
          >
            🎁 {t('sakhi.freePlansOption', 'Free Plans')}
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF9F5] text-xs">
          
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isLast = idx === messages.length - 1;

            if (isUser) {
              return (
                <div key={msg.id} ref={isLast ? latestMessageRef : null} className="flex justify-end">
                  <div className="max-w-[85%] bg-sanchay-navy-950 text-white p-3.5 rounded-2xl rounded-tr-xs shadow-card">
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            // Verdict Badges mapping
            let verdictBadge = null;
            if (msg.eligibilityResult === 'ELIGIBLE') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sanchay-emerald-50 text-sanchay-emerald-800 border border-sanchay-emerald-300 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sanchay-emerald-600" />
                  <span>STATUTORY ELIGIBILITY SATISFIED</span>
                </div>
              );
            } else if (msg.eligibilityResult === 'INELIGIBLE') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>STATUTORY INELIGIBLE</span>
                </div>
              );
            } else if (msg.eligibilityResult === 'ADDITIONAL_INFORMATION_REQUIRED') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>ADDITIONAL INFORMATION REQUIRED</span>
                </div>
              );
            } else if (
              msg.eligibilityResult === 'NO_APPLICABLE_SCHEME' ||
              msg.eligibilityResult === 'NO_APPLICABLE_PLAN' ||
              msg.eligibilityResult === 'NO_APPLICABLE_BENEFIT'
            ) {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>{msg.eligibilityResult.replace(/_/g, ' ')}</span>
                </div>
              );
            } else if (msg.eligibilityResult === 'REVIEW_REQUIRED') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>REVIEW REQUIRED</span>
                </div>
              );
            } else if (msg.intent === 'OUT_OF_SCOPE') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-sanchay-navy-950" />
                  <span>OFFICIAL SCHEMES ONLY</span>
                </div>
              );
            } else if (msg.intent === 'COMPARE_SCHEMES') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SCHEME COMPARISON BRIEF</span>
                </div>
              );
            } else if (msg.intent === 'EXPLAIN_SCHEME' || msg.intent === 'BENEFITS') {
              verdictBadge = (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sanchay-gold-50 text-sanchay-navy-950 border border-sanchay-gold-300 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-600" />
                  <span>VERIFIED SCHEME BRIEF</span>
                </div>
              );
            }

            return (
              <div key={msg.id} ref={isLast ? latestMessageRef : null} className="flex flex-col gap-2">
                
                {/* Briefing Card Container */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-3">
                  
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {verdictBadge}
                    {msg.sender === 'sakhi' && (() => {
                      const readOutLabels = {
                        en: { read: 'Read Out', stop: 'Stop' },
                        hi: { read: 'सुनें', stop: 'रोकें' },
                        mr: { read: 'ऐका', stop: 'थांबवा' },
                        bn: { read: 'শুনুন', stop: 'বন্ধ করুন' },
                        te: { read: 'వినండి', stop: 'ఆపండి' }
                      };
                      const activeLabel = readOutLabels[currentLang] || readOutLabels.en;
                      return (
                        <button
                          type="button"
                          onClick={() => toggleSpeak(msg.id, msg.text)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSpeakingId === msg.id
                              ? 'bg-sanchay-emerald-600 text-white animate-pulse shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title={isSpeakingId === msg.id ? activeLabel.stop : activeLabel.read}
                        >
                          {isSpeakingId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span>{activeLabel.stop}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-sanchay-emerald-700" />
                              <span>{activeLabel.read}</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>

                  {/* Body Text / Markdown Formatter */}
                  <div className="prose-xs space-y-1 text-sanchay-navy-950 leading-relaxed">
                    {renderMarkdown(msg.text)}
                  </div>

                  {/* Source Chips with Direct Links */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                        Verified Official Sources:
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-sanchay-emerald-600 shrink-0" />
                            <span className="font-bold text-sanchay-navy-950 truncate">{src.source_authority}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">({src.last_verified})</span>
                          </div>
                          {src.official_url && (
                            <a
                              href={src.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sanchay-emerald-700 hover:text-sanchay-emerald-800 font-mono font-bold uppercase text-[10px] flex items-center gap-0.5 shrink-0 hover:underline"
                            >
                              <span>Official Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {msg.actionButtons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleActionClick(btn)}
                          className="px-3 py-1.5 rounded-xl bg-sanchay-navy-950 hover:bg-sanchay-navy-850 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span>{btn.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
                    <span>Single Source of Truth: MongoDB Master</span>
                    <span>{msg.timestamp}</span>
                  </div>

                </div>

                {/* Suggested Prompts Pill Row */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-2">
                    {msg.suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-sanchay-emerald-50 border border-slate-200/90 text-sanchay-navy-900 hover:text-sanchay-emerald-700 text-[10px] font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-sanchay-gold-500" />
                        <span className="truncate max-w-[200px]">{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            );
          })}

          {/* Honest Retrieval Loading State */}
          {isLoading && (
            <div className="bg-white rounded-2xl p-4 border border-sanchay-emerald-200/90 shadow-card flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sanchay-emerald-50 flex items-center justify-center text-sanchay-emerald-600 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <span className="font-serif font-bold text-xs text-sanchay-navy-950 block">
                  {t('sakhi.retrieving', 'Retrieving from verified database...')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {t('sakhi.retrievingSub', 'Running rule-based statutory engine & gazette cross-check')}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Contextual Suggested Prompt Chips */}
        {((pagePrompts && pagePrompts.length > 0) || (quickChips && quickChips.length > 0)) && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400 shrink-0">
              {t('sakhi.contextQuestions', 'Suggested:')}
            </span>
            {[...(pagePrompts || []), ...(quickChips || [])].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.prompt)}
                className="px-2.5 py-1 rounded-full bg-[#FAFAFC] hover:bg-sanchay-emerald-50 hover:text-sanchay-emerald-700 text-sanchay-navy-900 border border-slate-200 text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200/90">
          {micNotice && (
            <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{micNotice}</span>
            </div>
          )}

          {/* Active Listening Animated Banner with Language Switcher */}
          {isListening && (
            <div className="mb-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-100/70 to-rose-50 border border-rose-200/90 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <span className="font-serif font-bold text-xs text-rose-950">
                    {currentLang === 'hi' ? 'सखी सुन रही है... बोलिए' :
                     currentLang === 'mr' ? 'सखी ऐकत आहे... बोला' :
                     currentLang === 'bn' ? 'সখী শুনছে... বলুন' :
                     currentLang === 'te' ? 'సఖి వింటోంది... మాట్లాడండి' :
                     'Sakhi is listening... Speak now'}
                  </span>
                </div>

                {/* Quick Voice Language Switcher for all 5 Supported Languages */}
                <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-xl border border-rose-200 overflow-x-auto">
                  {[
                    { code: 'en-IN', label: 'EN' },
                    { code: 'hi-IN', label: 'हिन्दी' },
                    { code: 'mr-IN', label: 'मराठी' },
                    { code: 'bn-IN', label: 'বাংলা' },
                    { code: 'te-IN', label: 'తెలుగు' }
                  ].map((vl) => (
                    <button
                      key={vl.code}
                      type="button"
                      onClick={() => {
                        setVoiceLang(vl.code);
                        if (isListening && recognitionRef.current) {
                          try { recognitionRef.current.stop(); } catch (e) {}
                        }
                        setTimeout(() => toggleListening(vl.code), 120);
                      }}
                      className={`px-1.5 py-0.5 rounded-lg text-[9.5px] font-bold cursor-pointer transition-all ${
                        voiceLang === vl.code ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-900'
                      }`}
                    >
                      {vl.label}
                    </button>
                  ))}
                </div>
              </div>

              {liveTranscript && (
                <p className="text-[11px] text-rose-900 font-medium italic bg-white/70 px-2.5 py-1 rounded-xl border border-rose-200/60 truncate">
                  "{liveTranscript}"
                </p>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isListening) {
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch (err) {}
                }
                setIsListening(false);
              }
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? (
                currentLang === 'hi' ? 'बोलिए, सखी सुन रही है...' :
                currentLang === 'mr' ? 'बोला, सखी ऐकत आहे...' :
                currentLang === 'bn' ? 'বলুন, সখী শুনছে...' :
                currentLang === 'te' ? 'మాట్లాడండి, సఖి వింటోంది...' :
                'Listening... Speak now'
              ) : t('sakhi.placeholder', 'Ask Sakhi about verified scheme rules...')}
              disabled={isLoading}
              className={`flex-1 bg-[#FAFAFC] border rounded-2xl px-4 py-2.5 text-xs text-sanchay-navy-950 placeholder:text-slate-400 focus:outline-none transition-all disabled:opacity-50 font-medium ${
                isListening
                  ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-200 shadow-xs'
                  : 'border-slate-200 focus:border-sanchay-emerald-600'
              }`}
            />

            {/* Microphone Voice Input Button */}
            <button
              type="button"
              onClick={() => toggleListening()}
              disabled={isLoading}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200 shadow-md'
                  : 'bg-[#FAFAFC] hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title={isListening ? (currentLang === 'hi' ? 'सखी सुन रही है... रोकने के लिए क्लिक करें' : 'Listening... click to stop') : (currentLang === 'hi' ? 'आवाज़ से पूछें (हिंदी, मराठी, बांग्ला, तेलुगु, अंग्रेजी)' : 'Voice Input (Speak in Hindi, English, Marathi, Bengali, Telugu)')}
              aria-label="Microphone"
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white animate-bounce" />
              ) : (
                <Mic className="w-4 h-4 text-sanchay-emerald-700" />
              )}
            </button>

            {/* Send Message Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-2xl bg-sanchay-navy-950 hover:bg-sanchay-navy-900 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-card cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-sanchay-gold-400" />
            </button>
          </form>

          <p className="text-[9px] font-mono text-slate-400 text-center mt-2">
            {t('footer.disclaimer', 'Educational guidance grounded in Government of India gazettes.')}
          </p>
        </div>

      </div>

    </div>
  );
};
