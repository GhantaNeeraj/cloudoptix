from app.models.models import CloudResource, ResourceMetrics, Recommendation, Alert
from app.services.analysis_engine import AnalysisEngine
from datetime import datetime, timedelta

def test_idle_resource_detection(db_session):
    # 1. Create a dummy idle resource
    resource = CloudResource(
        id="TEST-EC2-IDLE",
        name="test-idle-instance",
        type="Compute",
        provider="AWS",
        region="us-east-1",
        status="active",
        monthly_cost=150.0,
        launch_time=datetime.utcnow() - timedelta(days=20),
        efficiency_score=100.0,
        is_idle=False
    )
    db_session.add(resource)
    db_session.commit()

    # 2. Add idle metrics (low utilization CPU & Mem)
    metric = ResourceMetrics(
        resource_id="TEST-EC2-IDLE",
        cpu_avg=2.1,
        cpu_max=6.0,
        mem_avg=4.5,
        mem_max=8.0,
        network_in_out_gb=0.1,
        disk_iops=2.0,
        timestamp=datetime.utcnow()
    )
    db_session.add(metric)
    db_session.commit()

    # 3. Execute Analysis Engine
    analyzer = AnalysisEngine()
    analyzer.run_analysis(db_session)

    # 4. Assertions
    updated_res = db_session.query(CloudResource).filter(CloudResource.id == "TEST-EC2-IDLE").first()
    assert updated_res.is_idle is True
    assert updated_res.efficiency_score < 40.0

    # Assert recommendation exists
    rec = db_session.query(Recommendation).filter(Recommendation.resource_id == "TEST-EC2-IDLE").first()
    assert rec is not None
    assert "Idle" in rec.problem
    assert rec.potential_savings == 150.0 * 0.90
    assert rec.priority == "MEDIUM"
