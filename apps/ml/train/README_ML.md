# Pet Health ML Training Pipeline

## Overview
Complete machine learning pipeline for training pet health risk assessment models using synthetic data.

## Features
- **Multi-model comparison** (Logistic Regression, Random Forest, Gradient Boosting)
- **Safety-focused evaluation** prioritizing high-risk detection
- **Feature importance analysis** for explainability
- **Production-ready inference** interface
- **Model versioning** and artifact management

## Usage

### Training Models
```bash
python train_pet_health_model.py
```

### Requirements
```bash
pip install -r requirements.txt
```

## Pipeline Phases

### Phase 1: Dataset Loading & Validation
- Loads generated synthetic dataset
- Validates data quality and ranges
- Removes potential data leakage columns
- Handles missing values safely

### Phase 2: Feature Engineering
- Separates numeric, categorical, and boolean features
- Applies StandardScaler to numeric features
- One-hot encodes categorical variables
- Preserves boolean features as-is

### Phase 3: Model Selection & Training
- **Baseline**: Logistic Regression with L2 regularization
- **Ensemble**: Random Forest with balanced class weights
- **Boosting**: Gradient Boosting with controlled complexity
- Cross-validation for robust evaluation

### Phase 4: Safety-Focused Evaluation
- Prioritizes high-risk category detection (recall)
- Uses stratified train/validation/test splits
- Calculates comprehensive metrics (accuracy, AUC, classification report)
- Weighted scoring favoring critical/high-risk performance

### Phase 5: Explainability
- Feature importance extraction for all models
- Coefficient analysis for linear models
- Top feature ranking for interpretability

### Phase 6: Model Artifacts
- Serialized model pipelines (joblib)
- Target label encoders
- Preprocessing transformers
- Versioned metadata with timestamps

### Phase 7: Inference Interface
- `PetHealthPredictor` class for production use
- Structured input/output format
- Confidence scores and probability distributions
- Model version tracking

## Model Output Format

```python
{
    'risk_category': 'Medium',  # Low/Medium/High/Critical
    'confidence': 0.85,         # Max probability (0-1)
    'probability_distribution': {
        'Low': 0.05,
        'Medium': 0.85,
        'High': 0.08,
        'Critical': 0.02
    },
    'model_version': '20231219_143022'
}
```

## Safety Constraints
- **No medical diagnoses** - only risk assessment
- **No treatment recommendations** - only monitoring guidance
- **Conservative missing value handling** - defaults to safe values
- **High-risk bias** - optimized to catch critical cases

## Files Generated
- `models/pet_health_model_TIMESTAMP.joblib` - Trained model pipeline
- `models/target_encoder_TIMESTAMP.joblib` - Label encoder
- `models/model_metadata_TIMESTAMP.json` - Model configuration and metrics
- `models/evaluation_report_TIMESTAMP.json` - Detailed performance analysis

## Integration Example

```python
from train_pet_health_model import PetHealthPredictor

# Load trained model
predictor = PetHealthPredictor(
    'models/pet_health_model_20231219_143022.joblib',
    'models/model_metadata_20231219_143022.json'
)

# Make prediction
pet_data = {
    'species': 'dog',
    'breed': 'Labrador Retriever',
    'age_months': 24,
    'symptoms_present': 'digestive_vomiting',
    'symptom_count': 1,
    'temperature_c': 38.5,
    # ... other features
}

result = predictor.predict_risk(pet_data)
print(f"Risk: {result['risk_category']} (confidence: {result['confidence']:.2f})")
```