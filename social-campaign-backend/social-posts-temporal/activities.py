# activities.py
import os
import re
import json
from typing import Dict, List, Optional
import httpx
from pydantic import BaseModel, Field
from temporalio import activity

def _sanitize_env_value(value: str) -> str:
    """Sanitize environment variable values to be ASCII-safe."""
    if not value:
        return value
    
    # Remove smart quotes instead of converting them
    value = value.replace('\u201c', '').replace('\u201d', '')  # ""
    value = value.replace('\u2018', '').replace('\u2019', '')  # ''
    value = value.replace('\u2013', '-').replace('\u2014', '-')  # en/em dashes
    
    # Remove any leading/trailing quotes or spaces
    value = value.strip().strip('"').strip("'").strip()
    
    # Encode to ASCII, replacing any remaining non-ASCII chars
    try:
        return value.encode('ascii', errors='replace').decode('ascii')
    except Exception:
        # Fallback: remove all non-ASCII characters
        return ''.join(char for char in value if ord(char) < 128)

# Load and sanitize ALL environment variables
OPENROUTER_API_KEY = _sanitize_env_value(os.getenv("OPENROUTER_API_KEY", ""))
OPENROUTER_MODEL = _sanitize_env_value(os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet"))
OPENROUTER_FALLBACK_MODEL = _sanitize_env_value(os.getenv("OPENROUTER_FALLBACK_MODEL", "meta-llama/llama-3.1-405b-instruct"))

APP_URL = _sanitize_env_value(os.getenv("APP_URL", "http://localhost"))
APP_NAME = _sanitize_env_value(os.getenv("APP_NAME", "Temporal Social Poster"))

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Platform specs (simple guardrails)
PLATFORM_SPECS: Dict[str, Dict] = {
    "linkedin":  {"max_chars": 3000, "hashtags_max": 10},
    "twitter":   {"max_chars": 280,  "hashtags_max": 6},     # X non-premium limit
    "x":         {"max_chars": 280,  "hashtags_max": 6},     # X (same as twitter)
    "facebook":  {"max_chars": 63206, "hashtags_max": 15},
    "instagram": {"max_chars": 2200, "hashtags_max": 30},
}

class DraftInput(BaseModel):
    idea: str
    audience: Optional[str] = None
    tone: Optional[str] = None

class PlatformRequest(BaseModel):
    platform: str = Field(pattern="^(linkedin|twitter|x|facebook|instagram)$")
    draft_text: str
    idea: str
    audience: Optional[str] = None
    tone: Optional[str] = None
    image: Optional[str] = None  # pass URL or file ref if you have one

def _sanitize_header_value(value: str) -> str:
    """
    Sanitize header values to ensure they're ASCII-safe.
    Replace common Unicode characters with ASCII equivalents.
    """
    # Replace smart quotes with regular quotes
    value = value.replace('\u201c', '"').replace('\u201d', '"')  # ""
    value = value.replace('\u2018', "'").replace('\u2019', "'")  # ''
    value = value.replace('\u2013', '-').replace('\u2014', '-')  # en/em dashes
    
    # Encode to ASCII, replacing any remaining non-ASCII chars
    try:
        return value.encode('ascii', errors='replace').decode('ascii')
    except Exception:
        # Fallback: remove all non-ASCII characters
        return ''.join(char for char in value if ord(char) < 128)

def _headers() -> Dict[str, str]:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set")
    # Sanitize ALL header values to ensure they're ASCII-safe
    return {
        "Authorization": f"Bearer {_sanitize_header_value(OPENROUTER_API_KEY)}",
        "Content-Type": "application/json",
        "HTTP-Referer": _sanitize_header_value(APP_URL),
        "X-Title": _sanitize_header_value(APP_NAME),
    }

async def _chat_complete(messages: List[Dict], model: str) -> str:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 800,
    }
    headers = _headers()
    
    # Debug logging (remove in production)
    print(f"[DEBUG] Using model: {model}")
    print(f"[DEBUG] API Key present: {bool(OPENROUTER_API_KEY)}")
    print(f"[DEBUG] API Key length: {len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0}")
    print(f"[DEBUG] API Key first 10 chars: {OPENROUTER_API_KEY[:10] if OPENROUTER_API_KEY else 'NONE'}")
    print(f"[DEBUG] Headers: {list(headers.keys())}")
    
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        if not r.is_success:
            print(f"[ERROR] OpenRouter API returned {r.status_code}")
            print(f"[ERROR] Response: {r.text}")
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]

async def _smart_complete(messages: List[Dict]) -> str:
    """
    Try preferred model; fall back if needed.
    """
    try:
        return await _chat_complete(messages, OPENROUTER_MODEL)
    except Exception:
        # Fallback to a strong, widely-available model
        return await _chat_complete(messages, OPENROUTER_FALLBACK_MODEL)

def _hard_trim(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    # Try to trim at a word boundary; keep last 3 chars for ellipsis
    trimmed = text[: max(0, limit - 1)].rsplit(" ", 1)[0]
    return trimmed[:limit - 1] + "…"

def _limit_hashtags(text: str, max_hashtags: int) -> str:
    # Keep first N hashtags, drop the rest
    tags = re.findall(r"(?:^|\s)(#[A-Za-z0-9_]+)", text)
    if len(tags) <= max_hashtags:
        return text
    keep = set(tags[:max_hashtags])
    def repl(m):
        tag = m.group(1)
        return "" if tag not in keep else f" {tag}"
    return re.sub(r"(?:^|\s)(#[A-Za-z0-9_]+)", lambda m: repl(m), text)

@activity.defn
async def generate_base_draft(inp: DraftInput) -> str:
    """
    Use OpenRouter to generate an initial cross-platform draft.
    """
    sys = (
        "You are an expert social media copywriter. "
        "Write a concise, engaging, original draft suitable for adaptation across LinkedIn, X/Twitter, Facebook, and Instagram. "
        "Focus on clarity, audience value, and a single clear call-to-action. Avoid fluff."
    )
    user = f"""Idea: {inp.idea}
Target audience (optional): {inp.audience or "unspecified"}
Desired tone (optional): {inp.tone or "neutral-pro"}"""

    messages = [
        {"role": "system", "content": sys},
        {"role": "user", "content": user},
        {"role": "user", "content": "Deliver ONLY the draft text (no preface, no bullets, no headings). Keep it adaptable."}
    ]
    content = await _smart_complete(messages)
    return content.strip()

@activity.defn
async def curate_for_platform(req: PlatformRequest) -> str:
    """
    Curate the draft into a platform-specific post with constraints.
    """
    spec = PLATFORM_SPECS[req.platform]
    max_chars = spec["max_chars"]
    max_tags = spec["hashtags_max"]

    sys = (
        "You are a senior social media copywriter.\n"
        "Task: Tailor the given draft to the target platform, strictly following platform constraints.\n"
        "Rules:\n"
        f"- Hard character limit: {max_chars}\n"
        "- Keep voice natural and non-repetitive.\n"
        "- Include 2–6 concise relevant hashtags (except LinkedIn may use up to 10; Instagram up to 30). "
        "Place hashtags at the end unless essential in-line.\n"
        "- One clear CTA, audience-appropriate.\n"
        "- If an image is provided, include a short mention and write one line of ALT text at the end as: ALT: <description>."
    )

    platform_style = {
        "linkedin":  "Professional, value-led, skimmable with short lines. Avoid clickbait.",
        "twitter":   "Punchy. Max brevity. Prioritize hook, 1 insight, CTA, few hashtags.",
        "x":         "Punchy. Max brevity. Prioritize hook, 1 insight, CTA, few hashtags.",
        "facebook":  "Conversational and friendly. 2–4 short lines. Clear CTA.",
        "instagram": "Aesthetic, warm, short lines. Hashtags at end. Add one emoji if natural."
    }[req.platform]

    user = f"""
Platform: {req.platform}
Platform tone/style guide: {platform_style}
Idea: {req.idea}
Audience: {req.audience or "unspecified"}
Tone: {req.tone or "neutral-pro"}
Image provided? {"yes" if req.image else "no"}
Draft to adapt:
---
{req.draft_text}
---
Return ONLY the final post text. No explanations or formatting blocks.
"""

    messages = [
        {"role": "system", "content": sys},
        {"role": "user", "content": user}
    ]
    curated = (await _smart_complete(messages)).strip()

    # Guardrails: hard trim + hashtag caps
    curated = _limit_hashtags(curated, max_tags)
    curated = _hard_trim(curated, max_chars)
    return curated
