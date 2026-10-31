"""
backend/tests/test_sip_p0_fixes.py

Automated test suite verifying Priority 0 Fixes:
1. Intent routing for the 7 SIP personal finance queries.
2. Quarterly SIP calculation accuracy (20 periods, ₹3,00,000 principal, ₹3,83,169.86 FV).
3. Regular monthly SIP calculation parity.
4. Government scheme query routing preservation.
"""

import pytest
from app.services.financial_tools import calculate_sip_projection
from app.services.gemini_adapter import GeminiSakhiAdapter, sakhi_adapter


class TestSIPIntentRouting:
    """Verifies that SIP queries route to FINANCIAL_COACH, avoiding generic eligibility/schemes."""

    @pytest.fixture(autouse=True)
    def setup_adapter(self):
        self.adapter = GeminiSakhiAdapter()
        self.adapter.client = None
        self.adapter.api_key = None

    @pytest.mark.parametrize("query", [
        "Can I start a weekly SIP?",
        "Can I invest in Flexi SIP?",
        "Compare Equity SIP, Debt SIP and Hybrid SIP.",
        "What is an ELSS SIP?",
        "Explain Step-up SIP.",
        "How does a quarterly SIP work?",
        "Can you calculate my SIP returns?"
    ])
    def test_target_sip_queries_route_to_financial_coach(self, query):
        intent, schemes = self.adapter.extract_intent(query)
        assert intent == "FINANCIAL_COACH", f"Query '{query}' resolved to '{intent}' instead of 'FINANCIAL_COACH'"
        assert intent not in ["CHECK_ELIGIBILITY", "BENEFITS", "COMPARE_SCHEMES", "RECOMMENDATION_EXPLANATION"]

    @pytest.mark.parametrize("query", [
        "Can I start a weekly SIP?",
        "Can I invest in Flexi SIP?",
        "Compare Equity SIP, Debt SIP and Hybrid SIP.",
        "What is an ELSS SIP?",
        "Explain Step-up SIP.",
        "How does a quarterly SIP work?",
        "Can you calculate my SIP returns?"
    ])
    def test_sip_responses_do_not_trigger_unrelated_government_schemes(self, query):
        res = self.adapter._handle_financial_coach(message=query, language="en")
        assert res.intent == "FINANCIAL_COACH"
        answer_lower = res.answer.lower()
        # Verify no unrelated government welfare scheme injection
        assert "pmkvy" not in answer_lower
        assert "pomis" not in answer_lower
        assert "how old are you" not in answer_lower
        assert "family income" not in answer_lower


class TestSIPCalculations:
    """Verifies quarterly and monthly SIP mathematical calculations."""

    def test_quarterly_sip_calculation_tool(self):
        # ₹15,000 quarterly for 5 years at 10%
        res = calculate_sip_projection(
            monthly_investment=15000,
            timeframe_years=5,
            annual_rate_pct=10.0,
            frequency="quarterly"
        )
        assert res["status"] == "SUCCESS"
        assert res["frequency"] == "Quarterly"
        assert res["periods_per_year"] == 4
        assert res["total_installments"] == 20
        assert res["total_principal_invested"] == 300000.0
        assert res["projected_future_value"] == 383169.86
        assert res["estimated_returns"] == 83169.86
        assert res["wealth_multiplier"] == 1.28

        # Scenarios
        scenarios = res["comparative_scenarios"]
        assert scenarios["conservative_7pct_sovereign_style"]["projected_future_value"] == 355524.17
        assert scenarios["conservative_7pct_sovereign_style"]["estimated_returns"] == 55524.17
        assert scenarios["moderate_10pct_balanced"]["projected_future_value"] == 383169.86
        assert scenarios["growth_12pct_long_term"]["projected_future_value"] == 403055.62
        assert scenarios["growth_12pct_long_term"]["estimated_returns"] == 103055.62

    def test_monthly_sip_parity(self):
        # ₹3,000 monthly for 5 years at 10%
        res = calculate_sip_projection(
            monthly_investment=3000,
            timeframe_years=5,
            annual_rate_pct=10.0,
            frequency="monthly"
        )
        assert res["status"] == "SUCCESS"
        assert res["frequency"] == "Monthly"
        assert res["periods_per_year"] == 12
        assert res["total_installments"] == 60
        assert res["total_principal_invested"] == 180000.0
        assert res["projected_future_value"] == 232311.22
        assert res["estimated_returns"] == 52311.22

    def test_offline_fallback_quarterly_query(self):
        adapter = GeminiSakhiAdapter()
        adapter.api_key = None
        adapter.client = None
        adapter.get_client = lambda: None

        res = adapter._handle_financial_coach(
            message="I want to invest ₹15,000 quarterly for 5 years.",
            language="en"
        )
        assert res.intent == "FINANCIAL_COACH"
        assert "3,00,000" in res.answer or "300,000" in res.answer or "3 lakh" in res.answer.lower()
        assert "3,83,169" in res.answer or "3,83,170" in res.answer or "383,170" in res.answer or "383170" in res.answer


class TestGovernmentSchemeRoutingPreservation:
    """Verifies that government scheme queries remain completely unaffected."""

    @pytest.mark.parametrize("query,expected_intent,expected_scheme_prefix", [
        ("Am I eligible for PM-KISAN?", "CHECK_ELIGIBILITY", "pmkisan"),
        ("Compare PPF and Sukanya", "COMPARE_SCHEMES", "ppf"),
        ("Can I apply for Atal Pension Yojana?", "CHECK_ELIGIBILITY", "apy"),
    ])
    def test_government_scheme_queries_preserved(self, query, expected_intent, expected_scheme_prefix):
        intent, schemes = sakhi_adapter.extract_intent(query)
        assert intent == expected_intent
        assert any(expected_scheme_prefix in s for s in schemes)
