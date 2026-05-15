import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score
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
demand_features = []
demand_targets = []

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
        road_type = int(row['Road_Type']) if pd.notna(row['Road_Type']) else 1
        num_vehicles = int(row['Number_of_Vehicles']) if pd.notna(row['Number_of_Vehicles']) else 1
        
        feature_vector = [hour, day_of_week, weather, road_type, num_vehicles]
        demand_features.append(feature_vector)
        
        severity = int(row['Accident_Severity']) if pd.notna(row['Accident_Severity']) else 3
        casualties = int(row['Number_of_Casualties']) if pd.notna(row['Number_of_Casualties']) else 0
        
        is_high_demand = 1 if (severity <= 2 or casualties >= 2) else 0
        demand_targets.append(is_high_demand)
    except:
        continue

X_demand = np.array(demand_features)
y_demand = np.array(demand_targets)

print(f"Training data shape: {X_demand.shape}")
print(f"High demand ratio: {sum(y_demand)/len(y_demand)*100:.1f}%")

print("Training Random Forest model...")
demand_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
demand_model.fit(X_demand, y_demand)

preds = demand_model.predict(X_demand)
precision = precision_score(y_demand, preds, zero_division=0)
recall = recall_score(y_demand, preds, zero_division=0)
f1 = f1_score(y_demand, preds, zero_division=0)

print(f"Demand Model Trained!")
print(f"Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")

os.makedirs('../models', exist_ok=True)
joblib.dump(demand_model, '../models/demand_model.pkl')
print(f"Saved: ../models/demand_model.pkl")

stats = {}
if os.path.exists('../models/model_stats.json'):
    with open('../models/model_stats.json', 'r') as f:
        stats = json.load(f)

stats['demand'] = {
    'precision': float(precision),
    'recall': float(recall),
    'f1_score': float(f1),
    'samples': int(len(y_demand)),
    'trained_on': 'AccidentsBig.csv + CasualtiesBig.csv (59,998 Kaggle records)'
}

with open('../models/model_stats.json', 'w') as f:
    json.dump(stats, f, indent=2)

print("Training complete!")