import os
import sys
from pathlib import Path

# Add current directory to path so we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.app import app
    from backend.config import HOST, PORT, MODEL_PATH, DB_PATH
except ImportError as e:
    print(f"Error: Could not import backend modules. {e}")
    print("Please make sure you are running this from the project root.")
    sys.exit(1)

def check_environment():
    """Verify that models and database are ready."""
    if not Path(MODEL_PATH).exists():
        print("WARNING: Model folder not found at:", MODEL_PATH)
        print("Please run 'python scripts/download_model.py' first.")
    
    db_dir = Path(DB_PATH).parent
    if not db_dir.exists():
        db_dir.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    print("Checking environment...")
    check_environment()
    
    print(f"\nStarting ImageX server...")
    print(f"Open browser at: http://{HOST}:{PORT}")
    
    app.run(host=HOST, port=PORT, debug=False)
