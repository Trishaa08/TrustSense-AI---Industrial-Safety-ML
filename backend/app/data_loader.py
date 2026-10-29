import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
from app.config import DATA_DIR, UPLOAD_DIR, DATASET_PROVENANCE

logger = logging.getLogger("trustsense.data_loader")

class DataLoader:
    """Robust data access layer for TrustSense-Gas datasets with in-memory caching."""
    _instance = None
    _cache: Dict[str, pd.DataFrame] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
            cls._cache = {}
        return cls._instance

    def get_dataset_path(self, filename: str, is_uploaded: bool = False) -> Path:
        """Resolve safe file path preventing directory traversal."""
        base = UPLOAD_DIR if is_uploaded else DATA_DIR
        # Sanitization: only allow basename
        clean_name = Path(filename).name
        target = (base / clean_name).resolve()
        if not str(target).startswith(str(base.resolve())):
            raise ValueError(f"Invalid file path detected: {filename}")
        return target

    def load_csv(self, filename: str, force_reload: bool = False, is_uploaded: bool = False) -> pd.DataFrame:
        """Load a CSV file with caching, sanitization, and graceful fallbacks."""
        cache_key = f"{'upload_' if is_uploaded else 'bundled_'}{filename}"
        if not force_reload and cache_key in self._cache:
            return self._cache[cache_key]

        filepath = self.get_dataset_path(filename, is_uploaded=is_uploaded)
        if not filepath.exists():
            raise FileNotFoundError(f"Dataset file '{filename}' does not exist in {filepath.parent}")

        try:
            df = pd.read_csv(filepath)
            self._cache[cache_key] = df
            logger.info(f"Loaded {filename}: {len(df)} rows, {len(df.columns)} columns")
            return df
        except Exception as e:
            logger.error(f"Error loading CSV {filename}: {e}")
            raise

    # Dedicated getters for standard project files
    def get_sensor_windows(self) -> pd.DataFrame:
        return self.load_csv("sensor_windows.csv")

    def get_timeseries_demo(self) -> pd.DataFrame:
        return self.load_csv("sensor_timeseries_demo.csv")

    def get_sensor_positions(self) -> pd.DataFrame:
        return self.load_csv("sensor_positions.csv")

    def get_leak_ground_truth(self) -> pd.DataFrame:
        return self.load_csv("leak_ground_truth.csv")

    def get_leak_localization_samples(self) -> pd.DataFrame:
        return self.load_csv("leak_localization_samples.csv")

    def get_reference_profiles(self) -> pd.DataFrame:
        return self.load_csv("sensor_reference_profiles.csv")

    def get_environmental_conditions(self) -> pd.DataFrame:
        return self.load_csv("environmental_conditions.csv")

    def get_fault_injection_log(self) -> pd.DataFrame:
        return self.load_csv("fault_injection_log.csv")

    def get_data_dictionary(self) -> pd.DataFrame:
        return self.load_csv("data_dictionary.csv")

    def list_datasets(self) -> List[Dict[str, Any]]:
        """List all available datasets in bundled and uploaded directories."""
        result = []
        files = [
            ("sensor_windows.csv", "Primary sensor window dataset with physical features and group split"),
            ("sensor_timeseries_demo.csv", "1-minute resolution timeseries for simulation playback across 8 units"),
            ("sensor_positions.csv", "Sensor floorplan coordinates, types, zones, and calibration ages"),
            ("leak_ground_truth.csv", "Simulated leak event ground truth coordinates and parameters"),
            ("leak_localization_samples.csv", "Spatial gas sensor readings for all 30 simulated leak events"),
            ("sensor_reference_profiles.csv", "Healthy reference profile means and deviations per sensor"),
            ("fault_injection_log.csv", "Synthetic sensor fault injection timeline and labels"),
            ("environmental_conditions.csv", "Simulated temperature, humidity, airflow, and ventilation conditions"),
            ("data_dictionary.csv", "Feature definitions, physical units, and synthetic data types"),
        ]

        for filename, desc in files:
            p = DATA_DIR / filename
            if p.exists():
                try:
                    df = self.load_csv(filename)
                    result.append({
                        "filename": filename,
                        "rows": len(df),
                        "row_count": len(df),
                        "columns": list(df.columns),
                        "column_count": len(df.columns),
                        "size_bytes": p.stat().st_size,
                        "size_kb": round(p.stat().st_size / 1024, 1),
                        "description": desc,
                        "role": desc,
                        "data_origin": DATASET_PROVENANCE
                    })
                except Exception:
                    pass

        # Also check uploaded files
        for p in UPLOAD_DIR.glob("*.csv"):
            try:
                df = pd.read_csv(p)
                result.append({
                    "filename": f"[Uploaded] {p.name}",
                    "rows": len(df),
                    "row_count": len(df),
                    "columns": list(df.columns),
                    "column_count": len(df.columns),
                    "size_bytes": p.stat().st_size,
                    "size_kb": round(p.stat().st_size / 1024, 1),
                    "description": "User-uploaded dataset file",
                    "role": "User Uploaded",
                    "data_origin": "User Uploaded (Isolated Storage)"
                })
            except Exception:
                pass

        return result

    def get_preview(self, filename: str, limit: int = 100, is_uploaded: bool = False) -> Dict[str, Any]:
        """Generate summary preview, column dtypes, missing values, and sample rows."""
        df = self.load_csv(filename, is_uploaded=is_uploaded)
        dtypes = {col: str(df[col].dtype) for col in df.columns}
        missing = {col: int(df[col].isnull().sum()) for col in df.columns}
        head = df.head(limit).replace({np.nan: None}).to_dict(orient="records")

        label_dist = {}
        if "fault_type" in df.columns:
            label_dist["fault_type"] = df["fault_type"].value_counts().to_dict()
        if "is_faulty" in df.columns:
            label_dist["is_faulty"] = df["is_faulty"].value_counts().to_dict()
        if "label_state" in df.columns:
            label_dist["label_state"] = df["label_state"].value_counts().to_dict()
        if "split_units" in df.columns:
            label_dist["split_units"] = df["split_units"].value_counts().to_dict()

        return {
            "filename": filename,
            "total_rows": len(df),
            "row_count": len(df),
            "columns": list(df.columns),
            "column_count": len(df.columns),
            "dtypes": dtypes,
            "missing_values": missing,
            "null_counts": missing,
            "head": head,
            "rows": head,
            "is_uploaded": is_uploaded,
            "label_distribution": label_dist if label_dist else None,
            "provenance": DATASET_PROVENANCE if not is_uploaded else "User Uploaded CSV"
        }

# Global singleton
data_loader = DataLoader()
