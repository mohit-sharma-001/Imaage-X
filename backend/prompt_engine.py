import requests
import json
import re
from backend.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT, STYLE_PRESETS

def is_non_english(text: str) -> bool:
    """Returns True if text contains non-ASCII characters or is very short."""
    try:
        text.encode('ascii')
        # Also return True for very short prompts as they benefit from enhancement
        return len(text.strip()) < 10
    except UnicodeEncodeError:
        return True

def enhance_via_ollama(raw_prompt: str) -> str:
    """Sends prompt to local Ollama for enhancement into detailed English SD prompt."""
    url = f"{OLLAMA_URL}/api/generate"
    
    system_instruction = (
        "You are an expert at writing Stable Diffusion prompts. "
        "The user has described an image they want in any language. "
        "Your job: understand their description and write a detailed English prompt for Stable Diffusion image generation. "
        "Include: subject details, art style, lighting, mood, camera angle, quality tags like (masterpiece, best quality, highly detailed, 8k). "
        "Return ONLY the English prompt. No explanation. No quotes. No markdown. Just the prompt text."
    )
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"User description: {raw_prompt}",
        "system": system_instruction,
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
        if response.status_code == 200:
            result = response.json()
            enhanced_prompt = result.get("response", "").strip()
            return enhanced_prompt if enhanced_prompt else raw_prompt
        return raw_prompt
    except Exception as e:
        print(f"Ollama enhancement failed: {e}")
        return raw_prompt

def clean_prompt(text: str) -> str:
    """Removes markdown, quotes, and collapses whitespace."""
    if not text:
        return "a beautiful scene, cinematic lighting, highly detailed, masterpiece quality, 4k"
        
    # Remove markdown symbols
    text = re.sub(r'[*#_~`]', '', text)
    # Remove surrounding quotes
    text = text.strip('"\'')
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Limit to 400 characters
    return text[:400]

def process_prompt(raw_prompt: str, style: str = "None") -> dict:
    """Main entry point for prompt processing."""
    raw_prompt = raw_prompt.strip()
    
    if not raw_prompt:
        base_prompt = "a beautiful scene"
    else:
        base_prompt = raw_prompt

    # 1. Enhance if non-English
    if is_non_english(base_prompt) and base_prompt != "a beautiful scene":
        enhanced = enhance_via_ollama(base_prompt)
        cleaned = clean_prompt(enhanced)
        final_prompt = cleaned
        method = "ollama" if enhanced != base_prompt else "fallback"
    else:
        cleaned = clean_prompt(base_prompt)
        final_prompt = cleaned
        method = "passthrough"

    # 2. Apply Style Preset
    style_trigger = STYLE_PRESETS.get(style, "")
    if style_trigger:
        final_prompt = f"{final_prompt}, {style_trigger}"
        method = f"{method}+{style.lower()}"

    return {
        "prompt": final_prompt,
        "enhanced": "ollama" in method,
        "method": method
    }
