#!/usr/bin/env python3
"""
Pet Health Risk Assessment ML Training Pipeline
Trains models to predict health risk levels from pet health observations.
"""

import pandas as pd
import numpy as np
import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Any, List
import warnings
warnings.filterwarnings('ignore')

# ML imports
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

class PetHealthMLPipeline:
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.models = {}
        self.preprocessor = None
        self.feature_names = None
        self.target_encoder = None
        
    def load_and_validate_data(self, data_path: str) -> pd.DataFrame:
        """Load dataset and perform validation checks."""
        print("Loading dataset...")
        df = pd.read_csv(data_path)
        
        print(f"Dataset shape: {df.shape}")
        print(f"Unique pets: {df['pet_id'].nunique()}")
        
        # Validation checks
        assert not df['risk_score'].isnull().any(), "Risk scores contain null values"
        assert df['risk_score'].between(0, 1).all(), "Risk scores not in [0,1] range"
        assert not df['species'].isnull().any(), "Species contains null values"
        
        # Check for data leakage - remove any direct risk indicators
        leakage_cols = ['risk_category', 'recommendation']
        available_leakage = [col for col in leakage_cols if col in df.columns]
        if available_leakage:
            print(f"Removing potential leakage columns: {available_leakage}")
            df = df.drop(columns=available_leakage)
        
        print("Dataset validation passed")
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features and target variables."""
        # Define feature columns (exclude identifiers and targets)
        exclude_cols = ['record_id', 'pet_id', 'risk_score', 'risk_category', 'recommendation']
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        X = df[feature_cols].copy()
        
        # Create risk category from risk_score for classification
        y = pd.cut(df['risk_score'], 
                  bins=[0, 0.25, 0.5, 0.75, 1.0],
                  labels=['Low', 'Medium', 'High', 'Critical'],
                  include_lowest=True)
        
        # Handle missing values
        X = X.fillna({
            'breed': 'Unknown',
            'gender': 'unknown',
            'symptoms_present': 'none',
            'max_symptom_severity': 'none',
            'symptom_duration': 'none'
        })
        
        # Fill numeric columns with median
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].median())
        
        self.feature_names = feature_cols
        print(f"Features prepared: {len(feature_cols)} columns")
        print(f"Target distribution:\n{y.value_counts()}")
        
        return X, y
    
    def create_preprocessor(self, X: pd.DataFrame) -> ColumnTransformer:
        """Create preprocessing pipeline."""
        # Identify column types
        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
        categorical_features = X.select_dtypes(include=['object', 'bool']).columns.tolist()
        
        # Remove boolean columns from categorical (handle separately)
        bool_features = X.select_dtypes(include=['bool']).columns.tolist()
        categorical_features = [col for col in categorical_features if col not in bool_features]
        
        print(f"Numeric features: {len(numeric_features)}")
        print(f"Categorical features: {len(categorical_features)}")
        print(f"Boolean features: {len(bool_features)}")
        
        # Create preprocessing steps
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_features),
                ('bool', 'passthrough', bool_features)
            ],
            remainder='drop'
        )
        
        return preprocessor
    
    def train_models(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Train multiple models and compare performance."""
        # Split data
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.4, random_state=self.random_state, stratify=y
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=self.random_state, stratify=y_temp
        )
        
        print(f"Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}")
        
        # Create preprocessor
        self.preprocessor = self.create_preprocessor(X_train)
        
        # Encode target labels
        self.target_encoder = LabelEncoder()
        y_train_encoded = self.target_encoder.fit_transform(y_train)
        y_val_encoded = self.target_encoder.transform(y_val)
        y_test_encoded = self.target_encoder.transform(y_test)
        
        # Define models
        models_config = {
            'logistic_regression': LogisticRegression(
                random_state=self.random_state,
                max_iter=1000,
                class_weight='balanced'
            ),
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                random_state=self.random_state,
                class_weight='balanced',
                max_depth=10
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=100,
                random_state=self.random_state,
                max_depth=6,
                learning_rate=0.1
            )
        }
        
        results = {}
        
        for name, model in models_config.items():
            print(f"\nTraining {name}...")
            
            # Create pipeline
            pipeline = Pipeline([
                ('preprocessor', self.preprocessor),
                ('classifier', model)
            ])
            
            # Train model
            pipeline.fit(X_train, y_train_encoded)
            
            # Evaluate
            train_score = pipeline.score(X_train, y_train_encoded)
            val_score = pipeline.score(X_val, y_val_encoded)
            test_score = pipeline.score(X_test, y_test_encoded)
            
            # Predictions for detailed metrics
            y_pred = pipeline.predict(X_test)
            y_pred_proba = pipeline.predict_proba(X_test)
            
            # Calculate metrics
            test_accuracy = accuracy_score(y_test_encoded, y_pred)
            
            # Multi-class AUC (one-vs-rest)
            try:
                auc_score = roc_auc_score(y_test_encoded, y_pred_proba, multi_class='ovr')
            except:
                auc_score = None
            
            results[name] = {
                'pipeline': pipeline,
                'train_score': train_score,
                'val_score': val_score,
                'test_score': test_score,
                'test_accuracy': test_accuracy,
                'auc_score': auc_score,
                'predictions': y_pred,
                'probabilities': y_pred_proba,
                'classification_report': classification_report(
                    y_test_encoded, y_pred, 
                    target_names=self.target_encoder.classes_,
                    output_dict=True
                )
            }
            
            print(f"Train: {train_score:.3f}, Val: {val_score:.3f}, Test: {test_score:.3f}")
            if auc_score:
                print(f"AUC: {auc_score:.3f}")
        
        # Store test data for final evaluation
        self.test_data = {
            'X_test': X_test,
            'y_test': y_test,
            'y_test_encoded': y_test_encoded
        }
        
        return results
    
    def select_best_model(self, results: Dict[str, Any]) -> str:
        """Select best model based on validation performance and safety."""
        # Prioritize models with good validation performance
        # and good performance on high-risk categories (safety)
        
        best_model = None
        best_score = -1
        
        for name, result in results.items():
            # Get classification report
            report = result['classification_report']
            
            # Calculate weighted score favoring high-risk detection
            val_score = result['val_score']
            
            # Bonus for high-risk category performance (Critical and High)
            high_risk_bonus = 0
            if 'Critical' in report:
                high_risk_bonus += report['Critical'].get('recall', 0) * 0.3
            if 'High' in report:
                high_risk_bonus += report['High'].get('recall', 0) * 0.2
            
            combined_score = val_score + high_risk_bonus
            
            print(f"{name}: Val={val_score:.3f}, High-risk bonus={high_risk_bonus:.3f}, Combined={combined_score:.3f}")
            
            if combined_score > best_score:
                best_score = combined_score
                best_model = name
        
        print(f"\nBest model: {best_model}")
        return best_model
    
    def analyze_feature_importance(self, model_name: str, pipeline: Pipeline) -> Dict[str, float]:
        """Extract and analyze feature importance."""
        model = pipeline.named_steps['classifier']
        
        # Get feature names after preprocessing
        preprocessor = pipeline.named_steps['preprocessor']
        
        # Get feature names from preprocessor
        feature_names = []
        
        # Numeric features
        num_features = preprocessor.named_transformers_['num']
        if hasattr(num_features, 'feature_names_in_'):
            feature_names.extend(num_features.feature_names_in_)
        else:
            # Get from the original numeric columns
            numeric_cols = [col for col in self.feature_names if col in preprocessor.named_transformers_['num'].feature_names_in_]
            feature_names.extend(numeric_cols)
        
        # Categorical features (one-hot encoded)
        cat_encoder = preprocessor.named_transformers_['cat']
        if hasattr(cat_encoder, 'get_feature_names_out'):
            feature_names.extend(cat_encoder.get_feature_names_out())
        
        # Boolean features
        bool_cols = preprocessor.named_transformers_['bool']
        if bool_cols != 'drop' and hasattr(preprocessor, 'feature_names_in_'):
            bool_features = [col for col in self.feature_names if col in preprocessor.transformers_[2][2]]
            feature_names.extend(bool_features)
        
        # Get importance scores
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            # For logistic regression, use absolute values of coefficients
            importances = np.abs(model.coef_[0]) if len(model.coef_.shape) == 2 else np.abs(model.coef_)
        else:
            print(f"Cannot extract feature importance for {model_name}")
            return {}
        
        # Create importance dictionary
        if len(feature_names) == len(importances):
            importance_dict = dict(zip(feature_names, importances))
        else:
            # Fallback: use generic names
            importance_dict = {f'feature_{i}': imp for i, imp in enumerate(importances)}
        
        # Sort by importance
        importance_dict = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
        
        return importance_dict
    
    def save_model_artifacts(self, best_model_name: str, results: Dict[str, Any], 
                           feature_importance: Dict[str, float], output_dir: str = "models"):
        """Save trained model and artifacts."""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save best model pipeline
        best_pipeline = results[best_model_name]['pipeline']
        model_path = output_path / f"pet_health_model_{timestamp}.joblib"
        joblib.dump(best_pipeline, model_path)
        print(f"Model saved: {model_path}")
        
        # Save target encoder
        encoder_path = output_path / f"target_encoder_{timestamp}.joblib"
        joblib.dump(self.target_encoder, encoder_path)
        print(f"Target encoder saved: {encoder_path}")
        
        # Save model metadata
        metadata = {
            'model_type': best_model_name,
            'timestamp': timestamp,
            'feature_names': self.feature_names,
            'target_classes': self.target_encoder.classes_.tolist(),
            'model_path': str(model_path),
            'encoder_path': str(encoder_path),
            'performance_metrics': {
                'train_score': results[best_model_name]['train_score'],
                'val_score': results[best_model_name]['val_score'],
                'test_score': results[best_model_name]['test_score'],
                'auc_score': results[best_model_name]['auc_score']
            },
            'feature_importance': feature_importance
        }
        
        metadata_path = output_path / f"model_metadata_{timestamp}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        print(f"Metadata saved: {metadata_path}")
        
        # Save detailed evaluation report
        evaluation = {
            'model_comparison': {
                name: {
                    'val_score': result['val_score'],
                    'test_score': result['test_score'],
                    'auc_score': result['auc_score']
                }
                for name, result in results.items()
            },
            'best_model_report': results[best_model_name]['classification_report'],
            'feature_importance_top10': dict(list(feature_importance.items())[:10])
        }
        
        eval_path = output_path / f"evaluation_report_{timestamp}.json"
        with open(eval_path, 'w') as f:
            json.dump(evaluation, f, indent=2, default=str)
        print(f"Evaluation report saved: {eval_path}")
        
        return {
            'model_path': model_path,
            'metadata_path': metadata_path,
            'evaluation_path': eval_path
        }

class PetHealthPredictor:
    """Production-ready inference interface."""
    
    def __init__(self, model_path: str, metadata_path: str):
        self.model = joblib.load(model_path)
        
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.target_encoder = joblib.load(self.metadata['encoder_path'])
        self.feature_names = self.metadata['feature_names']
    
    def predict_risk(self, pet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict health risk for a single pet observation."""
        # Convert to DataFrame
        df = pd.DataFrame([pet_data])
        
        # Ensure all required features are present
        for feature in self.feature_names:
            if feature not in df.columns:
                df[feature] = None
        
        # Select and order features
        df = df[self.feature_names]
        
        # Handle missing values (same as training)
        df = df.fillna({
            'breed': 'Unknown',
            'gender': 'unknown',
            'symptoms_present': 'none',
            'max_symptom_severity': 'none',
            'symptom_duration': 'none'
        })
        
        # Fill numeric columns with 0 (conservative)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(0)
        
        # Make prediction
        prediction = self.model.predict(df)[0]
        probabilities = self.model.predict_proba(df)[0]
        
        # Convert back to labels
        risk_category = self.target_encoder.inverse_transform([prediction])[0]
        
        # Create probability distribution
        prob_dict = {
            class_name: float(prob) 
            for class_name, prob in zip(self.target_encoder.classes_, probabilities)
        }
        
        # Calculate confidence (max probability)
        confidence = float(max(probabilities))
        
        return {
            'risk_category': risk_category,
            'confidence': confidence,
            'probability_distribution': prob_dict,
            'model_version': self.metadata['timestamp']
        }

def main():
    # Initialize pipeline
    pipeline = PetHealthMLPipeline(random_state=42)
    
    # Find the latest dataset
    data_files = list(Path("./").glob("pet_health_dataset_*.csv"))
    if not data_files:
        raise FileNotFoundError("No dataset files found. Run generate_pet_health_dataset.py first.")
    
    latest_dataset = max(data_files, key=lambda x: x.stat().st_mtime)
    print(f"Using dataset: {latest_dataset}")
    
    # Load and prepare data
    df = pipeline.load_and_validate_data(str(latest_dataset))
    X, y = pipeline.prepare_features(df)
    
    # Train models
    results = pipeline.train_models(X, y)
    
    # Select best model
    best_model_name = pipeline.select_best_model(results)
    
    # Analyze feature importance
    feature_importance = pipeline.analyze_feature_importance(
        best_model_name, results[best_model_name]['pipeline']
    )
    
    print(f"\nTop 10 Important Features:")
    for feature, importance in list(feature_importance.items())[:10]:
        print(f"  {feature}: {importance:.4f}")
    
    # Save artifacts
    artifacts = pipeline.save_model_artifacts(best_model_name, results, feature_importance)
    
    print(f"\nTraining completed successfully!")
    print(f"Best model: {best_model_name}")
    print(f"Model artifacts saved in: models/")
    
    # Demonstrate inference
    print(f"\nTesting inference interface...")
    predictor = PetHealthPredictor(
        str(artifacts['model_path']), 
        str(artifacts['metadata_path'])
    )
    
    # Test prediction with sample data
    sample_data = {
        'species': 'dog',
        'breed': 'Labrador Retriever',
        'age_months': 24,
        'weight_kg': 25.0,
        'gender': 'male',
        'is_senior': False,
        'is_young': False,
        'temperature_c': 38.5,
        'heart_rate_bpm': 100,
        'respiratory_rate_bpm': 20,
        'symptoms_present': 'digestive_vomiting',
        'symptom_count': 1,
        'max_symptom_severity': 'mild',
        'symptom_duration': '1-3-days',
        'appetite_level': 'decreased',
        'energy_level': 'low',
        'hydration_normal': True,
        'gait_normal': True,
        'coat_condition': 'good'
    }
    
    prediction = predictor.predict_risk(sample_data)
    print(f"Sample prediction: {prediction}")

if __name__ == "__main__":
    main()