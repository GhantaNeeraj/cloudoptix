from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, get_db
from sqlalchemy.orm import Session
from app.api import auth, dashboard, resources, savings, alerts, recommendations, assistant
from app.services.data_seeder import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CloudOptix AI-Powered Cost Optimization Platform API",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo development ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(savings.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(assistant.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "message": "Welcome to CloudOptix API. Go to /docs for Swagger documentation."
    }

@app.post(f"{settings.API_V1_STR}/reset", tags=["Demo Management"])
def reset_demo_database(db: Session = Depends(get_db)):
    """Wipes and re-seeds the demo database with initial wasteful resources and alerts.
    Allows easy demonstration of the product's detection loop.
    """
    seed_database(db)
    return {"message": "Demo database successfully reset and re-analyzed."}
