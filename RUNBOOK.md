# Running AmbulanceRoute Pune

Welcome to the "Uber-like" AmbulanceRoute Pune platform. This project consists of two main services:
1. **Next.js Web Application & Socket.io Server** (Node.js)
2. **Machine Learning Predictive Backend** (Python Flask)

Follow these steps to run the complete system locally.

---

## 1. Setup the Next.js Frontend & Node Backend

Open your terminal in the root of the project directory.

### Install Node Dependencies
```bash
npm install
```

### Initialize the Database
This application uses SQLite (`dev.db`) for local development, managed by Prisma.
```bash
npx prisma generate
npx prisma db push
```

### Build and Start the Application
Because this project utilizes WebSockets for real-time tracking, you must run it using the custom `server.js` file rather than the standard `next start` command.

```bash
npm run build
NODE_ENV=production node server.js
```
The application will now be running on `http://localhost:3000`.

---

## 2. Setup the Python ML Backend

You will need a **second terminal window** to run the Python backend that serves the predictive models.

### Navigate to the ML Backend Directory
```bash
cd ml-backend
```

### Install Python Dependencies
(Note: It is highly recommended to create and activate a Python virtual environment first).
```bash
pip install -r requirements.txt
```

### Start the Flask Server
```bash
python app.py
```
The Machine Learning backend will now be running on `http://localhost:5001`. The Next.js app will automatically communicate with this port to generate intelligent ETA and Risk score predictions.

---

## 3. Integrating New Datasets (`AccidentsBig.csv` & `CasualtiesBig.csv`)

You mentioned adding new datasets (`AccidentsBig.csv` and `CasualtiesBig.csv`) into the `data/raw/` directory. Currently, the system's models are trained on mock data.

To train the models exclusively on your new datasets, you must update the training scripts.

### Step A: Update `train_demand.py`
Open `ml-backend/train/train_demand.py`. You will need to replace the mock data loading with a Pandas merge operation that reads your new files.

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

# 1. Load your new datasets
accidents_df = pd.read_csv('../../data/raw/AccidentsBig.csv', low_memory=False)
casualties_df = pd.read_csv('../../data/raw/CasualtiesBig.csv', low_memory=False)

# 2. Merge the datasets (assuming they share a common key like 'Accident_Index')
df = pd.merge(accidents_df, casualties_df, on='Accident_Index')

# 3. Feature Engineering
# The Demand model expects these features: ['hour', 'day_of_week', 'zone_encoded', 'weather_encoded']
# You must map your dataset's columns to these names. For example:
df['hour'] = pd.to_datetime(df['Time'], format='%H:%M').dt.hour
df['day_of_week'] = pd.to_datetime(df['Date'], format='%d/%m/%Y').dt.dayofweek
# ... (Encode locations and weather appropriately)

# 4. Target Variable
# The model tries to predict 'risk_score' (or incident count).
# You can calculate this by counting casualties per hour/zone.
target_y = df.groupby(['zone_encoded', 'hour', 'day_of_week']).size().reset_index(name='risk_score')

# 5. Train the Model
X = target_y[['hour', 'day_of_week', 'zone_encoded']] # Add weather if available
y = target_y['risk_score']

model = RandomForestRegressor(n_estimators=100)
model.fit(X, y)

# 6. Save the new model
os.makedirs('../models', exist_ok=True)
with open('../models/demand_model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("Demand model trained on new dataset and saved successfully!")
```

### Step B: Update `train_traffic.py`
Follow a similar process in `ml-backend/train/train_traffic.py`, but focus on features that predict *travel time* or *congestion delays* (e.g., extracting distance and duration if your dataset contains route information).

### Step C: Retrain & Restart
Once the scripts are updated, run them from your `ml-backend` terminal:
```bash
python train/train_demand.py
python train/train_traffic.py
```
Finally, restart the Flask app (`python app.py`) so it loads the newly generated `.pkl` files.
