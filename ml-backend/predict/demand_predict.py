import joblib
import numpy as np
import os

model = None

def load_model():
    global model
    if model is None:
        try:
            model = joblib.load(os.path.join(os.path.dirname(__file__), '../models/demand_model.pkl'))
        except Exception as e:
            print(f'[demand_predict] Failed to load model: {e}')

# Zone → road_type mapping (matches training data encoding)
# Training used UK road types 1-6; we map our zones to closest equivalents
ZONE_ROAD_TYPE = {
    'Center':  1,   # Single carriageway (busy city centre)
    'North':   3,   # Dual carriageway
    'East':    1,
    'West':    2,   # One-way street
    'Highway': 6,   # Motorway / expressway
    'Unknown': 1,
}

# Weather string → numeric (matches training data Weather_Conditions encoding)
WEATHER_MAP = {
    'Clear':        1,
    'Raining':      2,
    'Rain':         2,
    'Fog':          3,
    'Snow':         5,
    'High winds':   7,
    'Unknown':      1,
}

def predict_demand(hour, day, location, weather):
    """
    Predict emergency demand risk for a zone.

    Args:
        hour        : int  0-23
        day         : int  0=Sunday … 6=Saturday
        location    : str  zone name key (Center / North / East / West / Highway)
        weather     : str  weather description

    Returns:
        risk_score  : float  0-100
        confidence  : float  0-1
    """
    load_model()
    if model is None:
        # Fallback: rule-based estimate when model unavailable
        risk = 40.0
        if hour in range(8, 11) or hour in range(17, 21):
            risk += 20
        if location == 'Highway':
            risk += 15
        if weather in ('Raining', 'Rain', 'Fog'):
            risk += 10
        return min(100.0, risk), 0.5

    road_type    = ZONE_ROAD_TYPE.get(location, 1)
    weather_code = WEATHER_MAP.get(weather, 1)

    # Estimate num_vehicles from hour (peak hours → more vehicles)
    if 7 <= hour <= 10 or 17 <= hour <= 20:
        num_vehicles = 3
    elif 11 <= hour <= 16:
        num_vehicles = 2
    else:
        num_vehicles = 1

    # Must match training order exactly:
    # [hour, day_of_week, weather, road_type, num_vehicles]
    features = np.array([[hour, day, weather_code, road_type, num_vehicles]])

    try:
        proba = model.predict_proba(features)[0]
        prob_incident = float(proba[1]) if len(proba) > 1 else (1.0 if model.predict(features)[0] == 1 else 0.0)
    except Exception as e:
        print(f'[demand_predict] Prediction error: {e}')
        return 40.0, 0.5

    risk_score = min(100.0, max(0.0, prob_incident * 100))
    confidence = min(0.95, max(0.5, abs(0.5 - prob_incident) * 2))

    return risk_score, confidence