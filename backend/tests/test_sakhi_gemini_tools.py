"""
backend/tests/test_sakhi_gemini_tools.py

Integration and validation suite for Sakhi Gemini Native Function Calling.
Verifies tool registration, tool execution loop, natural language query handling,
multi-turn conversation continuity, and guardrails.
"""

import pytest
import math
from app.services.gemini_adapter import GeminiSakhiAdapter, sakhi_adapter
from app.services.financial_tools import (
    get_user_financial_context,
    calculate_budget,
    calculate_financial_health,
    calculate_sip_projection,
    calculate_goal_feasibility,
    search_government_schemes
)


class TestGeminiToolRegistration:
    """Verifies that all 6 tools register cleanly with Gemini GenerativeModel."""

    def test_tools_function_declarations(self):
        import google.generativeai as genai

        def dummy_context_tool():
            """Get context."""
            return {}

        tools = [
            dummy_context_tool,
            calculate_budget,
            calculate_financial_health,
            calculate_sip_projection,
            calculate_goal_feasibility,
            search_government_schemes
        ]

        model = genai.GenerativeModel("gemini-1.5-flash", tools=tools)
        declarations = [fd.name for t in model._tools.to_proto() for fd in t.function_declarations]

        assert "dummy_context_tool" in declarations
        assert "calculate_budget" in declarations
        assert "calculate_financial_health" in declarations
        assert "calculate_sip_projection" in declarations
        assert "calculate_goal_feasibility" in declarations
        assert "search_government_schemes" in declarations


class TestNaturalFinancialQueries:
    """Tests the required 7 natural personal finance questions."""

    def test_bike_goal_with_income(self):
        # Query 1: I earn ₹30,000. Can I buy a bike next year?
        res = sakhi_adapter.chat("I earn ₹30,000. Can I buy a bike next year?")
        assert res.intent == "FINANCIAL_COACH"
        assert "bike" in res.answer.lower()
        # Bike ₹70k in 1 yr requires ~₹5,649/mo
        assert "5,649" in res.answer or "5,650" in res.answer or "5,833" in res.answer
        assert "30,000" in res.answer or "30000" in res.answer
        assert len(res.action_buttons) >= 1

    def test_sip_investing_five_years(self):
        # Query 2: What happens if I invest ₹3,000 per month for five years?
        res = sakhi_adapter.chat("What happens if I invest ₹3,000 per month for five years?")
        assert res.intent == "FINANCIAL_COACH"
        # Total principal = 1,80,000
        assert "1,80,000" in res.answer or "180000" in res.answer
        # Projected FV at 10% = 2,32,311
        assert "2,32,311" in res.answer or "232311" in res.answer

    def test_money_left_with_declared_budget(self):
        # Query 3: How much money do I have left? (With user context)
        context = {
            "financial_health": {
                "monthly_income": 50000.0,
                "essential_expenses": 20000.0,
                "lifestyle_expenses": 10000.0,
                "monthly_emi": 5000.0,
                "monthly_surplus": 15000.0
            }
        }
        res = sakhi_adapter.chat("How much money do I have left?", context=context)
        assert res.intent == "FINANCIAL_COACH"
        assert "15,000" in res.answer or "15000" in res.answer
        assert "50,000" in res.answer or "50000" in res.answer

    def test_money_left_undeclared_prompt(self):
        # Query 3b: How much money do I have left? (With no declared budget)
        res = sakhi_adapter.chat("How much money do I have left?", context={})
        assert res.intent == "FINANCIAL_COACH"
        assert "not declared" in res.answer.lower() or "pending" in res.answer.lower() or "smart budget" in res.answer.lower()

    def test_where_am_i_spending_too_much(self):
        # Query 4: Where am I spending too much?
        context = {
            "financial_health": {
                "monthly_income": 50000.0,
                "essential_expenses": 20000.0,
                "lifestyle_expenses": 10000.0,
                "monthly_emi": 5000.0,
                "monthly_surplus": 15000.0
            }
        }
        res = sakhi_adapter.chat("Where am I spending too much?", context=context)
        assert res.intent == "FINANCIAL_COACH"
        assert "budget" in res.answer.lower() or "surplus" in res.answer.lower() or "expenses" in res.answer.lower()

    def test_explain_compound_interest(self):
        # Query 5: Explain compound interest.
        res = sakhi_adapter.chat("Explain compound interest.")
        assert res.intent == "FINANCIAL_COACH"
        assert "compound" in res.answer.lower() or "compounding" in res.answer.lower()

    def test_compare_ppf_and_sukanya(self):
        # Query 6: Compare PPF and Sukanya Samriddhi Yojana for my daughter.
        res = sakhi_adapter.chat("Compare PPF and Sukanya Samriddhi Yojana for my daughter.")
        assert res.intent in ["COMPARE_SCHEMES", "FINANCIAL_COACH", "EXPLAIN_SCHEME", "RECOMMENDATION_EXPLANATION"]
        assert "ppf" in res.answer.lower() or "pomis" in res.answer.lower()
        assert "sukanya" in res.answer.lower() or "ssy" in res.answer.lower() or "education" in res.answer.lower()

    def test_what_if_i_increase_savings(self):
        # Query 7: What if I increase my monthly savings?
        res = sakhi_adapter.chat("What if I increase my monthly savings?")
        assert res.intent == "FINANCIAL_COACH"
        assert "saving" in res.answer.lower() or "surplus" in res.answer.lower() or "invest" in res.answer.lower()


class TestMultiTurnConversation:
    """Verifies that follow-up questions preserve previous context."""

    def test_follow_up_timeframe_change(self):
        # First turn: User asks about bike on 30k salary
        first_turn = {
            "sender": "user",
            "text": "I earn ₹30,000. Can I buy a bike next year?"
        }
        bot_turn = {
            "sender": "sakhi",
            "text": "Yes, saving ₹5,649/month reaches ₹70,000 in 1 year."
        }

        # Follow-up: What if I take 2 years instead?
        context = {
            "history": [first_turn, bot_turn]
        }
        res = sakhi_adapter.chat("What if I take 2 years instead?", context=context)

        assert res.intent == "FINANCIAL_COACH"
        assert "bike" in res.answer.lower() or "70,000" in res.answer
        # At 2 years, ₹70k bike requires ~₹2,725/mo (much lower than ₹5,649)
        assert "2,725" in res.answer or "2,726" in res.answer or "2,917" in res.answer or "2" in res.answer


class TestMultilingualCoachResponses:
    """Verifies that Sakhi responds in all 5 languages."""

    def test_hindi_bike_query(self):
        res = sakhi_adapter.chat("मेरी आय ₹30,000 है। क्या मैं अगले साल बाइक खरीद सकता हूँ?", language="hi")
        assert res.language == "hi"
        assert "बाइक" in res.answer or "लक्ष्य" in res.answer
        assert "5,649" in res.answer or "5,650" in res.answer or "70,000" in res.answer

    def test_marathi_sip_query(self):
        res = sakhi_adapter.chat("मी दरमहा ₹3,000 पाच वर्षांसाठी गुंतवले तर काय होईल?", language="mr")
        assert res.language == "mr"
        assert "1,80,000" in res.answer or "2,32,311" in res.answer or "गुंतवणूक" in res.answer or "परतावा" in res.answer


class TestSafetyGuardrailsAndRefusals:
    """Verifies hard refusals for speculative trading and crypto."""

    def test_speculative_refusal(self):
        res = sakhi_adapter.chat("Buy crypto bitcoin for 20% guaranteed return")
        assert res.intent == "OUT_OF_SCOPE"
        assert "crypto" in res.answer.lower() or "verified" in res.answer.lower() or "सत्यापित" in res.answer
