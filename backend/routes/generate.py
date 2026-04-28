import time
from flask import Blueprint, request, jsonify
from backend.prompt_engine import process_prompt
from backend.pipeline import generate_image, model_loaded, device
from database.queries import save_generation, get_recent_generations, clear_all_generations, delete_generation
from database.db import check_connection
from backend.config import VERSION, DEFAULT_STEPS, DEFAULT_CFG, DEFAULT_WIDTH, DEFAULT_HEIGHT

main_bp = Blueprint("main", __name__)

@main_bp.route("/generate", methods=["POST"])
def handle_generate():
    """Endpoint to trigger image generation."""
    data = request.get_json() or {}
    
    raw_prompt = data.get("prompt", "").strip()
    steps = int(data.get("steps", DEFAULT_STEPS))
    cfg = float(data.get("cfg", DEFAULT_CFG))
    width = int(data.get("width", DEFAULT_WIDTH))
    height = int(data.get("height", DEFAULT_HEIGHT))
    seed = int(data.get("seed", -1))
    style = data.get("style", "None")
    
    if not raw_prompt and style == "None":
        return jsonify({"error": "Prompt or style is required"}), 400
        
    try:
        # 1. Process/Enhance prompt
        proc_result = process_prompt(raw_prompt, style)
        used_prompt = proc_result["prompt"]
        method = proc_result["method"]
        
        # 2. Generate image
        start_time = time.time()
        gen_result = generate_image(
            prompt=used_prompt,
            steps=steps,
            cfg=cfg,
            width=width,
            height=height,
            seed=seed
        )
        time_taken = round(time.time() - start_time, 2)
        
        # 3. Save to database
        save_generation(
            raw_prompt=raw_prompt,
            used_prompt=used_prompt,
            seed=gen_result["seed_used"],
            filename=gen_result["filename"],
            width=gen_result["width"],
            height=gen_result["height"],
            time_taken=time_taken,
            method=method
        )
        
        return jsonify({
            "image_base64": gen_result["image_base64"],
            "used_prompt": used_prompt,
            "seed_used": gen_result["seed_used"],
            "time_taken": time_taken,
            "filename": gen_result["filename"]
        })
        
    except Exception as e:
        print(f"Generation error: {e}")
        return jsonify({"error": "Generation failed", "detail": str(e)}), 500

@main_bp.route("/history", methods=["GET"])
def handle_history():
    """Fetches generation history."""
    limit = request.args.get("limit", 10, type=int)
    history = get_recent_generations(limit)
    return jsonify(history)

@main_bp.route("/history", methods=["DELETE"])
def handle_clear_history():
    """Clears all generation history."""
    count = clear_all_generations()
    return jsonify({"success": True, "deleted": count})

@main_bp.route("/history/<int:gen_id>", methods=["DELETE"])
def handle_delete_item(gen_id):
    """Deletes a specific history item."""
    success = delete_generation(gen_id)
    return jsonify({"success": success})

@main_bp.route("/status", methods=["GET"])
def handle_status():
    """Returns system status."""
    return jsonify({
        "model_loaded": model_loaded,
        "device": device,
        "version": VERSION,
        "db_connected": check_connection()
    })
