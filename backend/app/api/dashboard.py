from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import CloudResource, BillingRecord, Recommendation, Alert
from app.schemas.schemas import DashboardStatsResponse, SavingOpportunity
from app.services.forecasting import CostForecastingEngine
from app.api.auth import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Computes high-level aggregated statistics for the CloudOptix dashboard."""
    # Date markers
    today = date.today()
    days_ago_30 = today - timedelta(days=30)
    
    # 1. Current Monthly Cost (sum of last 30 days billing records, excluding resource-level duplicates)
    billing_sum = db.query(BillingRecord.amount)\
        .filter(BillingRecord.resource_id == None, BillingRecord.date >= days_ago_30)\
        .all()
    monthly_cost = sum(r[0] for r in billing_sum)
    
    # 2. Recommendations & Potential Savings
    active_recs = db.query(Recommendation).filter(Recommendation.status == "active").all()
    potential_monthly_savings = sum(r.potential_savings for r in active_recs)
    potential_annual_savings = potential_monthly_savings * 12.0
    
    # 3. Forecasted Next Month Cost
    daily_records = db.query(
        BillingRecord.date,
        BillingRecord.amount
    ).filter(BillingRecord.resource_id == None).all()
    
    daily_spend_map = {}
    for rec in daily_records:
        daily_spend_map[rec.date] = daily_spend_map.get(rec.date, 0.0) + rec.amount
    daily_spend_list = sorted([{"date": k, "amount": v} for k, v in daily_spend_map.items()], key=lambda x: x["date"])
    
    forecaster = CostForecastingEngine()
    predicted_next_month, _ = forecaster.forecast_next_month(daily_spend_list)

    # 4. Waste counts
    idle_count = db.query(CloudResource).filter(CloudResource.status == "active", CloudResource.is_idle == True).count()
    underutilized_count = db.query(CloudResource).filter(CloudResource.status == "active", CloudResource.is_underutilized == True).count()
    
    resize_opportunity_count = db.query(Recommendation)\
        .filter(Recommendation.action.like("%Resize%"), Recommendation.status == "active")\
        .count()
        
    # 5. Warnings and alert counts
    critical_alerts_count = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_read == False).count()
    anomalies_count = db.query(Alert).filter(Alert.category == "Anomaly", Alert.is_read == False).count()
    
    # 6. Top 5 savings opportunities
    top_recs = db.query(Recommendation)\
        .filter(Recommendation.status == "active")\
        .order_by(Recommendation.potential_savings.desc())\
        .limit(5)\
        .all()
        
    top_savings = []
    for rec in top_recs:
        res = db.query(CloudResource).filter(CloudResource.id == rec.resource_id).first()
        res_name = res.name if res else "Unknown Resource"
        svc_type = res.type if res else "Compute"
        
        top_savings.append(SavingOpportunity(
            resource_id=rec.resource_id,
            resource_name=res_name,
            service_type=svc_type,
            potential_savings=rec.potential_savings,
            priority=rec.priority
        ))
        
    return DashboardStatsResponse(
        monthly_cost=monthly_cost,
        potential_monthly_savings=potential_monthly_savings,
        potential_annual_savings=potential_annual_savings,
        predicted_next_month=predicted_next_month,
        idle_count=idle_count,
        underutilized_count=underutilized_count,
        resize_opportunity_count=resize_opportunity_count,
        critical_alerts_count=critical_alerts_count,
        anomalies_count=anomalies_count,
        top_savings=top_savings
    )
