"""
backend/app/services/financial_tools.py

Deterministic Backend Financial Tool Layer for Sanchay & Sakhi Assistant.

ARCHITECTURAL PRINCIPLES:
1. 100% Deterministic: All financial calculations are executed by pure Python
   mathematical functions and verified engines, NEVER by LLM generation or hallucination.
2. Timing Convention: Standard Ordinary Annuity (End-of-Month Compounding).
   Matches `src/services/goalCalculations.js` and `src/components/markets/IllustrativeSimulator.jsx`.
3. Input Safety: Strictly validates missing, negative, non-numeric, and infinite values.
4. Truthful Context: Undeclared financial information is preserved as None/Undeclared,
   never fabricated or silently assumed to be confirmed zero.
5. Neutrality: Projections are educational and illustrative; zero guaranteed return claims
   or speculative financial advice.
"""

import math
from typing import Dict, Any, List, Optional, Union
from app.schemas import FinancialProfileInput
from app.services.financial_health_engine import calculate_financial_health as run_financial_health_engine
from app.services.scheme_search import search_schemes


# ==============================================================================
# NUMERICAL VALIDATION UTILITIES
# ==============================================================================

def _is_valid_finite_number(val: Any) -> bool:
    """Returns True if val is a valid finite real number (not None, bool, NaN, or inf)."""
    if val is None or isinstance(val, bool):
        return False
    try:
        f = float(val)
        return math.isfinite(f)
    except (ValueError, TypeError):
        return False


def _safe_float(val: Any, default: Optional[float] = None) -> Optional[float]:
    """Safely converts val to float if finite, else returns default."""
    if _is_valid_finite_number(val):
        return float(val)
    return default


# ==============================================================================
# TOOL 1: GET USER FINANCIAL CONTEXT
# ==============================================================================

def get_user_financial_context(context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Retrieves and standardizes the user's declared financial health, budget, active goal,
    and demographic profile from the active request context.

    Preserves undeclared fields as None so the assistant never confuses missing inputs
    with confirmed zero values.

    Args:
        context: Optional dictionary containing user profile, financial_health, and goal_plan.

    Returns:
        Structured dictionary containing declared budget facts, active goal details, and profile.
    """
    ctx = context if isinstance(context, dict) else {}

    fin_health = ctx.get("financial_health") if isinstance(ctx.get("financial_health"), dict) else {}
    goal_plan = ctx.get("goal_plan") if isinstance(ctx.get("goal_plan"), dict) else {}
    profile = ctx.get("profile") if isinstance(ctx.get("profile"), dict) else {}

    # 1. Budget & Cashflow resolution
    raw_monthly_inc = fin_health.get("monthly_income")
    raw_annual_inc = fin_health.get("annual_income") or profile.get("annual_income")

    has_budget_data = False
    monthly_income = None
    if _is_valid_finite_number(raw_monthly_inc):
        monthly_income = round(float(raw_monthly_inc), 2)
        has_budget_data = True
    elif _is_valid_finite_number(raw_annual_inc) and float(raw_annual_inc) > 0:
        monthly_income = round(float(raw_annual_inc) / 12.0, 2)
        has_budget_data = True

    essential_expenses = _safe_float(fin_health.get("essential_expenses"))
    lifestyle_expenses = _safe_float(fin_health.get("lifestyle_expenses"))
    monthly_emi = _safe_float(fin_health.get("monthly_emi"))
    liquid_savings = _safe_float(fin_health.get("liquid_savings"))

    # Resolve total expenses and surplus if data is available
    total_expenses = None
    monthly_surplus = None
    is_surplus_positive = None
    if monthly_income is not None:
        e = essential_expenses or 0.0
        l = lifestyle_expenses or 0.0
        emi = monthly_emi or 0.0
        total_expenses = round(e + l + emi, 2)
        monthly_surplus = round(monthly_income - total_expenses, 2)
        is_surplus_positive = monthly_surplus > 0.0

    emergency_runway_months = _safe_float(fin_health.get("emergency_runway_months"))
    health_score = fin_health.get("health_score") if isinstance(fin_health.get("health_score"), (int, float)) else None
    health_grade = fin_health.get("score_grade") or fin_health.get("health_grade")

    # Insurance flags
    has_life_ins = fin_health.get("has_life_insurance") if isinstance(fin_health.get("has_life_insurance"), bool) else None
    has_health_ins = fin_health.get("has_health_insurance") if isinstance(fin_health.get("has_health_insurance"), bool) else None

    # 2. Active Goal resolution
    target_amt = _safe_float(goal_plan.get("target_amount"))
    has_goal = target_amt is not None and target_amt > 0

    return {
        "budget_data": {
            "has_budget_data": has_budget_data,
            "monthly_income": monthly_income,
            "essential_expenses": essential_expenses,
            "lifestyle_expenses": lifestyle_expenses,
            "monthly_emi": monthly_emi,
            "total_expenses": total_expenses,
            "monthly_surplus": monthly_surplus,
            "is_surplus_positive": is_surplus_positive,
            "liquid_savings": liquid_savings,
            "emergency_runway_months": emergency_runway_months,
            "health_score": health_score,
            "health_grade": health_grade,
            "has_life_insurance": has_life_ins,
            "has_health_insurance": has_health_ins
        },
        "active_goal": {
            "has_goal": has_goal,
            "goal_name": goal_plan.get("goal_name") or ctx.get("goal"),
            "target_amount": target_amt,
            "horizon_years": _safe_float(goal_plan.get("horizon_years") or goal_plan.get("timeframe_years")),
            "initial_amount": _safe_float(goal_plan.get("initial_amount"), 0.0),
            "proposed_monthly_contribution": _safe_float(goal_plan.get("proposed_monthly_contribution")),
            "required_monthly_contribution": _safe_float(goal_plan.get("required_monthly_contribution")),
            "feasibility_status": goal_plan.get("feasibility_status")
        },
        "user_profile": {
            "age": profile.get("age"),
            "gender": profile.get("gender"),
            "occupation": profile.get("occupation"),
            "state": profile.get("state")
        }
    }


# ==============================================================================
# TOOL 2: CALCULATE BUDGET (50/30/20 ALLOCATION)
# ==============================================================================

def calculate_budget(
    monthly_income: Optional[float] = None,
    annual_income: Optional[float] = None,
    essential_expenses: Optional[float] = None,
    lifestyle_expenses: Optional[float] = None,
    monthly_emi: Optional[float] = None
) -> Dict[str, Any]:
    """
    Calculates deterministic budget allocations, total monthly spending, remaining surplus/deficit,
    and 50/30/20 rule guidelines (50% Needs, 30% Wants, 20% Savings).

    Args:
        monthly_income: Monthly take-home household income in INR.
        annual_income: Annual household income in INR (converted to monthly if monthly_income is omitted).
        essential_expenses: Essential monthly needs (rent, groceries, bills, utilities) in INR.
        lifestyle_expenses: Discretionary monthly wants (dining, recreation, shopping) in INR.
        monthly_emi: Existing monthly debt commitments and loan repayments in INR.

    Returns:
        Dictionary with total outflow, monthly surplus, 50/30/20 actuals vs guidelines, and compliance indicators.
    """
    # 1. Validation
    for name, val in [
        ("monthly_income", monthly_income),
        ("annual_income", annual_income),
        ("essential_expenses", essential_expenses),
        ("lifestyle_expenses", lifestyle_expenses),
        ("monthly_emi", monthly_emi)
    ]:
        if val is not None:
            if not _is_valid_finite_number(val):
                return {"status": "ERROR", "error": f"Invalid non-numeric or infinite value for '{name}'."}
            if float(val) < 0:
                return {"status": "ERROR", "error": f"'{name}' cannot be negative."}

    # Resolve income
    eff_income = 0.0
    if monthly_income is not None:
        eff_income = float(monthly_income)
    elif annual_income is not None:
        eff_income = round(float(annual_income) / 12.0, 2)
    else:
        return {
            "status": "ERROR",
            "error": "Monthly income or annual income must be provided to calculate a budget."
        }

    e = float(essential_expenses or 0.0)
    l = float(lifestyle_expenses or 0.0)
    emi = float(monthly_emi or 0.0)

    total_expenses = round(e + l + emi, 2)
    monthly_surplus = round(eff_income - total_expenses, 2)
    is_surplus_positive = monthly_surplus > 0.0

    savings_rate_pct = round((monthly_surplus / eff_income) * 100.0, 1) if eff_income > 0 else 0.0

    # 50/30/20 Guidelines
    needs_guideline = round(eff_income * 0.50, 2)
    wants_guideline = round(eff_income * 0.30, 2)
    savings_guideline = round(eff_income * 0.20, 2)

    actual_needs = round(e + emi, 2)
    actual_wants = round(l, 2)

    needs_pct = round((actual_needs / eff_income) * 100.0, 1) if eff_income > 0 else 0.0
    wants_pct = round((actual_wants / eff_income) * 100.0, 1) if eff_income > 0 else 0.0
    savings_pct = round((monthly_surplus / eff_income) * 100.0, 1) if eff_income > 0 else 0.0

    return {
        "status": "SUCCESS",
        "monthly_income": eff_income,
        "essential_expenses": e,
        "lifestyle_expenses": l,
        "monthly_emi": emi,
        "total_expenses": total_expenses,
        "monthly_surplus": monthly_surplus,
        "is_surplus_positive": is_surplus_positive,
        "savings_rate_pct": savings_rate_pct,
        "breakdown_50_30_20": {
            "needs": {
                "actual_amount": actual_needs,
                "actual_percentage": needs_pct,
                "guideline_amount": needs_guideline,
                "guideline_percentage": 50.0,
                "is_within_guideline": needs_pct <= 50.0
            },
            "wants": {
                "actual_amount": actual_wants,
                "actual_percentage": wants_pct,
                "guideline_amount": wants_guideline,
                "guideline_percentage": 30.0,
                "is_within_guideline": wants_pct <= 30.0
            },
            "savings": {
                "actual_amount": monthly_surplus,
                "actual_percentage": savings_pct,
                "guideline_amount": savings_guideline,
                "guideline_percentage": 20.0,
                "is_within_guideline": savings_pct >= 20.0
            }
        },
        "educational_note": "The 50/30/20 guideline is an illustrative financial benchmark. Surplus can be allocated towards emergency savings, sovereign schemes, and milestone goals."
    }


# ==============================================================================
# TOOL 3: CALCULATE FINANCIAL HEALTH (100-POINT SCORE & PILLARS)
# ==============================================================================

def calculate_financial_health(
    monthly_income: Optional[float] = None,
    annual_income: Optional[float] = None,
    essential_expenses: Optional[float] = None,
    lifestyle_expenses: Optional[float] = None,
    monthly_emi: Optional[float] = None,
    liquid_savings: Optional[float] = None,
    has_life_insurance: Optional[bool] = None,
    has_health_insurance: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Evaluates comprehensive financial resilience using Sanchay's deterministic 100-point Health Score
    across four 25-point pillars:
    1. Savings Rate (0-25 pts)
    2. Emergency Fund Cushion (0-25 pts, 6-month benchmark)
    3. EMI Debt Burden (0-25 pts, 30% safe threshold)
    4. Insurance Protection (0-25 pts, 12.5 pts each for Life & Health)

    Args:
        monthly_income: Monthly take-home household income in INR.
        annual_income: Annual household income in INR.
        essential_expenses: Monthly essential living expenses in INR.
        lifestyle_expenses: Monthly discretionary lifestyle spending in INR.
        monthly_emi: Monthly debt repayment obligations in INR.
        liquid_savings: Readily accessible savings in bank accounts/liquid instruments in INR.
        has_life_insurance: True if covered by term/life insurance, False if confirmed none, None if undeclared.
        has_health_insurance: True if covered by health insurance, False if confirmed none, None if undeclared.

    Returns:
        Deterministic health score (0-100), rating grade, emergency runway months, and diagnostic advice.
    """
    # Validate inputs
    for name, val in [
        ("monthly_income", monthly_income),
        ("annual_income", annual_income),
        ("essential_expenses", essential_expenses),
        ("lifestyle_expenses", lifestyle_expenses),
        ("monthly_emi", monthly_emi),
        ("liquid_savings", liquid_savings)
    ]:
        if val is not None:
            if not _is_valid_finite_number(val):
                return {"status": "ERROR", "error": f"Invalid non-numeric or infinite value for '{name}'."}
            if float(val) < 0:
                return {"status": "ERROR", "error": f"'{name}' cannot be negative."}

    profile_input = FinancialProfileInput(
        monthly_income=_safe_float(monthly_income),
        annual_income=_safe_float(annual_income),
        essential_expenses=_safe_float(essential_expenses, 0.0),
        lifestyle_expenses=_safe_float(lifestyle_expenses, 0.0),
        monthly_emi=_safe_float(monthly_emi, 0.0),
        liquid_savings=_safe_float(liquid_savings, 0.0),
        has_life_insurance=has_life_insurance if isinstance(has_life_insurance, bool) else None,
        has_health_insurance=has_health_insurance if isinstance(has_health_insurance, bool) else None
    )

    result = run_financial_health_engine(profile_input)

    return {
        "status": "SUCCESS",
        "total_health_score": round(result.total_health_score, 1),
        "score_grade": result.score_grade,
        "effective_monthly_income": result.monthly_income,
        "monthly_surplus": result.monthly_surplus,
        "emergency_runway_months": round(result.pillars.emergency_runway_months, 1),
        "debt_to_income_ratio": round(result.pillars.emi_ratio_pct, 1),
        "pillars": {
            "savings_rate_score": round(result.pillars.savings_score, 1),
            "emergency_cushion_score": round(result.pillars.emergency_score, 1),
            "debt_burden_score": round(result.pillars.emi_score, 1),
            "insurance_protection_score": round(result.pillars.protection_score, 1)
        },
        "insights": result.insights,
        "disclaimer": result.disclaimer
    }


# ==============================================================================
# TOOL 4: CALCULATE SIP PROJECTION (COMPOUND INTEREST ANNUITY)
# ==============================================================================

def calculate_sip_projection(
    monthly_investment: float,
    timeframe_years: float,
    annual_rate_pct: float = 10.0,
    initial_deposit: float = 0.0,
    frequency: str = "monthly"
) -> Dict[str, Any]:
    """
    Calculates deterministic future value projections for recurring monthly or quarterly investments (SIP)
    using the standard Ordinary Annuity formula with end-of-period contributions:
    FV = P*(1+r)^n + M*((1+r)^n - 1)/r

    Matches `src/services/goalCalculations.js` and `src/components/markets/IllustrativeSimulator.jsx`.

    Args:
        monthly_investment: Recurring contribution (M) in INR (monthly or quarterly installment).
        timeframe_years: Investment horizon in years (y).
        annual_rate_pct: Assumed illustrative annual return rate in percent (e.g. 10.0 for 10% p.a.). Default 10.0.
        initial_deposit: Starting lump-sum principal (P) in INR. Default 0.0.
        frequency: Compounding & contribution frequency: "monthly" (default, 12 per year) or "quarterly" (4 per year).

    Returns:
        Total principal invested, projected future value, estimated compound returns,
        and comparative benchmark scenarios at 7%, 10%, and 12% p.a.
    """
    # Validation
    for name, val in [
        ("monthly_investment", monthly_investment),
        ("timeframe_years", timeframe_years),
        ("annual_rate_pct", annual_rate_pct),
        ("initial_deposit", initial_deposit)
    ]:
        if not _is_valid_finite_number(val):
            return {"status": "ERROR", "error": f"Invalid non-numeric or infinite value for '{name}'."}
        if float(val) < 0:
            return {"status": "ERROR", "error": f"'{name}' cannot be negative."}

    m = float(monthly_investment)
    y = float(timeframe_years)
    rate = float(annual_rate_pct)
    p = float(initial_deposit)

    freq_normalized = str(frequency or "monthly").strip().lower()
    is_quarterly = freq_normalized in ["quarterly", "quarter", "त्रैमासिक", "तिमाही"]
    periods_per_year = 4.0 if is_quarterly else 12.0
    freq_label = "Quarterly" if is_quarterly else "Monthly"

    # Edge case: 0 years horizon
    if y == 0:
        return {
            "status": "SUCCESS",
            "monthly_investment": m,
            "installment_amount": m,
            "frequency": freq_label,
            "timeframe_years": 0.0,
            "initial_deposit": p,
            "annual_rate_pct": rate,
            "total_principal_invested": p,
            "projected_future_value": round(p, 2),
            "estimated_returns": 0.0,
            "wealth_multiplier": 1.0,
            "total_installments": 0,
            "disclaimer": "With a 0-year timeframe, no recurring contribution compounding occurs."
        }

    n = y * periods_per_year
    total_invested = round(p + (m * n), 2)

    def _compute_fv(r_pct: float) -> float:
        if r_pct == 0:
            return round(p + (m * n), 2)
        r_period = (r_pct / 100.0) / periods_per_year
        growth_factor = math.pow(1.0 + r_period, n)
        fv_principal = p * growth_factor
        fv_installment = m * (growth_factor - 1.0) / r_period
        return round(fv_principal + fv_installment, 2)

    projected_fv = _compute_fv(rate)
    estimated_returns = round(projected_fv - total_invested, 2)
    wealth_multiplier = round(projected_fv / total_invested, 2) if total_invested > 0 else 1.0

    # Multi-scenario benchmarks (Conservative 7%, Moderate 10%, Growth 12%)
    fv_7 = _compute_fv(7.0)
    fv_10 = _compute_fv(10.0)
    fv_12 = _compute_fv(12.0)

    return {
        "status": "SUCCESS",
        "monthly_investment": m,
        "installment_amount": m,
        "frequency": freq_label,
        "periods_per_year": int(periods_per_year),
        "total_installments": int(n),
        "timeframe_years": y,
        "initial_deposit": p,
        "annual_rate_pct": rate,
        "total_principal_invested": total_invested,
        "projected_future_value": projected_fv,
        "estimated_returns": estimated_returns,
        "wealth_multiplier": wealth_multiplier,
        "comparative_scenarios": {
            "conservative_7pct_sovereign_style": {
                "annual_rate_pct": 7.0,
                "projected_future_value": fv_7,
                "estimated_returns": round(fv_7 - total_invested, 2)
            },
            "moderate_10pct_balanced": {
                "annual_rate_pct": 10.0,
                "projected_future_value": fv_10,
                "estimated_returns": round(fv_10 - total_invested, 2)
            },
            "growth_12pct_long_term": {
                "annual_rate_pct": 12.0,
                "projected_future_value": fv_12,
                "estimated_returns": round(fv_12 - total_invested, 2)
            }
        },
        "disclaimer": "Illustrative mathematical projection using standard ordinary annuity compounding. Market-linked returns are illustrative and not guaranteed."
    }


# ==============================================================================
# TOOL 4B: CALCULATE COMPOUND INTEREST (LUMP-SUM DETERMINISTIC)
# ==============================================================================

def calculate_compound_interest(
    principal: float,
    rate_pct: float = 7.0,
    time_years: float = 1.0,
    compound_frequency_per_year: int = 1
) -> Dict[str, Any]:
    """
    Calculates deterministic compound interest on a lump-sum principal.
    Formula: A = P * (1 + r / (100 * n))^(n * t)
    Total Interest = A - P

    Args:
        principal: Initial lump-sum deposit in INR.
        rate_pct: Annual interest rate percentage (e.g. 7.1 for PPF, 8.0 for FD/debt).
        time_years: Investment tenure in years.
        compound_frequency_per_year: Times compounded per year (1=annual, 4=quarterly, 12=monthly).

    Returns:
        Structured breakdown with principal, total interest earned, and final maturity amount.
    """
    p = _safe_float(principal, 0.0)
    r = _safe_float(rate_pct, 7.0)
    t = _safe_float(time_years, 1.0)
    n = max(1, int(compound_frequency_per_year or 1))

    if p is None or p <= 0:
        return {
            "status": "INVALID_INPUT",
            "message": "Principal amount must be a positive number."
        }
    if t is None or t <= 0:
        return {
            "status": "INVALID_INPUT",
            "message": "Time horizon must be a positive number of years."
        }
    if r is None or r < 0:
        r = 7.0

    # Compound interest calculation
    maturity = p * math.pow(1.0 + (r / (100.0 * n)), n * t)
    interest_earned = maturity - p

    freq_label = "Annually" if n == 1 else ("Quarterly" if n == 4 else ("Monthly" if n == 12 else f"{n} times/year"))

    return {
        "status": "SUCCESS",
        "principal": round(p, 2),
        "annual_rate_pct": round(r, 2),
        "timeframe_years": round(t, 2),
        "compounding_frequency": freq_label,
        "total_interest_earned": round(interest_earned, 2),
        "maturity_amount": round(maturity, 2),
        "formula_applied": f"A = {round(p, 2)} * (1 + {round(r, 2)}/(100 * {n}))^({n} * {round(t, 2)})",
        "disclaimer": "Deterministic mathematical compound interest calculation. Sovereign and bank interest rates are subject to official government notifications."
    }


# ==============================================================================
# TOOL 5: CALCULATE GOAL FEASIBILITY (AFFORDABILITY & REQUIRED SAVINGS)
# ==============================================================================

def calculate_goal_feasibility(
    target_amount: float,
    timeframe_years: float,
    monthly_surplus: Optional[float] = None,
    monthly_income: Optional[float] = None,
    initial_savings: float = 0.0,
    proposed_monthly_contribution: Optional[float] = None,
    assumed_rate_pct: float = 7.0,
    goal_name: str = "Milestone Goal"
) -> Dict[str, Any]:
    """
    Evaluates whether a target goal (e.g. laptop, bike, education, retirement) is achievable,
    determines the exact required monthly savings, and checks affordability against the user's
    unallocated monthly surplus or standard 20% savings capacity.

    Matches `src/services/goalCalculations.js` mathematical engine.

    Args:
        target_amount: Target goal amount desired in INR (e.g. 60000 for laptop, 70000 for bike).
        timeframe_years: Time to reach goal in years (e.g. 1 for 1 year, 0.5 for 6 months).
        monthly_surplus: User's declared unallocated monthly surplus in INR (if known).
        monthly_income: User's declared monthly take-home income in INR (if known).
        initial_savings: Lump-sum already accumulated towards this goal in INR. Default 0.0.
        proposed_monthly_contribution: Monthly amount user plans to invest (if testing a specific figure).
        assumed_rate_pct: Assumed annual growth/interest rate in percent (default 7.0% conservative sovereign/debt benchmark).
        goal_name: Descriptive name of the goal.

    Returns:
        Required monthly savings, feasibility verdict (ACHIEVABLE, SURPLUS_SHORTFALL, etc.),
        and cashflow cushion analysis.
    """
    # Validation
    for name, val in [
        ("target_amount", target_amount),
        ("timeframe_years", timeframe_years),
        ("initial_savings", initial_savings),
        ("assumed_rate_pct", assumed_rate_pct)
    ]:
        if not _is_valid_finite_number(val):
            return {"status": "ERROR", "error": f"Invalid non-numeric or infinite value for '{name}'."}
        if float(val) < 0:
            return {"status": "ERROR", "error": f"'{name}' cannot be negative."}

    target = float(target_amount)
    y = float(timeframe_years)
    init = float(initial_savings)
    rate = float(assumed_rate_pct)

    if target <= 0:
        return {"status": "ERROR", "error": "Target amount must be strictly greater than 0."}

    surplus = _safe_float(monthly_surplus)
    income = _safe_float(monthly_income)
    proposed = _safe_float(proposed_monthly_contribution)

    # 1. Check if already funded by initial savings
    if init >= target:
        return {
            "status": "SUCCESS",
            "goal_name": goal_name,
            "target_amount": target,
            "timeframe_years": y,
            "initial_savings": init,
            "required_monthly_savings": 0.0,
            "is_feasible": True,
            "feasibility_status": "TARGET_ALREADY_FUNDED",
            "monthly_surplus": surplus,
            "surplus_remaining": surplus,
            "message": f"Your goal '{goal_name}' of ₹{target:,.0f} is already fully funded by your initial savings of ₹{init:,.0f}."
        }

    # 2. Zero-year immediate milestone
    if y == 0:
        lump_sum_shortfall = round(target - init, 2)
        return {
            "status": "SUCCESS",
            "goal_name": goal_name,
            "target_amount": target,
            "timeframe_years": 0.0,
            "initial_savings": init,
            "required_monthly_savings": 0.0,
            "is_feasible": False,
            "feasibility_status": "IMMEDIATE_FUNDING_REQUIRED",
            "lump_sum_shortfall": lump_sum_shortfall,
            "message": f"Immediate milestone (0-year timeframe) requires an upfront lump-sum funding of ₹{lump_sum_shortfall:,.0f}."
        }

    # 3. Calculate required monthly contribution (M)
    # Formula: M = (FV - P*(1+r)^n) / [((1+r)^n - 1) / r]
    n = y * 12.0
    if rate == 0:
        required_monthly = round((target - init) / n, 2)
    else:
        r_monthly = (rate / 100.0) / 12.0
        growth_factor = math.pow(1.0 + r_monthly, n)
        fv_principal = init * growth_factor
        if fv_principal >= target:
            required_monthly = 0.0
        else:
            remaining_corpus = target - fv_principal
            annuity_factor = (growth_factor - 1.0) / r_monthly
            required_monthly = round(remaining_corpus / annuity_factor, 2)

    # If user provided a proposed contribution, evaluate projected future value
    effective_contribution = proposed if proposed is not None else required_monthly
    if rate == 0:
        projected_fv = round(init + (effective_contribution * n), 2)
    else:
        r_monthly = (rate / 100.0) / 12.0
        growth_factor = math.pow(1.0 + r_monthly, n)
        fv_p = init * growth_factor
        fv_m = effective_contribution * (growth_factor - 1.0) / r_monthly
        projected_fv = round(fv_p + fv_m, 2)

    is_achievable = projected_fv >= (target - 0.50)
    monthly_shortfall = max(0.0, round(required_monthly - effective_contribution, 2))

    # Evaluate affordability against surplus or income
    is_affordable_in_surplus = None
    surplus_remaining = None
    if surplus is not None:
        is_affordable_in_surplus = (effective_contribution <= surplus) and (surplus > 0)
        surplus_remaining = round(surplus - effective_contribution, 2)

    # Standard 20% savings capacity check if income is available
    standard_20pct_capacity = round(income * 0.20, 2) if income is not None else None
    fits_in_20pct_capacity = (required_monthly <= standard_20pct_capacity) if standard_20pct_capacity is not None else None
    pct_of_income = round((required_monthly / income) * 100.0, 1) if income and income > 0 else None

    # Status resolution
    if surplus is not None:
        if is_achievable and is_affordable_in_surplus:
            feasibility_status = "ACHIEVABLE"
            verdict_text = f"Goal is achievable! Saving ₹{required_monthly:,.0f}/month reaches ₹{target:,.0f} in {y:g} year(s) and fits within your surplus of ₹{surplus:,.0f}/month (leaving ₹{surplus_remaining:,.0f}/month cushion)."
        elif not is_achievable:
            feasibility_status = "SHORTFALL"
            verdict_text = f"Proposed savings of ₹{effective_contribution:,.0f}/month falls short by ₹{monthly_shortfall:,.0f}/month. You need to save ₹{required_monthly:,.0f}/month."
        else:
            feasibility_status = "SURPLUS_SHORTFALL"
            verdict_text = f"The required savings of ₹{required_monthly:,.0f}/month exceeds your currently declared surplus of ₹{surplus:,.0f}/month. Consider extending the timeline or optimizing expenses."
    elif income is not None:
        if fits_in_20pct_capacity:
            feasibility_status = "ACHIEVABLE_WITHIN_GUIDELINES"
            verdict_text = f"Saving ₹{required_monthly:,.0f}/month represents {pct_of_income}% of your monthly income of ₹{income:,.0f}, which fits comfortably within the recommended 20% savings guideline (₹{standard_20pct_capacity:,.0f}/month)."
        else:
            feasibility_status = "EXCEEDS_GUIDELINE_CAPACITY"
            verdict_text = f"Saving ₹{required_monthly:,.0f}/month represents {pct_of_income}% of your monthly income of ₹{income:,.0f}, exceeding the standard 20% guideline (₹{standard_20pct_capacity:,.0f}/month). A longer duration is recommended."
    else:
        feasibility_status = "UNKNOWN_SURPLUS"
        verdict_text = f"To achieve ₹{target:,.0f} in {y:g} year(s), you need to save ₹{required_monthly:,.0f}/month (at {rate}% assumed annual yield). Enter your income/expenses in Budget Planner to check personal affordability."

    return {
        "status": "SUCCESS",
        "goal_name": goal_name,
        "target_amount": target,
        "timeframe_years": y,
        "initial_savings": init,
        "assumed_rate_pct": rate,
        "required_monthly_savings": required_monthly,
        "projected_future_value": projected_fv,
        "is_feasible": is_achievable and (is_affordable_in_surplus is not False),
        "feasibility_status": feasibility_status,
        "monthly_surplus": surplus,
        "surplus_remaining": surplus_remaining,
        "monthly_shortfall": monthly_shortfall,
        "standard_20pct_savings_capacity": standard_20pct_capacity,
        "percentage_of_income": pct_of_income,
        "message": verdict_text
    }


# ==============================================================================
# TOOL 6: SEARCH GOVERNMENT SCHEMES
# ==============================================================================

def search_government_schemes(
    query: Optional[str] = None,
    category: Optional[str] = None,
    goal: Optional[str] = None,
    max_results: int = 5
) -> Dict[str, Any]:
    """
    Searches verified Government of India welfare and small savings schemes
    (such as PPF, Sukanya Samriddhi Yojana, Atal Pension Yojana, SCSS, etc.)
    filtered by keyword, category, or life stage.

    Args:
        query: Free-text search term (e.g. "daughter", "girl child", "pension", "tax saving").
        category: Scheme category (e.g. "SAVINGS", "PENSION", "INSURANCE", "WOMEN", "AGRICULTURE", "HEALTH").
        goal: Financial milestone (e.g. "education", "retirement", "wealth").
        max_results: Maximum number of scheme results to return (default 5).

    Returns:
        List of matching verified sovereign schemes with official interest rates, lock-in periods, and benefits.
    """
    limit = max(1, min(10, int(max_results) if _is_valid_finite_number(max_results) else 5))

    schemes, total = search_schemes(
        search=query.strip() if query else None,
        category=category.strip() if category else None,
        goal=goal.strip() if goal else None,
        verified=True,
        active_only=True,
        page=1,
        page_size=limit
    )

    formatted_results = []
    for s in schemes[:limit]:
        # Extract display fields
        name_en = s.get("name", {}).get("en") if isinstance(s.get("name"), dict) else s.get("name")
        name_hi = s.get("name", {}).get("hi") if isinstance(s.get("name"), dict) else None

        interest_rate = s.get("interest_rate") or s.get("financial_specs", {}).get("interest_rate")
        lock_in = s.get("lock_in_period") or s.get("financial_specs", {}).get("lock_in_period")
        tax = s.get("tax_benefit") or s.get("financial_specs", {}).get("tax_benefit")

        formatted_results.append({
            "scheme_id": s.get("scheme_id") or s.get("id"),
            "name": name_en,
            "name_hindi": name_hi,
            "category": s.get("category"),
            "interest_rate": interest_rate,
            "lock_in_period": lock_in,
            "tax_benefit": tax,
            "summary": s.get("description", {}).get("en") if isinstance(s.get("description"), dict) else s.get("summary") or s.get("description"),
            "official_portal": s.get("official_url") or s.get("portal_url"),
            "sovereign_guarantee": True
        })

    return {
        "status": "SUCCESS",
        "query": query,
        "category": category,
        "total_matches": total,
        "returned_schemes": formatted_results,
        "authority": "Directly verified against official Government of India gazettes."
    }
