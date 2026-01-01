FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- FIX STARTS HERE ---
# 1. Copy the main Flask app
COPY app.py .

# 2. Copy the inference module (preserve directory structure)
COPY inference/ ./inference/

# 3. Copy models
COPY models/ ./models/
# --- FIX ENDS HERE ---

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash inference
RUN chown -R inference:inference /app
USER inference

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the service
CMD ["python", "inference_service.py"]