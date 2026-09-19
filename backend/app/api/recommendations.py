from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import CloudResource, ResourceMetrics, Recommendation
from app.schemas.schemas import RecommendationResponse
from app.services.analysis_engine import AnalysisEngine
from app.api.auth import get_current_user
from typing import List

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/", response_model=List[RecommendationResponse])
def list_recommendations(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetches all active cost-saving recommendations."""
    return db.query(Recommendation).filter(Recommendation.status == "active").all()

@router.post("/{rec_id}/approve", response_model=RecommendationResponse)
def approve_recommendation(rec_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Approves and applies the recommendation. 
    Simulates stopping or downsizing by updating resource metrics, 
    lowering resource cost, and executing a fresh analysis run.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    # Mark as approved
    rec.status = "approved"
    
    # Locate resource and apply changes
    resource = db.query(CloudResource).filter(CloudResource.id == rec.resource_id).first()
    if resource:
        # Subtract savings from monthly cost
        resource.monthly_cost = float(max(0.0, resource.monthly_cost - rec.potential_savings))
        resource.is_idle = False
        resource.is_underutilized = False
        resource.efficiency_score = 98.0
        
        # Simulate healthy utilization metrics going forward
        latest_metric = db.query(ResourceMetrics)\
            .filter(ResourceMetrics.resource_id == resource.id)\
            .order_by(ResourceMetrics.timestamp.desc())\
            .first()
            
        if latest_metric:
            # Shift utilization to normal ranges
            latest_metric.cpu_avg = 45.0
            latest_metric.cpu_max = 75.0
            latest_metric.mem_avg = 50.0
            latest_metric.mem_max = 70.0
            db.add(latest_metric)

    db.commit()
    
    # Re-run analysis engine to update the alerts, savings pools, and dashboards!
    analyzer = AnalysisEngine()
    analyzer.run_analysis(db)
    
    # Fetch the updated recommendation to return (since run_analysis deletes active recs,
    # we return a mocked/updated approved state representation)
    return rec
@router.post("/{rec_id}/dismiss", response_model=RecommendationResponse)
def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Dismisses the recommendation, removing it from active lists."""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    rec.status = "dismissed"
    db.commit()
    
    # Re-run analysis engine
    analyzer = AnalysisEngine()
    analyzer.run_analysis(db)
    
    return rec
