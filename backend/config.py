import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if it exists
load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "stable-diffusion-v1-5"))
OUTPUTS_DIR = BASE_DIR / "outputs"
DB_PATH = BASE_DIR / "database" / "imagex.db"

# Create folders if not exists
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
Path(MODEL_PATH).parent.mkdir(parents=True, exist_ok=True)

# Model settings
DEFAULT_STEPS = 25
DEFAULT_CFG = 7.5
DEFAULT_WIDTH = 512
DEFAULT_HEIGHT = 512
MAX_STEPS = 75
MIN_STEPS = 10
MAX_SIZE = 1024
MIN_SIZE = 256

# Negative prompt always appended
NEGATIVE_PROMPT = "blurry, bad quality, distorted, ugly, deformed, low resolution, watermark, text, signature, noise, grainy"

# Style Presets (Trigger words)
STYLE_PRESETS = {
    "None": "",
    "Cinematic": "cinematic lighting, dramatic atmosphere, high contrast, detailed textures, 8k resolution, movie still, masterpiece",
    "Studio Ghibli": "Studio Ghibli style, anime art, vibrant colors, painterly aesthetic, Hayao Miyazaki inspired, whimsical, lush landscapes",
    "Oil Painting": "oil painting style, thick brushstrokes, textured canvas, classical art, rich colors, artistic, museum quality",
    "3D Render": "3D render, Octane render, Unreal Engine 5, Raytracing, hyper-realistic, polished, smooth surfaces, volumetric lighting",
    "Cyberpunk": "cyberpunk aesthetic, neon lights, rainy streets, futuristic city, glowing accents, high tech, dark synthwave mood"
}

# Ollama settings (for multilingual)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT = 30

# Server
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 5000))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
VERSION = "1.0.0"
