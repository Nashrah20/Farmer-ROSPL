"""Simple production server using waitress"""
from waitress import serve
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from config import Config

if __name__ == '__main__':
    print("\n" + "="*60)
    print("FARM AI BACKEND SERVER (Production)")
    print("="*60)
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    print(f"Database: {Config.MONGODB_DATABASE}")
    print(f"Port: {Config.FLASK_PORT}")
    print("="*60 + "\n")
    print("Server starting... Press Ctrl+C to stop\n")
    
    try:
        serve(app, host='0.0.0.0', port=Config.FLASK_PORT)
    except Exception as e:
        print(f"[ERROR] Server failed to start: {e}")
        import traceback
        traceback.print_exc()
