import os
import time
import json
import threading
import asyncio
from typing import Optional, List, Dict, Any

from flask import Flask, request, jsonify
from flask_cors import CORS

from temporalio.client import Client
from workflows import SocialPostWorkflow  # your existing workflow
from posting_workflows import PostToSocialMediaWorkflow, PostToSocialMediaRequest

# -------- Config via env --------
NAMESPACE   = os.getenv("TEMPORAL_NAMESPACE", "default")
HOST        = os.getenv("TEMPORAL_HOST", "localhost")
PORT        = int(os.getenv("TEMPORAL_PORT", "7233"))
TASK_QUEUE  = os.getenv("TEMPORAL_TASK_QUEUE", "social-post-queue")

# Optional: default timeout (seconds) for waiting on a workflow result
DEFAULT_RESULT_TIMEOUT = int(os.getenv("RESULT_TIMEOUT_SECONDS", "120"))

# -------- Async event loop in a background thread --------
_loop = asyncio.new_event_loop()
_loop_thread = threading.Thread(target=_loop.run_forever, daemon=True)
_loop_thread.start()

def run_async(coro):
    """Run a coroutine on the background loop and wait for its result."""
    return asyncio.run_coroutine_threadsafe(coro, _loop).result()

# -------- Temporal Client (async) --------
_client = None

async def _connect_client() -> Client:
    try:
        # Preferred signature on newer SDKs
        return await Client.connect(f"{HOST}:{PORT}", namespace=NAMESPACE)
    except TypeError:
        # Fallback for older SDKs
        return await Client.connect(target_host=HOST, target_port=PORT, namespace=NAMESPACE)

async def _get_client() -> Client:
    global _client
    if _client is None:
        _client = await _connect_client()
    return _client

# -------- Helpers --------
def _handle_ids_dict(handle):
    """
    Return a dict with workflow_id and, if available, run_id.
    Different SDK versions expose different attr names.
    """
    wid = getattr(handle, "id", None)
    # Try several candidates in order
    run_id = None
    for attr in ("first_execution_run_id", "first_run_id", "run_id"):
        val = getattr(handle, attr, None)
        if val:
            run_id = val
            break
    out = {"workflow_id": wid}
    if run_id:
        out["run_id"] = run_id
    return out

def _make_payload(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize incoming JSON to the payload expected by SocialPostWorkflow.run
    (the workflow you already patched to accept a single dict payload).
    """
    if not isinstance(body, dict):
        raise ValueError("JSON body must be an object")
    idea = body.get("idea")
    if not idea or not isinstance(idea, str):
        raise ValueError("Field 'idea' (string) is required")

    payload = {
        "idea": idea,
        "audience": body.get("audience"),
        "tone": body.get("tone"),
        "image": body.get("image"),
        "platforms": body.get("platforms") or ["linkedin", "twitter", "facebook", "instagram"],
    }
    # Basic sanity for platforms
    if not isinstance(payload["platforms"], list) or not all(isinstance(p, str) for p in payload["platforms"]):
        raise ValueError("Field 'platforms' must be a list of strings")
    return payload

async def _start_workflow(payload: Dict[str, Any], workflow_id: Optional[str] = None):
    client = await _get_client()
    wf_id = workflow_id or f"social-post-{int(time.time()*1000)}"
    handle = await client.start_workflow(
        SocialPostWorkflow.run,
        payload,                      # single payload for compatibility
        id=wf_id,
        task_queue=TASK_QUEUE,
    )
    return handle

async def _start_and_wait(payload: Dict[str, Any], timeout_seconds: Optional[int] = None):
    handle = await _start_workflow(payload)
    # Wait for result with optional timeout
    timeout_seconds = timeout_seconds if timeout_seconds is not None else DEFAULT_RESULT_TIMEOUT
    try:
        result = await asyncio.wait_for(handle.result(), timeout=timeout_seconds)
        return {
            **_handle_ids_dict(handle),
            "status": "completed",
            "result": result,
        }
    except asyncio.TimeoutError:
        return {
            **_handle_ids_dict(handle),
            "status": "running",
            "message": f"Timed out waiting {timeout_seconds}s. Poll the result endpoint.",
        }

async def _get_result(workflow_id: str, run_id: Optional[str] = None, timeout_seconds: int = 1):
    client = await _get_client()
    handle = client.get_workflow_handle(workflow_id=workflow_id, run_id=run_id)
    try:
        # Try a short wait to see if it already finished
        result = await asyncio.wait_for(handle.result(), timeout=timeout_seconds)
        return { **_handle_ids_dict(handle), "status": "completed", "result": result }
    except asyncio.TimeoutError:
        # Not done yet
        return { **_handle_ids_dict(handle), "status": "running" }

# -------- Flask app --------
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.get("/healthz")
def health():
    try:
        # Ensure client can connect
        _ = run_async(_get_client())
        return jsonify({"ok": True, "namespace": NAMESPACE, "task_queue": TASK_QUEUE})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.post("/api/v1/social-posts")  # synchronous convenience: start and wait (with timeout)
def generate_posts():
    """
    POST JSON:
    {
      "idea": "required string",
      "audience": "optional string",
      "tone": "optional string",
      "image": "optional string (url/path)",
      "platforms": ["linkedin","twitter","facebook","instagram"],  // optional
      "wait": true,                     // optional (default true)
      "timeout_seconds": 120            // optional
    }
    """
    try:
        body = request.get_json(silent=True) or {}
        payload = _make_payload(body)
        wait = bool(body.get("wait", True))
        timeout_seconds = body.get("timeout_seconds")

        if wait:
            result = run_async(_start_and_wait(payload, timeout_seconds=timeout_seconds))
            code = 200 if result.get("status") == "completed" else 202
            return jsonify(result), code
        else:
            handle = run_async(_start_workflow(payload))
            return jsonify({ **_handle_ids_dict(handle), "status": "started" }), 202

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/v1/social-posts/<workflow_id>")  # poll for completion
def get_posts(workflow_id: str):
    """
    GET /api/v1/social-posts/{workflow_id}?run_id=...&timeout_seconds=1
    """
    try:
        run_id = request.args.get("run_id") or None
        timeout_seconds = request.args.get("timeout_seconds", default="1")
        timeout_seconds = int(timeout_seconds)
        result = run_async(_get_result(workflow_id, run_id=run_id, timeout_seconds=timeout_seconds))
        code = 200 if result.get("status") == "completed" else 202
        return jsonify(result), code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/v1/social-posts/publish")  # Publish a post to social media
def publish_post():
    """
    POST JSON:
    {
      "post_id": "uuid",          // Database post ID
      "platform": "linkedin",     // Platform to post to
      "content": "text",          // Post content
      "access_token": "token",    // OAuth access token
      "author_urn": "urn:li:person:xxx",  // For LinkedIn (optional, will be fetched if not provided)
      "image_url": "url",         // Optional
      "use_mock": false,          // Use mock for testing
      "wait": true                // Wait for result
    }
    """
    try:
        body = request.get_json(silent=True) or {}
        
        # Validate required fields
        post_id = body.get("post_id")
        platform = body.get("platform")
        content = body.get("content")
        access_token = body.get("access_token")
        
        if not all([post_id, platform, content, access_token]):
            return jsonify({"error": "Missing required fields: post_id, platform, content, access_token"}), 400
        
        # Build workflow request
        workflow_request = PostToSocialMediaRequest(
            platform=platform,
            post_id=post_id,
            content=content,
            access_token=access_token,
            author_urn=body.get("author_urn"),
            image_url=body.get("image_url"),
            use_mock=body.get("use_mock", False)
        )
        
        wait = bool(body.get("wait", True))
        
        # Start workflow
        workflow_id = f"publish-{platform}-{post_id}"
        
        async def start_publish_workflow():
            client = await _get_client()
            handle = await client.start_workflow(
                PostToSocialMediaWorkflow.run,
                workflow_request.dict(),
                id=workflow_id,
                task_queue=TASK_QUEUE,
            )
            
            if wait:
                try:
                    result = await asyncio.wait_for(handle.result(), timeout=60)
                    return {
                        **_handle_ids_dict(handle),
                        "status": "completed",
                        "result": result
                    }
                except asyncio.TimeoutError:
                    return {
                        **_handle_ids_dict(handle),
                        "status": "running",
                        "message": "Workflow still running. Poll for results."
                    }
            else:
                return {
                    **_handle_ids_dict(handle),
                    "status": "started"
                }
        
        result = run_async(start_publish_workflow())
        code = 200 if result.get("status") == "completed" else 202
        return jsonify(result), code
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=True)
