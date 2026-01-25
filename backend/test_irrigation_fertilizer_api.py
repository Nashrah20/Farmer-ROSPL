"""
Test script for Irrigation & Fertilizer Prediction API
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_prediction():
    """Test the irrigation & fertilizer prediction endpoint"""
    
    print("="*70)
    print("🧪 TESTING IRRIGATION & FERTILIZER PREDICTION API")
    print("="*70)
    
    # Test Case 1: Low soil moisture (urgent irrigation needed)
    print("\n📊 Test Case 1: Low Soil Moisture Scenario")
    print("-" * 70)
    
    payload1 = {
        "soil_moisture": 15,
        "soil_temp": 25,
        "air_temp": 28,
        "humidity": 45,
        "wind": 5,
        "rainfall": 0,
        "ph": 7.0,
        "ec": 0.4,
        "nitrogen": 50,
        "phosphorus": 20,
        "potassium": 150,
        "ndvi": 0.4,
        "leaf_health": 75,
        "stress_level": 12,
        "soil_type": "coarse",
        "crop": "wheat",
        "crop_stage": "Sowing",
        "region": "NorthMaha"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/predict-irrigation-fertilizer", 
                               json=payload1, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                data = result['data']
                print("✅ Prediction Successful!")
                print(f"\n💧 IRRIGATION:")
                print(f"   Amount: {data['irrigation']['amount_liters']} liters")
                print(f"   Recommendation: {data['irrigation']['recommendation']}")
                
                print(f"\n🌱 FERTILIZER:")
                print(f"   Nitrogen (N): {data['fertilizer']['nitrogen_g']} g")
                print(f"   Phosphorus (P): {data['fertilizer']['phosphorus_g']} g")
                print(f"   Potassium (K): {data['fertilizer']['potassium_g']} g")
                print(f"   Total NPK: {data['fertilizer']['total_npk_g']} g")
                print(f"   NPK Ratio: {data['fertilizer']['npk_ratio']}")
                
                print(f"\n💡 RECOMMENDATIONS:")
                for i, rec in enumerate(data['recommendations'], 1):
                    print(f"   {i}. [{rec['priority'].upper()}] {rec['type']}: {rec['message']}")
            else:
                print(f"❌ Prediction Failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the Flask backend is running on port 5000")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test Case 2: Good conditions
    print("\n\n📊 Test Case 2: Optimal Conditions")
    print("-" * 70)
    
    payload2 = {
        "soil_moisture": 65,
        "soil_temp": 22,
        "air_temp": 25,
        "humidity": 60,
        "wind": 3,
        "rainfall": 2,
        "ph": 7.2,
        "ec": 0.45,
        "nitrogen": 80,
        "phosphorus": 40,
        "potassium": 200,
        "ndvi": 0.75,
        "leaf_health": 90,
        "stress_level": 2,
        "soil_type": "black",
        "crop": "cotton",
        "crop_stage": "Flowering",
        "region": "WestMaha"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/predict-irrigation-fertilizer", 
                               json=payload2, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                data = result['data']
                print("✅ Prediction Successful!")
                print(f"\n💧 IRRIGATION:")
                print(f"   Amount: {data['irrigation']['amount_liters']} liters")
                print(f"   Recommendation: {data['irrigation']['recommendation']}")
                
                print(f"\n🌱 FERTILIZER:")
                print(f"   Nitrogen (N): {data['fertilizer']['nitrogen_g']} g")
                print(f"   Phosphorus (P): {data['fertilizer']['phosphorus_g']} g")
                print(f"   Potassium (K): {data['fertilizer']['potassium_g']} g")
                print(f"   Total NPK: {data['fertilizer']['total_npk_g']} g")
                print(f"   NPK Ratio: {data['fertilizer']['npk_ratio']}")
                
                print(f"\n💡 RECOMMENDATIONS:")
                if data['recommendations']:
                    for i, rec in enumerate(data['recommendations'], 1):
                        print(f"   {i}. [{rec['priority'].upper()}] {rec['type']}: {rec['message']}")
                else:
                    print("   ✅ No critical recommendations - conditions are optimal!")
            else:
                print(f"❌ Prediction Failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test Case 3: Minimal parameters
    print("\n\n📊 Test Case 3: Minimal Parameters (with defaults)")
    print("-" * 70)
    
    payload3 = {
        "soil_moisture": 40,
        "soil_temp": 24,
        "air_temp": 27,
        "humidity": 55
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/predict-irrigation-fertilizer", 
                               json=payload3, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                data = result['data']
                print("✅ Prediction Successful (using defaults)!")
                print(f"\n💧 IRRIGATION: {data['irrigation']['amount_liters']} liters")
                print(f"🌱 FERTILIZER: N={data['fertilizer']['nitrogen_g']}g, "
                      f"P={data['fertilizer']['phosphorus_g']}g, "
                      f"K={data['fertilizer']['potassium_g']}g")
            else:
                print(f"❌ Prediction Failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*70)
    print("✅ TESTING COMPLETE")
    print("="*70)


if __name__ == "__main__":
    test_prediction()
