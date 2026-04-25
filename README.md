# ImageX — Offline Text-to-Image Generator

**your words. your images. your machine.**

ImageX is a high-performance, private, and fully offline AI image generation suite. It runs Stable Diffusion v1.5 locally on your hardware, requiring no cloud subscriptions, no API keys, and zero internet connection after the initial setup.

---

## 🚀 Key Features
- **Fully Offline:** All processing happens on your local GPU/CPU.
- **Privacy First:** Your prompts and generated images never leave your machine.
- **Multilingual Support:** Describe images in your native language (powered by local Ollama integration).
- **Persistent History:** Automatically saves your generations to a local SQLite database.
- **Premium UI:** Modern dark theme with real-time progress tracking and settings control.

---

## 🛠️ System Requirements
- **OS:** Windows 10/11, macOS, or Linux.
- **Python:** 3.9 or higher.
- **RAM:** 8 GB minimum (16 GB recommended).
- **GPU:** NVIDIA (CUDA) or Apple Silicon (MPS) recommended for speed. Works on CPU (slower).
- **Disk Space:** ~6 GB free space (for the model and dependencies).

---

## 📦 First-Time Setup

### Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
pip install -r requirements.txt
```

### Step 2: Automated Setup & Model Download
Run the setup script to create necessary folders and download the Stable Diffusion weights (requires ~4GB download):
```bash
python scripts/setup.py
```
*Alternatively, you can run `python scripts/download_model.py` separately.*

### Step 3: (Optional) Multilingual Support
If you want to use prompts in languages other than English, install **Ollama** and pull the Llama 3.2 model:
```bash
# In a separate terminal
ollama run llama3.2
```

---

## 🚦 How to Run
Once setup is complete, start the server:
```bash
python run.py
``

---

## 📂 Folder Structure
- `frontend/`: All UI files (HTML, CSS, Vanilla JS).
- `backend/`: Flask server and Stable Diffusion logic.
- `database/`: SQLite database and SQL query logic.
- `models/`: Local storage for the AI model weights.
- `outputs/`: Every image you generate is saved here as a PNG.
- `scripts/`: Automation tools for setup and maintenance.

---

## 💡 Troubleshooting
- **Slow Generation:** If you don't have a dedicated GPU, generation can take 1-5 minutes per image.
- **Connection Refused:** Ensure the Flask server is running and your firewall isn't blocking port 5000.
- **Out of Memory:** Close other heavy applications or try reducing the image size to 512x512.
- **Ollama Not Found:** The app will still work for English prompts; it just won't be able to "enhance" or translate foreign language prompts.

---

**Version:** 1.0.0  
**License:** MIT  
*Built for the creators who value privacy and speed.*
