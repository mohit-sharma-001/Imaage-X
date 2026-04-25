import sqlite3
import os
from pathlib import Path
from backend.config import DB_PATH
from database.models import CREATE_GENERATIONS_TABLE, CREATE_APP_META_TABLE, INSERT_DEFAULT_META

def get_connection() -> sqlite3.Connection:
    """Opens connection to SQLite database."""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row  # Access results as dictionaries
    return conn

def init_db():
    """Creates all tables if they don't exist."""
    db_dir = Path(DB_PATH).parent
    if not db_dir.exists():
        db_dir.mkdir(parents=True, exist_ok=True)
        
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(CREATE_GENERATIONS_TABLE)
        cursor.execute(CREATE_APP_META_TABLE)
        cursor.execute(INSERT_DEFAULT_META)
        conn.commit()
        print(f"Database initialized: {DB_PATH}")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

def check_connection() -> bool:
    """Tries to open connection and run a simple query."""
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        return True
    except Exception:
        return False
