# 🐾 Pet Health ML Service

The **Pet Health ML Service** is the machine learning component of the Pet Care application.  
It is responsible for generating synthetic pet health data, training risk assessment models, and serving predictions via a REST API.

---

## 📂 Directory Structure

```
apps/ml/
├── train/
│   ├── generate_pet_health_dataset.py
│   ├── train_pet_health_model.py
│   └── *.csv
├── inference/
│   └── predictor.py
├── models/                      # Created at runtime
│   ├── model.joblib
│   └── metadata.json
├── app.py
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start Guide

**Prerequisite:**  
Ensure you are inside the `apps/ml` directory before running commands.

---

### Step 1: Install Dependencies

If running locally (without Docker):

```bash
pip install -r requirements.txt
```

---

### Step 2: Generate Training Data

Generate a synthetic dataset before training.

```bash
cd train
python generate_pet_health_dataset.py
```

This creates a CSV file (for example `pet_health_dataset_2023_XX_XX.csv`) in the `train/` directory.

---

### Step 3: Train the Model

Run the training pipeline:

```bash
python train_pet_health_model.py
```

After training completes, a `models/` directory is created inside `train/`.

Move it one level up so the API can access it:

```bash
mv models ../
cd ..
```

Final required location:

```
apps/ml/models/
```

---

### Step 4: Start the Server

#### Option A: Using Docker (Recommended)

```bash
docker compose up --build
```

Service will be available at:

```
http://localhost:5000
```

#### Option B: Running Locally

```bash
python app.py
```

---

## 🔄 Training & Inference Flow

```
Generate Synthetic Data
        ↓
Train ML Model
        ↓
Save Model Artifacts (models/)
        ↓
Load Model at API Startup
        ↓
Receive /predict Requests
        ↓
Return Risk Assessment
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|------|--------|-------------|
| GET | `/health` | Returns service status and model version |
| GET | `/model/info` | Returns model metadata and metrics |
| POST | `/predict` | Returns a pet health risk assessment |

---

### Example Prediction Request

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "species": "dog",
    "symptoms_present": "digestive_vomiting",
    "symptom_count": 1,
    "temperature_c": 38.5,
    "age_months": 24
  }'
```

---

### Example Prediction Response

```json
{
  "risk_level": "medium",
  "risk_score": 0.63,
  "model_version": "v1.0.0"
}
```

---

## 🛠️ Configuration

Environment variables:

| Variable | Default | Description |
|--------|--------|-------------|
| INFERENCE_HOST | 0.0.0.0 | Server host |
| INFERENCE_PORT | 5000 | Server port |
| INFERENCE_DEBUG | false | Flask debug mode |
| MODELS_DIR | models | Model artifacts directory |

---

## ⚠️ Troubleshooting

### RuntimeError: No model files found

**Cause:**  
`models/` directory is missing or empty.

**Fix:**  
Run the training pipeline and ensure the directory exists at:

```
apps/ml/models/
```

---

### FileNotFoundError: No dataset files found

**Cause:**  
Training dataset was not generated.

**Fix:**

```bash
cd train
python generate_pet_health_dataset.py
```

---

### docker-compose command not found

**Cause:**  
Using a newer Docker version.

**Fix:**

```bash
docker compose up --build
```

---

## 🔁 Model Lifecycle Notes

- Models are loaded once at service startup
- Restart the API after retraining
- Retraining overwrites existing models unless versioned

---

🐶🐱 Happy modeling and healthy pets!
