from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, date

# User & Auth
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Metrics
class MetricSchema(BaseModel):
    cpu_avg: float
    cpu_max: float
    mem_avg: float
    mem_max: float
    network_in_out_gb: float
    disk_iops: float
    timestamp: datetime

    class Config:
        from_attributes = True

# Recommendations
class RecommendationResponse(BaseModel):
    id: int
    resource_id: str
    problem: str
    evidence: str
    financial_impact: float
    action: str
    potential_savings: float
    priority: str
    status: str

    class Config:
        from_attributes = True

# Resource Response
class ResourceResponse(BaseModel):
    id: str
    name: str
    type: str
    provider: str
    region: str
    status: str
    monthly_cost: float
    efficiency_score: float
    is_idle: bool
    is_underutilized: bool

    class Config:
        from_attributes = True

class ResourceDetailsResponse(ResourceResponse):
    metrics: List[MetricSchema] = []
    recommendations: List[RecommendationResponse] = []

    class Config:
        from_attributes = True

# Alerts
class AlertResponse(BaseModel):
    id: int
    category: str
    severity: str
    title: str
    description: str
    amount_involved: Optional[float] = None
    recommended_action: Optional[str] = None
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

# Billing
class BillingRecordResponse(BaseModel):
    id: int
    service_name: str
    amount: float
    date: date
    resource_id: Optional[str] = None

    class Config:
        from_attributes = True

# Dashboard Stats
class SavingOpportunity(BaseModel):
    resource_id: str
    resource_name: str
    service_type: str
    potential_savings: float
    priority: str

class DashboardStatsResponse(BaseModel):
    monthly_cost: float
    potential_monthly_savings: float
    potential_annual_savings: float
    predicted_next_month: float
    idle_count: int
    underutilized_count: int
    resize_opportunity_count: int
    critical_alerts_count: int
    anomalies_count: int
    top_savings: List[SavingOpportunity] = []

# Savings Overview
class SavingsByService(BaseModel):
    service_name: str
    potential_savings: float

class SavingsOverTime(BaseModel):
    month: str
    amount: float

class SavingsOverviewResponse(BaseModel):
    total_monthly_savings: float
    total_annual_savings: float
    savings_by_service: List[SavingsByService]
    savings_over_time: List[SavingsOverTime]

# AI Assistant Chat
class ChatQuery(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
