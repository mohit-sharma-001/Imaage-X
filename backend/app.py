import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.config import HOST, PORT, DEBUG, VERSION, OUTPUTS_DIR, MODEL_PATH, DB_PATH
from backend.routes.generate import main_bp
from backend.pipeline import load_model, device
from database.db import init_db

def create_app():
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000", "null"]}})
    
    # Register blueprints
    app.register_blueprint(main_bp)
    
    # Serve frontend index
    @app.route("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")
    
    # Serve generated images
    @app.route("/outputs/<path:filename>")
    def serve_outputs(filename):
        return send_from_directory(OUTPUTS_DIR, filename)

    # Run startup tasks immediately for Flask 2.3+
    with app.app_context():
        print("Starting up ImageX...")
        init_db()
        load_model()
        
        banner = f"""
  ╔══════════════════════════════════════╗
  ║        imageX — offline v{VERSION}        ║
  ║  your words. your images. yours.    ║
  ╠══════════════════════════════════════╣
  ║  Server  : http://{HOST}:{PORT}    ║
  ║  Device  : {device if device else 'detecting...'}                 ║
  ║  Model   : SD v1.5 (local disk)     ║
  ║  Database: {os.path.basename(DB_PATH)}                ║
  ╚══════════════════════════════════════╝
        """
        print(banner)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
