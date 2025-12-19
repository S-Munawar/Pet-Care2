#!/usr/bin/env python3
"""
Test suite for Pet Health ML Inference Service
"""

import json
import requests
import time
from typing import Dict, Any

class InferenceServiceTester:
    """Test suite for the inference service."""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        
    def test_health_check(self) -> bool:
        """Test service health endpoint."""
        try:
            response = requests.get(f"{self.base_url}/health")
            return response.status_code == 200 and response.json().get('status') == 'healthy'
        except:
            return False
    
    def test_valid_prediction(self) -> Dict[str, Any]:
        """Test valid prediction request."""
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
        
        response = requests.post(
            f"{self.base_url}/predict",
            json=sample_data,
            headers={'Content-Type': 'application/json'}
        )
        
        return {
            'status_code': response.status_code,
            'response': response.json() if response.status_code == 200 else response.text
        }
    
    def test_minimal_input(self) -> Dict[str, Any]:
        """Test prediction with minimal required fields."""
        minimal_data = {
            'species': 'cat',
            'symptoms_present': 'none',
            'symptom_count': 0
        }
        
        response = requests.post(
            f"{self.base_url}/predict",
            json=minimal_data,
            headers={'Content-Type': 'application/json'}
        )
        
        return {
            'status_code': response.status_code,
            'response': response.json() if response.status_code == 200 else response.text
        }
    
    def test_high_risk_case(self) -> Dict[str, Any]:
        """Test high-risk prediction case."""
        high_risk_data = {
            'species': 'dog',
            'age_months': 120,  # Senior dog
            'is_senior': True,
            'temperature_c': 40.5,  # High fever
            'symptoms_present': 'respiratory_difficulty_breathing|digestive_vomiting|behavioral_lethargy',
            'symptom_count': 3,
            'max_symptom_severity': 'severe',
            'symptom_duration': 'more-than-week',
            'appetite_level': 'none',
            'energy_level': 'lethargic',
            'hydration_normal': False,
            'gait_normal': False,
            'coat_condition': 'poor'
        }
        
        response = requests.post(
            f"{self.base_url}/predict",
            json=high_risk_data,
            headers={'Content-Type': 'application/json'}
        )
        
        return {
            'status_code': response.status_code,
            'response': response.json() if response.status_code == 200 else response.text
        }
    
    def test_invalid_inputs(self) -> Dict[str, Any]:
        """Test various invalid input scenarios."""
        test_cases = [
            # Missing required fields
            {'species': 'dog'},
            
            # Invalid species
            {'species': 'dragon', 'symptoms_present': 'none', 'symptom_count': 0},
            
            # Invalid numeric ranges
            {'species': 'dog', 'symptoms_present': 'none', 'symptom_count': 0, 'temperature_c': 100},
            
            # Invalid categorical values
            {'species': 'dog', 'symptoms_present': 'none', 'symptom_count': 0, 'gender': 'alien'},
            
            # Non-JSON request
            "not json"
        ]
        
        results = []
        for i, test_case in enumerate(test_cases):
            try:
                if isinstance(test_case, str):
                    response = requests.post(f"{self.base_url}/predict", data=test_case)
                else:
                    response = requests.post(
                        f"{self.base_url}/predict",
                        json=test_case,
                        headers={'Content-Type': 'application/json'}
                    )
                
                results.append({
                    'test_case': i + 1,
                    'input': test_case,
                    'status_code': response.status_code,
                    'expected_error': True,
                    'got_error': response.status_code >= 400
                })
            except Exception as e:
                results.append({
                    'test_case': i + 1,
                    'input': test_case,
                    'error': str(e)
                })
        
        return results
    
    def test_model_info(self) -> Dict[str, Any]:
        """Test model info endpoint."""
        response = requests.get(f"{self.base_url}/model/info")
        return {
            'status_code': response.status_code,
            'response': response.json() if response.status_code == 200 else response.text
        }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run complete test suite."""
        print("🧪 Running Pet Health ML Inference Service Tests")
        print("=" * 50)
        
        results = {}
        
        # Test 1: Health Check
        print("1. Testing health check...")
        results['health_check'] = self.test_health_check()
        print(f"   ✅ Health check: {'PASS' if results['health_check'] else 'FAIL'}")
        
        if not results['health_check']:
            print("   ❌ Service not healthy, skipping other tests")
            return results
        
        # Test 2: Valid Prediction
        print("\n2. Testing valid prediction...")
        results['valid_prediction'] = self.test_valid_prediction()
        success = results['valid_prediction']['status_code'] == 200
        print(f"   ✅ Valid prediction: {'PASS' if success else 'FAIL'}")
        if success:
            response = results['valid_prediction']['response']
            print(f"   📊 Risk: {response['risk_assessment']['category']} "
                  f"(confidence: {response['risk_assessment']['confidence']})")
        
        # Test 3: Minimal Input
        print("\n3. Testing minimal input...")
        results['minimal_input'] = self.test_minimal_input()
        success = results['minimal_input']['status_code'] == 200
        print(f"   ✅ Minimal input: {'PASS' if success else 'FAIL'}")
        
        # Test 4: High Risk Case
        print("\n4. Testing high-risk case...")
        results['high_risk'] = self.test_high_risk_case()
        success = results['high_risk']['status_code'] == 200
        print(f"   ✅ High-risk case: {'PASS' if success else 'FAIL'}")
        if success:
            response = results['high_risk']['response']
            print(f"   ⚠️  Risk: {response['risk_assessment']['category']} "
                  f"(high_risk flag: {response['flags']['high_risk']})")
        
        # Test 5: Invalid Inputs
        print("\n5. Testing invalid inputs...")
        results['invalid_inputs'] = self.test_invalid_inputs()
        passed = sum(1 for r in results['invalid_inputs'] if r.get('got_error', False))
        total = len(results['invalid_inputs'])
        print(f"   ✅ Invalid inputs: {passed}/{total} correctly rejected")
        
        # Test 6: Model Info
        print("\n6. Testing model info...")
        results['model_info'] = self.test_model_info()
        success = results['model_info']['status_code'] == 200
        print(f"   ✅ Model info: {'PASS' if success else 'FAIL'}")
        if success:
            info = results['model_info']['response']
            print(f"   📋 Model: {info['model_type']} v{info['model_version']}")
        
        print("\n" + "=" * 50)
        print("🎯 Test Summary:")
        print(f"   Health Check: {'✅' if results['health_check'] else '❌'}")
        print(f"   Valid Prediction: {'✅' if results['valid_prediction']['status_code'] == 200 else '❌'}")
        print(f"   Minimal Input: {'✅' if results['minimal_input']['status_code'] == 200 else '❌'}")
        print(f"   High Risk: {'✅' if results['high_risk']['status_code'] == 200 else '❌'}")
        print(f"   Invalid Inputs: {'✅' if passed == total else '❌'}")
        print(f"   Model Info: {'✅' if results['model_info']['status_code'] == 200 else '❌'}")
        
        return results

def main():
    """Run inference service tests."""
    import sys
    
    # Check if service is running
    tester = InferenceServiceTester()
    
    print("Waiting for service to be ready...")
    for i in range(10):
        if tester.test_health_check():
            break
        time.sleep(1)
        print(f"  Attempt {i+1}/10...")
    else:
        print("❌ Service not responding. Make sure inference_service.py is running.")
        return 1
    
    # Run tests
    results = tester.run_all_tests()
    
    # Save results
    with open('test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: test_results.json")
    return 0

if __name__ == '__main__':
    exit(main())