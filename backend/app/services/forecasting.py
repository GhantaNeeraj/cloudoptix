import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Any, Tuple

class CostForecastingEngine:
    def forecast_next_month(self, daily_spend_records: List[Dict[str, Any]]) -> Tuple[float, float]:
        """Fits a linear regression model on historical daily spend and forecasts the next 30 days.
        
        daily_spend_records: list of dicts with keys 'date' and 'amount'.
        Returns a tuple of:
          - forecasted_monthly_spend (sum of next 30 days)
          - growth_trend_percentage (percentage slope of cost change)
        """
        if len(daily_spend_records) < 7:
            # Fallback if there is not enough history
            if len(daily_spend_records) > 0:
                avg_spend = sum(r["amount"] for r in daily_spend_records) / len(daily_spend_records)
                return avg_spend * 30, 0.0
            return 0.0, 0.0

        df = pd.DataFrame(daily_spend_records)
        df = df.sort_values("date")
        
        # Create day indices as independent variable X (0, 1, 2, ..., N)
        X = np.arange(len(df)).reshape(-1, 1)
        y = df["amount"].values
        
        # Fit Linear Regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next 30 days
        future_X = np.arange(len(df), len(df) + 30).reshape(-1, 1)
        future_predictions = model.predict(future_X)
        
        # Clip negative costs just in case trend is steeply downward
        future_predictions = np.clip(future_predictions, 0, None)
        
        forecasted_monthly_spend = float(np.sum(future_predictions))
        
        # Calculate slope to get growth trend (change relative to recent mean)
        slope = model.coef_[0]
        recent_mean = float(np.mean(y[-14:])) if len(y) >= 14 else float(np.mean(y))
        
        if recent_mean > 0:
            growth_trend_percentage = float((slope * 30 / recent_mean) * 100)
        else:
            growth_trend_percentage = 0.0
            
        return forecasted_monthly_spend, growth_trend_percentage
