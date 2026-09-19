import os
import json
import xgboost as xgb
import pandas as pd
import numpy as np
from pathlib import Path

class XGBoostMLEngine:
    def __init__(self):
        self.model_dir = Path(__file__).parent.parent / "resources"
        self.model_path = self.model_dir / "xgboost_model.json"
        self.model = None
        
        # Ensure resources folder exists
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
    def _generate_training_data(self) -> pd.DataFrame:
        """Generates a synthetic training dataset of 500 servers to train XGBoost."""
        np.random.seed(42)
        n_samples = 500
        
        cpu_avg = np.random.uniform(1.0, 95.0, n_samples)
        cpu_max = cpu_avg + np.random.uniform(5.0, 20.0, n_samples)
        cpu_max = np.clip(cpu_max, 0, 100)
        
        mem_avg = np.random.uniform(2.0, 95.0, n_samples)
        mem_max = mem_avg + np.random.uniform(3.0, 15.0, n_samples)
        mem_max = np.clip(mem_max, 0, 100)
        
        net_in_out = np.random.exponential(150.0, n_samples)
        disk_iops = np.random.exponential(200.0, n_samples)
        monthly_cost = np.random.uniform(15.0, 1500.0, n_samples)
        
        # Inefficient if CPU/Mem utilization is extremely low,
        # or underutilized but monthly cost is high (oversized servers)
        is_inefficient = []
        for i in range(n_samples):
            # Condition 1: Idle
            if cpu_avg[i] < 5.0 and mem_avg[i] < 10.0:
                is_inefficient.append(1)
            # Condition 2: High cost + Underutilization (Oversized)
            elif cpu_avg[i] < 15.0 and mem_avg[i] < 25.0 and monthly_cost[i] > 150.0:
                is_inefficient.append(1)
            # Condition 3: Random low utilization
            elif cpu_avg[i] < 8.0 and np.random.rand() > 0.3:
                is_inefficient.append(1)
            else:
                is_inefficient.append(0)
                
        df = pd.DataFrame({
            "cpu_avg": cpu_avg,
            "cpu_max": cpu_max,
            "mem_avg": mem_avg,
            "mem_max": mem_max,
            "net_in_out": net_in_out,
            "disk_iops": disk_iops,
            "monthly_cost": monthly_cost,
            "is_inefficient": is_inefficient
        })
        return df

    def train_model(self):
        """Trains the XGBoost Classifier on synthetic historical data."""
        df = self._generate_training_data()
        X = df.drop(columns=["is_inefficient"])
        y = df["is_inefficient"]
        
        # Initialize and fit XGBoost classifier
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric="logloss"
        )
        
        self.model.fit(X, y)
        
        # Save model
        self.model.save_model(str(self.model_path))
        print(f"XGBoost model successfully trained and saved to {self.model_path}")

    def load_model(self) -> bool:
        """Loads a pre-trained XGBoost model if it exists."""
        if self.model_path.exists():
            self.model = xgb.XGBClassifier()
            self.model.load_model(str(self.model_path))
            return True
        return False

    def predict_inefficiency_prob(self, metrics: dict, monthly_cost: float) -> float:
        """Predicts the probability of a resource being inefficient.
        
        metrics keys: cpu_avg, cpu_max, mem_avg, mem_max, network_in_out_gb, disk_iops
        """
        # Ensure model is initialized
        if self.model is None:
            if not self.load_model():
                self.train_model()
                
        # Prepare feature vector
        features = pd.DataFrame([{
            "cpu_avg": metrics.get("cpu_avg", 0.0),
            "cpu_max": metrics.get("cpu_max", 0.0),
            "mem_avg": metrics.get("mem_avg", 0.0),
            "mem_max": metrics.get("mem_max", 0.0),
            "net_in_out": metrics.get("network_in_out_gb", 0.0),
            "disk_iops": metrics.get("disk_iops", 0.0),
            "monthly_cost": monthly_cost
        }])
        
        # Predict probability
        prob = float(self.model.predict_proba(features)[0][1])
        return prob
