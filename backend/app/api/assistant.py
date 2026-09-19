from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ChatQuery, ChatResponse
from app.services.assistant_service import AIAssistantService
from app.api.auth import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])
assistant_service = AIAssistantService()

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(query: ChatQuery, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Receives chat query from frontend and returns data-grounded markdown response."""
    response_txt = assistant_service.answer_question(db, query.message)
    return ChatResponse(response=response_txt)
