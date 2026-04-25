import os
import sys
import subprocess
from pathlib import Path

def run_command(command):
    print(f"Running: {command}")
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end='')
    process.wait()
    return process.returncode

def setup():
    print("="*40)
    print("      ImageX — Automated Setup")
    print("="*40)

    # 1. Check Python version
    if sys.version_info < (3, 9):
        print("Error: Python 3.9 or higher is required.")
        return

    # 2. Create folders
    print("\nCreating directory structure...")
    folders = ["models", "outputs", "database", "backend/routes"]
    for f in folders:
        Path(f).mkdir(parents=True, exist_ok=True)
        print(f"  [+] {f}/")

    # 3. Install requirements
    print("\nInstalling Python dependencies...")
    if run_command("pip install -r requirements.txt") != 0:
        print("Error installing dependencies. Please try manually.")
        return

    # 4. Initialize Database
    print("\nInitializing database...")
    sys.path.append(os.getcwd())
    try:
        from database.db import init_db
        init_db()
    except Exception as e:
        print(f"Warning: Could not initialize DB automatically. {e}")

    # 5. Model Download option
    print("\n" + "-"*40)
    choice = input("Do you want to download the Stable Diffusion model now? (~4GB) (y/n): ")
    if choice.lower() == 'y':
        if run_command("python scripts/download_model.py") != 0:
            print("Model download failed.")
    else:
        print("Skipping model download. Remember to run 'python scripts/download_model.py' later.")

    print("\n" + "="*40)
    print("  Setup Complete!")
    print("  To start the app: python run.py")
    print("="*40)

if __name__ == "__main__":
    setup()
