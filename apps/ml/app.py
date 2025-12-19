#!/usr/bin/env python3
"""
Pet Health ML API Server
Flask REST API for pet health risk assessment.
"""

import os
import logging
from datetime import datetime

from flask import Flask, request, jsonify
from inference.inference_service import PetHealthInferenceService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Initialize inference service
inference_service = PetHealthInferenceService()

# Initialize on startup (Flask 3.0+ way)
def initialize_service():
    """Initialize the inference service on startup."""
    logger.info("Initializing Pet Health ML Inference Service...")
    
    if not inference_service.load_latest_model():
        logger.error("Failed to load model artifacts")
        raise RuntimeError("Service initialization failed")
    
    logger.info("Service initialized successfully")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'pet-health-ml-inference',
        'model_loaded': inference_service.is_ready(),
        'model_version': inference_service.model_version,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint."""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Empty request body'}), 400
        
        # Check service readiness
        if not inference_service.is_ready():
            return jsonify({'error': 'Service not ready'}), 503
        
        # Make prediction
        result = inference_service.predict(data)
        
        return jsonify(result), 200
        
    except ValueError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({'error': str(e)}), 400
    
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return jsonify({'error': 'Internal service error'}), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information."""
    if not inference_service.is_ready():
        return jsonify({'error': 'Model not loaded'}), 503
    
    info = inference_service.get_model_info()
    return jsonify(info)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

def main():
    """Run the Flask API server."""
    # Configuration from environment
    host = os.getenv('INFERENCE_HOST', '0.0.0.0')
    port = int(os.getenv('INFERENCE_PORT', 5000))
    debug = os.getenv('INFERENCE_DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting Pet Health ML API Server on {host}:{port}")
    
    # Initialize service before starting server
    initialize_service()
    
    # Start Flask app
    app.run(host=host, port=port, debug=debug)
    
    return 0

if __name__ == '__main__':
    exit(main())