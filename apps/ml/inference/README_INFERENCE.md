# Pet Health ML Inference Service

## Overview
Production-ready ML inference service for pet health risk assessment. Loads trained model artifacts and provides safe, structured predictions via REST API.

## Features
- **Stateless inference** - no training or model fitting
- **Automatic model loading** - uses latest trained artifacts
- **Input validation** - comprehensive safety checks
- **Structured outputs** - machine-readable responses
- **Safety guardrails** - no diagnoses, only risk assessment
- **Production ready** - logging, error handling, containerized

## Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start service
python inference_service.py

# Test service
python test_inference.py
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t pet-health-ml-inference .
docker run -p 5000:5000 pet-health-ml-inference
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service status and model information.

### Prediction
```bash
POST /predict
Content-Type: application/json

{
  "species": "dog",
  "symptoms_present": "digestive_vomiting",
  "symptom_count": 1,
  "temperature_c": 38.5,
  "age_months": 24
}
```

### Model Information
```bash
GET /model/info
```
Returns loaded model metadata and performance metrics.

## Input Schema

### Required Fields
- `species`: Pet species (dog, cat, bird, rabbit, hamster, fish, reptile, other)
- `symptoms_present`: Symptoms description or "none"
- `symptom_count`: Number of symptoms (0-20)

### Optional Fields
- `breed`: Pet breed
- `age_months`: Age in months (0-300)
- `weight_kg`: Weight in kilograms (0-200)
- `gender`: male/female/unknown
- `temperature_c`: Body temperature (30-45°C)
- `heart_rate_bpm`: Heart rate (10-1000 bpm)
- `respiratory_rate_bpm`: Respiratory rate (5-200 bpm)
- `max_symptom_severity`: none/mild/moderate/severe
- `symptom_duration`: Duration category
- `appetite_level`: normal/increased/decreased/none
- `energy_level`: normal/high/low/lethargic
- `hydration_normal`: Boolean
- `gait_normal`: Boolean
- `coat_condition`: good/fair/poor
- `is_senior`: Boolean
- `is_young`: Boolean

## Output Schema

```json
{
  "risk_assessment": {
    "category": "Medium",
    "confidence": 0.847,
    "probability_distribution": {
      "Low": 0.123,
      "Medium": 0.847,
      "High": 0.028,
      "Critical": 0.002
    }
  },
  "flags": {
    "high_risk": false,
    "requires_attention": false,
    "confidence_threshold_met": true
  },
  "metadata": {
    "model_version": "20231219_143022",
    "prediction_timestamp": "2023-12-19T14:30:22.123456",
    "service_version": "1.0.0"
  },
  "safety_notice": "This is a risk assessment only. Consult a veterinarian for medical advice."
}
```

## Safety Features

### Input Validation
- **Range checks** for all numeric values
- **Categorical validation** for enum fields
- **Required field enforcement**
- **Type validation** for all inputs

### Output Safety
- **No medical diagnoses** - only risk categories
- **No treatment advice** - assessment only
- **Conservative defaults** for missing values
- **Confidence scoring** for uncertainty awareness
- **Safety notices** in all responses

### Error Handling
- **Graceful degradation** for invalid inputs
- **Structured error responses**
- **No internal details exposed**
- **Comprehensive logging**

## Configuration

### Environment Variables
- `INFERENCE_HOST`: Service host (default: 0.0.0.0)
- `INFERENCE_PORT`: Service port (default: 5000)
- `INFERENCE_DEBUG`: Debug mode (default: false)
- `MODELS_DIR`: Model artifacts directory (default: models)

### Model Loading
Service automatically loads the latest model artifacts from the `models/` directory:
- `pet_health_model_TIMESTAMP.joblib`
- `model_metadata_TIMESTAMP.json`
- `target_encoder_TIMESTAMP.joblib`

## Testing

### Automated Tests
```bash
# Run comprehensive test suite
python test_inference.py
```

### Manual Testing
```bash
# Health check
curl http://localhost:5000/health

# Sample prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "species": "dog",
    "symptoms_present": "none",
    "symptom_count": 0
  }'
```

## Deployment

### Production Checklist
- [ ] Model artifacts present in `models/` directory
- [ ] Environment variables configured
- [ ] Health checks passing
- [ ] Logging configured
- [ ] Resource limits set
- [ ] Security scanning completed

### Monitoring
- Monitor `/health` endpoint for service status
- Track prediction latency and error rates
- Monitor model confidence distributions
- Alert on high-risk prediction patterns

## Integration

### Backend Integration
```javascript
// Express.js example
const response = await fetch('http://ml-service:5000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(petHealthData)
});

const prediction = await response.json();
console.log(`Risk: ${prediction.risk_assessment.category}`);
```

### Error Handling
```javascript
if (!response.ok) {
  const error = await response.json();
  console.error('Prediction failed:', error.error);
}
```

## Security

### Input Sanitization
- All inputs validated before processing
- No code execution from user input
- Safe default values for missing data

### Output Safety
- No sensitive information exposed
- Structured, predictable responses
- Safety notices included

### Container Security
- Non-root user execution
- Minimal base image
- Read-only model artifacts
- Health check monitoring