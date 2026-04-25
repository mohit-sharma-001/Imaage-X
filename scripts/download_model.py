import os
import sys
import torch
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from diffusers import StableDiffusionPipeline
    from backend.config import MODEL_PATH
except ImportError:
    print("Error: Missing dependencies. Please run 'pip install -r requirements.txt' first.")
    sys.exit(1)

def download():
    print("\n" + "="*40)
    print("      ImageX — Model Downloader")
    print("="*40)
    print("This script will download Stable Diffusion v1.5.")
    print("This will use approximately 4 GB of disk space.")
    print("Initial internet connection required.")
    print("="*40 + "\n")

    model_dir = Path(MODEL_PATH)
    if model_dir.exists():
        confirm = input(f"Model already exists at {MODEL_PATH}. Redownload? (y/n): ")
        if confirm.lower() != 'y':
            print("Download cancelled.")
            return

    print(f"Target directory: {MODEL_PATH}")
    print("Downloading... (this may take several minutes depending on your internet)")

    try:
        # We download in float16 to save space/bandwidth, 
        # but the loader in pipeline.py handles device-specific dtype
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16,
            safety_checker=None,
            requires_safety_checker=False,
            use_safetensors=True
        )
        
        print("\nSaving model to disk...")
        pipe.save_pretrained(MODEL_PATH)
        
        print("\n" + "!"*40)
        print("  Download complete!")
        print(f"  Model saved to: {MODEL_PATH}")
        print("  You can now disconnect from the internet.")
        print("  To start ImageX, run: python run.py")
        print("!"*40)

    except Exception as e:
        print(f"\nERROR during download: {e}")
        print("Please check your internet connection and try again.")

if __name__ == "__main__":
    download()
