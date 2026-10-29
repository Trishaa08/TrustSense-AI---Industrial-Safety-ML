# TrustSense-Gas synthetic development dataset

IMPORTANT: These files are SYNTHETIC and intended for prototyping, coursework, pipeline testing, and evaluation-code development. They are not real sensor measurements, not validated gas-detector data, and not suitable for safety decisions or patent claims about measured performance.

## Files
- sensor_windows.csv: hourly windows for 36 simulated units over 45 days; 38,880 rows.
- sensor_timeseries_demo.csv: 1-minute simulated readings for 8 units over 48 hours.
- data_dictionary.csv: column descriptions and examples.
- sensor_positions.csv: synthetic sensor layout coordinates.
- leak_ground_truth.csv: simulated leak source coordinates and event metadata.
- leak_localization_samples.csv: simulated sensor-network readings for each synthetic leak event.
- fault_injection_log.csv: synthetic fault onset/type labels.
- environmental_conditions.csv: temperature, humidity, airflow and environment-shift labels.
- sensor_reference_profiles.csv: synthetic healthy reference statistics per sensor.
- generate_dataset.py: a small starter script that loads and previews the provided CSV.

## Recommended use
1. Start with sensor_windows.csv for healthy/faulty and fault-type classification.
2. Use unit_id or split_units for group-held-out evaluation. Do not randomly split rows from the same unit.
3. Use sensor_timeseries_demo.csv for time-series feature extraction and prototype plots.
4. Use leak_localization_samples.csv with leak_ground_truth.csv and sensor_positions.csv for initial localization experiments.
5. Replace simulated measurements and labels with documented real data as soon as available.

## Important limitations
- Sensor readings and leak concentrations are generated from simplified synthetic assumptions.
- The leak localization sample uses a simple distance attenuation model and does not simulate realistic fluid dynamics, ventilation, obstacles, or sensor-specific chemistry.
- A high score on these files does not establish real-world performance, certification, or patentability.
- A single sensor cannot reliably localize a leak. Spatially distributed sensors and ground-truth source locations are needed.
