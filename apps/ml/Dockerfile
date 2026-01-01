FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- CRITICAL FIXES ---
# 1. Copy the main app and the logic folders
COPY app.py .
COPY inference/ ./inference/
COPY train/ ./train/
COPY models/ ./models/

# 2. Set Python path so it can find the 'inference' package
ENV PYTHONPATH=/app

# Expose the Flask port
EXPOSE 5000

# Run the Flask server (app.py), which handles the API
CMD ["python", "app.py"]