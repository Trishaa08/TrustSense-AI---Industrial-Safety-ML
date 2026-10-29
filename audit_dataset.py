import pandas as pd
import json
import os

files = [
    'sensor_windows.csv', 
    'sensor_timeseries_demo.csv', 
    'sensor_positions.csv', 
    'leak_ground_truth.csv', 
    'leak_localization_samples.csv', 
    'fault_injection_log.csv', 
    'environmental_conditions.csv', 
    'sensor_reference_profiles.csv',
    'data_dictionary.csv'
]

print("=== DATASET AUDIT REPORT ===")
for f in files:
    path = os.path.join('dataset', f)
    if not os.path.exists(path):
        print(f"File not found: {f}")
        continue
    df = pd.read_csv(path)
    print(f"\n--- {f} ---")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    nulls = df.isnull().sum()
    null_cols = nulls[nulls > 0]
    print(f"Nulls: {null_cols.to_dict() if len(null_cols) > 0 else 'None'}")
    if 'fault_type' in df.columns:
        print(f"fault_type value counts:\n{df['fault_type'].value_counts().to_dict()}")
    if 'is_faulty' in df.columns:
        print(f"is_faulty value counts:\n{df['is_faulty'].value_counts().to_dict()}")
    if 'split_units' in df.columns:
        print(f"split_units value counts:\n{df['split_units'].value_counts().to_dict()}")
    if 'label_state' in df.columns:
        print(f"label_state value counts:\n{df['label_state'].value_counts().to_dict()}")
    if 'sensor_id' in df.columns:
        print(f"Unique sensor_id count: {df['sensor_id'].nunique()}, sample: {df['sensor_id'].unique()[:5]}")
    if 'unit_id' in df.columns:
        print(f"Unique unit_id count: {df['unit_id'].nunique()}, sample: {df['unit_id'].unique()[:5]}")
    if 'timestamp' in df.columns:
        print(f"Timestamp range: {df['timestamp'].min()} to {df['timestamp'].max()}")

print("\n--- SAMPLE ROW sensor_windows.csv ---")
sw = pd.read_csv('dataset/sensor_windows.csv')
print(sw.iloc[0].to_dict())

print("\n--- SAMPLE ROW leak_localization_samples.csv ---")
lls = pd.read_csv('dataset/leak_localization_samples.csv')
print(lls.head(2).to_dict(orient='records'))

print("\n--- SAMPLE ROW leak_ground_truth.csv ---")
lgt = pd.read_csv('dataset/leak_ground_truth.csv')
print(lgt.head(2).to_dict(orient='records'))
