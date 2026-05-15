import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import json
import os

print("Loading dataset")
try:
    accidents_df = pd.read_csv('../data/raw/AccidentsBig.csv', low_memory=False)
    casualties_df = pd.read_csv('../data/raw/CasualtiesBig.csv', low_memory=False)
    print(f"Loaded AccidentsBig.csv: {len(accidents_df)} records")
    print(f"Loaded CasualtiesBig.csv: {len(casualties_df)} records")
except FileNotFoundError as e:
    print(f"Error loading files: {e}")
    exit()

print("Merging datasets...")
merged_df = pd.merge(accidents_df, casualties_df, on='Accident_Index', how='inner')
print(f"Merged: {len(merged_df)} records")

print("Preparing features...")
traffic_features = []
traffic_targets = []

for idx, row in merged_df.iterrows():
    try:
        time_val = row.get('Time', 12)
        if pd.isna(time_val):
            hour = 12
        else:
            try:
                hour = int(float(str(time_val).split('.')[0]))
            except:
                hour = 12
        
        day_of_week = int(row['Day_of_Week']) if pd.notna(row['Day_of_Week']) else 1
        weather = int(row['Weather_Conditions']) if pd.notna(row['Weather_Conditions']) else 1
        speed_limit = int(row['Speed_limit']) if pd.notna(row['Speed_limit']) else 30
        num_vehicles = int(row['Number_of_Vehicles']) if pd.notna(row['Number_of_Vehicles']) else 1
        
        feature_vector = [hour, day_of_week, weather, speed_limit, num_vehicles]
        traffic_features.append(feature_vector)
        
        casualties = int(row['Number_of_Casualties']) if pd.notna(row['Number_of_Casualties']) else 1
        traffic_targets.append(casualties)
    except:
        continue

X_traffic = np.array(traffic_features)
y_traffic = np.array(traffic_targets)

print(f"Training data shape: {X_traffic.shape}")
print(f"Average casualties: {np.mean(y_traffic):.2f}")

print("Training Linear Regression model...")
traffic_model = LinearRegression()
traffic_model.fit(X_traffic, y_traffic)

preds = traffic_model.predict(X_traffic)
r2 = r2_score(y_traffic, preds)
mae = mean_absolute_error(y_traffic, preds)

print(f"Traffic Model Trained!")
print(f"R2 Score: {r2:.4f}, MAE: {mae:.4f}")

os.makedirs('../models', exist_ok=True)
joblib.dump(traffic_model, '../models/traffic_model.pkl')
print(f"Saved: ../models/traffic_model.pkl")

stats = {}
if os.path.exists('../models/model_stats.json'):
    with open('../models/model_stats.json', 'r') as f:
        stats = json.load(f)

stats['traffic'] = {
    'r2_score': float(r2),
    'mae': float(mae),
    'samples': int(len(y_traffic)),
    'trained_on': 'AccidentsBig.csv + CasualtiesBig.csv (59,998 Kaggle records)'
}

with open('../models/model_stats.json', 'w') as f:
    json.dump(stats, f, indent=2)
    
print("Training complete!")