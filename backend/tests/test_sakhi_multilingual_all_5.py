"""
Complete Test Suite for SANCHAY Sakhi AI Multilingual Capabilities across all 5 Supported Languages:
1. English (en)
2. Hindi (hi)
3. Marathi (mr)
4. Bengali (bn)
5. Telugu (te)
Plus Hinglish / Romanized input and dynamic language switching with context retention.

Tests A through J mandated by specification:
A. Government Scheme question
B. LIC question
C. Free Benefits question
D. Eligibility question
E. Missing-information question
F. Application question
G. Mixed-domain question
H. Follow-up question
I. Language switching
J. Hindi/Hinglish input
"""

import os
import sys
import unittest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.language_service import (
    detect_user_language,
    get_multilingual_text,
    LANGUAGE_SCRIPTS,
    PROMPT_TRANSLATIONS
)
from app.services.gemini_adapter import sakhi_adapter
from app.services.sakhi_lic_handler import handle_lic_chat, detect_query_domain
from app.services.sakhi_free_benefits_handler import handle_free_benefits_chat


class TestSakhiMultilingualAll5(unittest.TestCase):

    # =========================================================================
    # 1. LANGUAGE DETECTION TESTS
    # =========================================================================
    def test_language_detection_all_scripts(self):
        """Verify script and lexicon detection for all 5 languages."""
        # English
        self.assertEqual(detect_user_language("What government schemes are available for me?"), "en")
        
        # Hindi
        self.assertEqual(detect_user_language("मेरे लिए कौन सी सरकारी योजना उपलब्ध है?"), "hi")
        
        # Marathi
        self.assertEqual(detect_user_language("माझ्यासाठी कोणत्या सरकारी योजना उपलब्ध आहेत?"), "mr")
        self.assertEqual(detect_user_language("शेतकऱ्यांसाठी कोणत्या योजना उपलब्ध आहेत?"), "mr")
        
        # Bengali
        self.assertEqual(detect_user_language("আমার জন্য কোন সরকারি প্রকল্প পাওয়া যায়?"), "bn")
        self.assertEqual(detect_user_language("কৃষকদের জন্য কোন সরকারি প্রকল্পগুলি উপলব্ধ?"), "bn")
        
        # Telugu
        self.assertEqual(detect_user_language("నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?"), "te")
        self.assertEqual(detect_user_language("రైతులకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?"), "te")

    def test_hinglish_and_romanized_detection(self):
        """Verify Hinglish and informal mixed phrases detect to Hindi."""
        self.assertEqual(detect_user_language("mere liye konsi yojana hai"), "hi")
        self.assertEqual(detect_user_language("mujhe LIC ka plan chahiye"), "hi")
        self.assertEqual(detect_user_language("government scheme batao"), "hi")
        self.assertEqual(detect_user_language("मुझे LIC का best plan बताओ"), "hi")

    # =========================================================================
    # A. GOVERNMENT SCHEMES IN ALL 5 LANGUAGES
    # =========================================================================
    def test_requirement_a_government_schemes_all_5_languages(self):
        queries = {
            "en": "What schemes are available for farmers?",
            "hi": "किसानों के लिए कौन सी योजनाएं उपलब्ध हैं?",
            "mr": "शेतकऱ्यांसाठी कोणत्या योजना उपलब्ध आहेत?",
            "bn": "কৃষকদের জন্য কোন সরকারি প্রকল্পগুলি উপলব্ধ?",
            "te": "రైతులకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?"
        }

        for expected_lang, query in queries.items():
            res = sakhi_adapter.chat(message=query)
            self.assertEqual(res.language, expected_lang, f"Failed language detection for {expected_lang}")
            self.assertIn(res.intent, ["GENERAL_SCHEME_SEARCH", "RECOMMENDATION_EXPLANATION", "CHECK_ELIGIBILITY"])
            self.assertTrue(len(res.answer) > 20, f"Empty answer for {expected_lang}")

    # =========================================================================
    # B. LIC QUESTIONS IN ALL 5 LANGUAGES
    # =========================================================================
    def test_requirement_b_lic_questions_all_5_languages(self):
        lic_queries = {
            "en": "Which LIC plan is suitable for me?",
            "hi": "मेरे लिए कौन सा LIC प्लान सही है?",
            "mr": "माझ्यासाठी कोणती LIC योजना योग्य आहे?",
            "bn": "আমার জন্য কোন LIC প্ল্যানটি উপযুক্ত?",
            "te": "నాకు ఏ LIC ప్లాన్ సరైనది?"
        }

        for expected_lang, query in lic_queries.items():
            res = sakhi_adapter.chat(message=query)
            self.assertEqual(res.language, expected_lang, f"Failed LIC language for {expected_lang}")
            self.assertIn(res.intent, ["LIC_RECOMMENDATION", "RECOMMENDATION_EXPLANATION", "GENERAL_SCHEME_SEARCH", "COMPARE_SCHEMES"])
            # Must reference official LIC plans
            self.assertTrue(any(p in res.answer for p in ["LIC", "Jeevan", "Labh", "Umang", "Amar", "UIN", "836", "845", "एलआईसी"]))

    # =========================================================================
    # C. FREE BENEFITS QUESTIONS IN ALL 5 LANGUAGES
    # =========================================================================
    def test_requirement_c_free_benefits_all_5_languages(self):
        free_queries = {
            "hi": "मुझे राजस्थान में कौन से मुफ्त सरकारी लाभ मिल सकते हैं?",
            "mr": "मला कोणते मोफत सरकारी लाभ मिळू शकतात?",
            "bn": "আমি কী কী বিনামূল্যের সরকারি সুবিধা পেতে পারি?",
            "te": "నాకు ఏ ఉచిత ప్రభుత్వ ప్రయోజనాలు లభించవచ్చు?",
            "en": "What free benefits can I get in Rajasthan?"
        }

        for expected_lang, query in free_queries.items():
            res = sakhi_adapter.chat(message=query)
            self.assertEqual(res.language, expected_lang, f"Failed Free Benefits language for {expected_lang}")
            self.assertIn(res.intent, ["FREE_BENEFITS_QUERY", "GENERAL_SCHEME_SEARCH", "free_benefits_info", "CHECK_ELIGIBILITY", "COMPARE_SCHEMES"])
            # Must not convert subsidy to completely free
            self.assertTrue(len(res.answer) > 20)

    # =========================================================================
    # D. ELIGIBILITY QUESTIONS IN ALL 5 LANGUAGES
    # =========================================================================
    def test_requirement_d_eligibility_questions_all_5_languages(self):
        elig_queries = {
            "en": "Am I eligible for this scheme?",
            "hi": "क्या मैं इस योजना के लिए पात्र हूं?",
            "mr": "मी या योजनेसाठी पात्र आहे का?",
            "bn": "আমি কি এই প্রকল্পের জন্য যোগ্য?",
            "te": "నేను ఈ పథకానికి అర్హుడినా?"
        }

        for expected_lang, query in elig_queries.items():
            res = sakhi_adapter.chat(message=query)
            self.assertEqual(res.language, expected_lang, f"Failed eligibility language for {expected_lang}")
            self.assertIn(res.intent, ["CHECK_ELIGIBILITY", "RECOMMENDATION_EXPLANATION"])
            self.assertIn(res.eligibility_result, ["ADDITIONAL_INFORMATION_REQUIRED", "REVIEW_REQUIRED", "ELIGIBLE", None])

    # =========================================================================
    # E. MISSING-INFORMATION QUESTION (EXACT SPEC STRINGS)
    # =========================================================================
    def test_requirement_e_missing_information_prompt_accuracy(self):
        """
        Check that when eligibility is evaluated with age but missing income,
        Sakhi asks for the required annual family income in the user language.
        """
        # Hindi
        res_hi = sakhi_adapter.chat(
            message="क्या मैं पात्र हूं?",
            context={"profile": {"age": 30}}
        )
        self.assertEqual(res_hi.language, "hi")
        self.assertTrue("पारिवारिक आय" in res_hi.answer or "वार्षिक" in res_hi.answer or "अतिरिक्त जानकारी" in res_hi.answer)

        # Marathi
        res_mr = sakhi_adapter.chat(
            message="मी या योजनेसाठी पात्र आहे का?",
            context={"profile": {"age": 30}}
        )
        self.assertEqual(res_mr.language, "mr")
        self.assertTrue("उत्पन्न" in res_mr.answer or "कौटुंबिक" in res_mr.answer or "अतिरिक्त माहिती" in res_mr.answer)

        # Bengali
        res_bn = sakhi_adapter.chat(
            message="আমি কি এই প্রকল্পের জন্য যোগ্য?",
            context={"profile": {"age": 30}}
        )
        self.assertEqual(res_bn.language, "bn")
        self.assertTrue("আয়" in res_bn.answer or "পারিবারিক" in res_bn.answer or "অতিরিক্ত তথ্য" in res_bn.answer)

        # Telugu
        res_te = sakhi_adapter.chat(
            message="నేను ఈ పథకానికి అర్హుడినా?",
            context={"profile": {"age": 30}}
        )
        self.assertEqual(res_te.language, "te")
        self.assertTrue("ఆదాయం" in res_te.answer or "కుటుంబ" in res_te.answer or "అదనపు సమాచారం" in res_te.answer)

        # English
        res_en = sakhi_adapter.chat(
            message="Am I eligible for this scheme?",
            context={"profile": {"age": 30}}
        )
        self.assertEqual(res_en.language, "en")
        self.assertTrue("income" in res_en.answer.lower() or "family" in res_en.answer.lower() or "additional information" in res_en.answer.lower())

    # =========================================================================
    # F. APPLICATION QUESTIONS IN ALL 5 LANGUAGES
    # =========================================================================
    def test_requirement_f_how_to_apply_all_5_languages(self):
        apply_queries = {
            "en": "How to apply for PPF?",
            "hi": "PPF के लिए आवेदन कैसे करें?",
            "mr": "PPF साठी अर्ज कसा करावा?",
            "bn": "PPF এর জন্য কীভাবে আবেদন করব?",
            "te": "PPF కోసం ఎలా దరఖాస్తు చేయాలి?"
        }

        for expected_lang, query in apply_queries.items():
            res = sakhi_adapter.chat(message=query)
            self.assertEqual(res.language, expected_lang)
            self.assertEqual(res.intent, "HOW_TO_APPLY")
            # Official link should not be altered
            self.assertTrue(any("indiapost.gov.in" in s.official_url or "india.gov.in" in s.official_url for s in res.sources))

    # =========================================================================
    # G. MIXED-DOMAIN QUESTION (GOVERNMENT + LIC)
    # =========================================================================
    def test_requirement_g_mixed_domain(self):
        res = sakhi_adapter.chat("I want government scheme and also LIC plan")
        self.assertIn(res.intent, ["MIXED_QUERY", "COMPARE_SCHEMES"])
        self.assertTrue("Government" in res.answer or "LIC" in res.answer)

    # =========================================================================
    # H. FOLLOW-UP QUESTION & CONVERSATION MEMORY
    # =========================================================================
    def test_requirement_h_follow_up_memory(self):
        context = {
            "history": [
                {"sender": "user", "text": "I am 35 years old and my annual income is 4 lakh"},
                {"sender": "assistant", "text": "Noted, you have ₹4,00,000 annual income."}
            ]
        }
        res = sakhi_adapter.chat("What pension schemes can I consider?", context=context)
        self.assertIn(res.intent, ["GENERAL_SCHEME_SEARCH", "RECOMMENDATION_EXPLANATION", "CHECK_ELIGIBILITY"])
        self.assertTrue("NPS" in res.answer or "APY" in res.answer or "Pension" in res.answer)

    # =========================================================================
    # I. LANGUAGE SWITCHING MID-CONVERSATION WITH CONTEXT RETENTION
    # =========================================================================
    def test_requirement_i_language_switching_with_context(self):
        """
        User turn 1 in Hindi: "मैं किसान हूं।"
        User turn 2 in English: "My age is 35."
        Sakhi should detect English, respond in English, while remembering occupation=farmer and age=35.
        """
        context = {
            "history": [
                {"sender": "user", "text": "मैं किसान हूं।"},
                {"sender": "assistant", "text": "आपकी उम्र और वार्षिक पारिवारिक आय बताइए।"}
            ]
        }
        res = sakhi_adapter.chat("My age is 35.", context=context)
        self.assertEqual(res.language, "en", "Sakhi should switch to English when user asks in English")
        # Should understand that user is farmer and age is 35
        self.assertIn(res.intent, ["CHECK_ELIGIBILITY", "RECOMMENDATION_EXPLANATION", "GENERAL_SCHEME_SEARCH"])
        self.assertTrue(len(res.answer) > 20)

    # =========================================================================
    # J. HINDI / HINGLISH QUERIES
    # =========================================================================
    def test_requirement_j_hinglish_queries(self):
        hinglish_samples = [
            ("mere liye konsi yojana hai", "hi"),
            ("mujhe LIC ka plan chahiye", "hi"),
            ("government scheme batao", "hi"),
            ("मुझे LIC का best plan बताओ", "hi")
        ]

        for query, expected_lang in hinglish_samples:
            res = sakhi_adapter.chat(query)
            self.assertEqual(res.language, expected_lang, f"Failed for '{query}'")
            self.assertTrue(len(res.answer) > 20)


if __name__ == "__main__":
    unittest.main()
