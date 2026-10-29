#!/usr/bin/env python3
"""
TrustSense-Gas dataset package note.

The CSV files shipped with this package are already generated and ready to load.
This script intentionally does not regenerate them; use the CSVs directly.
All measurements and labels in this package are synthetic examples, not real
gas-sensor observations. Do not use them for safety decisions or as evidence of
real-world performance.
"""
from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent

if __name__ == "__main__":
    path = DATA_DIR / "sensor_windows.csv"
    df = pd.read_csv(path)
    print(f"Loaded {path.name}: {len(df):,} rows, {len(df.columns)} columns")
    print(df.head())
