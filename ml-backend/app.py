from flask import Flask, request, jsonify
import json
import os
from datetime import datetime
import sys

# Add directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from predict.traffic_predict import predict_traffic
from predict.demand_predict import predict_demand

app = Flask(__name__)

@app.route('/predict/traffic', methods=['POST'])
def traffic():
    try:
        data = request.json

        hour = data.get('hour', 12)
        day = data.get('day_of_week', 0)
        route = data.get('route_id', 'R1')
        weather = data.get('weather', 'Clear')

        pred_mins, conf = predict_traffic(
            hour,
            day,
            route,
            weather
        )

        # Fallback if ML fails
        if pred_mins is None:
            pred_mins = 20
            conf = 0.5

        # Simulated rerouting logic
        # If predicted time is high, suggest alternative
        suggest_reroute = pred_mins > 25

        alternative_route = suggest_reroute

        alternative_route_name = (
            'Traffic Optimized Route'
            if suggest_reroute
            else None
        )

        time_saved = (
            round(pred_mins * 0.25, 2)
            if suggest_reroute
            else 0
        )

        return jsonify({
            'predicted_travel_minutes': pred_mins,
            'confidence': conf,
            'model_type': 'LinearRegression',

            # NEW FIELDS FOR REROUTING
            'alternative_route': alternative_route,
            'alternative_route_name': alternative_route_name,
            'time_saved': time_saved
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 400


@app.route('/predict/demand', methods=['POST'])
def demand():
    data = request.json

    hour = data.get('hour', 12)
    day = data.get('day_of_week', 0)
    location = data.get('location', 'Unknown')
    weather = data.get('weather', 'Clear')

    risk_score, confidence = predict_demand(
        hour,
        day,
        location,
        weather
    )

    return jsonify({
        'risk_score': risk_score,
        'confidence': confidence,
        'model_type': 'RandomForestClassifier',
        'location': location,
        'hour': hour,
    })


@app.route('/models/info', methods=['GET'])
def info():
    stats = {}

    if os.path.exists('models/model_stats.json'):
        with open('models/model_stats.json', 'r') as f:
            stats = json.load(f)

    return jsonify({
        'traffic_model_accuracy':
            stats.get('traffic', {}).get('r2_score', 0),

        'demand_model_accuracy':
            stats.get('demand', {}).get('f1_score', 0),

        'last_trained_date':
            datetime.now().isoformat()
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok'
    })


@app.route('/predict', methods=['POST'])
def predict_all():
    try:
        data = request.json

        hour = data.get('hour', 12)
        day_of_week = data.get('day_of_week', 3)
        weather = data.get('weather', 0)
        road_type = data.get('road_type', 0)
        num_vehicles = data.get('num_vehicles', 1)

        is_high_demand = (
            1 if (hour > 17 or weather > 2)
            else 0
        )

        predicted_casualties = (
            num_vehicles *
            (1.5 if road_type > 1 else 1.0)
        )

        traffic_severity = (
            "High"
            if is_high_demand
            else "Low"
        )

        return jsonify({
            'is_high_demand': is_high_demand,
            'predicted_casualties': predicted_casualties,
            'traffic_severity': traffic_severity
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 400


if __name__ == '__main__':
    app.run(
        port=5001,
        debug=False
    )