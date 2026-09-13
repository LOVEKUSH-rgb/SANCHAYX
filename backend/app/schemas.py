from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union


# ==========================================
# 1. MASTER SCHEME DATA MODELS
# ==========================================

class LocalizedName(BaseModel):
    model_config = ConfigDict(extra="ignore")
    en: str
    hi: Optional[str] = None


class OwnershipSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    level: str = "central"  # "central", "state"
    state: Optional[str] = None
    ministry: Optional[str] = None
    department: Optional[str] = None


class MasterEligibilitySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    gender: Optional[str] = "all"  # "all", "female", "male"
    residency: Optional[str] = "Indian citizen"
    income_limit: Optional[float] = None
    income_unit: Optional[str] = None
    occupation: List[str] = []
    education: List[str] = []
    marital_status: List[str] = []
    disability_requirement: Optional[str] = None
    guardian_required: Optional[bool] = None
    child_age_limit: Optional[int] = None
    special_conditions: Union[List[str], Optional[str]] = []


class MasterFinancialSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    minimum_contribution: Optional[float] = None
    maximum_contribution: Optional[float] = None
    contribution_frequency: Optional[str] = None
    lock_in: Optional[str] = None
    lock_in_years: Optional[int] = None
    maturity: Optional[str] = None
    interest_rate: Optional[str] = None
    return_type: Optional[str] = None


class MasterBenefitsSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    summary: Optional[str] = None
    amount: Optional[str] = None
    tax_benefit: Optional[str] = None


class MasterLiquiditySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    level: Optional[str] = None  # "low", "medium", "high", ""
    withdrawal_rules: Optional[str] = None


class MasterRecommendationMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    recommendable: bool = True
    suitable_goals: List[str] = []
    not_suitable_for: List[str] = []


class MasterVerificationSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str = "VERIFIED"  # "VERIFIED", "REVIEW_REQUIRED", "UNVERIFIED"
    last_verified: Optional[str] = None
    source_authority: Optional[str] = None
    official_url: Optional[str] = None


class MasterSearchSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    keywords: List[str] = []


class MasterStatusSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    active: bool = True
    legacy: bool = False
    recommendation_enabled: bool = True


class SchemeSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    scheme_id: str
    name: Union[LocalizedName, str]
    short_name: Optional[str] = None
    ownership: Optional[OwnershipSchema] = Field(default_factory=OwnershipSchema)
    category: str
    sub_category: Optional[str] = None
    scheme_type: Optional[str] = None
    target_groups: List[str] = []
    goals: List[str] = []
    
    eligibility: MasterEligibilitySchema = Field(default_factory=MasterEligibilitySchema)
    financial: MasterFinancialSchema = Field(default_factory=MasterFinancialSchema)
    benefits: MasterBenefitsSchema = Field(default_factory=MasterBenefitsSchema)
    liquidity: Optional[MasterLiquiditySchema] = Field(default_factory=MasterLiquiditySchema)
    recommendation: Optional[MasterRecommendationMeta] = Field(default_factory=MasterRecommendationMeta)
    verification: Optional[MasterVerificationSchema] = Field(default_factory=MasterVerificationSchema)
    search: Optional[MasterSearchSchema] = Field(default_factory=MasterSearchSchema)
    status: Optional[MasterStatusSchema] = Field(default_factory=MasterStatusSchema)

    # Convenience properties for backward-compatibility with UI
    @property
    def name_en(self) -> str:
        if isinstance(self.name, dict):
            return self.name.get("en", "")
        if isinstance(self.name, LocalizedName):
            return self.name.en
        return str(self.name)

    @property
    def name_hi(self) -> Optional[str]:
        if isinstance(self.name, dict):
            return self.name.get("hi")
        if isinstance(self.name, LocalizedName):
            return self.name.hi
        return None

    @property
    def is_verified(self) -> bool:
        if self.verification:
            return self.verification.status == "VERIFIED"
        return False

    @property
    def is_active(self) -> bool:
        if self.status:
            return self.status.active
        return True


# ==========================================
# 2. USER PROFILE & INPUT MODELS
# ==========================================

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    age: Optional[int] = None
    gender: Optional[str] = None  # "all", "female", "male", "All", "Female", "Male"
    child_gender: Optional[str] = None  # "female", "male"
    residency: Optional[str] = "Resident Indian"
    residency_status: Optional[str] = "resident"  # "resident", "nri"
    state: Optional[str] = None
    income: Optional[float] = None
    annual_income: Optional[float] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None
    has_disability: Optional[bool] = False
    disability: Optional[bool] = False
    saving_for: Optional[str] = "self"  # "self", "minor"
    has_guardian: Optional[bool] = None
    child_age: Optional[int] = None
    is_retired: Optional[bool] = False
    is_vrs: Optional[bool] = False
    caste: Optional[str] = None
    life_stage: Optional[str] = None
    persona: Optional[str] = None


class UserGoal(BaseModel):
    model_config = ConfigDict(extra="allow")
    goal: str  # retirement, pension, child_education, girl_child, marriage, long_term_savings, short_term_savings, monthly_income, healthcare, housing, farmer_support, business, self_employment, education, women_empowerment, disability_support, old_age_support, widow_support, family_support
    horizon_years: Optional[int] = None


class UserPreferences(BaseModel):
    model_config = ConfigDict(extra="allow")
    monthly_budget: Optional[float] = None
    monthly_capacity: Optional[float] = None
    horizon_years: Optional[int] = None
    liquidity_preference: Optional[str] = "medium"  # "low", "medium", "high"
    tax_preference: Optional[bool] = True


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    # Nested format from frontend
    profile: Optional[UserProfile] = None
    goal: Optional[UserGoal] = None
    preferences: Optional[UserPreferences] = None
    category_filter: Optional[str] = "all"
    
    # Flat format alternatives
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    residency: Optional[str] = None
    income: Optional[float] = None
    occupation: Optional[str] = None
    saving_for: Optional[str] = None
    has_guardian: Optional[bool] = None
    child_age: Optional[int] = None
    goal_name: Optional[str] = None
    monthly_budget: Optional[float] = None
    horizon_years: Optional[int] = None
    liquidity_preference: Optional[str] = None
    tax_preference: Optional[bool] = None


# ==========================================
# 3. EVALUATION & RESPONSE MODELS
# ==========================================

class EligibilityEvaluationResult(BaseModel):
    status: str  # "ELIGIBLE", "INELIGIBLE", "REVIEW_REQUIRED"
    eligible: bool
    reasons: List[str] = []
    failed_criteria: List[str] = []
    review_required_fields: List[str] = []


class ScoredScheme(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    scheme_id: str
    name: Any
    short_name: Optional[str] = None
    category: str
    sub_category: Optional[str] = None
    scheme_type: Optional[str] = None
    ownership: Optional[Dict[str, Any]] = None
    
    status: str  # "ELIGIBLE", "INELIGIBLE", "REVIEW_REQUIRED"
    fit_score: float = 0.0
    
    goal_match: float = 0.0
    eligibility_strength: float = 0.0
    budget_match: float = 0.0
    horizon_match: float = 0.0
    liquidity_match: float = 0.0
    tax_match: float = 0.0
    
    why_this_fits: List[str] = []
    eligibility_summary: Dict[str, Any] = {}
    verified_source: Dict[str, Any] = {}
    
    scheme: Dict[str, Any] = {}


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    recommendation_id: Optional[str] = None
    status: str = "success"
    recommendation_type: str = "exact_matches"  # "exact_matches", "closest_fit", "no_exact_match"
    explanation: str
    
    exact_matches: List[ScoredScheme] = []
    closest_matches: List[ScoredScheme] = []
    rejected_schemes: List[Dict[str, Any]] = []
    review_required: List[Dict[str, Any]] = []
    
    total_evaluated: int = 0
    total_eligible: int = 0
    total_ineligible: int = 0
    total_review_required: int = 0
    
    # Backward compatibility with existing UI
    recommendations: List[Dict[str, Any]] = []
    closest_fits: List[Dict[str, Any]] = []
    failed_reasons: List[str] = []


class SchemeImportBatch(BaseModel):
    schemes: List[Dict[str, Any]]
    auto_verify: bool = False


class AdminResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


# ==========================================
# 4. SCHEME COMPARISON MODELS
# ==========================================

class CompareRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scheme_ids: List[str]
    profile: Optional[UserProfile] = None


class SchemeComparisonItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scheme_id: str
    name: Any
    short_name: Optional[str] = None
    category: str
    authority: Optional[str] = None
    ministry: Optional[str] = None
    official_url: Optional[str] = None
    last_verified_date: Optional[str] = None
    verified: bool = False
    verification_status: str = "unverified"
    eligibility_summary: str
    goal_suitability: str
    interest_or_benefit: str
    minimum_contribution: str
    maximum_contribution: str
    lock_in: str
    liquidity: str
    tax_treatment: str
    withdrawal_rules: str
    image_url: Optional[str] = None
    is_insurance: bool = False
    user_eligible: Optional[bool] = None
    eligibility_reasons: List[str] = []


class CompareResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_compared: int
    items: List[SchemeComparisonItem]
    comparison_summary: str


# ==========================================
# 5. SAKHI ASSISTANT (AI) MODELS
# ==========================================

class SourceCitation(BaseModel):
    model_config = ConfigDict(extra="allow")
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    authority: str = "Government of India"
    source_authority: Optional[str] = "Government of India"
    official_url: str = "https://india.gov.in"
    last_verified: Optional[str] = "2026-08-28"
    last_verified_date: Optional[str] = "2026-08-28"


class SakhiContext(BaseModel):
    model_config = ConfigDict(extra="allow")
    page: Optional[str] = "Landing"
    scheme_id: Optional[str] = None
    recommendation_id: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None


class SakhiActionButton(BaseModel):
    model_config = ConfigDict(extra="allow")
    label: str
    action: str  # "navigate", "open_url", "ask_prompt", "compare"
    payload: Dict[str, Any] = {}


class SakhiChatRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    message: str
    language: str = "en"
    context: Optional[Union[SakhiContext, Dict[str, Any]]] = None


class SakhiChatResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    answer: str
    intent: str = "EXPLAIN_SCHEME"
    sources: List[SourceCitation] = []
    eligibility_result: Optional[str] = None  # "ELIGIBLE", "INELIGIBLE", "REVIEW_REQUIRED", None
    guardrail_applied: Optional[str] = None
    language: str = "en"
    suggested_prompts: List[str] = []
    action_buttons: List[SakhiActionButton] = []
    disclaimer: Optional[str] = "All scheme data is verified directly against official Government of India gazettes."


class SakhiQueryRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    query: str
    language: str = "en"


class SakhiQueryResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    answer: str
    language: str = "en"
    suggested_prompts: List[str] = []
    disclaimer: Optional[str] = "All scheme data is verified directly against official Government of India gazettes."


# ==========================================
# 6. LIC MASTER DATA & ELIGIBILITY SCHEMAS
# ==========================================

class LICAgeRulesSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    min_entry_age_years: Optional[float] = None
    max_entry_age_years: Optional[float] = None
    min_maturity_age_years: Optional[float] = None
    max_maturity_age_years: Optional[float] = None
    entry_age_text: Optional[str] = None


class LICGenderRulesSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    allowed: Optional[str] = "All"
    female_concession: Optional[str] = None
    notes: Optional[str] = None


class LICChildAgeRulesSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    is_child_plan: bool = False
    min_child_age: Optional[float] = None
    max_child_age: Optional[float] = None
    risk_commencement_rule: Optional[str] = None
    proposer_pwb_available: bool = False


class LICPremiumRulesSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    premium_payment_modes: List[str] = []
    min_sum_assured: Optional[float] = None
    max_sum_assured: Optional[float] = None
    min_sum_assured_text: Optional[str] = None
    max_sum_assured_text: Optional[str] = None
    min_premium: Optional[float] = None
    min_premium_text: Optional[str] = None
    sum_assured_multiples: Optional[str] = None
    high_sum_assured_rebate: Optional[str] = None


class LICBenefitsSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    death_benefit_summary: Optional[str] = None
    maturity_benefit_summary: Optional[str] = None
    survival_benefits: Optional[str] = None
    guaranteed_additions: Optional[str] = None
    bonus_type: Optional[str] = None
    loyalty_additions: Optional[str] = None


class LICPlanSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    plan_id: str
    plan_name: str
    plan_number: str
    uin: str
    category: str
    active_status: str = "active"
    short_description: Optional[str] = None
    main_purpose: Optional[str] = None
    detailed_description: Optional[str] = None
    eligibility_rules: Optional[Dict[str, Any]] = None
    age_rules: Optional[LICAgeRulesSchema] = None
    gender_rules: Optional[LICGenderRulesSchema] = None
    child_age_rules: Optional[LICChildAgeRulesSchema] = None
    premium_rules: Optional[LICPremiumRulesSchema] = None
    policy_term: Optional[Dict[str, Any]] = None
    premium_payment_term: Optional[Dict[str, Any]] = None
    benefits: Optional[LICBenefitsSchema] = None
    death_benefit: Optional[str] = None
    maturity_benefit: Optional[str] = None
    survival_benefit: Optional[str] = None
    loan_availability: Optional[Dict[str, Any]] = None
    surrender_rules: Optional[Dict[str, Any]] = None
    revival_rules: Optional[Dict[str, Any]] = None
    grace_period: Optional[Dict[str, Any]] = None
    riders: List[str] = []
    goals: List[str] = []
    suitable_for: List[str] = []
    retirement_relevance: Optional[str] = None
    protection_relevance: Optional[str] = None
    investment_preference: List[str] = []
    budget_category: Optional[str] = None
    official_lic_url: str
    official_document_url: Optional[str] = None
    official_brochure_url: Optional[str] = None
    official_category_url: Optional[str] = None
    source: str = "LIC Official Website"
    last_verified: str = "2026-08-31"
    verification_required: bool = False


class LICInformationSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    organization_name: str = "Life Insurance Corporation of India"
    short_name: str = "LIC"
    establishment_date: str = "1 September 1956"
    statutory_act: str = "Life Insurance Corporation Act, 1956 (Act No. 31 of 1956)"
    organization_type: str = "Statutory Public Sector Corporation"
    irdai_registration_number: str = "512"
    corporate_office: str = "Yogakshema, Jeevan Bima Marg, P.O. Box No. 19953, Mumbai – 400 021"
    purpose: str
    official_website: str = "https://www.licindia.in/"
    official_product_pages: Dict[str, str] = {}
    catalogue_summary: Dict[str, int] = {}
    source: str = "LIC Official Website"
    last_verified: str = "2026-08-31"
    verification_required: bool = False



