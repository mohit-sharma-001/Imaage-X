import torch
import io
import base64
import time
import random
from pathlib import Path
from diffusers import StableDiffusionPipeline
from backend.config import (
    MODEL_PATH, OUTPUTS_DIR, NEGATIVE_PROMPT,
    MIN_STEPS, MAX_STEPS, MIN_SIZE, MAX_SIZE
)

# Global pipeline state
pipe = None
device = None
model_loaded = False

def detect_device():
    """Detects best available hardware accelerator."""
    if torch.cuda.is_available():
        return "cuda", torch.float16
    elif torch.backends.mps.is_available():
        return "mps", torch.float16
    else:
        return "cpu", torch.float32

def load_model() -> bool:
    """Initializes the Stable Diffusion pipeline from local disk."""
    global pipe, device, model_loaded
    
    if not Path(MODEL_PATH).exists():
        print(f"ERROR: Model not found at {MODEL_PATH}")
        return False
    
    try:
        device_str, dtype = detect_device()
        device = device_str
        
        print(f"Loading model on {device}...")
        pipe = StableDiffusionPipeline.from_pretrained(
            MODEL_PATH,
            torch_dtype=dtype,
            local_files_only=True,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        pipe.to(device)
        # Optional: enable attention slicing for lower VRAM usage
        if device == "cuda":
            pipe.enable_attention_slicing()
            
        model_loaded = True
        print("Model loaded successfully.")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

def generate_image(
    prompt: str,
    steps: int = 25,
    cfg: float = 7.5,
    width: int = 512,
    height: int = 512,
    seed: int = -1
) -> dict:
    """Generates an image from a prompt and returns base64 and metadata."""
    global pipe, model_loaded, device
    
    if not model_loaded:
        if not load_model():
            raise RuntimeError("Stable Diffusion model is not loaded.")

    # Clamp parameters
    steps = max(MIN_STEPS, min(steps, MAX_STEPS))
    width = max(MIN_SIZE, min((width // 8) * 8, MAX_SIZE))
    height = max(MIN_SIZE, min((height // 8) * 8, MAX_SIZE))
    
    if seed == -1:
        seed = random.randint(1, 999999)
        
    generator = torch.Generator(device).manual_seed(seed)
    
    print(f"Generating image with seed {seed}...")
    
    with torch.inference_mode():
        output = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=steps,
            guidance_scale=cfg,
            width=width,
            height=height,
            generator=generator
        )
    
    image = output.images[0]
    
    # Save to disk
    timestamp = int(time.time())
    filename = f"imagex_{seed}_{timestamp}.png"
    save_path = OUTPUTS_DIR / filename
    image.save(save_path)
    
    # Convert to base64 for frontend
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    b64_string = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    return {
        "image_base64": b64_string,
        "filename": filename,
        "seed_used": seed,
        "width": width,
        "height": height
    }
