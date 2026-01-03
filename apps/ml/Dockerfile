FROM python:3.11-slim

WORKDIR /app

# 1. Install System Deps
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python Deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy Source Code
COPY app.py .
COPY inference/ ./inference/
COPY train/ ./train/

# --- THE FIX: Train the Model during the Build ---
# Instead of copying existing models, we generate them right here.
WORKDIR /app/train
RUN python generate_pet_health_dataset.py
RUN python train_pet_health_model.py

# Move the newly created models to the correct folder
RUN mkdir -p /app/models && mv models/* /app/models/

# 4. Final Setup
WORKDIR /app
ENV PYTHONPATH=/app
EXPOSE 5000

CMD ["python", "app.py"]