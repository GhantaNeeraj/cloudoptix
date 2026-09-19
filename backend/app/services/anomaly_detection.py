import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Tuple, Dict, Any

class CostAnomalyEngine:
    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = IsolationForest(contamination=self.contamination, random_state=42)

    def detect_anomalies(self, daily_spend_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Trains Isolation Forest on daily billing history and identifies anomalies.
        
        daily_spend_records: list of dicts with keys 'date' and 'amount'.
        Returns list of anomalies detected.
        """
        if len(daily_spend_records) < 14:
            # Not enough data points to train a reliable anomaly detector
            return []

        df = pd.DataFrame(daily_spend_records)
        df = df.sort_values("date")
        
        # Prepare feature vector (daily spend amount)
        X = df[["amount"]].values
        
        # Train Isolation Forest
        self.model.fit(X)
        
        # Predict: 1 = normal, -1 = anomaly
        predictions = self.model.predict(X)
        
        # Calculate moving average (rolling mean) as "expected" spending baseline
        df["rolling_mean"] = df["amount"].rolling(window=7, min_periods=1).mean()
        df["is_anomaly"] = predictions == -1
        
        anomalies = []
        for i, row in df.iterrows():
            # We only alert on cost spikes (spends that are anomalous AND higher than rolling mean)
            # If spending is lower than usual, it's not a cost spike alert we care about.
            if row["is_anomaly"] and row["amount"] > (row["rolling_mean"] * 1.25):
                anomalies.append({
                    "date": row["date"],
                    "actual_amount": float(row["amount"]),
                    "expected_amount": float(row["rolling_mean"]),
                    "percent_increase": float(((row["amount"] - row["rolling_mean"]) / row["rolling_mean"]) * 100)
                })
                
        return anomalies
