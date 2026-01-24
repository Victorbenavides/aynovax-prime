import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

TOTAL_SAMPLES = 2000
START_DATE = datetime(2025, 1, 1)

def generate_sensor_data(n_samples):
    """Generates the raw sensor readings with realistic noise."""
    np.random.seed(42)
    
    # Feature 1: Machine Temperature (Celsius)
    # Normal operation is around 60-80°C
    temp = np.random.normal(loc=70, scale=10, size=n_samples)
    
    # Feature 2: Hydraulic Pressure (Bar)
    # Normal operation is around 120 Bar
    pressure = np.random.normal(loc=120, scale=15, size=n_samples)
    
    # Feature 3: Vibration Frequency (Hz)
    # Higher vibration usually indicates mechanical looseness
    vibration = np.random.normal(loc=50, scale=5, size=n_samples)
    
    return pd.DataFrame({
        'temperature_c': temp,
        'pressure_bar': pressure,
        'vibration_hz': vibration
    })

def apply_business_logic(row):
    """
    Simulates the physical outcome of the process.
    Here we define the 'Ground Truth' logic that the AI needs to learn.
    """
    temp = row['temperature_c']
    pressure = row['pressure_bar']
    vib = row['vibration_hz']
    
    # Rule 1: Overheating causes material degradation
    if temp > 95:
        return 'Defective (Heat Damage)'
    
    # Rule 2: Low pressure results in weak structural integrity
    if pressure < 90:
        return 'Defective (Low Pressure)'
    
    # Rule 3: High vibration + High Temp = Critical System Failure
    if vib > 65 and temp > 85:
        return 'Critical Failure'
    
    return 'Approved'

def main():
    print(">>> Initializing AynovaX Data Simulation...")
    
    # 1. Generate Base Data
    df = generate_sensor_data(TOTAL_SAMPLES)
    
    # 2. Add Timestamps (simulating a timeline)
    df['timestamp'] = [START_DATE + timedelta(minutes=15*i) for i in range(TOTAL_SAMPLES)]
    
    # 3. Apply the "Laws of Physics" (Labels)
    df['quality_status'] = df.apply(apply_business_logic, axis=1)
    
    # 4. Add some "Business Context" for the Analyst role
    df['batch_id'] = [f"BATCH-{random.randint(1000, 9999)}" for _ in range(TOTAL_SAMPLES)]
    
    # 5. Export
    output_filename = 'aynovax_manufacturing_data.csv'
    df.to_csv(output_filename, index=False)
    
    print(f"\n[SUCCESS] Dataset generated: {output_filename}")
    print(f"Total Records: {len(df)}")
    print(f"Breakdown by Status:\n{df['quality_status'].value_counts()}")

if __name__ == "__main__":
    main()