"""
ML Retraining Pipeline (Issue 9)
Orchestrates: train → validate → promote (replace live models only if validation passes).
Usage: python train/retrain_pipeline.py
"""
import subprocess
import shutil
import os
import json
from datetime import datetime

BASE    = os.path.dirname(os.path.abspath(__file__))
MODELS  = os.path.join(BASE, '../models')
BACKUP  = os.path.join(BASE, '../models/backup')

def run(cmd: str, label: str) -> bool:
    print(f'\n▶  {label}')
    result = subprocess.run(cmd, shell=True, cwd=BASE)
    if result.returncode != 0:
        print(f'❌ {label} failed (exit {result.returncode})')
        return False
    print(f'✅ {label} succeeded')
    return True

def backup_models():
    os.makedirs(BACKUP, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    for fname in ['demand_model.pkl', 'traffic_model.pkl', 'model_stats.json']:
        src = os.path.join(MODELS, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(BACKUP, f'{ts}_{fname}'))
    print(f'  Models backed up with timestamp {ts}')

def restore_backup():
    """Roll back to the most recent backup if validation fails."""
    if not os.path.exists(BACKUP):
        print('  No backup found — cannot restore.')
        return
    backups = sorted(os.listdir(BACKUP), reverse=True)
    restored = set()
    for fname in backups:
        for model in ['demand_model.pkl', 'traffic_model.pkl', 'model_stats.json']:
            if model not in restored and fname.endswith(model):
                shutil.copy2(os.path.join(BACKUP, fname), os.path.join(MODELS, model))
                restored.add(model)
                print(f'  Restored: {fname} → models/{model}')
        if len(restored) == 3:
            break

if __name__ == '__main__':
    print('=' * 50)
    print(' RouteMed ML Retraining Pipeline')
    print(f' {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 50)

    # Step 1: Backup current live models
    print('\n── Step 1: Backup current models ──────────')
    backup_models()

    # Step 2: Train demand model
    if not run('python train_demand.py', 'Train demand model'):
        restore_backup()
        exit(1)

    # Step 3: Train traffic model
    if not run('python train_traffic.py', 'Train traffic model'):
        restore_backup()
        exit(1)

    # Step 4: Validate — only promote if all checks pass
    if not run('python validate_models.py', 'Validate models'):
        print('\n⚠️  Validation failed — rolling back to previous models.')
        restore_backup()
        exit(1)

    print('\n' + '=' * 50)
    print(' ✅ Retraining complete. New models are live.')
    print('=' * 50)

    # Log retraining event
    log_path = os.path.join(MODELS, 'retrain_log.json')
    log = []
    if os.path.exists(log_path):
        with open(log_path) as f:
            log = json.load(f)
    log.append({'retrained_at': datetime.now().isoformat(), 'status': 'success'})
    with open(log_path, 'w') as f:
        json.dump(log[-20:], f, indent=2)  # keep last 20 entries
