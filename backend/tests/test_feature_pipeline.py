import pytest
import numpy as np
from app.feature_pipeline import feature_pipeline, FEATURE_COLUMNS, PROHIBITED_COLUMNS
from app.data_loader import data_loader

def test_no_prohibited_columns():
    for col in PROHIBITED_COLUMNS:
        assert col not in FEATURE_COLUMNS, f"Prohibited leakage column '{col}' detected in feature list!"

def test_group_split_separation():
    df = data_loader.get_sensor_windows()
    train_units = set(df[df["split_units"] == "train"]["unit_id"].unique())
    val_units = set(df[df["split_units"] == "validation"]["unit_id"].unique())
    test_units = set(df[df["split_units"] == "test"]["unit_id"].unique())

    # Ensure zero overlap
    assert len(train_units.intersection(test_units)) == 0, "Data leakage detected: unit overlap between train and test!"
    assert len(train_units.intersection(val_units)) == 0, "Data leakage detected: unit overlap between train and val!"
    assert len(val_units.intersection(test_units)) == 0, "Data leakage detected: unit overlap between val and test!"

def test_feature_engineering_shape():
    df = data_loader.get_sensor_windows().head(50)
    feat_df = feature_pipeline.engineer_features(df)
    assert len(feat_df) == 50
    assert list(feat_df.columns) == FEATURE_COLUMNS
    assert "baseline_deviation" in feat_df.columns
    assert "hour_sin" in feat_df.columns
    assert "hour_cos" in feat_df.columns
