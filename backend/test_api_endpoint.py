#!/usr/bin/env python3
"""
Test the actual API endpoint to see what predictions it returns
"""

import requests
import json
import time

API_URL = "http://localhost:5000"

print("=" * 80)
print("TESTING API PREDICTION ENDPOINT")
print("=" * 80)

# Wait a moment for server to be ready
print("\nWaiting for server to be ready...")
time.sleep(2)

# Test predict endpoint for a zone
test_zone = "CS1"

print(f"\nTesting prediction for zone: {test_zone}")
print("-" * 80)

try:
    response = requests.post(
        f"{API_URL}/api/predict",
        json={"zone_id": test_zone},
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ API Response:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            prediction = result.get('prediction', {})
            predictions = prediction.get('predictions', {})
            
            print("\n" + "=" * 80)
            print("PREDICTION VALUES:")
            print("=" * 80)
            print(f"💧 Irrigation: {predictions.get('irrigation_liters', 'N/A')} L")
            print(f"🌱 Nitrogen: {predictions.get('fertilizer_N_g', 'N/A')} g")
            print(f"🌾 Phosphorus: {predictions.get('fertilizer_P_g', 'N/A')} g")
            print(f"🍃 Potassium: {predictions.get('fertilizer_K_g', 'N/A')} g")
            
            print("\n" + "=" * 80)
            print("EXPLANATION:")
            print("=" * 80)
            print(prediction.get('explanation', 'No explanation'))
            
            print("\n" + "=" * 80)
            print("MODEL INFO:")
            print("=" * 80)
            print(f"Model Used: {prediction.get('model_used', 'Unknown')}")
            print(f"Predicted At: {prediction.get('predicted_at', 'N/A')}")
            
            # Check if values are reasonable
            irrigation = predictions.get('irrigation_liters', 0)
            if irrigation > 50:
                print("\n⚠️ WARNING: Irrigation value seems too high!")
                print(f"   Expected: 5-20 liters (new model)")
                print(f"   Got: {irrigation} liters")
                print("   This might be from old model or cached data")
            else:
                print(f"\n✅ Irrigation value ({irrigation}L) looks reasonable for new model")
                
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("\n❌ Cannot connect to API")
    print(f"   Is the backend running on {API_URL}?")
    print("\n   To start backend, run:")
    print("   cd backend")
    print("   python serve.py")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
