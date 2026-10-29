import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional
from sklearn.preprocessing import StandardScaler
from app.data_loader import data_loader
import logging

logger = logging.getLogger("trustsense.feature_pipeline")

# Features allowed at prediction time
RAW_FEATURES = [
    "gas_reading",
    "temperature_c",
    "humidity_pct",
    "airflow_m_s",
    "baseline_estimate",
    "response_time_s",
    "recovery_time_s",
    "rolling_noise_std",
    "pulse_amplitude",
    "pulse_curve_distance"
]

FEATURE_COLUMNS = [
    "gas_reading",
    "temperature_c",
    "humidity_pct",
    "airflow_m_s",
    "baseline_estimate",
    "response_time_s",
    "recovery_time_s",
    "rolling_noise_std",
    "pulse_amplitude",
    "pulse_curve_distance",
    "baseline_deviation",
    "diff_response_time",
    "diff_recovery_time",
    "diff_pulse_amplitude",
    "diff_pulse_curve",
    "hour_sin",
    "hour_cos"
]

# Leakage columns that MUST NEVER be used as prediction inputs
PROHIBITED_COLUMNS = [
    "true_gas_ppm_simulated",
    "gas_event",
    "env_shift",
    "is_faulty",
    "fault_type",
    "label_state",
    "leak_masked_by_fault"
]

class FeaturePipeline:
    """Prepares and transforms sensor features while strictly guarding against data leakage."""
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.ref_profiles: Dict[str, Dict[str, float]] = {}
        self._load_reference_profiles()

    def _load_reference_profiles(self):
        """Loads healthy reference stats per sensor for relative deviation features."""
        try:
            df = data_loader.get_reference_profiles()
            for _, row in df.iterrows():
                sid = row["sensor_id"]
                fname = row["feature_name"]
                mean_val = float(row["healthy_reference_mean"])
                if sid not in self.ref_profiles:
                    self.ref_profiles[sid] = {}
                self.ref_profiles[sid][fname] = mean_val
        except Exception as e:
            logger.warning(f"Could not load reference profiles: {e}")

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive features available at inference time without future or target information."""
        feat_df = df.copy()

        # 1. Baseline deviation
        if "gas_reading" in feat_df.columns and "baseline_estimate" in feat_df.columns:
            feat_df["baseline_deviation"] = feat_df["gas_reading"] - feat_df["baseline_estimate"]
        else:
            feat_df["baseline_deviation"] = 0.0

        # 2. Reference profile deviations
        for feature_key, col_name, ref_name in [
            ("diff_response_time", "response_time_s", "response_time_s"),
            ("diff_recovery_time", "recovery_time_s", "recovery_time_s"),
            ("diff_pulse_amplitude", "pulse_amplitude", "pulse_amplitude"),
            ("diff_pulse_curve", "pulse_curve_distance", "pulse_curve_distance"),
        ]:
            if col_name in feat_df.columns and "sensor_id" in feat_df.columns:
                ref_means = feat_df["sensor_id"].apply(
                    lambda s: self.ref_profiles.get(s, {}).get(ref_name, 0.0)
                )
                feat_df[feature_key] = feat_df[col_name] - ref_means
            else:
                feat_df[feature_key] = 0.0

        # 3. Cyclical hour representation
        if "hour" in feat_df.columns:
            feat_df["hour_sin"] = np.sin(2 * np.pi * feat_df["hour"] / 24.0)
            feat_df["hour_cos"] = np.cos(2 * np.pi * feat_df["hour"] / 24.0)
        elif "timestamp" in feat_df.columns:
            hours = pd.to_datetime(feat_df["timestamp"]).dt.hour
            feat_df["hour_sin"] = np.sin(2 * np.pi * hours / 24.0)
            feat_df["hour_cos"] = np.cos(2 * np.pi * hours / 24.0)
        else:
            feat_df["hour_sin"] = 0.0
            feat_df["hour_cos"] = 1.0

        # Fill any missing feature values with 0.0
        for col in FEATURE_COLUMNS:
            if col not in feat_df.columns:
                feat_df[col] = 0.0
            feat_df[col] = feat_df[col].fillna(0.0)

        return feat_df[FEATURE_COLUMNS]

    def fit(self, train_df: pd.DataFrame):
        """Fit scaler strictly on training split."""
        X_train_raw = self.engineer_features(train_df)
        self.scaler.fit(X_train_raw)
        self.is_fitted = True
        logger.info(f"FeaturePipeline fitted on {len(train_df)} training samples")

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform features using fitted scaler."""
        X_raw = self.engineer_features(df)
        if not self.is_fitted:
            raise RuntimeError("FeaturePipeline must be fitted on training partition before transform.")
        return self.scaler.transform(X_raw)

    def fit_transform(self, train_df: pd.DataFrame) -> np.ndarray:
        self.fit(train_df)
        return self.scaler.transform(self.engineer_features(train_df))

    def get_dataset_splits(self) -> Tuple[
        pd.DataFrame, pd.DataFrame, pd.DataFrame,
        np.ndarray, np.ndarray, np.ndarray,
        np.ndarray, np.ndarray, np.ndarray
    ]:
        """Loads sensor_windows.csv and partitions strictly by split_units."""
        df = data_loader.get_sensor_windows()
        
        train_mask = df["split_units"] == "train"
        val_mask = df["split_units"] == "validation"
        test_mask = df["split_units"] == "test"

        df_train = df[train_mask].copy()
        df_val = df[val_mask].copy()
        df_test = df[test_mask].copy()

        # Fit on train only!
        self.fit(df_train)

        X_train = self.transform(df_train)
        X_val = self.transform(df_val)
        X_test = self.transform(df_test)

        y_train_faulty = df_train["is_faulty"].values
        y_val_faulty = df_val["is_faulty"].values
        y_test_faulty = df_test["is_faulty"].values

        y_train_type = df_train["fault_type"].values
        y_val_type = df_val["fault_type"].values
        y_test_type = df_test["fault_type"].values

        return (
            df_train, df_val, df_test,
            X_train, X_val, X_test,
            y_train_faulty, y_val_faulty, y_test_faulty
        )

# Global pipeline instance
feature_pipeline = FeaturePipeline()
