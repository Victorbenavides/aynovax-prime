"""
AynovaX - Inference Service
---------------------------
Handles the loading of the ML artifact and encapsulates the prediction logic.
It acts as the bridge between the raw model and the API controller.
"""

import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

# Define path relative to where the app is running
MODEL_PATH = Path("app/artifacts/production_model.joblib")

class QualityPredictionService:
    def __init__(self):
        self.model = self._load_model()

    def _load_model(self):
        """Loads the serialized pipeline from disk."""
        try:
            if not MODEL_PATH.exists():
                raise FileNotFoundError(f"Model artifact not found at: {MODEL_PATH}")
            
            print(f"[SYSTEM] Loading AI Model from {MODEL_PATH}...")
            return joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            raise e

    def predict(self, temperature, pressure, vibration):
        """
        Runs the inference and adds business context (Recommendations).
        """
        # Prepare input as a DataFrame (keeping column names matches training step)
        input_df = pd.DataFrame([{
            'temperature_c': temperature,
            'pressure_bar': pressure,
            'vibration_hz': vibration
        }])

        # 1. Get Prediction
        prediction = self.model.predict(input_df)[0]
        
        # 2. Get Probabilities (Confidence)
        probs = self.model.predict_proba(input_df)
        confidence = np.max(probs) 

        # 3. Generate Human-Readable Recommendation
        recommendation = self._generate_recommendation(prediction, temperature, pressure)

        financial_impact = 0.0
        ticket_required = False
        
        if prediction == "Approved":
            financial_impact = 15.50 
        elif "Defective" in prediction:
            financial_impact = -45.00 
            ticket_required = True
        elif "Critical" in prediction:
            financial_impact = -1200.00 
            ticket_required = True
            
        return {
            "status": prediction,
            "confidence_score": round(confidence, 4),
            "recommendation": recommendation,
            "processed_at": datetime.now().isoformat(),
            "financial_impact": financial_impact,
            "ticket_required": ticket_required
        }
    def _generate_recommendation(self, status, temp, pressure):
        """Dynamic logic to assist the human operator."""
        if status == "Approved":
            return "System optimal. Continue normal operation."
        elif "Heat" in status:
            return f"ALERT: Reduce operating speed immediately. Temp ({temp}°C) exceeds safety threshold."
        elif "Pressure" in status:
            return f"WARNING: Check hydraulic pump valves. Pressure ({pressure} Bar) is critically low."
        elif "Critical" in status:
            return "EMERGENCY: STOP MACHINE. Imminent failure detected."
        else:
            return "Investigate process parameters."