from abc import ABC, abstractmethod
from datetime import datetime, timedelta, date
import random

class CloudProviderAdapter(ABC):
    @abstractmethod
    def get_resources(self):
        """Fetch all resources from the cloud provider."""
        pass

    @abstractmethod
    def get_billing_data(self, start_date: date, end_date: date):
        """Fetch billing details for the specified date range."""
        pass

class DemoCloudProviderAdapter(CloudProviderAdapter):
    def get_resources(self):
        """Generates static/active cloud resources with utilization metrics."""
        resources = []
        now = datetime.utcnow()
        
        # 1. EC2-101: Idle compute instance
        resources.append({
            "id": "EC2-101",
            "name": "web-prod-server-01",
            "type": "Compute",
            "provider": "AWS",
            "region": "us-east-1",
            "status": "active",
            "monthly_cost": 200.0,
            "launch_time": now - timedelta(days=60),
            "metrics": {
                "cpu_avg": 2.8,
                "cpu_max": 8.0,
                "mem_avg": 6.5,
                "mem_max": 12.0,
                "network_in_out_gb": 0.4,
                "disk_iops": 5.0
            }
        })
        
        # 2. DB-204: Oversized database instance (RDS db.r5.xlarge -> should be db.t3.medium)
        resources.append({
            "id": "DB-204",
            "name": "db-analytics-replica",
            "type": "Database",
            "provider": "AWS",
            "region": "us-east-1",
            "status": "active",
            "monthly_cost": 500.0,
            "launch_time": now - timedelta(days=120),
            "metrics": {
                "cpu_avg": 7.5,
                "cpu_max": 14.0,
                "mem_avg": 11.2,
                "mem_max": 18.0,
                "network_in_out_gb": 5.2,
                "disk_iops": 45.0
            }
        })
        
        # 3. EC2-302: Underutilized compute instance (t3.xlarge -> should be t3.medium)
        resources.append({
            "id": "EC2-302",
            "name": "worker-heavy-02",
            "type": "Compute",
            "provider": "AWS",
            "region": "us-west-2",
            "status": "active",
            "monthly_cost": 300.0,
            "launch_time": now - timedelta(days=45),
            "metrics": {
                "cpu_avg": 11.5,
                "cpu_max": 24.0,
                "mem_avg": 14.8,
                "mem_max": 22.0,
                "network_in_out_gb": 12.5,
                "disk_iops": 30.0
            }
        })
        
        # 4. S3-103: High cost growth in storage
        resources.append({
            "id": "S3-103",
            "name": "raw-logs-bucket",
            "type": "Storage",
            "provider": "AWS",
            "region": "us-east-1",
            "status": "active",
            "monthly_cost": 280.0,
            "launch_time": now - timedelta(days=150),
            "metrics": {
                "cpu_avg": 0.0,
                "cpu_max": 0.0,
                "mem_avg": 0.0,
                "mem_max": 0.0,
                "network_in_out_gb": 450.0,
                "disk_iops": 120.0
            }
        })

        # 5. DB-101: Well-utilized database
        resources.append({
            "id": "DB-101",
            "name": "db-primary-master",
            "type": "Database",
            "provider": "AWS",
            "region": "us-east-1",
            "status": "active",
            "monthly_cost": 1200.0,
            "launch_time": now - timedelta(days=200),
            "metrics": {
                "cpu_avg": 68.5,
                "cpu_max": 85.0,
                "mem_avg": 74.0,
                "mem_max": 82.0,
                "network_in_out_gb": 85.0,
                "disk_iops": 500.0
            }
        })
        
        # Add 6 NEW compute resources added in current month (some are underutilized to generate waste detection)
        for i in range(1, 7):
            resources.append({
                "id": f"EC2-NEW-{i}",
                "name": f"k8s-node-burst-{i:02d}",
                "type": "Compute",
                "provider": "Azure" if i % 2 == 0 else "AWS",
                "region": "eu-central-1" if i % 2 == 0 else "us-east-1",
                "status": "active",
                "monthly_cost": 180.0,
                "launch_time": now - timedelta(days=random.randint(5, 25)),
                "metrics": {
                    "cpu_avg": random.choice([4.2, 8.5, 12.1, 45.0, 52.0]),  # Some underutilized, some well-used
                    "cpu_max": random.choice([15.0, 25.0, 35.0, 75.0, 80.0]),
                    "mem_avg": random.choice([10.0, 15.0, 20.0, 60.0, 65.0]),
                    "mem_max": random.choice([20.0, 30.0, 40.0, 80.0, 85.0]),
                    "network_in_out_gb": 5.0 + i,
                    "disk_iops": 15.0
                }
            })

        # Add other normal resources to build up the database (Compute, Storage, Networking, Database)
        # Compute Resources
        for i in range(1, 10):
            resources.append({
                "id": f"EC2-NORM-{i}",
                "name": f"api-prod-server-{i:02d}",
                "type": "Compute",
                "provider": "AWS",
                "region": "us-east-1",
                "status": "active",
                "monthly_cost": 150.0 + (i * 20.0),
                "launch_time": now - timedelta(days=120 + i),
                "metrics": {
                    "cpu_avg": 45.0 + random.uniform(-10, 10),
                    "cpu_max": 75.0 + random.uniform(-5, 5),
                    "mem_avg": 55.0 + random.uniform(-10, 10),
                    "mem_max": 80.0 + random.uniform(-5, 5),
                    "network_in_out_gb": 20.0 + i * 2,
                    "disk_iops": 100.0
                }
            })

        # Storage Buckets / Volumes
        for i in range(1, 5):
            resources.append({
                "id": f"S3-NORM-{i}",
                "name": f"assets-bucket-{i:02d}",
                "type": "Storage",
                "provider": "GCP" if i % 2 == 0 else "AWS",
                "region": "us-east-1",
                "status": "active",
                "monthly_cost": 80.0 + (i * 30.0),
                "launch_time": now - timedelta(days=180),
                "metrics": {
                    "cpu_avg": 0.0,
                    "cpu_max": 0.0,
                    "mem_avg": 0.0,
                    "mem_max": 0.0,
                    "network_in_out_gb": 10.0,
                    "disk_iops": 20.0
                }
            })

        # Database instances
        for i in range(2, 5):
            resources.append({
                "id": f"DB-NORM-{i}",
                "name": f"db-customer-shard-{i:02d}",
                "type": "Database",
                "provider": "AWS",
                "region": "eu-west-1",
                "status": "active",
                "monthly_cost": 400.0 + (i * 50.0),
                "launch_time": now - timedelta(days=150),
                "metrics": {
                    "cpu_avg": 55.0,
                    "cpu_max": 70.0,
                    "mem_avg": 62.0,
                    "mem_max": 75.0,
                    "network_in_out_gb": 150.0,
                    "disk_iops": 200.0
                }
            })

        # Networking instances / Load Balancers
        for i in range(1, 4):
            resources.append({
                "id": f"NET-NORM-{i}",
                "name": f"alb-public-ingress-{i:02d}",
                "type": "Networking",
                "provider": "AWS",
                "region": "us-east-1",
                "status": "active",
                "monthly_cost": 60.0 + (i * 15.0),
                "launch_time": now - timedelta(days=100),
                "metrics": {
                    "cpu_avg": 0.0,
                    "cpu_max": 0.0,
                    "mem_avg": 0.0,
                    "mem_max": 0.0,
                    "network_in_out_gb": 1200.0,
                    "disk_iops": 0.0
                }
            })

        return resources

    def get_billing_data(self, start_date: date, end_date: date):
        """Generates historical billing records conforming to MoM requirements.
        Target: Previous month (90-60 days ago) total: ~$12,000
                Current month (30-0 days ago) total: ~$15,600 (30% increase)
        We also inject an Isolation Forest spike on day 75 (15 days ago).
        """
        billing_records = []
        current_date = start_date
        
        # Calculate monthly totals and distribute them daily
        # Prev Month: Compute 6000, Storage 2000, Database 3700, Networking 300 = 12000
        # Curr Month: Compute 8500 (22% increase + 6 new resources), Storage 2500 (18% increase), Database 3700, Networking 900 (34% increase) = 15,600
        # Injected anomaly spike: on a single day (15 days ago), networking cost spikes by $1,250
        
        total_days = (end_date - start_date).days + 1
        
        # Date boundary helpers
        days_ago_30 = end_date - timedelta(days=30)
        days_ago_60 = end_date - timedelta(days=60)
        days_ago_90 = end_date - timedelta(days=90)
        
        # Target day for cost spike anomaly: 15 days ago
        anomaly_date = end_date - timedelta(days=15)

        resources = self.get_resources()
        
        while current_date <= end_date:
            # Determine period: previous month (90 to 60 days ago) or current month (30 to 0 days ago)
            # or transition month (60 to 30 days ago)
            is_prev_month = days_ago_90 <= current_date < days_ago_60
            is_curr_month = days_ago_30 <= current_date <= end_date
            
            # Base service splits
            if is_prev_month:
                comp_daily = 6000.0 / 30.0
                stor_daily = 2000.0 / 30.0
                db_daily = 3700.0 / 30.0
                net_daily = 300.0 / 30.0
            elif is_curr_month:
                comp_daily = 8500.0 / 30.0
                stor_daily = 2500.0 / 30.0
                db_daily = 3700.0 / 30.0
                net_daily = 900.0 / 30.0
            else: # Transition period (smooth interpolation)
                # Middle month total around 13,800 (averaging 460/day)
                comp_daily = 7250.0 / 30.0
                stor_daily = 2250.0 / 30.0
                db_daily = 3700.0 / 30.0
                net_daily = 600.0 / 30.0

            # Add random fluctuations (+/- 5%)
            comp_daily *= random.uniform(0.95, 1.05)
            stor_daily *= random.uniform(0.95, 1.05)
            db_daily *= random.uniform(0.95, 1.05)
            net_daily *= random.uniform(0.95, 1.05)

            # Inject the anomaly spike on the target date
            is_anomaly_day = current_date == anomaly_date
            if is_anomaly_day:
                net_daily += 1250.0  # Big spike in networking costs!

            # Add service level billing records
            billing_records.append({
                "service_name": "Compute",
                "amount": comp_daily,
                "date": current_date,
                "resource_id": None
            })
            billing_records.append({
                "service_name": "Storage",
                "amount": stor_daily,
                "date": current_date,
                "resource_id": None
            })
            billing_records.append({
                "service_name": "Database",
                "amount": db_daily,
                "date": current_date,
                "resource_id": None
            })
            billing_records.append({
                "service_name": "Networking",
                "amount": net_daily,
                "date": current_date,
                "resource_id": None
            })

            # Allocate resource level costs for key servers for current active period (0-30 days ago)
            # This makes sure database query filters return correct resource level costs
            if is_curr_month:
                # Distribute resource monthly cost daily
                for res in resources:
                    daily_share = res["monthly_cost"] / 30.0
                    daily_share *= random.uniform(0.98, 1.02)
                    billing_records.append({
                        "service_name": res["type"],
                        "amount": daily_share,
                        "date": current_date,
                        "resource_id": res["id"]
                    })
            elif is_prev_month:
                # S3-103 cost was lower in prev month ($200 vs $280)
                # DB-204 and EC2-101 and EC2-302 existed and cost the same
                for res in resources:
                    if res["id"].startswith("EC2-NEW"):
                        continue  # New resources did not exist in previous month
                    
                    cost = res["monthly_cost"]
                    if res["id"] == "S3-103":
                        cost = 200.0  # lower storage cost (grew 40% to 280)
                    
                    daily_share = cost / 30.0
                    daily_share *= random.uniform(0.98, 1.02)
                    billing_records.append({
                        "service_name": res["type"],
                        "amount": daily_share,
                        "date": current_date,
                        "resource_id": res["id"]
                    })

            current_date += timedelta(days=1)

        return billing_records
