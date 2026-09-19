from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Alert
from app.schemas.schemas import AlertResponse
from app.api.auth import get_current_user
from typing import List

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/", response_model=List[AlertResponse])
def list_alerts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetches all system alerts sorted by severity (CRITICAL first) and timestamp (newest first)."""
    return db.query(Alert).order_by(
        Alert.is_read.asc(),
        Alert.severity.asc(),  # CRITICAL (C) before WARNING (W) before INFO (I)
        Alert.timestamp.desc()
    ).all()

@router.post("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Marks a single alert as read by ID."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/read-all", status_code=status.HTTP_200_OK)
def mark_all_alerts_as_read(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Marks all currently active alerts as read."""
    db.query(Alert).filter(Alert.is_read == False).update({Alert.is_read: True})
    db.commit()
    return {"message": "All alerts successfully marked as read."}
