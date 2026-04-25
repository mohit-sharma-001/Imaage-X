import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def reset():
    print("="*40)
    print("      ImageX — Database Reset")
    print("="*40)
    
    confirm = input("This will delete ALL generation history. Are you sure? (y/n): ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return

    try:
        from backend.config import DB_PATH
        from database.db import init_db
        
        db_file = Path(DB_PATH)
        if db_file.exists():
            os.remove(db_file)
            print(f"Deleted {DB_PATH}")
        
        print("Reinitializing fresh database...")
        init_db()
        
        print("\nDatabase reset complete.")
        
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset()
