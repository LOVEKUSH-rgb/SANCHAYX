"""
backend/tests/test_financial_tools.py

Unit and Validation Test Suite for backend financial tools layer.
Verifies mathematical parity with JavaScript goalCalculations.js,
boundary safety, missing data preservation, and scheme retrieval.
"""

import math
import pytest
from app.services.financial_tools import (
    get_user_financial_context,
    calculate_budget,
    calculate_financial_health,
    calculate_sip_projection,
    calculate_goal_feasibility,
    search_government_schemes
)


class TestFinancialToolsMathParity:
    """Verifies exact decimal parity with src/services/goalCalculations.js"""

    def test_sip_projection_parity_with_javascript(self):
        # Case 1: SIP 3000, 5 years, 10%
        # JS outputs: 232311.22
        res1 = calculate_sip_projection(monthly_investment=3000, timeframe_years=5, annual_rate_pct=10.0)
        assert res1["status"] == "SUCCESS"
        assert res1["total_principal_invested"] == 180000.0
        assert math.isclose(res1["projected_future_value"], 232311.22, abs_tol=0.01)

        # Case 2: SIP 3000, 5 years, 7%
        # JS outputs: 214778.7
        res2 = calculate_sip_projection(monthly_investment=3000, timeframe_years=5, annual_rate_pct=7.0)
        assert math.isclose(res2["projected_future_value"], 214778.70, abs_tol=0.01)

        # Case 3: SIP 3000, 5 years, 12%
        # JS outputs: 245009.01
        res3 = calculate_sip_projection(monthly_investment=3000, timeframe_years=5, annual_rate_pct=12.0)
        assert math.isclose(res3["projected_future_value"], 245009.01, abs_tol=0.01)

    def test_goal_feasibility_parity_with_javascript(self):
        # Laptop: 60k in 1 year at 7%
        # JS requiredMonthly: 4841.60
        res_laptop = calculate_goal_feasibility(target_amount=60000, timeframe_years=1, assumed_rate_pct=7.0)
        assert res_laptop["status"] == "SUCCESS"
        assert math.isclose(res_laptop["required_monthly_savings"], 4841.60, abs_tol=0.01)

        # Bike: 70k in 1 year at 7%
        # JS requiredMonthly: 5648.54
        res_bike = calculate_goal_feasibility(target_amount=70000, timeframe_years=1, assumed_rate_pct=7.0)
        assert res_bike["status"] == "SUCCESS"
        assert math.isclose(res_bike["required_monthly_savings"], 5648.54, abs_tol=0.01)

        # Bike affordability with surplus: 15k surplus covers 5648.54
        res_bike_surplus = calculate_goal_feasibility(
            target_amount=70000,
            timeframe_years=1,
            monthly_surplus=15000,
            assumed_rate_pct=7.0
        )
        assert res_bike_surplus["is_feasible"] is True
        assert res_bike_surplus["feasibility_status"] == "ACHIEVABLE"
        assert math.isclose(res_bike_surplus["surplus_remaining"], 9351.46, abs_tol=0.01)


class TestInputValidationAndEdgeCases:
    """Verifies missing, negative, non-numeric and infinite values are handled cleanly."""

    def test_missing_and_undeclared_income(self):
        # Undeclared budget in context
        ctx = {"financial_health": {}, "profile": {}}
        user_ctx = get_user_financial_context(ctx)
        assert user_ctx["budget_data"]["has_budget_data"] is False
        assert user_ctx["budget_data"]["monthly_income"] is None
        assert user_ctx["budget_data"]["total_expenses"] is None
        assert user_ctx["budget_data"]["monthly_surplus"] is None
        assert user_ctx["budget_data"]["has_life_insurance"] is None

        # calculate_budget without income returns error, not zero income
        budget_err = calculate_budget()
        assert budget_err["status"] == "ERROR"

    def test_negative_and_invalid_inputs(self):
        # Negative income
        res_neg = calculate_budget(monthly_income=-5000)
        assert res_neg["status"] == "ERROR"

        # NaN and inf in SIP
        res_nan = calculate_sip_projection(monthly_investment=float("nan"), timeframe_years=5)
        assert res_nan["status"] == "ERROR"

        res_inf = calculate_sip_projection(monthly_investment=3000, timeframe_years=float("inf"))
        assert res_inf["status"] == "ERROR"

        # Negative target in goal
        res_neg_goal = calculate_goal_feasibility(target_amount=-50000, timeframe_years=1)
        assert res_neg_goal["status"] == "ERROR"

    def test_zero_timeframe_horizon(self):
        # 0 years SIP returns principal with 0 returns
        sip_zero = calculate_sip_projection(monthly_investment=5000, timeframe_years=0, initial_deposit=10000)
        assert sip_zero["status"] == "SUCCESS"
        assert sip_zero["projected_future_value"] == 10000.0
        assert sip_zero["estimated_returns"] == 0.0

        # 0 years goal requires immediate funding
        goal_zero = calculate_goal_feasibility(target_amount=50000, timeframe_years=0, initial_savings=20000)
        assert goal_zero["status"] == "SUCCESS"
        assert goal_zero["feasibility_status"] == "IMMEDIATE_FUNDING_REQUIRED"
        assert goal_zero["lump_sum_shortfall"] == 30000.0


class TestBudgetAndHealthEngines:
    """Verifies integration with existing financial_health_engine."""

    def test_budget_50_30_20_calculation(self):
        # 50,000 income, 20k essentials, 10k lifestyle, 5k EMI
        # Needs = 25k (50%), Wants = 10k (20%), Surplus = 15k (30%)
        res = calculate_budget(
            monthly_income=50000,
            essential_expenses=20000,
            lifestyle_expenses=10000,
            monthly_emi=5000
        )
        assert res["status"] == "SUCCESS"
        assert res["total_expenses"] == 35000.0
        assert res["monthly_surplus"] == 15000.0
        assert res["savings_rate_pct"] == 30.0
        assert res["breakdown_50_30_20"]["needs"]["actual_percentage"] == 50.0
        assert res["breakdown_50_30_20"]["needs"]["is_within_guideline"] is True
        assert res["breakdown_50_30_20"]["wants"]["actual_percentage"] == 20.0
        assert res["breakdown_50_30_20"]["wants"]["is_within_guideline"] is True
        assert res["breakdown_50_30_20"]["savings"]["actual_percentage"] == 30.0
        assert res["breakdown_50_30_20"]["savings"]["is_within_guideline"] is True

    def test_financial_health_scoring(self):
        # Full profile evaluation
        res = calculate_financial_health(
            monthly_income=50000,
            essential_expenses=20000,
            lifestyle_expenses=10000,
            monthly_emi=5000,
            liquid_savings=120000,
            has_life_insurance=True,
            has_health_insurance=True
        )
        assert res["status"] == "SUCCESS"
        assert res["total_health_score"] == 100.0
        assert res["score_grade"] == "EXCELLENT"
        assert res["emergency_runway_months"] == 6.0


class TestGovernmentSchemeSearch:
    """Verifies integration with existing scheme search engine."""

    def test_search_verified_schemes(self):
        res = search_government_schemes(query="Sukanya", max_results=3)
        assert res["status"] == "SUCCESS"
        assert res["total_matches"] >= 1
        assert any("sukanya" in s["name"].lower() or "ssy" in str(s["scheme_id"]).lower() for s in res["returned_schemes"])

        res_pension = search_government_schemes(category="PENSION", max_results=3)
        assert res_pension["status"] == "SUCCESS"
        assert len(res_pension["returned_schemes"]) > 0

