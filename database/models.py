# SQL schemas for ImageX database

CREATE_GENERATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_prompt TEXT NOT NULL,
    used_prompt TEXT NOT NULL,
    seed INTEGER NOT NULL,
    filename TEXT NOT NULL,
    width INTEGER DEFAULT 512,
    height INTEGER DEFAULT 512,
    time_taken REAL DEFAULT 0.0,
    method TEXT DEFAULT 'passthrough',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_APP_META_TABLE = """
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

INSERT_DEFAULT_META = """
INSERT OR IGNORE INTO app_meta (key, value) VALUES 
('version', '1.0.0'),
('total_generated', '0'),
('last_used', CURRENT_TIMESTAMP);
"""
