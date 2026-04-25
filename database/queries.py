import sqlite3
from datetime import datetime
from database.db import get_connection

def save_generation(raw_prompt, used_prompt, seed, filename, width, height, time_taken, method) -> int:
    """Inserts a new generation record and updates metadata."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Insert generation
        cursor.execute("""
            INSERT INTO generations (raw_prompt, used_prompt, seed, filename, width, height, time_taken, method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (raw_prompt, used_prompt, seed, filename, width, height, time_taken, method))
        
        gen_id = cursor.lastrowid
        
        # Update app_meta
        cursor.execute("UPDATE app_meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'total_generated'")
        cursor.execute("UPDATE app_meta SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_used'", (datetime.now().isoformat(),))
        
        conn.commit()
        return gen_id
    except Exception as e:
        print(f"Error saving generation: {e}")
        return -1
    finally:
        conn.close()

def get_recent_generations(limit: int = 10) -> list:
    """Returns a list of recent generation records."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM generations ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []
    finally:
        conn.close()

def get_generation_by_id(gen_id: int) -> dict:
    """Fetches a single generation by ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM generations WHERE id = ?", (gen_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def clear_all_generations() -> int:
    """Deletes all history and resets counter."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM generations")
        count = cursor.rowcount
        cursor.execute("UPDATE app_meta SET value = '0' WHERE key = 'total_generated'")
        conn.commit()
        return count
    except Exception as e:
        print(f"Error clearing history: {e}")
        return 0
    finally:
        conn.close()

def get_total_count() -> int:
    """Returns total generations count."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM app_meta WHERE key = 'total_generated'")
        row = cursor.fetchone()
        return int(row['value']) if row else 0
    finally:
        conn.close()

def get_app_meta(key: str) -> str:
    """Fetches a metadata value."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM app_meta WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row['value'] if row else None
    finally:
        conn.close()

def set_app_meta(key: str, value: str):
    """Updates or inserts a metadata value."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", (key, value))
        conn.commit()
    finally:
        conn.close()
