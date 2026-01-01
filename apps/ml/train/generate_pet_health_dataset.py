import pandas as pd
import numpy as np
import uuid
from datetime import datetime
import random

def generate_synthetic_data(num_samples=1000):
    print(f"Generating {num_samples} synthetic records...")
    
    # categories
    species_list = ['dog', 'cat', 'bird', 'rabbit']
    symptoms_list = ['none', 'digestive_vomiting', 'lethargy', 'skin_irritation', 'respiratory_cough']
    severity_list = ['none', 'mild', 'moderate', 'severe']
    duration_list = ['none', '1-3-days', 'under-24h', 'over-week']
    appetite_list = ['normal', 'decreased', 'increased', 'none']
    energy_list = ['normal', 'low', 'lethargic', 'high']
    coat_list = ['good', 'fair', 'poor']

    data = []

    for _ in range(num_samples):
        # Generate base features
        species = random.choice(species_list)
        age_months = random.randint(1, 180)
        
        # Correlate risk factors slightly for realism
        has_symptoms = random.random() > 0.4
        
        if has_symptoms:
            symptoms = random.choice(symptoms_list[1:])
            severity = random.choice(severity_list[1:])
            symptom_count = random.randint(1, 3)
            risk_score = np.random.beta(5, 2) # Skew towards higher risk
        else:
            symptoms = 'none'
            severity = 'none'
            symptom_count = 0
            risk_score = np.random.beta(1, 5) # Skew towards lower risk

        # Normalize risk score to 0-1 strictly
        risk_score = max(0.0, min(1.0, risk_score))

        record = {
            'record_id': str(uuid.uuid4()),
            'pet_id': str(uuid.uuid4()),
            'species': species,
            'breed': 'Unknown', # Simplified
            'age_months': age_months,
            'weight_kg': random.uniform(2, 40),
            'gender': random.choice(['male', 'female', 'unknown']),
            'is_senior': age_months > 96,
            'is_young': age_months < 12,
            'temperature_c': random.normalvariate(38.5, 0.5),
            'heart_rate_bpm': random.randint(60, 140),
            'respiratory_rate_bpm': random.randint(15, 40),
            'symptoms_present': symptoms,
            'symptom_count': symptom_count,
            'max_symptom_severity': severity,
            'symptom_duration': random.choice(duration_list),
            'appetite_level': random.choice(appetite_list),
            'energy_level': random.choice(energy_list),
            'hydration_normal': random.choice([True, False]),
            'gait_normal': random.choice([True, False]),
            'coat_condition': random.choice(coat_list),
            'risk_score': risk_score 
        }
        data.append(record)

    df = pd.DataFrame(data)
    
    # Save with timestamp to match training script expectation
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"pet_health_dataset_{timestamp}.csv"
    df.to_csv(filename, index=False)
    print(f"Dataset saved: {filename}")

if __name__ == "__main__":
    generate_synthetic_data()