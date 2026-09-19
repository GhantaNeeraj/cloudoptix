import pytest
from app.models.models import CloudResource, ResourceMetrics, BillingRecord, Recommendation, Alert
from datetime import date, timedelta, datetime
from app.services.data_seeder import seed_database

def test_auth_workflow(client):
    # 1. Register a new user
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@cloudoptix.com", "password": "securepassword"}
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == "newuser@cloudoptix.com"
    
    # 2. Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "newuser@cloudoptix.com", "password": "securepassword"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    
    # 3. Access secured endpoint (/me)
    token = login_response.json()["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "newuser@cloudoptix.com"

def test_dashboard_and_recs_workflow(client, db_session, auth_headers):
    # 1. Seed database using data_seeder to simulate a complex wasteful footprint
    seed_database(db_session)
    
    # 2. Query Dashboard Stats
    stats_response = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert stats_response.status_code == 200
    stats = stats_response.json()
    
    # Assert cost aggregates and waste metrics are calculated correctly from DB
    assert stats["monthly_cost"] > 0
    assert stats["potential_monthly_savings"] > 0
    assert stats["idle_count"] == 1  # EC2-101
    assert stats["underutilized_count"] >= 2  # DB-204, EC2-302
    assert len(stats["top_savings"]) > 0
    
    # 3. Query Recommendations List
    recs_response = client.get("/api/v1/recommendations/", headers=auth_headers)
    assert recs_response.status_code == 200
    recs = recs_response.json()
    assert len(recs) > 0
    
    # Let's find DB-204 oversized database recommendation
    db_rec = [r for r in recs if r["resource_id"] == "DB-204"][0]
    assert "Resize" in db_rec["action"]
    assert db_rec["potential_savings"] == 250.0  # 500 * 0.50
    
    # 4. Approve recommendation (resolves waste & lowers costs!)
    app_response = client.post(
        f"/api/v1/recommendations/{db_rec['id']}/approve",
        headers=auth_headers
    )
    assert app_response.status_code == 200
    assert app_response.json()["status"] == "approved"
    
    # 5. Assert cost on dashboard decreased after optimization approval!
    new_stats_response = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    new_stats = new_stats_response.json()
    assert new_stats["potential_monthly_savings"] < stats["potential_monthly_savings"]

def test_ai_assistant_endpoint(client, db_session, auth_headers):
    # Seed DB
    seed_database(db_session)
    
    # Chat: Why did my bill increase?
    chat_response = client.post(
        "/api/v1/assistant/chat",
        headers=auth_headers,
        json={"message": "Why did my bill increase?"}
    )
    assert chat_response.status_code == 200
    resp_text = chat_response.json()["response"]
    assert "bill increase" in resp_text.lower()
    assert "EC2-101" in resp_text
    assert "DB-204" in resp_text
    
    # Chat: Show me all idle servers
    chat_response_idle = client.post(
        "/api/v1/assistant/chat",
        headers=auth_headers,
        json={"message": "Show me all idle servers"}
    )
    assert chat_response_idle.status_code == 200
    resp_idle = chat_response_idle.json()["response"]
    assert "TEST-EC2" not in resp_idle  # Seeder database contains EC2-101
    assert "EC2-101" in resp_idle
    assert "web-prod-server-01" in resp_idle

def test_database_reset_endpoint(client, db_session, auth_headers):
    # Call reset
    reset_response = client.post(
        "/api/v1/reset",
        headers=auth_headers
    )
    assert reset_response.status_code == 200
    assert "reset" in reset_response.json()["message"]
