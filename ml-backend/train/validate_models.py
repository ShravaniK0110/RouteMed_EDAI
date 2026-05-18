"""
ML Model Validation Pipeline (Issue 9)
Runs after training to check model quality and detect drift.
Usage: python train/validate_models.py
"""
import joblib
import numpy as np
import json
import os
from datetime import datetime

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../models')
STATS_PATH = os.path.join(MODEL_DIR, 'model_stats.json')

# ── Thresholds ────────────────────────────────────────────────────────────────
DEMAND_MIN_F1       = 0.60   # Demand model must achieve at least 60% F1
TRAFFIC_MIN_R2      = 0.30   # Traffic model must achieve at least 0.30 R² 
DRIFT_F1_DROP       = 0.10   # Alert if F1 drops more than 10 points vs baseline
DRIFT_R2_DROP       = 0.10   # Alert if R² drops more than 0.10 vs baseline

def load_stats() -> dict:
    if not os.path.exists(STATS_PATH):
        print('[VALIDATE] No model_stats.json found. Run training first.')
        return {}
    with open(STATS_PATH) as f:
        return json.load(f)

def validate_demand(stats: dict) -> bool:
    d = stats.get('demand', {})
    f1 = d.get('f1_score', 0)
    print(f'\n── Demand Model ────────────────────────')
    print(f'  F1 Score : {f1:.4f}  (min required: {DEMAND_MIN_F1})')
    print(f'  Precision: {d.get("precision", 0):.4f}')
    print(f'  Recall   : {d.get("recall", 0):.4f}')
    print(f'  Samples  : {d.get("samples", "?")}')

    if f1 < DEMAND_MIN_F1:
        print(f'  ❌ FAIL — F1 {f1:.4f} is below minimum {DEMAND_MIN_F1}')
        return False

    # Drift check against baseline
    baseline = d.get('baseline_f1')
    if baseline and (baseline - f1) > DRIFT_F1_DROP:
        print(f'  ⚠️  DRIFT DETECTED — F1 dropped {baseline - f1:.4f} from baseline {baseline:.4f}')
        return False

    print(f'  ✅ PASS')
    return True

def validate_traffic(stats: dict) -> bool:
    t = stats.get('traffic', {})
    r2  = t.get('r2_score', 0)
    mae = t.get('mae', 999)
    print(f'\n── Traffic Model ───────────────────────')
    print(f'  R² Score : {r2:.4f}  (min required: {TRAFFIC_MIN_R2})')
    print(f'  MAE      : {mae:.4f} minutes')
    print(f'  Samples  : {t.get("samples", "?")}')

    if r2 < TRAFFIC_MIN_R2:
        print(f'  ❌ FAIL — R² {r2:.4f} is below minimum {TRAFFIC_MIN_R2}')
        return False

    baseline = t.get('baseline_r2')
    if baseline and (baseline - r2) > DRIFT_R2_DROP:
        print(f'  ⚠️  DRIFT DETECTED — R² dropped {baseline - r2:.4f} from baseline {baseline:.4f}')
        return False

    print(f'  ✅ PASS')
    return True

def check_model_files() -> bool:
    print(f'\n── Model Files ─────────────────────────')
    demand_path  = os.path.join(MODEL_DIR, 'demand_model.pkl')
    traffic_path = os.path.join(MODEL_DIR, 'traffic_model.pkl')
    ok = True
    for path, name in [(demand_path, 'demand_model.pkl'), (traffic_path, 'traffic_model.pkl')]:
        if os.path.exists(path):
            size_kb = os.path.getsize(path) / 1024
            try:
                joblib.load(path)
                print(f'  ✅ {name} — {size_kb:.1f} KB — loadable')
            except Exception as e:
                print(f'  ❌ {name} — cannot load: {e}')
                ok = False
        else:
            print(f'  ❌ {name} — FILE MISSING')
            ok = False
    return ok

def set_baselines(stats: dict):
    """Call this once after a known-good training run to set drift baselines."""
    if 'demand' in stats and 'baseline_f1' not in stats['demand']:
        stats['demand']['baseline_f1'] = stats['demand'].get('f1_score', 0)
    if 'traffic' in stats and 'baseline_r2' not in stats['traffic']:
        stats['traffic']['baseline_r2'] = stats['traffic'].get('r2_score', 0)
    stats['baseline_set_at'] = datetime.now().isoformat()
    with open(STATS_PATH, 'w') as f:
        json.dump(stats, f, indent=2)
    print('\n  Baselines saved to model_stats.json')

if __name__ == '__main__':
    print('=' * 45)
    print(' RouteMed ML Validation Pipeline')
    print(f' {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 45)

    stats = load_stats()
    if not stats:
        exit(1)

    files_ok   = check_model_files()
    demand_ok  = validate_demand(stats)
    traffic_ok = validate_traffic(stats)

    print(f'\n── Summary ─────────────────────────────')
    all_ok = files_ok and demand_ok and traffic_ok
    if all_ok:
        set_baselines(stats)
        print('  ✅ All checks passed. Models are production-ready.')
    else:
        print('  ❌ Validation FAILED. Do not deploy these models.')
        print('     Re-run training or check your dataset quality.')
        exit(1)
