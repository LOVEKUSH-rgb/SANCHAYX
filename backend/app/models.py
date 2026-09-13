from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    short_name = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)  # Savings, Pension, Protection & Insurance
    sub_category = Column(String(100), nullable=True)
    provider = Column(String(150), default="Government of India")
    description_simple = Column(Text, nullable=False)
    return_type = Column(String(100), nullable=False)
    current_interest_rate = Column(String(50), nullable=False)
    rate_effective_from = Column(String(20), default="2024-01-01")
    minimum_contribution = Column(Float, default=0.0)
    maximum_contribution = Column(Float, default=0.0)
    contribution_frequency = Column(String(50), default="Yearly")
    lock_in_years = Column(Integer, default=0)
    tax_benefit = Column(String(200), nullable=True)
    benefits_overview = Column(Text, nullable=True)
    official_source_url = Column(String(300), nullable=False)
    official_authority = Column(String(150), default="Ministry of Finance")
    last_verified_date = Column(String(20), default="2024-08-01")
    is_demo_data = Column(Boolean, default=False)
    status = Column(String(20), default="active")

    eligibility_rules = relationship("EligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    goal_mappings = relationship("SchemeGoalMapping", back_populates="scheme", cascade="all, delete-orphan")


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.id"), nullable=False)
    min_age = Column(Integer, default=0)
    max_age = Column(Integer, default=100)
    gender_requirement = Column(String(20), default="All")  # Female Only, Male Only, All
    guardian_allowed = Column(Boolean, default=True)
    income_requirement = Column(String(100), default="None")
    special_conditions = Column(Text, nullable=True)

    scheme = relationship("Scheme", back_populates="eligibility_rules")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    scheme_mappings = relationship("SchemeGoalMapping", back_populates="goal", cascade="all, delete-orphan")


class SchemeGoalMapping(Base):
    __tablename__ = "scheme_goal_mapping"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.id"), nullable=False)
    goal_id = Column(String(50), ForeignKey("goals.id"), nullable=False)
    relevance_score = Column(Float, default=100.0)

    scheme = relationship("Scheme", back_populates="goal_mappings")
    goal = relationship("Goal", back_populates="scheme_mappings")


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    anonymous_session_id = Column(String(100), nullable=False)
    goal = Column(String(50), nullable=False)
    age_group = Column(String(20), nullable=False)
    recommended_scheme_ids = Column(String(300), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
