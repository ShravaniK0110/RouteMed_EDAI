import joblib
import pandas as pd
import numpy as np
import os

model = None

def load_model():
    global model
    if model is None:
        try:
            model = joblib.load(os.path.join(os.path.dirname(__file__), '../models/traffic_model.pkl'))
        except:
            pass

def predict_traffic(hour, day, route, weather):
    load_model()
    if model is None:
        return None, 0.0

    df = pd.DataFrame([{
        'hour': hour,
        'day_of_week': day,
        'route_id': route,
        'weather': weather
    }])

    pred = model.predict(df)[0]

    # Calculate dummy confidence
    confidence = min(0.95, max(0.6, 1.0 - (abs(pred - 20) / 100.0)))

    return float(pred), float(confidence)
