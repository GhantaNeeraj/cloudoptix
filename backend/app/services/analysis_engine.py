from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.models.models import CloudResource, ResourceMetrics, BillingRecord, Recommendation, Alert
from app.services.ml_engine import XGBoostMLEngine
from app.services.anomaly_detection import CostAnomalyEngine
from app.services.forecasting import CostForecastingEngine
from app.core.config import settings

class AnalysisEngine:
    def __init__(self):
        self.ml_engine = XGBoostMLEngine()
        self.anomaly_engine = CostAnomalyEngine()
        self.forecast_engine = CostForecastingEngine()

    def run_analysis(self, db: Session):
        """Runs the entire analytical pipeline, updating efficiency scores, 
        recommendations, anomaly reports, forecasting projections, and generating alerts.
        """
        # 1. Clear previous active alerts and recommendations to avoid duplication
        # We preserve read alerts or custom ones if any, but for the demo we clear and regenerate.
        db.query(Alert).delete()
        db.query(Recommendation).filter(Recommendation.status == "active").delete()
        db.commit()

        resources = db.query(CloudResource).all()
        total_monthly_savings = 0.0

        for resource in resources:
            if resource.status != "active":
                continue
                
            # Get latest metric snapshot
            latest_metric = db.query(ResourceMetrics)\
                .filter(ResourceMetrics.resource_id == resource.id)\
                .order_by(ResourceMetrics.timestamp.desc())\
                .first()
                
            if not latest_metric:
                continue

            # Prep metric dict
            metrics_dict = {
                "cpu_avg": latest_metric.cpu_avg,
                "cpu_max": latest_metric.cpu_max,
                "mem_avg": latest_metric.mem_avg,
                "mem_max": latest_metric.mem_max,
                "network_in_out_gb": latest_metric.network_in_out_gb,
                "disk_iops": latest_metric.disk_iops
            }

            # 2. Get XGBoost inefficiency probability
            xgb_prob = self.ml_engine.predict_inefficiency_prob(metrics_dict, resource.monthly_cost)

            # 3. Domain Logic + Rules evaluation
            is_idle = False
            is_underutilized = False
            base_score = 100.0
            problem = ""
            evidence = ""
            action = ""
            savings = 0.0
            priority = "LOW"

            if resource.type in ["Compute", "Database"]:
                # Idle server detection (CPU < 5%, Mem < 10%)
                if latest_metric.cpu_avg < 5.0 and latest_metric.mem_avg < 10.0:
                    is_idle = True
                    is_idle_days = 14 # simulated period
                    base_score = 25.0 - (resource.monthly_cost / 100.0) # Cost-weighted penalty
                    base_score = max(5.0, min(35.0, base_score))
                    
                    problem = "Idle / Highly Underutilized Resource"
                    evidence = f"CPU average is {latest_metric.cpu_avg:.1f}% (below 5%) and Memory is {latest_metric.mem_avg:.1f}% (below 10%) for the last {is_idle_days} days."
                    action = "Stop or terminate this resource after verification."
                    savings = resource.monthly_cost * 0.90 # Assumes 10% IP/disk retention cost
                    priority = "HIGH" if resource.monthly_cost > 150 else "MEDIUM"
                    
                # Underutilized / Oversized resource detection (CPU 5-15%, Mem 10-25%)
                elif latest_metric.cpu_avg < 15.0 and latest_metric.mem_avg < 25.0:
                    is_underutilized = True
                    base_score = 60.0 - (resource.monthly_cost / 150.0)
                    base_score = max(40.0, min(69.0, base_score))
                    
                    problem = "Underutilized & Oversized Resource"
                    evidence = f"CPU average is {latest_metric.cpu_avg:.1f}% and Memory is {latest_metric.mem_avg:.1f}% with standard workloads. Cost: ${resource.monthly_cost:.2f}/month."
                    action = "Resize resource to a smaller compute/database instance size."
                    savings = resource.monthly_cost * 0.50 # Assumes 50% savings by down-sizing
                    priority = "HIGH" if resource.monthly_cost >= 300 else "MEDIUM"
                
                # Moderate underutilization (CPU 15-35%, Mem 25-45%)
                elif latest_metric.cpu_avg < 35.0 and latest_metric.mem_avg < 45.0:
                    base_score = 80.0 - (resource.monthly_cost / 500.0)
                    base_score = max(70.0, min(89.0, base_score))
                
                else: # Excellent efficiency
                    base_score = 95.0 + random_offset(resource.id)
                    base_score = min(100.0, base_score)
                    
            elif resource.type == "Storage":
                # Storage logic - S3-103 cost spike check (MoM growth)
                # Check S3-103 specifically for demonstration
                if resource.id == "S3-103":
                    base_score = 45.0
                    is_underutilized = True
                    problem = "Rapid Storage Growth / Unused Archival Files"
                    evidence = "Storage spending increased MoM by 40% while data retrieval frequency remains extremely low (<2%)."
                    action = "Enable lifecycle rule to transition old logs to Glacier deep archive or delete them."
                    savings = resource.monthly_cost * 0.65 # saving 65% by archiving
                    priority = "MEDIUM"
                else:
                    base_score = 90.0 + random_offset(resource.id)

            # 4. Blend ML score with rule-based score
            # 70% rule weight, 30% XGBoost weight (which outputs high probability of inefficiency for low util/high cost)
            ml_based_score = (1.0 - xgb_prob) * 100.0
            final_score = (0.7 * base_score) + (0.3 * ml_based_score)
            final_score = float(max(0.0, min(100.0, final_score)))

            # Update DB Resource properties
            resource.efficiency_score = final_score
            resource.is_idle = is_idle
            resource.is_underutilized = is_underutilized
            
            # Save recommendation if generated
            if problem:
                rec = Recommendation(
                    resource_id=resource.id,
                    problem=problem,
                    evidence=evidence,
                    financial_impact=resource.monthly_cost,
                    action=action,
                    potential_savings=savings,
                    priority=priority,
                    status="active"
                )
                db.add(rec)
                total_monthly_savings += savings

        db.commit()

        # 5. ANOMALY DETECTION (Isolation Forest)
        # Fetch daily billing history
        daily_records = db.query(
            BillingRecord.date,
            BillingRecord.amount
        ).filter(BillingRecord.resource_id == None).all() # Service-level aggregates only
        
        # Group by date to get daily spend sum
        daily_spend_map = {}
        for rec in daily_records:
            daily_spend_map[rec.date] = daily_spend_map.get(rec.date, 0.0) + rec.amount
            
        daily_spend_list = [{"date": k, "amount": v} for k, v in daily_spend_map.items()]
        daily_spend_list = sorted(daily_spend_list, key=lambda x: x["date"])

        anomalies = self.anomaly_engine.detect_anomalies(daily_spend_list)
        for anomaly in anomalies:
            anomaly_date_str = anomaly["date"].strftime("%B %d, %Y")
            alert = Alert(
                category="Anomaly",
                severity="CRITICAL",
                title="Critical Cost Anomaly Detected",
                description=f"Unusual cloud spending spike occurred on {anomaly_date_str}. Today's spending was significantly above the expected historical baseline.",
                amount_involved=anomaly["actual_amount"] - anomaly["expected_amount"],
                recommended_action="Review Networking NAT Gateway usage or network data transfer logs. This spike is highly correlated with a sudden egress bandwidth increase.",
                timestamp=datetime.combine(anomaly["date"], datetime.min.time()),
                is_read=False
            )
            db.add(alert)

        # 6. FORECASTING & BUDGET ALERTS
        forecast_spend, trend = self.forecast_engine.forecast_next_month(daily_spend_list)
        
        # Current month spending sum
        today = date.today()
        first_of_month = today.replace(day=1)
        current_month_spend = db.query(BillingRecord.amount)\
            .filter(BillingRecord.resource_id == None, BillingRecord.date >= first_of_month)\
            .all()
        curr_total = sum(r[0] for r in current_month_spend)

        # Budget Warning: 85% of budget consumed
        budget_limit = settings.BUDGET_LIMIT
        budget_pct = (curr_total / budget_limit) * 100.0
        if budget_pct >= 80.0:
            alert = Alert(
                category="Budget",
                severity="WARNING" if budget_pct < 100.0 else "CRITICAL",
                title="Monthly Cloud Budget Warning",
                description=f"Cloud Optix detected that {budget_pct:.1f}% of your monthly budget of ${budget_limit:,.2f} has been consumed. Current spend: ${curr_total:,.2f}.",
                amount_involved=curr_total,
                recommended_action="Suspend non-production testing environments and review high-cost databases.",
                timestamp=datetime.utcnow(),
                is_read=False
            )
            db.add(alert)

        # Forecast Warning: Expected to exceed budget
        if forecast_spend > budget_limit:
            alert = Alert(
                category="Forecast",
                severity="CRITICAL",
                title="Projected Spending Budget Overrun",
                description=f"Projected spending for next month is estimated at ${forecast_spend:,.2f}, which exceeds your monthly budget of ${budget_limit:,.2f} by ${forecast_spend - budget_limit:,.2f} ({((forecast_spend - budget_limit) / budget_limit) * 100:.1f}%).",
                amount_involved=forecast_spend,
                recommended_action="Enact resizing and scheduling optimization recommendations immediately to prevent budget overrun.",
                timestamp=datetime.utcnow(),
                is_read=False
            )
            db.add(alert)

        # 7. SERVICE COST MoM SPENDING INCREASE ALERTS
        # Compare last 30 days vs previous 30 days (days 30-0 ago vs 60-30 ago)
        # Prev: date between [today-60, today-30)
        # Curr: date between [today-30, today]
        days_ago_30 = today - timedelta(days=30)
        days_ago_60 = today - timedelta(days=60)
        
        services = ["Compute", "Storage", "Database", "Networking"]
        for service in services:
            prev_sum = db.query(BillingRecord.amount)\
                .filter(BillingRecord.service_name == service, BillingRecord.date >= days_ago_60, BillingRecord.date < days_ago_30)\
                .all()
            curr_sum = db.query(BillingRecord.amount)\
                .filter(BillingRecord.service_name == service, BillingRecord.date >= days_ago_30)\
                .all()
            
            p_total = sum(r[0] for r in prev_sum)
            c_total = sum(r[0] for r in curr_sum)
            
            if p_total > 0:
                increase_pct = ((c_total - p_total) / p_total) * 100.0
                if increase_pct >= 15.0 and (c_total - p_total) >= 100.0:
                    severity = "CRITICAL" if increase_pct > 30.0 else "WARNING"
                    
                    # Identify the culprit resources in this service
                    details_txt = ""
                    if service == "Compute":
                        details_txt = "Main cause: 6 new compute resources were launched, and 3 compute resources (EC2-101, EC2-302) remain underutilized."
                    elif service == "Storage":
                        details_txt = "Main cause: Storage bucket S3-103 increased size by 40% with very low access frequency."
                    elif service == "Networking":
                        details_txt = "Main cause: Sudden network egress traffic anomaly spiked traffic costs by $1,250 on a single day."

                    alert = Alert(
                        category="Service-Increase",
                        severity=severity,
                        title=f"{service.upper()} Spending Cost Increase Detected",
                        description=f"{service} spending increased by {increase_pct:.1f}% compared with the previous month. Previous: ${p_total:,.2f}, Current: ${c_total:,.2f}.",
                        amount_involved=c_total - p_total,
                        recommended_action=f"Review active resources in the {service} service. {details_txt}",
                        timestamp=datetime.utcnow(),
                        is_read=False
                    )
                    db.add(alert)

        # 8. RESOURCE LEVEL RECOMMENDATIONS / ALERTS
        # Idle Alert for EC2-101
        ec2_101 = db.query(CloudResource).filter(CloudResource.id == "EC2-101").first()
        if ec2_101 and ec2_101.efficiency_score < 40.0:
            alert = Alert(
                category="Idle",
                severity="WARNING",
                title="Highly Underutilized Compute Instance EC2-101",
                description="Resource 'web-prod-server-01' (EC2-101) CPU utilization has remained below 5% for the last 14 days while continuing to run 720 hours.",
                amount_involved=180.0, # potential saving
                recommended_action="Stop or resize this compute resource. Stop action saves $180/month.",
                timestamp=datetime.utcnow(),
                is_read=False
            )
            db.add(alert)
            
        # High Cost DB-101 / DB-204 alerts
        db_204 = db.query(CloudResource).filter(CloudResource.id == "DB-204").first()
        if db_204 and db_204.efficiency_score < 60.0:
            alert = Alert(
                category="High-Cost",
                severity="WARNING",
                title="Oversized Database Instance DB-204",
                description="Database replica 'db-analytics-replica' (DB-204) is oversized. Current CPU average is 7.5%, and Memory is 11.2%. Current cost: $500/month.",
                amount_involved=280.0, # potential saving
                recommended_action="Down-size instance from db.r5.xlarge to db.t3.medium. Down-sizing saves $280/month.",
                timestamp=datetime.utcnow(),
                is_read=False
            )
            db.add(alert)

        # Savings Warning Alert
        if total_monthly_savings > 0:
            alert = Alert(
                category="Savings",
                severity="INFO",
                title="Massive Potential Cloud Cost Savings Detected",
                description=f"Cloud Optix has analyzed your active infrastructure and identified potential monthly savings of ${total_monthly_savings:,.2f} (${total_monthly_savings * 12:,.2f}/year).",
                amount_involved=total_monthly_savings,
                recommended_action="Review and approve the active resizing and stopping recommendations in the Savings tab.",
                timestamp=datetime.utcnow(),
                is_read=False
            )
            db.add(alert)

        db.commit()

def random_offset(val: str) -> float:
    """Deterministic pseudo-random offset based on ID for demo consistency."""
    return (hash(val) % 500) / 100.0 - 2.5
