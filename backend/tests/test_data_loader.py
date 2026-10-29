import pytest
from app.data_loader import data_loader
from app.config import DATA_DIR

def test_load_sensor_windows():
    df = data_loader.get_sensor_windows()
    assert len(df) == 38880
    assert "is_faulty" in df.columns
    assert "fault_type" in df.columns
    assert "split_units" in df.columns
    assert "gas_reading" in df.columns

def test_load_sensor_positions():
    df = data_loader.get_sensor_positions()
    assert len(df) == 16
    assert set(df["sensor_id"].unique()) == {f"S{i:02d}" for i in range(1, 17)}
    assert "x_m" in df.columns
    assert "y_m" in df.columns
    assert "zone" in df.columns

def test_load_leak_ground_truth():
    df = data_loader.get_leak_ground_truth()
    assert len(df) == 30
    assert "source_x_m" in df.columns
    assert "source_y_m" in df.columns
    assert "source_zone" in df.columns

def test_load_localization_samples():
    df = data_loader.get_leak_localization_samples()
    assert len(df) == 480
    assert "gas_reading_ppm_simulated" in df.columns
    assert "leak_id" in df.columns

def test_list_datasets():
    datasets = data_loader.list_datasets()
    assert len(datasets) >= 8
    filenames = [d["filename"] for d in datasets]
    assert "sensor_windows.csv" in filenames
    assert "sensor_positions.csv" in filenames

def test_preview_dataset():
    prev = data_loader.get_preview("sensor_positions.csv", limit=5)
    assert prev["total_rows"] == 16
    assert len(prev["head"]) == 5
    assert "x_m" in prev["columns"]
