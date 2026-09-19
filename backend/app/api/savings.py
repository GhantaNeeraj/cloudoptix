from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import CloudResource, Recommendation
from app.schemas.schemas import SavingsOverviewResponse, SavingsByService, SavingsOverTime
from app.api.auth import get_current_user
from datetime import date
from typing import List

router = APIRouter(prefix="/savings", tags=["Savings"])

@router.get("/overview", response_model=SavingsOverviewResponse)
def get_savings_overview(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Aggregates cost savings metrics by service type and projected savings over a 6-month timeline."""
    active_recs = db.query(Recommendation).filter(Recommendation.status == "active").all()
    
    # Calculate totals
    total_monthly = sum(r.potential_savings for r in active_recs)
    total_annual = total_monthly * 12.0
    
    # 1. Savings by service category
    service_savings_map = {"Compute": 0.0, "Storage": 0.0, "Database": 0.0, "Networking": 0.0}
    for rec in active_recs:
        res = db.query(CloudResource).filter(CloudResource.id == rec.resource_id).first()
        svc_type = res.type if res else "Compute"
        if svc_type in service_savings_map:
            service_savings_map[svc_type] += rec.potential_savings
        else:
            service_savings_map[svc_type] = rec.potential_savings
            
    savings_by_service = [
        SavingsByService(service_name=k, potential_savings=v) for k, v in service_savings_map.items() if v > 0
    ]
    
    # 2. Cumulative savings projection over the next 6 months (Month 1 to Month 6)
    # If the user saves $800/mo, month 1 is 800, month 2 is 1600, etc.
    today = date.today()
    savings_over_time = []
    
    months_names = ["September", "October", "November", "December", "January", "February"]
    # Adjust starting month based on current date
    start_month_idx = today.month - 1  # 0-indexed
    all_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for i in range(6):
        month_name = all_months[(start_month_idx + i) % 12]
        cumulative_saving = total_monthly * (i + 1)
        savings_over_time.append(SavingsOverTime(
            month=month_name,
            amount=cumulative_saving
        ))
        
    return SavingsOverviewResponse(
        total_monthly_savings=total_monthly,
        total_annual_savings=total_annual,
        savings_by_service=savings_by_service,
        savings_over_time=savings_over_time
    )
