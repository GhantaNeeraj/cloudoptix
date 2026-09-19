from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.core.database import Base, engine
from app.core.auth import get_password_hash
from app.models.models import User, CloudResource, ResourceMetrics, BillingRecord
from app.services.cloud_provider import DemoCloudProviderAdapter
from app.services.analysis_engine import AnalysisEngine
import random

def seed_database(db: Session):
    """Initializes tables, seeds admin user, resources, metric snapshots, 
    daily expenditures, and triggers the first analysis run.
    """
    import random
    random.seed(42)
    print("Initializing Database and dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Create Default Admin User
    print("Creating default administrator user...")
    admin = User(
        email="admin@cloudoptix.com",
        hashed_password=get_password_hash("admin123"),
        is_active=True
    )
    db.add(admin)
    db.commit()

    # 2. Get resources from Demo Adapter
    print("Generating simulated resources...")
    adapter = DemoCloudProviderAdapter()
    resources = adapter.get_resources()

    end_date = date.today()
    start_date = end_date - timedelta(days=90)

    # Add resources to DB
    for res_data in resources:
        res = CloudResource(
            id=res_data["id"],
            name=res_data["name"],
            type=res_data["type"],
            provider=res_data["provider"],
            region=res_data["region"],
            status=res_data["status"],
            monthly_cost=res_data["monthly_cost"],
            launch_time=res_data["launch_time"],
            efficiency_score=100.0,
            is_idle=False,
            is_underutilized=False
        )
        db.add(res)
        
        # 3. Generate 90 days of daily metrics history for this resource
        # This builds up a realistic database for resource details charts
        metrics_to_add = []
        metrics_base = res_data["metrics"]
        
        for d in range(91):
            target_date = datetime.combine(start_date + timedelta(days=d), datetime.min.time())
            
            # Skip if target_date is before resource launch time
            if target_date < res.launch_time:
                continue
                
            # Add random variation to base metrics
            cpu_fluctuation = random.uniform(-1.5, 1.5) if metrics_base["cpu_avg"] > 0 else 0
            mem_fluctuation = random.uniform(-2.0, 2.0) if metrics_base["mem_avg"] > 0 else 0
            
            cpu_avg_day = max(0.5, min(100.0, metrics_base["cpu_avg"] + cpu_fluctuation))
            cpu_max_day = max(cpu_avg_day, min(100.0, metrics_base["cpu_max"] + random.uniform(0.0, 5.0)))
            mem_avg_day = max(1.0, min(100.0, metrics_base["mem_avg"] + mem_fluctuation))
            mem_max_day = max(mem_avg_day, min(100.0, metrics_base["mem_max"] + random.uniform(0.0, 3.0)))
            
            net_day = metrics_base["network_in_out_gb"] * random.uniform(0.8, 1.2)
            disk_day = metrics_base["disk_iops"] * random.uniform(0.8, 1.2)

            metrics_to_add.append(ResourceMetrics(
                resource_id=res.id,
                cpu_avg=cpu_avg_day,
                cpu_max=cpu_max_day,
                mem_avg=mem_avg_day,
                mem_max=mem_max_day,
                network_in_out_gb=net_day,
                disk_iops=disk_day,
                timestamp=target_date
            ))
        db.bulk_save_objects(metrics_to_add)

    db.commit()
    print("Resources and daily metrics successfully seeded!")

    # 4. Generate 90 days of daily billing records
    print("Generating 90 days of daily billing history...")
    billing_data = adapter.get_billing_data(start_date, end_date)
    
    billing_to_add = []
    for record in billing_data:
        billing_to_add.append(BillingRecord(
            service_name=record["service_name"],
            amount=record["amount"],
            date=record["date"],
            resource_id=record["resource_id"]
        ))
        
    db.bulk_save_objects(billing_to_add)
    db.commit()
    print("Billing history successfully seeded!")

    # 5. Run Initial Analysis Pipeline (Trains XGBoost and Isolation Forest, creates recommendations & alerts)
    print("Running initial analysis engine pipelines...")
    analyzer = AnalysisEngine()
    analyzer.run_analysis(db)
    print("Database seeding and analytical models successfully created!")
