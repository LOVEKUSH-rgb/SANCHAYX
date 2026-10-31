"""
backend/app/services/financial_health_engine.py

Pure Deterministic Calculation Engine for Smart Budget and Financial Health.
Implements the 50/30/20 Indian budgeting guidelines and a transparent 100-point
Financial Resilience Health Score across four 25-point pillars.

CRITICAL ARCHITECTURAL GUARANTEES:
1. 100% Deterministic: No stochastic or LLM dependency; pure reproducible arithmetic.
2. Safe Zero-Income & Edge-Case Handling: Non-negative inputs guaranteed.
3. Explicit Missing Data Handling: Missing insurance is tracked as UNSPECIFIED,
   never falsely interpreted as confirmed absence.
4. Educational Transparency: Transparent formulas and thresholds documented below.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from app.schemas import (
    FinancialProfileInput,
    BudgetGuideline503020,
    FinancialHealthPillars,
    FinancialHealthResponse
)


# ==============================================================================
# FORMULAS & THRESHOLD SPECIFICATIONS
# ==============================================================================
# 1. 50/30/20 Guidelines:
#    - Needs (50% of income): Essential expenses + debt obligations.
#    - Wants (30% of income): Discretionary lifestyle and recreation.
#    - Savings (20% of income): Minimum benchmark for capital accumulation.
#
# 2. Four 25-Point Health Pillars (Total 100 Points):
#    - Pillar 1: Savings Rate (0-25 pts)
#      Formula: min(25.0, max(0.0, (savings_rate_pct / 20.0) * 25.0))
#      Thresholds: 0% savings -> 0 pts | 20%+ savings -> 25 pts.
#
#    - Pillar 2: Emergency Fund Cushion (0-25 pts)
#      Formula: min(25.0, max(0.0, (runway_months / 6.0) * 25.0))
#      Thresholds: 0 months -> 0 pts | 6+ months -> 25 pts.
#      Runway = liquid_savings / essential_expenses (or total outflow if essential is 0).
#
#    - Pillar 3: EMI Debt Burden (0-25 pts)
#      Formula:
#        emi_ratio <= 30%: 25.0 pts
#        emi_ratio >= 50%: 0.0 pts
#        Between 30% and 50%: 25.0 * (1.0 - (emi_ratio - 30.0) / 20.0)
#
#    - Pillar 4: Insurance Protection (0-25 pts)
#      12.5 pts for confirmed Life Insurance + 12.5 pts for confirmed Health Insurance.
#      Unspecified inputs receive 0 pts but trigger a PROVISIONAL completeness warning.
# ==============================================================================


def calculate_financial_health(inputs: FinancialProfileInput) -> FinancialHealthResponse:
    """
    Computes deterministic budget allocations and financial health scores
    for a user profile input.
    """
    # -------------------------------------------------------------------------
    # 1. Income Resolution
    # -------------------------------------------------------------------------
    income_source_type = "zero_income"
    if inputs.monthly_income is not None:
        effective_monthly_income = max(0.0, float(inputs.monthly_income))
        income_source_type = "explicit_monthly" if effective_monthly_income > 0.0 else "zero_income"
    elif inputs.annual_income is not None:
        effective_monthly_income = round(max(0.0, float(inputs.annual_income) / 12.0), 2)
        income_source_type = "derived_from_annual" if effective_monthly_income > 0.0 else "zero_income"
    else:
        effective_monthly_income = 0.0
        income_source_type = "zero_income"

    # -------------------------------------------------------------------------
    # 2. Expenses & Monthly Outflow
    # -------------------------------------------------------------------------
    essential = max(0.0, float(inputs.essential_expenses or 0.0))
    lifestyle = max(0.0, float(inputs.lifestyle_expenses or 0.0))
    emi = max(0.0, float(inputs.monthly_emi or 0.0))
    liquid = max(0.0, float(inputs.liquid_savings or 0.0))

    total_outflow = round(essential + lifestyle + emi, 2)
    monthly_surplus = round(effective_monthly_income - total_outflow, 2)
    is_surplus_positive = monthly_surplus > 0.0

    # -------------------------------------------------------------------------
    # 3. 50/30/20 Guideline Calculations
    # -------------------------------------------------------------------------
    needs_guideline = round(effective_monthly_income * 0.50, 2)
    wants_guideline = round(effective_monthly_income * 0.30, 2)
    savings_guideline = round(effective_monthly_income * 0.20, 2)

    actual_needs = round(essential + emi, 2)
    actual_wants = round(lifestyle, 2)
    actual_savings = round(monthly_surplus, 2)

    if effective_monthly_income > 0.0:
        needs_pct = round((actual_needs / effective_monthly_income) * 100.0, 1)
        wants_pct = round((actual_wants / effective_monthly_income) * 100.0, 1)
        savings_pct = round((actual_savings / effective_monthly_income) * 100.0, 1)
    else:
        needs_pct = 0.0
        wants_pct = 0.0
        savings_pct = 0.0

    budget_breakdown = BudgetGuideline503020(
        needs_guideline_50=needs_guideline,
        wants_guideline_30=wants_guideline,
        savings_guideline_20=savings_guideline,
        actual_needs=actual_needs,
        actual_wants=actual_wants,
        actual_savings=actual_savings,
        potential_savings=actual_savings,
        needs_percentage=needs_pct,
        wants_percentage=wants_pct,
        savings_percentage=savings_pct,
        surplus_percentage=savings_pct
    )

    # -------------------------------------------------------------------------
    # 4. Pillar 1: Savings & Surplus Rate (0 - 25 pts)
    # -------------------------------------------------------------------------
    if effective_monthly_income > 0.0:
        raw_savings_rate = (monthly_surplus / effective_monthly_income) * 100.0
        savings_rate_pct = round(raw_savings_rate, 2)
    else:
        savings_rate_pct = 0.0

    if savings_rate_pct <= 0.0:
        savings_score = 0.0
    elif savings_rate_pct >= 20.0:
        savings_score = 25.0
    else:
        savings_score = round((savings_rate_pct / 20.0) * 25.0, 2)

    # -------------------------------------------------------------------------
    # 5. Pillar 2: Emergency Cushion (Essential-Expense Coverage) (0 - 25 pts)
    # -------------------------------------------------------------------------
    # Use essential living expenses as baseline (excluding EMIs); fallback to total outflow if essential is zero
    baseline_expenses = essential if essential > 0.0 else total_outflow

    if baseline_expenses > 0.0:
        runway_months = round(liquid / baseline_expenses, 2)
    else:
        # Zero reported expenses: if they hold liquid savings, runway is healthy
        runway_months = 6.0 if liquid > 0.0 else 0.0

    if runway_months <= 0.0:
        emergency_score = 0.0
    elif runway_months >= 6.0:
        emergency_score = 25.0
    else:
        emergency_score = round((runway_months / 6.0) * 25.0, 2)

    # -------------------------------------------------------------------------
    # 6. Pillar 3: EMI Debt Burden (0 - 25 pts)
    # -------------------------------------------------------------------------
    if effective_monthly_income > 0.0:
        emi_ratio_pct = round((emi / effective_monthly_income) * 100.0, 2)
    else:
        emi_ratio_pct = 100.0 if emi > 0.0 else 0.0

    if emi_ratio_pct <= 30.0:
        emi_score = 25.0
    elif emi_ratio_pct >= 50.0:
        emi_score = 0.0
    else:
        # Linear degradation between 30% and 50%
        emi_score = round(25.0 * (1.0 - (emi_ratio_pct - 30.0) / 20.0), 2)

    # -------------------------------------------------------------------------
    # 7. Pillar 4: Insurance Protection (0 - 25 pts)
    # -------------------------------------------------------------------------
    life_covered = inputs.has_life_insurance is True
    health_covered = inputs.has_health_insurance is True

    life_status = (
        "CONFIRMED_COVERED" if inputs.has_life_insurance is True
        else ("CONFIRMED_UNINSURED" if inputs.has_life_insurance is False else "UNSPECIFIED")
    )
    health_status = (
        "CONFIRMED_COVERED" if inputs.has_health_insurance is True
        else ("CONFIRMED_UNINSURED" if inputs.has_health_insurance is False else "UNSPECIFIED")
    )

    life_pts = 12.5 if life_covered else 0.0
    health_pts = 12.5 if health_covered else 0.0
    protection_score = round(life_pts + health_pts, 2)

    is_protection_complete = (inputs.has_life_insurance is not None) and (inputs.has_health_insurance is not None)

    pillars = FinancialHealthPillars(
        savings_score=savings_score,
        savings_max=25.0,
        savings_rate_pct=savings_rate_pct,
        potential_savings_rate_pct=savings_rate_pct,
        surplus_rate_pct=savings_rate_pct,
        emergency_score=emergency_score,
        emergency_max=25.0,
        emergency_runway_months=runway_months,
        essential_expense_runway_months=runway_months,
        emi_score=emi_score,
        emi_max=25.0,
        emi_ratio_pct=emi_ratio_pct,
        protection_score=protection_score,
        protection_max=25.0,
        life_insurance_status=life_status,
        health_insurance_status=health_status,
        is_protection_complete=is_protection_complete
    )

    # -------------------------------------------------------------------------
    # 8. Composite Health Score & Grade
    # -------------------------------------------------------------------------
    total_score = round(savings_score + emergency_score + emi_score + protection_score, 1)

    if total_score >= 80.0:
        score_grade = "EXCELLENT"
    elif total_score >= 60.0:
        score_grade = "STABLE"
    elif total_score >= 40.0:
        score_grade = "NEEDS_ATTENTION"
    else:
        score_grade = "CRITICAL"

    # -------------------------------------------------------------------------
    # 9. Data Completeness & Diagnostics
    # -------------------------------------------------------------------------
    unspecified_fields = []
    if inputs.has_life_insurance is None:
        unspecified_fields.append("has_life_insurance")
    if inputs.has_health_insurance is None:
        unspecified_fields.append("has_health_insurance")
    if inputs.monthly_income is None and inputs.annual_income is None:
        unspecified_fields.append("income")

    is_provisional = len(unspecified_fields) > 0 or effective_monthly_income == 0.0

    data_completeness = {
        "is_complete": len(unspecified_fields) == 0,
        "is_provisional_score": is_provisional,
        "unspecified_fields": unspecified_fields,
        "protection_data_complete": is_protection_complete,
        "message": (
            "Complete profile: all pillars evaluated against declared financial figures."
            if not is_provisional
            else f"Provisional evaluation: {', '.join(unspecified_fields)} not explicitly confirmed."
        )
    }

    # -------------------------------------------------------------------------
    # 10. Actionable Deterministic Insights (Neutral Educational Diagnostics)
    # -------------------------------------------------------------------------
    insights = []
    if monthly_surplus < 0.0:
        insights.append(
            f"Monthly cashflow deficit: Outflows exceed income by ₹{abs(monthly_surplus):,.0f}/mo. "
            "Prioritize rationalizing discretionary lifestyle spending to balance monthly cashflow."
        )
    elif savings_score == 25.0:
        insights.append(
            f"Healthy cashflow surplus: You have an unallocated monthly surplus of {savings_rate_pct:.1f}% of income "
            f"(₹{monthly_surplus:,.0f}/mo) available for potential savings and investments."
        )
    elif savings_score < 15.0 and monthly_surplus > 0.0:
        insights.append(
            f"Potential savings capacity: Monthly surplus is {savings_rate_pct:.1f}% of income (₹{monthly_surplus:,.0f}/mo), "
            f"below the 20% guideline target of ₹{savings_guideline:,.0f}/mo. "
            f"Review lifestyle expenses (₹{lifestyle:,.0f}/mo) to build higher unallocated cashflow."
        )

    if emergency_score < 15.0:
        target_buffer = baseline_expenses * 3.0
        insights.append(
            f"Limited essential-expense buffer: Current liquid reserves cover {runway_months:.1f} months of essential living expenses "
            f"(excluding debt obligations). Educational guideline recommends maintaining a 3-6 month essential-expense reserve of at least ₹{target_buffer:,.0f}."
        )
    elif emergency_score == 25.0:
        insights.append(
            f"Robust essential-expense buffer: Liquid reserves provide {runway_months:.1f} months of essential living expense coverage "
            "(excluding debt obligations)."
        )

    if emi_ratio_pct > 30.0:
        insights.append(
            f"Elevated debt burden: EMIs consume {emi_ratio_pct:.1f}% of income (safe threshold is ≤ 30%). "
            "Educational best practice recommends avoiding new debt obligations and prioritizing debt reduction."
        )

    if inputs.has_life_insurance is False:
        insights.append(
            "Protection gap: No life insurance reported. Life coverage is an educational best practice to protect dependents against income loss."
        )
    elif inputs.has_life_insurance is None:
        insights.append("Life insurance status is unconfirmed; update status to receive verified protection scoring.")

    if inputs.has_health_insurance is False:
        insights.append(
            "Healthcare protection gap: No health insurance reported. Health coverage is an educational best practice to protect accumulated capital against unexpected hospitalization expenses."
        )
    elif inputs.has_health_insurance is None:
        insights.append("Health insurance status is unconfirmed; update status to receive verified protection scoring.")

    return FinancialHealthResponse(
        monthly_income=effective_monthly_income,
        income_source_type=income_source_type,
        total_outflow=total_outflow,
        monthly_surplus=monthly_surplus,
        is_surplus_positive=is_surplus_positive,
        budget_50_30_20=budget_breakdown,
        pillars=pillars,
        total_health_score=total_score,
        score_grade=score_grade,
        data_completeness=data_completeness,
        insights=insights,
        calculated_at=datetime.now(timezone.utc).isoformat()
    )
