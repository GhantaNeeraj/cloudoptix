import os

class Settings:
    PROJECT_NAME: str = "CloudOptix"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cloudoptix_super_secret_key_change_me_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for ease of demo
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cloudoptix.db")
    BUDGET_LIMIT: float = float(os.getenv("BUDGET_LIMIT", "15000.0"))

settings = Settings()
