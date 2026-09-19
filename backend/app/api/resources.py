from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import CloudResource, ResourceMetrics, Recommendation
from app.schemas.schemas import ResourceResponse, ResourceDetailsResponse
from app.api.auth import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/", response_model=List[ResourceResponse])
def list_resources(
    db: Session = Depends(get_db),
    type: Optional[str] = Query(None, description="Filter by type (Compute, Database, Storage, Networking)"),
    status: Optional[str] = Query(None, description="Filter by status (active, stopped)"),
    efficiency_band: Optional[str] = Query(None, description="Filter by efficiency (Excellent, Good, Needs Attention, Inefficient)"),
    search: Optional[str] = Query(None, description="Search term in name or ID"),
    current_user = Depends(get_current_user)
):
    """Fetches list of cloud resources with support for filtering and searching."""
    query = db.query(CloudResource)
    
    if type and type != "All":
        query = query.filter(CloudResource.type == type)
    if status:
        query = query.filter(CloudResource.status == status)
    if search:
        query = query.filter(
            (CloudResource.name.like(f"%{search}%")) | (CloudResource.id.like(f"%{search}%"))
        )
        
    resources = query.all()
    
    # Filter by efficiency band in Python for complexity avoidance
    if efficiency_band:
        filtered = []
        for r in resources:
            score = r.efficiency_score
            if efficiency_band == "Excellent" and score >= 90.0:
                filtered.append(r)
            elif efficiency_band == "Good" and 70.0 <= score < 90.0:
                filtered.append(r)
            elif efficiency_band == "Needs Attention" and 40.0 <= score < 70.0:
                filtered.append(r)
            elif efficiency_band == "Inefficient" and score < 40.0:
                filtered.append(r)
        return filtered
        
    return resources

@router.get("/{resource_id}", response_model=ResourceDetailsResponse)
def get_resource_details(resource_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetches full details of a specific cloud resource, including history metrics and active recommendations."""
    resource = db.query(CloudResource).filter(CloudResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # Get 90 days of metrics history sorted by timestamp
    metrics = db.query(ResourceMetrics)\
        .filter(ResourceMetrics.resource_id == resource_id)\
        .order_by(ResourceMetrics.timestamp.asc())\
        .all()
        
    # Get recommendations
    recs = db.query(Recommendation)\
        .filter(Recommendation.resource_id == resource_id, Recommendation.status == "active")\
        .all()
        
    # Build detailed schema response
    res_details = ResourceDetailsResponse.model_validate(resource)
    res_details.metrics = metrics
    res_details.recommendations = recs
    
    return res_details
