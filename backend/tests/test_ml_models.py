from app.services.ml_engine import XGBoostMLEngine
from app.services.anomaly_detection import CostAnomalyEngine
from datetime import date, timedelta

def test_xgboost_engine():
    engine = XGBoostMLEngine()
    # Force train
    engine.train_model()
    
    # Assert model file was written
    assert engine.model_path.exists()
    
    # Run a prediction for an idle server (low CPU, low Mem, high cost)
    idle_metrics = {
        "cpu_avg": 1.5,
        "cpu_max": 4.0,
        "mem_avg": 5.0,
        "mem_max": 8.0,
        "network_in_out_gb": 0.5,
        "disk_iops": 2.0
    }
    prob = engine.predict_inefficiency_prob(idle_metrics, 300.0)
    assert 0.0 <= prob <= 1.0
    # It should predict high probability of inefficiency
    assert prob > 0.5

    # Run prediction for a highly active server (high CPU, high Mem, normal cost)
    active_metrics = {
        "cpu_avg": 85.0,
        "cpu_max": 95.0,
        "mem_avg": 80.0,
        "mem_max": 90.0,
        "network_in_out_gb": 400.0,
        "disk_iops": 500.0
    }
    prob_active = engine.predict_inefficiency_prob(active_metrics, 300.0)
    assert prob_active < prob

def test_isolation_forest_anomalies():
    engine = CostAnomalyEngine(contamination=0.05)
    
    # Generate 30 days of normal spending around $300/day
    daily_spend = []
    base_date = date.today() - timedelta(days=35)
    
    for i in range(30):
        daily_spend.append({
            "date": base_date + timedelta(days=i),
            "amount": 300.0 + (i % 5) * 10  # 300, 310, 320, 330, 340
        })
        
    # Inject a cost spike on day 31
    daily_spend.append({
        "date": base_date + timedelta(days=30),
        "amount": 1300.0  # Massive spike
    })
    
    anomalies = engine.detect_anomalies(daily_spend)
    
    # Assert anomaly was detected
    assert len(anomalies) > 0
    # The anomaly should be on the spike date
    spike_anomaly = [a for a in anomalies if a["actual_amount"] == 1300.0]
    assert len(spike_anomaly) == 1
    assert spike_anomaly[0]["percent_increase"] > 150.0
