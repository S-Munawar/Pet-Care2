"""
Pet Health ML Inference Service
Core inference logic for pet health risk assessment.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

import joblib
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class PetHealthInferenceService:
    """Production ML inference service for pet health risk assessment."""
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.model = None
        self.target_encoder = None
        self.metadata = None
        self.feature_names = None
        self.model_version = None
        
        # Safety constraints
        self.ALLOWED_RISK_CATEGORIES = ['Low', 'Medium', 'High', 'Critical']
        self.HIGH_RISK_THRESHOLD = 0.5
        
    def load_latest_model(self) -> bool:
        """Load the latest trained model artifacts."""
        try:
            # Find latest model files
            model_files = list(self.models_dir.glob("pet_health_model_*.joblib"))
            if not model_files:
                logger.error("No model files found in models directory")
                return False
            
            latest_model_file = max(model_files, key=lambda x: x.stat().st_mtime)
            timestamp = latest_model_file.stem.split('_')[-2] + '_' + latest_model_file.stem.split('_')[-1]
            
            # Load model artifacts
            model_path = latest_model_file
            metadata_path = self.models_dir / f"model_metadata_{timestamp}.json"
            encoder_path = self.models_dir / f"target_encoder_{timestamp}.joblib"
            
            # Validate all required files exist
            required_files = [model_path, metadata_path, encoder_path]
            for file_path in required_files:
                if not file_path.exists():
                    logger.error(f"Required artifact missing: {file_path}")
                    return False
            
            # Load artifacts
            self.model = joblib.load(model_path)
            self.target_encoder = joblib.load(encoder_path)
            
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            self.feature_names = self.metadata['feature_names']
            self.model_version = timestamp
            
            logger.info(f"Model loaded successfully: version {self.model_version}")
            logger.info(f"Features: {len(self.feature_names)}")
            logger.info(f"Target classes: {self.metadata['target_classes']}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return False
    
    def validate_input(self, data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate input data for safety and completeness."""
        try:
            # Check required fields
            required_fields = ['species', 'symptoms_present', 'symptom_count']
            for field in required_fields:
                if field not in data:
                    return False, f"Missing required field: {field}"
            
            # Validate species
            valid_species = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']
            if data['species'] not in valid_species:
                return False, f"Invalid species: {data['species']}"
            
            # Validate numeric ranges
            numeric_validations = {
                'age_months': (0, 300),
                'weight_kg': (0, 200),
                'temperature_c': (30, 45),
                'heart_rate_bpm': (10, 1000),
                'respiratory_rate_bpm': (5, 200),
                'symptom_count': (0, 20)
            }
            
            for field, (min_val, max_val) in numeric_validations.items():
                if field in data:
                    try:
                        value = float(data[field])
                        if not (min_val <= value <= max_val):
                            return False, f"Invalid {field}: {value} (must be {min_val}-{max_val})"
                    except (ValueError, TypeError):
                        return False, f"Invalid {field}: must be numeric"
            
            # Validate categorical fields
            categorical_validations = {
                'gender': ['male', 'female', 'unknown'],
                'max_symptom_severity': ['none', 'mild', 'moderate', 'severe'],
                'symptom_duration': ['none', 'less-than-day', '1-3-days', '4-7-days', 'more-than-week'],
                'appetite_level': ['normal', 'increased', 'decreased', 'none'],
                'energy_level': ['normal', 'high', 'low', 'lethargic'],
                'coat_condition': ['good', 'fair', 'poor']
            }
            
            for field, valid_values in categorical_validations.items():
                if field in data and data[field] not in valid_values:
                    return False, f"Invalid {field}: {data[field]}"
            
            # Validate boolean fields
            boolean_fields = ['is_senior', 'is_young', 'hydration_normal', 'gait_normal']
            for field in boolean_fields:
                if field in data and not isinstance(data[field], bool):
                    return False, f"Invalid {field}: must be boolean"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Input validation error: {str(e)}")
            return False, "Input validation failed"
    
    def preprocess_input(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess input data for model inference."""
        # Create DataFrame with all required features
        df_data = {}
        
        # Fill in all expected features
        for feature in self.feature_names:
            if feature in data:
                df_data[feature] = data[feature]
            else:
                df_data[feature] = None
        
        df = pd.DataFrame([df_data])
        
        # Handle missing values (same as training)
        df = df.fillna({
            'breed': 'Unknown',
            'gender': 'unknown',
            'symptoms_present': 'none',
            'max_symptom_severity': 'none',
            'symptom_duration': 'none',
            'appetite_level': 'normal',
            'energy_level': 'normal',
            'coat_condition': 'good'
        })
        
        # Fill numeric columns with conservative defaults
        numeric_defaults = {
            'age_months': 24,
            'weight_kg': 5,
            'temperature_c': 38.5,
            'heart_rate_bpm': 120,
            'respiratory_rate_bpm': 25,
            'symptom_count': 0
        }
        
        for col, default_val in numeric_defaults.items():
            if col in df.columns:
                df[col] = df[col].fillna(default_val)
        
        # Fill boolean columns with safe defaults
        boolean_defaults = {
            'is_senior': False,
            'is_young': False,
            'hydration_normal': True,
            'gait_normal': True
        }
        
        for col, default_val in boolean_defaults.items():
            if col in df.columns:
                df[col] = df[col].fillna(default_val)
        
        return df
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform safe ML inference."""
        try:
            # Validate input
            is_valid, error_msg = self.validate_input(data)
            if not is_valid:
                raise ValueError(f"Input validation failed: {error_msg}")
            
            # Preprocess input
            df = self.preprocess_input(data)
            
            # Make prediction
            prediction = self.model.predict(df)[0]
            probabilities = self.model.predict_proba(df)[0]
            
            # Convert prediction to risk category
            risk_category = self.target_encoder.inverse_transform([prediction])[0]
            
            # Ensure risk category is valid (safety check)
            if risk_category not in self.ALLOWED_RISK_CATEGORIES:
                logger.warning(f"Invalid risk category predicted: {risk_category}")
                risk_category = 'Medium'
            
            # Create probability distribution
            prob_dict = {
                class_name: float(prob) 
                for class_name, prob in zip(self.target_encoder.classes_, probabilities)
            }
            
            # Calculate confidence
            confidence = float(max(probabilities))
            
            # Safety flags
            is_high_risk = risk_category in ['High', 'Critical']
            requires_attention = confidence > self.HIGH_RISK_THRESHOLD and is_high_risk
            
            # Construct safe response
            response = {
                'risk_assessment': {
                    'category': risk_category,
                    'confidence': round(confidence, 3),
                    'probability_distribution': {k: round(v, 3) for k, v in prob_dict.items()}
                },
                'flags': {
                    'high_risk': is_high_risk,
                    'requires_attention': requires_attention,
                    'confidence_threshold_met': confidence > 0.7
                },
                'metadata': {
                    'model_version': self.model_version,
                    'prediction_timestamp': datetime.utcnow().isoformat(),
                    'service_version': '1.0.0'
                },
                'safety_notice': 'This is a risk assessment only. Consult a veterinarian for medical advice.'
            }
            
            # Log prediction for monitoring
            logger.info(f"Prediction made: {risk_category} (confidence: {confidence:.3f})")
            
            return response
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        if self.model is None:
            return None
        
        return {
            'model_version': self.model_version,
            'feature_count': len(self.feature_names),
            'target_classes': self.metadata['target_classes'],
            'model_type': self.metadata['model_type'],
            'performance_metrics': self.metadata.get('performance_metrics', {})
        }
    
    def is_ready(self) -> bool:
        """Check if the service is ready to serve predictions."""
        return self.model is not None